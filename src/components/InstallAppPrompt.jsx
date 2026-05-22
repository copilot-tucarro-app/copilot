import { Download, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isAppleMobileDevice() {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const isModernIpad = platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /iPhone|iPad|iPod/.test(userAgent) || isModernIpad;
}

export default function InstallAppPrompt({ withBottomNav = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => (typeof window === "undefined" ? false : isInstalledApp()));
  const [isAppleMobile, setIsAppleMobile] = useState(() => (typeof window === "undefined" ? false : isAppleMobileDevice()));
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");

    function refreshInstalledState() {
      setIsInstalled(isInstalledApp());
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsDismissed(false);
    }

    function handleAppInstalled() {
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
    if (!deferredPrompt) return;

    setIsPrompting(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } finally {
      setIsPrompting(false);
    }
  }

  if (isInstalled || isDismissed) return null;

  const promptTitle = isAppleMobile ? "Instala COPILOT en tu iPhone" : "Instala COPILOT en tu celular";
  const promptMessage = isAppleMobile
    ? "Toca Compartir y luego Agregar a pantalla de inicio."
    : deferredPrompt
      ? "Accede mas rapido desde la pantalla de inicio."
      : "Abre el menu de Chrome y toca Instalar app.";

  return (
    <aside
      className={`fixed inset-x-3 z-50 mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white/95 p-3 shadow-soft backdrop-blur ${
        withBottomNav ? "bottom-[5.8rem]" : "bottom-[calc(env(safe-area-inset-bottom)+0.8rem)]"
      }`}
      aria-label="Instalar COPILOT"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lift">
          <Smartphone size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-tight text-slate-950">{promptTitle}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{promptMessage}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {deferredPrompt ? (
            <button
              type="button"
              onClick={installApp}
              disabled={isPrompting}
              className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lift transition hover:bg-blue-700 disabled:bg-slate-300"
              aria-label="Instalar app"
              title="Instalar app"
            >
              <Download size={19} />
            </button>
          ) : isAppleMobile ? (
            <div
              className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"
              aria-hidden="true"
              title="Usa el boton Compartir"
            >
              <Share2 size={19} />
            </div>
          ) : null}
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
  );
}
