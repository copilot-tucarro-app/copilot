import { ArrowRight, Grid3X3 } from "lucide-react";
import Header from "../components/Header";
import { getVisibleCenterTools } from "../config/centerTools";

const tileStyles = {
  blue: {
    icon: "bg-slate-100 text-slate-950 ring-slate-200",
    accent: "bg-black",
    action: "text-slate-950",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    accent: "bg-emerald-500",
    action: "text-emerald-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    accent: "bg-amber-500",
    action: "text-amber-700",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    accent: "bg-violet-500",
    action: "text-violet-700",
  },
};

export default function Center({ user, onLogout, onNavigate, canUseAllies, alliesOnly }) {
  const tools = getVisibleCenterTools({ canUseAllies, alliesOnly });

  return (
    <main className="screen-shell">
      <Header user={user} onLogout={onLogout} title="Centro" subtitle="Herramientas y servicios para moverte mejor." />

      <section className="mb-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
        <div className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(37,99,235,0.62),transparent_20rem)]" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-white text-blue-600">
              <Grid3X3 size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Mosaico de servicios</p>
              <h2 className="mt-1 text-xl font-black">Todo lo útil en un solo lugar</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">Este espacio queda listo para sumar más herramientas cuando las necesites.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tools.map((tool) => (
          <CenterTile key={tool.id} tool={tool} onOpen={() => onNavigate?.(tool.id)} />
        ))}
      </section>
    </main>
  );
}

function CenterTile({ tool, onOpen }) {
  const Icon = tool.icon;
  const styles = tileStyles[tool.tone] || tileStyles.blue;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[10.5rem] overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 text-left shadow-soft shadow-slate-200/60 ring-1 ring-slate-100 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-black/10"
      aria-label={`Abrir ${tool.title}`}
      title={tool.title}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} />
      <div className={`mb-4 grid size-12 place-items-center rounded-2xl ring-1 ${styles.icon}`}>
        <Icon size={22} />
      </div>
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-400">{tool.eyebrow}</p>
      <h2 className="mt-1 text-base font-black leading-tight text-slate-950">{tool.title}</h2>
      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{tool.description}</p>
      <span className={`mt-4 inline-flex items-center gap-1 text-xs font-black ${styles.action}`}>
        Abrir
        <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
