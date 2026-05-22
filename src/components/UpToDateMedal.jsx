import { Medal, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function UpToDateMedal({ vehicleLabel = "Vehiculo principal" }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="up-to-date-medal-button inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-3 text-amber-950 shadow-sm ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-300"
        aria-label="Vehiculo al dia"
        title="Vehiculo al dia"
      >
        <Medal size={21} />
        <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">Al dia</span>
      </button>

      {isOpen ? <UpToDateModal vehicleLabel={vehicleLabel} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

function UpToDateModal({ vehicleLabel, onClose }) {
  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal-panel app-modal-panel-sm">
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-7 text-center">
          <div className="up-to-date-stage mx-auto mb-5 grid size-44 place-items-center">
            <span className="up-to-date-ring" />
            <span className="up-to-date-confetti up-to-date-confetti-1" />
            <span className="up-to-date-confetti up-to-date-confetti-2" />
            <span className="up-to-date-confetti up-to-date-confetti-3" />
            <span className="up-to-date-confetti up-to-date-confetti-4" />
            <span className="up-to-date-road" />
            <span className="up-to-date-car">
              <span className="up-to-date-car-body" />
              <span className="up-to-date-car-window" />
              <span className="up-to-date-car-wheel up-to-date-car-wheel-left" />
              <span className="up-to-date-car-wheel up-to-date-car-wheel-right" />
            </span>
            <span className="up-to-date-medal">
              <Medal size={58} />
            </span>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">{vehicleLabel}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">Felicitaciones tu vehiculo esta al dia</h2>
        </div>
      </div>
    </div>
  );
}
