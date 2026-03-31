import { useState } from "react";
import type { Voyage, VoyageEvent } from "../data/voyage";

// ─── Radar / Rolling Risk Chart ──────────────────────────────────────────────

function radarPolygon(values: number[], cx: number, cy: number, r: number, count: number): string {
  return values
    .map((v, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = cx + v * r * Math.cos(angle);
      const y = cy + v * r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
}

function RollingRiskChart({ fuel, wave, vesselSpeed }: { fuel: number[]; wave: number[]; vesselSpeed: number[] }) {
  const cx = 80;
  const cy = 80;
  const r = 60;
  const count = 6;
  const rings = [0.33, 0.66, 1.0];
  const axes = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return {
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
    };
  });

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={radarPolygon(Array(count).fill(ring), cx, cy, r, count)}
          fill="none"
          stroke="#1E3A5F"
          strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.x2} y2={ax.y2} stroke="#1E3A5F" strokeWidth={1} />
      ))}
      {/* Data polygons */}
      <polygon
        points={radarPolygon(fuel, cx, cy, r, count)}
        fill="rgba(80, 140, 255, 0.35)"
        stroke="#508CFF"
        strokeWidth={1.5}
      />
      <polygon
        points={radarPolygon(wave, cx, cy, r, count)}
        fill="rgba(40, 210, 160, 0.35)"
        stroke="#28D2A0"
        strokeWidth={1.5}
      />
      <polygon
        points={radarPolygon(vesselSpeed, cx, cy, r, count)}
        fill="rgba(255, 140, 60, 0.35)"
        stroke="#FF8C3C"
        strokeWidth={1.5}
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#2FC4B2" />
    </svg>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#7B90A8", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function DataCell({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "#7B90A8" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
        {value}
        {unit && <span style={{ fontSize: 10, fontWeight: 400, color: "#7B90A8", marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

const EVENT_COLORS: Record<VoyageEvent["type"], string> = {
  warning: "#F5A623",
  alert: "#EF5350",
  info: "#2FC4B2",
};

const EVENT_ICONS: Record<VoyageEvent["type"], string> = {
  warning: "⚠",
  alert: "🌊",
  info: "📋",
};

function EventsSection({ events }: { events: VoyageEvent[] }) {
  // Group by date
  const grouped: Record<string, VoyageEvent[]> = {};
  events.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionLabel>Events</SectionLabel>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#0F2338", padding: "4px 10px", borderRadius: 4, marginBottom: 4,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2FC4B2" }}>{date}</span>
            <span style={{
              background: "#1E3A5F", color: "#7B90A8", fontSize: 10,
              borderRadius: 10, padding: "1px 6px",
            }}>{items.length}</span>
          </div>
          {items.map((ev, idx) => (
            <div key={idx} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderBottom: "1px solid #0F2338",
            }}>
              <span style={{ color: EVENT_COLORS[ev.type], fontSize: 14, width: 18, textAlign: "center" }}>
                {EVENT_ICONS[ev.type]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#FFFFFF" }}>{ev.title}</div>
                <div style={{ fontSize: 10, color: "#7B90A8" }}>{ev.time}</div>
              </div>
              <span style={{ color: "#7B90A8", fontSize: 12 }}>›</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Tab content: Overview ────────────────────────────────────────────────────

function OverviewContent({ voyage }: { voyage: Voyage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Rolling Risk + Incidents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Rolling Risk */}
        <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10 }}>
          <SectionLabel>Rolling Risk</SectionLabel>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RollingRiskChart
              fuel={voyage.rollingRisk.fuel}
              wave={voyage.rollingRisk.wave}
              vesselSpeed={voyage.rollingRisk.vesselSpeed}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4 }}>
            {[
              { label: "Fuel", color: "#508CFF" },
              { label: "Wave", color: "#28D2A0" },
              { label: "Vessel Speed", color: "#FF8C3C" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: 9, color: "#7B90A8" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Incidents */}
        <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel>Incidents</SectionLabel>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#F5A623", lineHeight: 1 }}>
            {voyage.incidents}
          </div>
          <div style={{ fontSize: 10, color: "#7B90A8" }}>reported this voyage</div>

          {/* AI Insights */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <SectionLabel>AI Insights</SectionLabel>
            </div>
            {voyage.aiInsights.map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2FC4B2", marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#B0C4D8", lineHeight: 1.4 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather */}
      <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10 }}>
        <SectionLabel>Weather</SectionLabel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                {["", ...voyage.weather.map((w) => w.label)].map((h, i) => (
                  <th key={i} style={{ textAlign: "center", color: "#7B90A8", fontWeight: 500, padding: "2px 4px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["Wind Spd", "Wave Ht", "Swell Ht", "Period", "Swell Dir"] as const).map((row) => {
                const keys: Record<string, keyof (typeof voyage.weather)[0]> = {
                  "Wind Spd": "windSpd",
                  "Wave Ht": "waveHt",
                  "Swell Ht": "swellHt",
                  Period: "period",
                  "Swell Dir": "swellDir",
                };
                const key = keys[row];
                return (
                  <tr key={row}>
                    <td style={{ color: "#7B90A8", padding: "3px 4px", whiteSpace: "nowrap" }}>{row}</td>
                    {voyage.weather.map((w, i) => (
                      <td key={i} style={{ textAlign: "center", color: "#FFFFFF", padding: "3px 4px", fontWeight: 500 }}>
                        {w[key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bunker */}
      <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10 }}>
        <SectionLabel>Bunker (Int'l)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          <DataCell label="ROB" value={voyage.bunker.rob} unit="MT" />
          <DataCell label="LOBS" value={voyage.bunker.lobs} unit="MT" />
          <DataCell label="Grade" value={voyage.bunker.grade} />
          <DataCell label="TOC" value={voyage.bunker.toc} unit="MT" />
          <DataCell label="Day Rem." value={voyage.bunker.daysRemaining} />
        </div>
      </div>

      {/* Vessel Speed */}
      <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10 }}>
        <SectionLabel>Vessel Speed (Kts)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <DataCell label="STW" value={voyage.vesselSpeed.stw} />
          <DataCell label="SOG" value={voyage.vesselSpeed.sog} />
          <DataCell label="Target" value={voyage.vesselSpeed.target} />
          <DataCell label="Avg" value={voyage.vesselSpeed.avg} />
        </div>
      </div>

      {/* Events */}
      <div style={{ background: "#0D1F35", borderRadius: 6, padding: 10 }}>
        <EventsSection events={voyage.events} />
      </div>
    </div>
  );
}

// ─── Tab placeholder ──────────────────────────────────────────────────────────

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#7B90A8", fontSize: 13 }}>
      {label} — coming soon
    </div>
  );
}

// ─── VoyagePanel ──────────────────────────────────────────────────────────────

const TABS = ["Overview", "Routes", "Waypoints", "Reports"] as const;
type Tab = (typeof TABS)[number];

interface VoyagePanelProps {
  voyage: Voyage;
  onClose?: () => void;
}

export default function VoyagePanel({ voyage, onClose }: VoyagePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 420,
      height: "100%",
      background: "#0B1929",
      display: "flex",
      flexDirection: "column",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.5)",
      zIndex: 10,
      fontFamily: "'Inter', sans-serif",
      color: "#FFFFFF",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #1A3050", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Vessel thumbnail placeholder */}
          <div style={{
            width: 40, height: 40, borderRadius: 4,
            background: "linear-gradient(135deg, #1A3A5C 0%, #0E2540 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}>🚢</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.03em" }}>{voyage.vesselName}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 7px",
                background: "rgba(38, 201, 122, 0.15)", color: "#26C97A",
                borderRadius: 10, border: "1px solid rgba(38,201,122,0.3)",
              }}>{voyage.status}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7B90A8", marginTop: 2 }}>{voyage.vesselImo}</div>
          </div>

          {onClose && (
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "#7B90A8",
              fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1,
              flexShrink: 0,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Route progress ── */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #1A3050", flexShrink: 0 }}>
        {/* Origin → Destination names */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{voyage.origin.name}</span>
          <div style={{ flex: 1, position: "relative", height: 12 }}>
            {/* Progress bar track */}
            <div style={{
              position: "absolute", top: "50%", left: 0, right: 0,
              height: 3, background: "#1A3050", transform: "translateY(-50%)", borderRadius: 2,
            }} />
            {/* Progress bar fill */}
            <div style={{
              position: "absolute", top: "50%", left: 0,
              width: `${voyage.progressPercent}%`,
              height: 3, background: "#F5A623", transform: "translateY(-50%)", borderRadius: 2,
            }} />
            {/* Vessel dot */}
            <div style={{
              position: "absolute", top: "50%", left: `${voyage.progressPercent}%`,
              width: 10, height: 10, borderRadius: "50%",
              background: "#F5A623", border: "2px solid #0B1929",
              transform: "translate(-50%, -50%)",
            }} />
            {/* Origin dot */}
            <div style={{
              position: "absolute", top: "50%", left: 0,
              width: 8, height: 8, borderRadius: "50%",
              background: "#2FC4B2", transform: "translate(-50%, -50%)",
            }} />
            {/* Destination dot */}
            <div style={{
              position: "absolute", top: "50%", right: 0,
              width: 8, height: 8, borderRadius: "50%",
              background: "#1A3050", border: "2px solid #7B90A8",
              transform: "translate(50%, -50%)",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{voyage.destination.name}</span>
        </div>

        {/* Coordinates + ATA/ETA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: "#7B90A8" }}>{voyage.origin.coordinates}</div>
            <div style={{ fontSize: 10, color: "#F5A623", marginTop: 2 }}>{voyage.origin.ata}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#7B90A8" }}>{voyage.destination.coordinates}</div>
            <div style={{ fontSize: 10, color: "#F5A623", marginTop: 2 }}>{voyage.destination.eta}</div>
          </div>
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Tab nav (left column) */}
        <div style={{ width: 72, background: "#091524", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #1A3050" }}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isActive ? "#0B1929" : "none",
                  border: "none",
                  borderLeft: isActive ? "3px solid #F5A623" : "3px solid transparent",
                  color: isActive ? "#FFFFFF" : "#7B90A8",
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  padding: "14px 6px",
                  cursor: "pointer",
                  textAlign: "center",
                  lineHeight: 1.3,
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12, scrollbarWidth: "thin", scrollbarColor: "#1A3050 transparent" }}>
          {activeTab === "Overview" && <OverviewContent voyage={voyage} />}
          {activeTab === "Routes" && <PlaceholderTab label="Routes" />}
          {activeTab === "Waypoints" && <PlaceholderTab label="Waypoints" />}
          {activeTab === "Reports" && <PlaceholderTab label="Reports" />}
        </div>
      </div>
    </div>
  );
}
