import { useEffect, useState } from "react";
import MapView from "./MapView";
import GlobalAppNavigation from "./GlobalAppNavigation";
import FleetsInteractionPanel from "./FleetsInteractionPanel";
import { getFleets } from "../network";
import type { Fleet } from "../network";

function FleetScreen() {
  const [fleets, setFleets] = useState<Fleet[]>([]);

  useEffect(() => {
    getFleets()
      .then(setFleets)
      .catch((err) => console.error("Failed to fetch fleets:", err));
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Centered on South China Sea between Singapore and Hong Kong */}
      <GlobalAppNavigation />
      <MapView center={[109.0, 12.0]} zoom={5} fleets={fleets} />
      <FleetsInteractionPanel fleets={fleets} />
    </div>
  );
}

export default FleetScreen;
