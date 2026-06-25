import { Bell, CarFrontIcon, CompassIcon, Grid3X3, Home } from "lucide-react";
import { isCenterScreen } from "../config/centerTools";

const navItems = [
  { id: "home", label: "Home", shortLabel: "Inicio", icon: Home },
  { id: "vehicle", label: "Vehiculo", shortLabel: "Auto", icon: CarFrontIcon },
  { id: "travel", label: "Viajes", shortLabel: "Ruta360", icon: CompassIcon },
  { id: "alerts", label: "Alertas", shortLabel: "Avisos", icon: Bell },
  { id: "center", label: "Centro", shortLabel: "Centro", icon: Grid3X3 },
];

export default function BottomNav({ activeScreen, onChange, alliesOnly = false }) {
  const visibleNavItems = navItems.filter((item) => {
    if (alliesOnly) return item.id === "center";
    return true;
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl gap-1 overflow-hidden" style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id || (item.id === "center" && isCenterScreen(activeScreen));
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.58rem] font-bold leading-none transition min-[370px]:gap-1 min-[370px]:py-2 min-[390px]:rounded-2xl ${
                active ? "bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.8 : 2.2} />
              <span className="hidden w-full truncate text-center min-[370px]:block">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
