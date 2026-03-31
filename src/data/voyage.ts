export interface VoyageWaypoint {
  position: [number, number]; // [lon, lat]
  name?: string;
}

export interface WeatherRow {
  label: string;
  windSpd: number;
  waveHt: number;
  swellHt: number;
  period: number;
  swellDir: number;
}

export interface VoyageEvent {
  date: string;
  time: string;
  title: string;
  type: "warning" | "info" | "alert";
}

export interface Voyage {
  id: string;
  vesselName: string;
  vesselImo: string;
  status: "On Sea" | "In Port" | "At Anchor";
  progressPercent: number;
  origin: { name: string; coordinates: string; ata: string };
  destination: { name: string; coordinates: string; eta: string };
  etaRemaining: string; // e.g. "4d 12hr"
  waypoints: VoyageWaypoint[];
  currentPosition: [number, number]; // [lon, lat]
  rollingRisk: { fuel: number[]; wave: number[]; vesselSpeed: number[] }; // 6 values each, 0-1
  incidents: number;
  aiInsights: string[];
  weather: WeatherRow[];
  bunker: { rob: number; lobs: number; grade: number; toc: number; daysRemaining: number };
  vesselSpeed: { stw: number; sog: number; target: number; avg: number };
  events: VoyageEvent[];
}

export const singaporeToHongKong: Voyage = {
  id: "VOY-2024-001",
  vesselName: "PUSAKA",
  vesselImo: "IMO 21435",
  status: "On Sea",
  progressPercent: 42,
  origin: {
    name: "Singapore",
    coordinates: "01°17.40' N, 103°51.50' E",
    ata: "ATA: 15 Jan | 09:00 UTC",
  },
  destination: {
    name: "Hong Kong",
    coordinates: "22°18.30' N, 114°10.20' E",
    eta: "ETA: 19 Jan 21:19 UTC",
  },
  etaRemaining: "4d 12hr",
  waypoints: [
    { position: [103.8198, 1.3521], name: "Singapore" },
    { position: [106.1, 3.8] },
    { position: [108.5, 7.5] },
    { position: [110.5, 11.0] },
    { position: [112.0, 15.5] },
    { position: [113.2, 19.0] },
    { position: [114.1694, 22.3193], name: "Hong Kong" },
  ],
  currentPosition: [110.5, 11.0],
  rollingRisk: {
    fuel: [0.85, 0.55, 0.70, 0.45, 0.80, 0.60],
    wave: [0.40, 0.75, 0.50, 0.85, 0.35, 0.65],
    vesselSpeed: [0.60, 0.40, 0.80, 0.50, 0.70, 0.45],
  },
  incidents: 2,
  aiInsights: [
    "Fuel usage was higher than anticipated",
    "Significant waves of around 5m were observed",
    "Storm expected in 24 hours",
  ],
  weather: [
    { label: "15 Jan", windSpd: 0.5, waveHt: 0.8, swellHt: 0.8, period: 0.9, swellDir: 225 },
    { label: "16 Jan", windSpd: 0.8, waveHt: 0.8, swellHt: 0.9, period: 0.8, swellDir: 210 },
    { label: "17 Jan", windSpd: 1.2, waveHt: 1.5, swellHt: 1.2, period: 1.1, swellDir: 195 },
    { label: "18 Jan", windSpd: 0.9, waveHt: 1.1, swellHt: 0.9, period: 0.8, swellDir: 200 },
    { label: "19 Jan", windSpd: 0.6, waveHt: 0.7, swellHt: 0.7, period: 0.6, swellDir: 215 },
  ],
  bunker: { rob: 500, lobs: 70, grade: 10, toc: 2060, daysRemaining: 30 },
  vesselSpeed: { stw: 9, sog: 10, target: 11, avg: 10 },
  events: [
    { date: "16 Feb", time: "10:00 UTC", title: "New Re-Routes Recommended", type: "warning" },
    { date: "16 Feb", time: "10:00 UTC", title: "Storm Alert", type: "alert" },
    { date: "16 Feb", time: "10:00 UTC", title: "Noon Report Received", type: "info" },
    { date: "12 Feb", time: "13:30 UTC", title: "New Re-Routes Recommended", type: "warning" },
    { date: "12 Feb", time: "13:30 UTC", title: "Noon Report Received", type: "info" },
    { date: "12 Feb", time: "13:30 UTC", title: "High Wave", type: "alert" },
  ],
};
