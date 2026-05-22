import { Bell, BookOpen, Calculator, Camera, Car, Home } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", shortLabel: "Inicio", icon: Home },
  { id: "vehicle", label: "Vehiculo", shortLabel: "Auto", icon: Car },
  { id: "alerts", label: "Alertas", shortLabel: "Avisos", icon: Bell },
  { id: "calculator", label: "Calculos", shortLabel: "Calc", icon: Calculator },
  { id: "code", label: "Codigo", shortLabel: "Codigo", icon: BookOpen },
  { id: "photoFines", label: "Camaras", shortLabel: "Fotos", icon: Camera },
];

export default function BottomNav({ activeScreen, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-6 gap-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.58rem] font-bold leading-none transition min-[370px]:gap-1 min-[370px]:py-2 min-[390px]:rounded-2xl ${
                active ? "bg-blue-600 text-white shadow-lift" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
