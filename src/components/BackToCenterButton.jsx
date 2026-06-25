import { ArrowLeft } from "lucide-react";

export default function BackToCenterButton({ onNavigate }) {
  if (!onNavigate) return null;

  return (
    <button
      type="button"
      onClick={() => onNavigate("center")}
      className="grid size-11 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-black"
      aria-label="Volver al Centro"
      title="Volver al Centro"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
