import { Download, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { APP_BRANDING_VERSION, APP_BUILD_VERSION, APP_ICON_URL, APP_LOGIN_LOGO_URL, APP_NAME } from "../config/appConfig";
import { isAppleMobileDevice } from "../utils/deviceUtils";
import InstallInstructionsModal from "./InstallInstructionsModal";

const CHECK_STORAGE_KEY = "copilot360-version-check";
const REINSTALL_DISMISSED_KEY = "copilot360-reinstall-dismissed";

export default function VersionGate({ withBottomNav = false }) {
  const [notice, setNotice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showReinstallInstructions, setShowReinstallInstructions] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(() => isAppleMobileDevice());

  useEffect(() => {
    let cancelled = false;
    setIsAppleMobile(isAppleMobileDevice());

    async function checkVersion() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json?v=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) return;

        const latest = await response.json();
        if (cancelled) return;

        window.localStorage.setItem(
          CHECK_STORAGE_KEY,
          JSON.stringify({
            checkedAt: new Date().toISOString(),
            localVersion: APP_BUILD_VERSION,
            productionVersion: latest.version,
            minVersion: latest.minVersion,
            brandingVersion: latest.brandingVersion,
          }),
        );

        if (compareVersions(APP_BUILD_VERSION, latest.minVersion) < 0) {
          setNotice({ type: "required-update", latest });
          return;
        }

        if (compareVersions(APP_BUILD_VERSION, latest.version) < 0) {
          setNotice({ type: "available-update", latest });
          return;
        }

        const dismissedBranding = window.localStorage.getItem(REINSTALL_DISMISSED_KEY);
        const reinstallKey = latest.brandingVersion || APP_BRANDING_VERSION;

        if (latest.reinstallRecommended && isInstalledApp() && dismissedBranding !== reinstallKey) {
          setNotice({ type: "reinstall", latest, reinstallKey });
        }
      } catch {
        // Version checks should never block the app if the user is offline.
      }
    }

    checkVersion();

    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => buildNoticeContent(notice), [notice]);

  if (!notice || !content) return null;

  const isRequired = notice.type === "required-update";

  async function refreshApp() {
    setRefreshing(true);

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            await registration.update().catch(() => undefined);
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }),
        );
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("copilot")).map((key) => caches.delete(key)));
      }
    } finally {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("appVersion", notice.latest?.version || Date.now().toString());
      window.location.replace(nextUrl.toString());
    }
  }

  function dismissReinstallNotice() {
    if (notice.reinstallKey) {
      window.localStorage.setItem(REINSTALL_DISMISSED_KEY, notice.reinstallKey);
    }
    setNotice(null);
  }

  if (notice.type === "reinstall") {
    return (
      <>
        <aside
          className={`fixed inset-x-3 z-50 mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white/95 p-3 shadow-soft backdrop-blur ${
            withBottomNav ? "bottom-[5.8rem]" : "bottom-[calc(env(safe-area-inset-bottom)+0.8rem)]"
          }`}
          aria-label={`Reinstalar ${APP_NAME}`}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-lift ring-1 ring-slate-900/10">
              <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight text-slate-950">Reinstala {APP_NAME}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Hay nueva version/logo. Toca descargar para ver los pasos.</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReinstallInstructions(true)}
                className="grid size-11 place-items-center rounded-2xl bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-neutral-900"
                aria-label="Ver pasos de reinstalacion"
                title="Ver pasos de reinstalacion"
              >
                <Download size={19} />
              </button>
              <button
                type="button"
                onClick={dismissReinstallNotice}
                className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Ocultar aviso"
                title="Ocultar aviso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </aside>

        {showReinstallInstructions ? (
          <InstallInstructionsModal mode="reinstall" isAppleMobile={isAppleMobile} onClose={() => setShowReinstallInstructions(false)} />
        ) : null}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[9997] flex min-w-80 items-center justify-center overflow-y-auto bg-slate-950/72 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="version-gate-title">
      <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-[0_28px_70px_rgba(2,6,23,0.36)] ring-1 ring-white/70">
        <div className="bg-slate-950 px-5 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <img src={APP_LOGIN_LOGO_URL} alt={APP_NAME} className="size-20 shrink-0 rounded-3xl bg-slate-950 object-contain ring-1 ring-white/10" />
            {!isRequired ? (
              <button type="button" onClick={dismissReinstallNotice} className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white" aria-label="Cerrar">
                <X size={18} />
              </button>
            ) : null}
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-wide text-blue-200">{content.eyebrow}</p>
          <h2 id="version-gate-title" className="mt-1 text-2xl font-black leading-tight">
            {content.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{content.body}</p>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
            <div className="flex justify-between gap-3">
              <span>Instalada</span>
              <span className="font-black text-slate-900">{APP_BUILD_VERSION}</span>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span>Productiva</span>
              <span className="font-black text-slate-900">{notice.latest?.version || "Disponible"}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" className="primary-button w-full" onClick={refreshApp} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Actualizando..." : content.primaryAction}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildNoticeContent(notice) {
  if (!notice) return null;

  if (notice.type === "required-update") {
    return {
      eyebrow: "Actualizacion requerida",
      title: "Hay una nueva version de la app",
      body: "Para seguir usando copilot360 con la version correcta, actualiza la app ahora.",
      primaryAction: "Actualizar ahora",
    };
  }

  if (notice.type === "available-update") {
    return {
      eyebrow: "Nueva version disponible",
      title: "Actualiza copilot360",
      body: "Ya hay una version mas reciente publicada. Actualiza para recibir los ultimos ajustes.",
      primaryAction: "Actualizar app",
    };
  }

  return {
    eyebrow: "Nuevo logo disponible",
    title: "Reinstala para ver el nuevo icono",
    body: notice.latest?.message || "Actualizamos el nombre y los logos de la app. Si el acceso del celular sigue mostrando la imagen anterior, reinstala la app.",
    primaryAction: "Refrescar app",
  };
}

function compareVersions(current, target) {
  const currentParts = normalizeVersion(current);
  const targetParts = normalizeVersion(target);
  const length = Math.max(currentParts.length, targetParts.length);

  for (let index = 0; index < length; index += 1) {
    const currentValue = currentParts[index] || 0;
    const targetValue = targetParts[index] || 0;
    if (currentValue > targetValue) return 1;
    if (currentValue < targetValue) return -1;
  }

  return 0;
}

function normalizeVersion(version) {
  return String(version || "")
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((part) => Number(part));
}

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
