import "./navHelpers.css";

// ── NavItem ────────────────────────────────────────────────────────────────────

export interface NavItemProps {
  icon: string;
  isDisabled?: boolean;
  onClick?: () => void;
  /** 'light' = white background nav → gray icon; 'dark' = blue background nav → white icon */
  theme?: "light" | "dark";
  badge?: number;
}

export function NavItem({
  icon,
  isDisabled,
  onClick,
  theme = "light",
  badge,
}: NavItemProps) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      className={`nav-item${isDisabled ? " nav-item--disabled" : ""}`}
    >
      <img
        src={icon}
        width={24}
        height={24}
        className={`nav-item__icon${theme === "light" ? " nav-item__icon--dim" : ""}`}
        draggable={false}
      />

      {badge !== undefined && badge > 0 && (
        <div className="nav-item__badge">{badge}</div>
      )}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export interface DividerProps {
  /** 'light' = gray (for white pill); 'dark' = white (for blue pill) */
  theme?: "light" | "dark";
  width?: number;
}

export function Divider({ theme = "light", width = 28 }: DividerProps) {
  return (
    <div
      className={`nav-divider nav-divider--${theme}`}
      style={{ width }}
    />
  );
}
