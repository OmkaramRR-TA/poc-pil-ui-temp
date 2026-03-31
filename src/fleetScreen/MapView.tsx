import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { fromLonLat } from "ol/proj";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Overlay from "ol/Overlay";
import "ol/ol.css";
import "./MapView.css";
import vesselIconUrl from "../assets/vessel_icon.svg";
import vesselHighlightUrl from "../assets/vessel_highlight.svg";
import markerOriginUrl from "../assets/marker_origin.svg";
import markerDestinationUrl from "../assets/marker_destination.svg";
import waypointCompletedUrl from "../assets/waypoint_completed_component.svg";
import waypointUpcomingUrl from "../assets/waypoint_upcoming.svg";
import { type Vessel } from "../data/vessels";
import { singaporeToHongKong } from "../data/voyage";
import VoyagePanel from "./VoyagePanel";
import type { Fleet } from "../network";

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  fleets?: Fleet[];
}

function createVesselStyle(heading: number): Style[] {
  const rotationRad = (heading * Math.PI) / 180;
  return [
    new Style({
      image: new Icon({
        src: vesselIconUrl,
        width: 16,
        height: 54,
        anchor: [0.5, 0.5],
        rotation: rotationRad,
      }),
    }),
  ];
}

function createSelectedVesselStyle(heading: number): Style[] {
  const rotationRad = (heading * Math.PI) / 180;
  return [
    // Selection highlight ring from Figma (58×58 SVG)
    new Style({
      image: new Icon({
        src: vesselHighlightUrl,
        width: 58,
        height: 58,
        anchor: [0.5, 0.5],
      }),
    }),
    // Same vessel icon at same size — no change on selection
    new Style({
      image: new Icon({
        src: vesselIconUrl,
        width: 16,
        height: 54,
        anchor: [0.5, 0.5],
        rotation: rotationRad,
      }),
    }),
  ];
}

// ── Voyage route styles (Figma: #0072BC solid 4px) ───────────────────────────

const routeLineStyle = new Style({
  stroke: new Stroke({ color: "#0072BC", width: 4 }),
});

// Origin (From): SVG marker from Figma (26×26)
const originStyle = new Style({
  image: new Icon({
    src: markerOriginUrl,
    width: 26,
    height: 26,
    anchor: [0.5, 0.5],
  }),
});

// Destination: SVG marker from Figma (26×26)
const destinationStyle = new Style({
  image: new Icon({
    src: markerDestinationUrl,
    width: 26,
    height: 26,
    anchor: [0.5, 0.5],
  }),
});

// ─────────────────────────────────────────────────────────────────────────────

// Compute bearing between two [lon, lat] points (degrees clockwise from north)
function computeHeading(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(to[0] - from[0]);
  const y = Math.sin(dLon) * Math.cos(toRad(to[1]));
  const x =
    Math.cos(toRad(from[1])) * Math.sin(toRad(to[1])) -
    Math.sin(toRad(from[1])) * Math.cos(toRad(to[1])) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const MapView = ({ center = [0, 0], zoom = 2, fleets = [] }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vesselSourceRef = useRef<VectorSource | null>(null);
  const etaRef = useRef<HTMLDivElement>(null);
  const selectedFeatureRef = useRef<Feature | null>(null);
  const [showVoyagePanel, setShowVoyagePanel] = useState(false);

  // Update vessel features whenever fleet data changes
  useEffect(() => {
    if (!vesselSourceRef.current) return;
    vesselSourceRef.current.clear();
    fleets.forEach((fleet) => {
      const vessel: Vessel = {
        id: fleet.vesselId,
        name: fleet.vesselId,
        position: [fleet.longitude, fleet.latitude],
        heading: fleet.direction,
        speed: 0,
        status: "Underway",
      };
      const feature = new Feature({
        geometry: new Point(fromLonLat(vessel.position)),
        vessel,
      });
      feature.setStyle(createVesselStyle(vessel.heading));
      vesselSourceRef.current!.addFeature(feature);
    });
  }, [fleets]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // ── Vessel features ──────────────────────────────────────────────────────
    const vesselSource = new VectorSource();
    vesselSourceRef.current = vesselSource;
    const vesselLayer = new VectorLayer({ source: vesselSource });

    // ── Voyage route features ────────────────────────────────────────────────
    const voyage = singaporeToHongKong;
    const routeCoords = voyage.waypoints.map((wp) => fromLonLat(wp.position));

    const routeLineFeature = new Feature({
      geometry: new LineString(routeCoords),
    });
    routeLineFeature.setStyle(routeLineStyle);

    // Find current waypoint index for completed vs upcoming classification
    const currentWpIdx = voyage.waypoints.findIndex(
      (wp) =>
        wp.position[0] === voyage.currentPosition[0] &&
        wp.position[1] === voyage.currentPosition[1],
    );

    const waypointFeatures = voyage.waypoints
      .filter((wp) => {
        const isOrigin =
          wp.position[0] === voyage.waypoints[0].position[0] &&
          wp.position[1] === voyage.waypoints[0].position[1];
        const isDestination =
          wp.position[0] ===
            voyage.waypoints[voyage.waypoints.length - 1].position[0] &&
          wp.position[1] ===
            voyage.waypoints[voyage.waypoints.length - 1].position[1];
        const isCurrent =
          wp.position[0] === voyage.currentPosition[0] &&
          wp.position[1] === voyage.currentPosition[1];
        return !isOrigin && !isDestination && !isCurrent;
      })
      .map((wp) => {
        const wpIdx = voyage.waypoints.indexOf(wp);
        const feature = new Feature({
          geometry: new Point(fromLonLat(wp.position)),
        });

        if (wpIdx < currentWpIdx) {
          const nextPos =
            voyage.waypoints[wpIdx + 1]?.position ??
            voyage.waypoints[wpIdx].position;
          const bearing = computeHeading(wp.position, nextPos);
          const rotationRad = ((bearing + 90) * Math.PI) / 180;
          feature.setStyle(
            new Style({
              image: new Icon({
                src: waypointCompletedUrl,
                width: 17,
                height: 17,
                anchor: [0.5, 0.5],
                rotation: rotationRad,
              }),
            }),
          );
        } else {
          const nextPos =
            voyage.waypoints[wpIdx + 1]?.position ??
            voyage.waypoints[wpIdx].position;
          const bearing = computeHeading(wp.position, nextPos);
          const rotationRad = ((bearing + 90) * Math.PI) / 180;
          feature.setStyle(
            new Style({
              image: new Icon({
                src: waypointUpcomingUrl,
                width: 14,
                height: 14,
                anchor: [0.5, 0.5],
                rotation: rotationRad,
              }),
            }),
          );
        }
        return feature;
      });

    // Origin port marker
    const originFeature = new Feature({
      geometry: new Point(fromLonLat(voyage.waypoints[0].position)),
    });
    originFeature.setStyle(originStyle);

    // Destination port marker
    const destFeature = new Feature({
      geometry: new Point(
        fromLonLat(voyage.waypoints[voyage.waypoints.length - 1].position),
      ),
    });
    destFeature.setStyle(destinationStyle);

    const routeSource = new VectorSource({
      features: [
        routeLineFeature,
        originFeature,
        destFeature,
        ...waypointFeatures,
      ],
    });
    const routeLayer = new VectorLayer({ source: routeSource, visible: false });

    // ── ETA pill overlay ─────────────────────────────────────────────────────
    const etaOverlay = new Overlay({
      element: etaRef.current!,
      positioning: "bottom-left",
      offset: [20, -20],
      stopEvent: false,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), routeLayer, vesselLayer],
      view: new View({
        center: fromLonLat(center),
        zoom,
      }),
    });

    map.addOverlay(etaOverlay);

    map.on("click", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f) as
        | Feature
        | undefined;
      const v = feature?.get("vessel") as Vessel | undefined;

      if (v) {
        // Deselect previous vessel if different
        if (
          selectedFeatureRef.current &&
          selectedFeatureRef.current !== feature
        ) {
          const prev = selectedFeatureRef.current.get("vessel") as Vessel;
          selectedFeatureRef.current.setStyle(createVesselStyle(prev.heading));
        }
        selectedFeatureRef.current = feature!;
        feature!.setStyle(createSelectedVesselStyle(v.heading));
        routeLayer.setVisible(true);
        etaOverlay.setPosition(fromLonLat(voyage.currentPosition));
        setShowVoyagePanel(true);
      } else {
        // Click on empty map — deselect
        if (selectedFeatureRef.current) {
          const prev = selectedFeatureRef.current.get("vessel") as Vessel;
          selectedFeatureRef.current.setStyle(createVesselStyle(prev.heading));
          selectedFeatureRef.current = null;
        }
        routeLayer.setVisible(false);
        etaOverlay.setPosition(undefined);
        setShowVoyagePanel(false);
      }
    });

    map.on("pointermove", (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getViewport().style.cursor = hit ? "pointer" : "";
    });

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current?.setTarget(undefined);
      mapInstanceRef.current = null;
      vesselSourceRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* ETA pill – anchored to vessel position via OL Overlay */}
      <div ref={etaRef} style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "#0072BC",
            color: "#FFFFFF",
            border: "1px solid #FFFFFF",
            borderRadius: 24,
            padding: "4px 8px",
            fontSize: 12,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            whiteSpace: "nowrap",
            lineHeight: 1.1,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          ETA: {singaporeToHongKong.etaRemaining}
        </div>
      </div>

      {/* VoyagePanel injected as overlay */}
      {showVoyagePanel && (
        <VoyagePanel
          voyage={singaporeToHongKong}
          onClose={() => setShowVoyagePanel(false)}
        />
      )}
    </div>
  );
};

export default MapView;
