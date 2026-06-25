import { Bell, BellOff, CalendarClock, CarFront, Loader2, Newspaper, Send, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import {
  disableCopilotNotifications,
  enableCopilotNotifications,
  getNotificationCapability,
  getNotificationPreferences,
  runVehicleNotificationCheck,
  seedHomeNewsNotificationHistory,
  sendTestNotification,
  updateNotificationPreferences,
} from "../utils/notificationUtils";
import { APP_NAME } from "../config/appConfig";
import { refreshHomeNewsFromSheet } from "../services/api";
import { getVehicle } from "../utils/storage";

export default function NotificationSettingsCard({ user }) {
  const [preferences, setPreferences] = useState(() => getNotificationPreferences(user));
  const [capability, setCapability] = useState(() => getNotificationCapability());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const active = preferences.enabled && capability.permission === "granted";
  const blocked = capability.permission === "denied";
  const canRequest = capability.supported && capability.secureContext && !blocked;
  const statusMeta = useMemo(() => getStatusMeta({ active, blocked, capability }), [active, blocked, capability]);

  useEffect(() => {
    function refresh() {
      setPreferences(getNotificationPreferences(user));
      setCapability(getNotificationCapability());
    }

    window.addEventListener("copilot:notification-preferences-updated", refresh);
    return () => window.removeEventListener("copilot:notification-preferences-updated", refresh);
  }, [user]);

  async function handleToggleEnabled() {
    setStatus("");
    setBusy("permission");

    try {
      if (active) {
        const nextPreferences = disableCopilotNotifications(user);
        setPreferences(nextPreferences);
        setCapability(getNotificationCapability());
        setStatus(`Notificaciones desactivadas en ${APP_NAME}.`);
        return;
      }

      const result = await enableCopilotNotifications(user);
      if (result.ok) {
        await seedCurrentNews();
      }
      setPreferences(getNotificationPreferences(user));
      setCapability(getNotificationCapability());
      setStatus(result.ok ? "Notificaciones activas en este dispositivo." : result.message);
    } finally {
      setBusy("");
    }
  }

  async function seedCurrentNews() {
    try {
      const result = await refreshHomeNewsFromSheet();
      if (result?.ok && Array.isArray(result.items)) {
        seedHomeNewsNotificationHistory({ user, items: result.items });
      }
    } catch (error) {
      console.warn("No se pudo preparar la linea base de novedades", error);
    }
  }

  function handlePreferenceChange(key, value) {
    const nextPreferences = updateNotificationPreferences(user, { [key]: value });
    setPreferences(nextPreferences);
    setStatus("Preferencias guardadas.");
  }

  async function handleTest() {
    setStatus("");
    setBusy("test");

    try {
      const result = await runVehicleNotificationCheck({
        user,
        vehicle: getVehicle(user),
        force: true,
        includeTestWhenEmpty: true,
      });

      if (result.ok && result.sent > 0) {
        setStatus("Enviamos una notificacion de prueba.");
        return;
      }

      const fallbackShown = await sendTestNotification();
      setStatus(fallbackShown ? "Enviamos una notificacion de prueba." : "No pudimos mostrar la notificacion.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="bg-slate-950 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-100 ring-1 ring-white/15">
              <Smartphone size={14} />
              Push
            </div>
            <h2 className="text-xl font-black leading-tight">Notificaciones del conductor</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Pico y Placa, documentos y novedades en el momento correcto.</p>
          </div>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleToggleEnabled} disabled={!canRequest || busy === "permission"} className={active ? "secondary-button border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" : "primary-button"}>
            {busy === "permission" ? <Loader2 className="animate-spin" size={18} /> : active ? <BellOff size={18} /> : <Bell size={18} />}
            {active ? "Desactivar" : "Activar"}
          </button>
          <button type="button" onClick={handleTest} disabled={!active || busy === "test"} className="secondary-button border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "test" ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Probar
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <NotificationToggle
          icon={CalendarClock}
          label="Documentos"
          detail="SOAT, tecnomecanica, licencia e impuesto."
          checked={preferences.documentReminders}
          disabled={!active}
          onChange={(checked) => handlePreferenceChange("documentReminders", checked)}
        />
        <NotificationToggle
          icon={CarFront}
          label="Pico y Placa"
          detail="Aviso diario cuando la placa tenga restriccion."
          checked={preferences.picoPlaca}
          disabled={!active}
          onChange={(checked) => handlePreferenceChange("picoPlaca", checked)}
        />
        <NotificationToggle
          icon={Newspaper}
          label="Novedades"
          detail="Publicaciones nuevas, tips y alertas importantes."
          checked={preferences.newsUpdates}
          disabled={!active}
          onChange={(checked) => handlePreferenceChange("newsUpdates", checked)}
        />

        <label className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 ${active ? "" : "opacity-60"}`}>
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-950">Hora diaria</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500">Revision automatica del dispositivo.</span>
          </span>
          <input className="input w-32" type="time" value={preferences.dailyReminderTime} disabled={!active} onChange={(event) => handlePreferenceChange("dailyReminderTime", event.target.value)} />
        </label>

        {status || statusMeta.message ? <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${statusMeta.messageTone}`}>{status || statusMeta.message}</p> : null}
      </div>
    </Card>
  );
}

function NotificationToggle({ icon: Icon, label, detail, checked, disabled, onChange }) {
  return (
    <label className={`flex items-center gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 ${disabled ? "opacity-60" : ""}`}>
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
        <Icon size={20} />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-950">{label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{detail}</span>
      </span>
      <input className="size-5 accent-black" type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function getStatusMeta({ active, blocked, capability }) {
  if (!capability.supported) {
    return {
      label: "No disponible",
      tone: "neutral",
      message: "Este navegador no soporta notificaciones.",
      messageTone: "bg-slate-100 text-slate-600",
    };
  }

  if (!capability.secureContext) {
    return {
      label: "HTTPS",
      tone: "warning",
      message: "Las notificaciones requieren HTTPS o localhost.",
      messageTone: "bg-amber-50 text-amber-700",
    };
  }

  if (blocked) {
    return {
      label: "Bloqueadas",
      tone: "danger",
      message: "El permiso esta bloqueado en el navegador.",
      messageTone: "bg-red-50 text-red-700",
    };
  }

  if (active) {
    return {
      label: "Activas",
      tone: "success",
      message: "",
      messageTone: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Inactivas",
    tone: "neutral",
    message: "",
    messageTone: "bg-slate-100 text-slate-600",
  };
}
