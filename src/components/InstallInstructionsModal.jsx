import { APP_ICON_URL, APP_NAME } from "../config/appConfig";

export default function InstallInstructionsModal({ isAppleMobile, onClose, mode = "install" }) {
  const isReinstall = mode === "reinstall";
  const title = isReinstall ? `Reinstala ${APP_NAME}` : `Agrega ${APP_NAME} a tu celular`;
  const eyebrow = isReinstall ? "Nueva version" : "Instalar app";

  return (
    <div className="app-modal-overlay z-[60]" role="dialog" aria-modal="true" aria-labelledby="install-instructions-title">
      <div className="app-modal-panel app-modal-panel-sm p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-900/10">
            <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">{eyebrow}</p>
            <h2 id="install-instructions-title" className="mt-1 text-xl font-black leading-tight text-slate-950">
              {title}
            </h2>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600 ring-1 ring-slate-200">
          {isReinstall && isAppleMobile ? (
            <>
              <p>1. Elimina el acceso anterior de la pantalla de inicio.</p>
              <p>2. Abre copilot360 en Safari.</p>
              <p>3. Toca Compartir y elige Agregar a pantalla de inicio.</p>
            </>
          ) : isReinstall ? (
            <>
              <p>1. Elimina la app instalada del celular.</p>
              <p>2. Abre copilot360 en Chrome.</p>
              <p>3. Toca descargar o usa el menu de Chrome para instalarla.</p>
            </>
          ) : isAppleMobile ? (
            <>
              <p>1. Abre esta pagina en Safari.</p>
              <p>2. Toca Compartir.</p>
              <p>3. Elige Agregar a pantalla de inicio.</p>
            </>
          ) : (
            <>
              <p>1. Abre el menu de Chrome.</p>
              <p>2. Toca Instalar app o Agregar a pantalla principal.</p>
              <p>3. Confirma la instalacion.</p>
            </>
          )}
        </div>

        <button type="button" onClick={onClose} className="primary-button mt-5 w-full">
          Entendido
        </button>
      </div>
    </div>
  );
}
