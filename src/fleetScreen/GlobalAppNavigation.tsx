import navHouseUrl from "../assets/nav_house.svg";
import navMapUrl from "../assets/nav_map.svg";
import navBoatUrl from "../assets/nav_boat.svg";
import navSimulateUrl from "../assets/nav_simulate.svg";
import navFileUrl from "../assets/nav_file.svg";
import navProfileLeoUrl from "../assets/nav_profile_leo.png";

import { NavItem, Divider } from "./navHelpers";
import "./GlobalAppNavigation.css";

// ── Global App Navigation (white pill, left side) ─────────────────────────────
// Active item = Vessels (Boat icon, index 2).
// Active indicator is an absolutely-positioned circle behind the active icon
// at x:5, y:152 (padding-top 48 + House 40 + gap 12 + Map 40 + gap 12 = 152).

export default function GlobalAppNavigation() {
  return (
    <div className="global-app-nav">
      {/* Active indicator — sits behind the Vessels (Boat) button */}
      <div className="global-app-nav__active-indicator" />

      {/* House – inactive */}
      <NavItem icon={navHouseUrl} theme="light" />
      {/* MapTrifold – active (Fleet view), white icon on blue circle */}
      <NavItem icon={navMapUrl} theme="dark" />
      {/* Boat – inactive */}
      <NavItem icon={navBoatUrl} theme="light" />
      {/* Simulate – disabled for MVP */}
      <NavItem icon={navSimulateUrl} theme="light" isDisabled />
      {/* FileText – disabled for MVP */}
      <NavItem icon={navFileUrl} theme="light" isDisabled />

      <Divider theme="light" />

      {/* Profile avatar */}
      <div className="global-app-nav__avatar">
        <img
          src={navProfileLeoUrl}
          width={40}
          height={40}
          className="global-app-nav__avatar-img"
          draggable={false}
        />
      </div>
    </div>
  );
}
