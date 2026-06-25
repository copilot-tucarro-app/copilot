import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_ICON_URL, APP_NAME } from "../config/appConfig";
import { isAppleMobileDevice } from "../utils/deviceUtils";
import InstallInstructionsModal from "./InstallInstructionsModal";

let savedInstallPrompt = null;

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function InstallAppPrompt({ withBottomNav = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(savedInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(() => (typeof window === "undefined" ? false : isInstalledApp()));
  const [isAppleMobile, setIsAppleMobile] = useState(() => (typeof window === "undefined" ? false : isAppleMobileDevice()));
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");

    function refreshInstalledState() {
      setIsInstalled(isInstalledApp());
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      savedInstallPrompt = event;
      setDeferredPrompt(event);
      setIsDismissed(false);
    }

    function handleAppInstalled() {
      savedInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeQuery.addEventListener?.("change", refreshInstalledState);
    displayModeQuery.addListener?.(refreshInstalledState);
    refreshInstalledState();
    setIsAppleMobile(isAppleMobileDevice());

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener?.("change", refreshInstalledState);
      displayModeQuery.removeListener?.(refreshInstalledState);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    setIsPrompting(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      savedInstallPrompt = null;
      setDeferredPrompt(null);

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } finally {
      setIsPrompting(false);
    }
  }

  if (isInstalled || isDismissed) return null;

  const promptTitle = isAppleMobile ? `Instala ${APP_NAME} en tu iPhone` : `Instala ${APP_NAME} en tu celular`;
  const promptMessage = isAppleMobile
    ? "Toca el boton para ver como agregarla a pantalla de inicio."
    : deferredPrompt
      ? "Toca descargar para agregarla a tu pantalla de inicio."
      : "Toca descargar o usa el menu de Chrome para instalarla.";

  return (
    <>
      <aside
        className={`fixed inset-x-3 z-50 mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white/95 p-3 shadow-soft backdrop-blur ${
          withBottomNav ? "bottom-[5.8rem]" : "bottom-[calc(env(safe-area-inset-bottom)+0.8rem)]"
        }`}
        aria-label={`Instalar ${APP_NAME}`}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-lift ring-1 ring-slate-900/10">
            <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-tight text-slate-950">{promptTitle}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{promptMessage}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={installApp}
              disabled={isPrompting}
              className="grid size-11 place-items-center rounded-2xl bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-neutral-900 disabled:bg-slate-300"
              aria-label="Instalar app"
              title="Instalar app"
            >
              <Download size={19} />
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Ocultar aviso"
              title="Ocultar aviso"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </aside>

      {showInstructions ? <InstallInstructionsModal isAppleMobile={isAppleMobile} onClose={() => setShowInstructions(false)} /> : null}
    </>
  );
}
