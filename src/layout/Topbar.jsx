import PropTypes from "prop-types";
import { User, Menu, LogOut } from "lucide-react";
import { C } from "../styles/theme";
import { NAV } from "../constants/nav";
import { useAuth, ROLLEN_LABEL } from "../auth/AuthContext";

export function Topbar({ view, onToggleSidebar }) {
  const V = NAV.find(v => v.key === view);
  const Icon = V?.icon;
  const { benutzer, authRequired, logout } = useAuth();

  return (
    <div className="sticky top-0 z-50 flex h-15 items-center justify-between border-b border-line bg-surface px-8 shadow-[0_1px_0_rgba(0,0,0,0.06)] max-[768px]:px-3.5 max-[768px]:py-3">
      {/* Left: hamburger + page title */}
      <div className="flex min-w-0 items-center gap-3">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} aria-label="Menü"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-glass text-t2 transition-all duration-150 hover:scale-[1.08] hover:bg-[rgba(0,0,0,0.07)]">
            <Menu size={16} />
          </button>
        )}
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.12)] max-[768px]:hidden">
            <Icon size={16} color={C.blue} />
          </div>
        )}
        <div className="min-w-0">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-bold leading-[1.2] tracking-[-0.02em] text-t1">{V?.label}</div>
          <div className="mt-px text-[11px] text-t4 max-[768px]:hidden">{V?.desc}</div>
        </div>
      </div>

      {/* Right: date + user — Datum-Pille auf Mobil ausgeblendet */}
      <div className="flex shrink-0 items-center gap-3.5">
        <div className="rounded-lg border border-line bg-surface-up px-3 py-1.5 font-mono text-[12px] text-t3 max-[768px]:hidden">
          {new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        </div>

        <div className="h-5 w-px bg-line max-[768px]:hidden" />

        {/* User: echter Benutzer aus dem AuthContext. Bei authRequired:false
            laeuft der Server ohne Auth → "Dev-Modus", kein Logout. */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563EB,#7C3AED)] shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
            <User size={15} color="#fff" />
          </div>
          <div className="max-[768px]:hidden">
            <div className="text-[13px] font-semibold text-t1">{benutzer?.name || "—"}</div>
            <div className="text-[10px] text-t4">
              {authRequired ? (ROLLEN_LABEL[benutzer?.rolle] || benutzer?.rolle || "") : "Dev-Modus"}
            </div>
          </div>
          {authRequired && (
            <button
              onClick={logout}
              title="Abmelden"
              aria-label="Abmelden"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-glass text-t3 transition-all duration-150 hover:scale-[1.08] hover:bg-[rgba(239,68,68,0.09)] hover:text-red-l"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Topbar.propTypes = {
  view: PropTypes.string.isRequired,
  onToggleSidebar: PropTypes.func,
};
