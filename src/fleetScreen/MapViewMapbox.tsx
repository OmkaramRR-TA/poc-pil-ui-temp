import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import vesselIconUrl from "../assets/vessel_icon.svg";
import vesselIconEtaEarlyUrl from "../assets/figma/vessel_icon_eta_early.svg";
import markerOriginUrl from "../assets/figma/marker_origin.svg";
import markerDestinationUrl from "../assets/figma/marker_destination.svg";
import waypointCompletedUrl from "../assets/figma/waypoint_completed_component.svg";
import waypointUpcomingUrl from "../assets/figma/waypoint_upcoming.svg";
import { vessels, type Vessel } from "../data/vessels";
import { singaporeToHongKong } from "../data/voyage";
import VoyagePanel from "./VoyagePanel";

// Set your Mapbox token in .env as VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

interface MapViewMapboxProps {
  center?: [number, number];
  zoom?: number;
}

// Bearing between two [lon, lat] points, degrees clockwise from north
function computeHeading(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(to[0] - from[0]);
  const y = Math.sin(dLon) * Math.cos(toRad(to[1]));
  const x =
    Math.cos(toRad(from[1])) * Math.sin(toRad(to[1])) -
    Math.sin(toRad(from[1])) * Math.cos(toRad(to[1])) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Load an SVG/image URL into the map sprite so symbol layers can reference it
function loadMapImage(
  map: mapboxgl.Map,
  name: string,
  url: string,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.onload = () => {
      if (!map.hasImage(name)) map.addImage(name, img);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Vessel marker HTML helpers ────────────────────────────────────────────────

function normalVesselHTML(heading: number): string {
  return `<img src="${vesselIconUrl}" width="12" height="58"
    style="transform:rotate(${heading}deg);display:block;" />`;
}

function selectedVesselHTML(heading: number): string {
  return `
    <div style="position:absolute;width:58px;height:58px;border-radius:50%;
                background:rgba(248,248,248,0.7);top:0;left:0;"></div>
    <div style="position:absolute;width:35.56px;height:35.56px;border-radius:50%;
                background:#FFFFFF;top:11.22px;left:11.22px;"></div>
    <img src="${vesselIconUrl}" width="12" height="58"
      style="transform:rotate(${heading}deg);position:relative;z-index:1;" />
  `;
}

// ── Component ─────────────────────────────────────────────────────────────────

const MapViewMapbox = ({ center = [110, 10], zoom = 4 }: MapViewMapboxProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [showVoyagePanel, setShowVoyagePanel] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    mapInstanceRef.current = map;

    map.on("load", async () => {
      const voyage = singaporeToHongKong;

      // ── Load waypoint SVG icons into sprite ────────────────────────────
      await Promise.all([
        loadMapImage(map, "waypoint-completed", waypointCompletedUrl, 17, 17),
        loadMapImage(map, "waypoint-upcoming", waypointUpcomingUrl, 14, 14),
      ]);

      // ── Route line ─────────────────────────────────────────────────────
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: voyage.waypoints.map((wp) => wp.position),
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#0072BC",
          "line-width": 4,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
      });

      // ── Intermediate waypoints (symbol layer, data-driven) ─────────────
      const currentWpIdx = voyage.waypoints.findIndex(
        (wp) =>
          wp.position[0] === voyage.currentPosition[0] &&
          wp.position[1] === voyage.currentPosition[1]
      );

      const waypointFeatures = voyage.waypoints
        .filter((_, idx) => {
          const isOrigin = idx === 0;
          const isDestination = idx === voyage.waypoints.length - 1;
          const isCurrent =
            voyage.waypoints[idx].position[0] === voyage.currentPosition[0] &&
            voyage.waypoints[idx].position[1] === voyage.currentPosition[1];
          return !isOrigin && !isDestination && !isCurrent;
        })
        .map((wp) => {
          const wpIdx = voyage.waypoints.indexOf(wp);
          const isCompleted = wpIdx < currentWpIdx;
          const nextPos =
            voyage.waypoints[wpIdx + 1]?.position ?? voyage.waypoints[wpIdx].position;
          // Caret SVG points west → offset +90° to align with bearing direction
          const rotation = (computeHeading(wp.position, nextPos) + 90) % 360;
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: wp.position },
            properties: {
              icon: isCompleted ? "waypoint-completed" : "waypoint-upcoming",
              rotation,
            },
          };
        });

      map.addSource("waypoints", {
        type: "geojson",
        data: { type: "FeatureCollection", features: waypointFeatures },
      });

      map.addLayer({
        id: "waypoints-layer",
        type: "symbol",
        source: "waypoints",
        layout: {
          "icon-image": ["get", "icon"],
          "icon-rotate": ["get", "rotation"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      // ── Origin marker ──────────────────────────────────────────────────
      const originEl = document.createElement("div");
      originEl.style.cssText = "width:26px;height:26px;cursor:default;";
      originEl.innerHTML = `<img src="${markerOriginUrl}" width="26" height="26" />`;
      new mapboxgl.Marker({ element: originEl, anchor: "center" })
        .setLngLat(voyage.waypoints[0].position)
        .addTo(map);

      // ── Destination marker ─────────────────────────────────────────────
      const destEl = document.createElement("div");
      destEl.style.cssText = "width:26px;height:26px;cursor:default;";
      destEl.innerHTML = `<img src="${markerDestinationUrl}" width="26" height="26" />`;
      new mapboxgl.Marker({ element: destEl, anchor: "center" })
        .setLngLat(voyage.waypoints[voyage.waypoints.length - 1].position)
        .addTo(map);

      // ── Active vessel at currentPosition ───────────────────────────────
      const nextWp =
        voyage.waypoints[currentWpIdx + 1] ??
        voyage.waypoints[voyage.waypoints.length - 1];
      const activeHeading = computeHeading(voyage.currentPosition, nextWp.position);

      const activeEl = document.createElement("div");
      activeEl.style.cssText =
        "position:relative;width:58px;height:58px;display:flex;align-items:center;justify-content:center;";
      activeEl.innerHTML = `
        <div style="position:absolute;width:58px;height:58px;border-radius:50%;
                    background:rgba(248,248,248,0.7);"></div>
        <div style="position:absolute;width:35.56px;height:35.56px;border-radius:50%;
                    background:#FFFFFF;"></div>
        <img src="${vesselIconEtaEarlyUrl}" width="30" height="40"
          style="position:relative;z-index:1;transform:rotate(${activeHeading}deg);" />
      `;
      new mapboxgl.Marker({ element: activeEl, anchor: "center" })
        .setLngLat(voyage.currentPosition)
        .addTo(map);

      // ── ETA pill — offset from the active vessel ───────────────────────
      const etaEl = document.createElement("div");
      etaEl.style.cssText = "pointer-events:none;";
      etaEl.innerHTML = `
        <div style="
          background:#0072BC;color:#FFFFFF;border:1px solid #FFFFFF;
          border-radius:24px;padding:4px 8px;font-size:12px;
          font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
          font-weight:400;white-space:nowrap;line-height:1.1;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">ETA: ${voyage.etaRemaining}</div>
      `;
      new mapboxgl.Marker({ element: etaEl, anchor: "bottom-left", offset: [20, -20] })
        .setLngLat(voyage.currentPosition)
        .addTo(map);

      // ── Fleet vessel markers ───────────────────────────────────────────
      const markerEls = new Map<string, HTMLElement>();
      const sharedPopup = new mapboxgl.Popup({
        closeButton: true,
        offset: 15,
        className: "vessel-popup",
        maxWidth: "220px",
      });

      // Close popup + deselect all when clicking the map background
      map.on("click", () => {
        sharedPopup.remove();
        markerEls.forEach((el, id) => {
          const vessel = vessels.find((v) => v.id === id)!;
          el.style.cssText = "width:12px;height:58px;cursor:pointer;";
          el.innerHTML = normalVesselHTML(vessel.heading);
        });
      });

      vessels.forEach((vessel: Vessel) => {
        const el = document.createElement("div");
        el.style.cssText = "width:12px;height:58px;cursor:pointer;";
        el.innerHTML = normalVesselHTML(vessel.heading);
        markerEls.set(vessel.id, el);

        el.addEventListener("click", (e) => {
          e.stopPropagation();

          // Deselect all others
          markerEls.forEach((other, id) => {
            if (id !== vessel.id) {
              const v = vessels.find((v) => v.id === id)!;
              other.style.cssText = "width:12px;height:58px;cursor:pointer;";
              other.innerHTML = normalVesselHTML(v.heading);
            }
          });

          // Toggle this vessel's selected state
          const isNowSelected = el.dataset.selected !== "true";
          el.dataset.selected = String(isNowSelected);

          if (isNowSelected) {
            el.style.cssText =
              "position:relative;width:58px;height:58px;cursor:pointer;display:flex;align-items:center;justify-content:center;";
            el.innerHTML = selectedVesselHTML(vessel.heading);

            sharedPopup
              .setLngLat(vessel.position)
              .setHTML(`
                <strong style="color:#E7B000">${vessel.name}</strong><br/>
                ID: ${vessel.id}<br/>
                Heading: ${vessel.heading}°<br/>
                Speed: ${vessel.speed} kts<br/>
                Status: ${vessel.status}
              `)
              .addTo(map);
          } else {
            el.style.cssText = "width:12px;height:58px;cursor:pointer;";
            el.innerHTML = normalVesselHTML(vessel.heading);
            sharedPopup.remove();
          }
        });

        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(vessel.position)
          .addTo(map);
      });
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Popup style overrides — strip default white mapbox popup chrome */}
      <style>{`
        .vessel-popup .mapboxgl-popup-content {
          background: #1a1a2e;
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #E7B000;
          font-size: 12px;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .vessel-popup .mapboxgl-popup-tip {
          border-top-color: #E7B000;
        }
        .vessel-popup .mapboxgl-popup-close-button {
          color: #7B90A8;
          font-size: 14px;
          padding: 2px 6px;
        }
      `}</style>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {!showVoyagePanel && (
        <button
          onClick={() => setShowVoyagePanel(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            background: "#0B1929",
            color: "#FFFFFF",
            border: "1px solid #1A3050",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          🚢 Show Voyage
        </button>
      )}

      {showVoyagePanel && (
        <VoyagePanel
          voyage={singaporeToHongKong}
          onClose={() => setShowVoyagePanel(false)}
        />
      )}
    </div>
  );
};

export default MapViewMapbox;
