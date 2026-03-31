import navNotificationUrl from "../assets/nav_notification.svg";
import navTasksUrl from "../assets/nav_tasks.svg";
import navBoatUrl from "../assets/nav_boat.svg";
import navRerouteUrl from "../assets/nav_reroute.svg";
import navLayersUrl from "../assets/nav_layers.svg";
import navInfoUrl from "../assets/nav_info.svg";

import { NavItem, Divider } from "./navHelpers";
import "./FleetsInteractionPanel.css";
import type { Fleet } from "../network";

// ── Fleets Interaction Panel (blue pill, right side) ──────────────────────────

export default function FleetsInteractionPanel({ fleets: _fleets }: { fleets?: Fleet[] }) {
  return (
    <div className="fleets-panel">
      {/* Notification with badge */}
      <NavItem icon={navNotificationUrl} theme="dark" badge={6} />
      {/* Tasks */}
      <NavItem icon={navTasksUrl} theme="dark" />
      {/* Fleet / Boat */}
      <NavItem icon={navBoatUrl} theme="dark" />
      {/* Re-Route */}
      <NavItem icon={navRerouteUrl} theme="dark" />

      {/* Divider — 32px wide per Figma */}
      <Divider theme="dark" width={32} />

      {/* Layers */}
      <NavItem icon={navLayersUrl} theme="dark" />
      {/* Info */}
      <NavItem icon={navInfoUrl} theme="dark" />
    </div>
  );
}
