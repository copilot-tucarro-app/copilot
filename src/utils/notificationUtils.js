import { APP_ICON_URL, APP_NAME } from "../config/appConfig";
import { checkPicoPlaca } from "../services/picoPlacaService";
import { savePushSubscription, sendTestPushNotification } from "../services/api";
import { listenForForegroundMessages, registerFirebaseMessagingToken } from "../services/firebaseMessaging";
import { buildDocumentAlerts } from "./alertUtils";
import { todayISO } from "./dateUtils";

const PREFS_KEY_PREFIX = "copiloto:notificationPrefs:";
const SENT_KEY_PREFIX = "copiloto:notificationSent:";
const DEFAULT_DAILY_REMINDER_TIME = "07:00";
const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: false,
  documentReminders: true,
  picoPlaca: true,
  newsUpdates: true,
  dailyReminderTime: DEFAULT_DAILY_REMINDER_TIME,
  lastCheckDate: "",
};
const DEFAULT_PUSH_BODY = `Tienes una alerta pendiente en ${APP_NAME}.`;
let foregroundPushUserKey = "";
let foregroundPushUnsubscribePromise = null;

export function getNotificationCapability() {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const secureContext = typeof window !== "undefined" && (window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname));

  return {
    supported,
    secureContext,
    serviceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    permission: getNotificationPermission(),
  };
}

export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function getNotificationPreferences(userOrEmail) {
  const key = getPreferencesKey(userOrEmail);
  const stored = readJSON(key, {});

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...stored,
    dailyReminderTime: normalizeReminderTime(stored.dailyReminderTime || DEFAULT_DAILY_REMINDER_TIME),
  };
}

export function updateNotificationPreferences(userOrEmail, partialPreferences) {
  const key = getPreferencesKey(userOrEmail);
  const nextPreferences = {
    ...getNotificationPreferences(userOrEmail),
    ...partialPreferences,
  };

  writeJSON(key, nextPreferences);
  dispatchNotificationPreferencesUpdated(nextPreferences);
  return nextPreferences;
}

export async function enableCopilotNotifications(userOrEmail) {
  const capability = getNotificationCapability();

  if (!capability.supported) {
    return { ok: false, reason: "unsupported", message: "Este navegador no soporta notificaciones." };
  }

  if (!capability.secureContext) {
    return { ok: false, reason: "insecure", message: "Las notificaciones requieren HTTPS o localhost." };
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    updateNotificationPreferences(userOrEmail, { enabled: false });
    return { ok: false, reason: permission, message: "Permiso de notificaciones no concedido." };
  }

  updateNotificationPreferences(userOrEmail, { enabled: true });
  const pushRegistration = await registerPushDevice(userOrEmail);
  await showCopilotNotification({
    title: `${APP_NAME} activado`,
    body: pushRegistration.ok
      ? "Te avisaremos aunque la app no este abierta."
      : "Te avisaremos sobre Pico y Placa y vencimientos importantes.",
    tag: "copilot-notifications-enabled",
    data: { type: "system" },
  });

  return { ok: true, permission, pushRegistration };
}

export function disableCopilotNotifications(userOrEmail) {
  return updateNotificationPreferences(userOrEmail, { enabled: false });
}

export async function sendTestNotification() {
  return showCopilotNotification({
    title: "Prueba de notificacion",
    body: `${APP_NAME} puede mostrar alertas en este dispositivo.`,
    tag: `copilot-test-${Date.now()}`,
    data: { type: "test" },
  });
}

export async function sendRemoteTestNotification(userOrEmail) {
  const pushRegistration = await registerPushDevice(userOrEmail);
  if (!pushRegistration.ok) return pushRegistration;

  const result = await sendTestPushNotification({
    email: normalizeUserEmail(userOrEmail),
    token: pushRegistration.token,
  });

  if (!result?.ok) {
    return {
      ok: false,
      reason: "remote_test_failed",
      message: result?.message || result?.error || "No se pudo enviar la prueba push remota.",
    };
  }

  return {
    ok: true,
    pushRegistration,
    firebaseResponse: result.firebaseResponse,
    message: result.message || "Push remoto enviado.",
  };
}

export function startForegroundPushNotifications(userOrEmail) {
  const userKey = normalizeUserEmail(userOrEmail);
  if (!userKey || foregroundPushUserKey === userKey) return;

  if (foregroundPushUnsubscribePromise) {
    foregroundPushUnsubscribePromise.then((unsubscribe) => unsubscribe?.()).catch(() => undefined);
  }

  foregroundPushUserKey = userKey;
  foregroundPushUnsubscribePromise = listenForForegroundMessages(async (payload) => {
    const prefs = getNotificationPreferences(userKey);
    if (!prefs.enabled || getNotificationPermission() !== "granted") return;

    const notification = buildFirebaseForegroundNotification(payload);
    if (notification) await showCopilotNotification(notification);
  }).catch((error) => {
    console.warn("No se pudo escuchar mensajes push en primer plano", error);
    foregroundPushUserKey = "";
    return null;
  });
}

export async function notifyNewHomeNews({ user, items = [] } = {}) {
  const prefs = getNotificationPreferences(user);
  const permission = getNotificationPermission();

  if (!prefs.enabled || !prefs.newsUpdates || permission !== "granted" || !Array.isArray(items) || !items.length) {
    return { ok: false, reason: "disabled", sent: 0 };
  }

  const sentLog = readSentLog(user);
  const notifications = items.map(buildNewsNotification).filter(Boolean);
  let sent = 0;

  for (const notification of notifications) {
    if (sentLog[notification.key]) continue;

    const shown = await showCopilotNotification(notification);
    if (shown) {
      sentLog[notification.key] = new Date().toISOString();
      sent += 1;
    }
  }

  writeSentLog(user, sentLog);
  return { ok: true, sent, pending: notifications.length };
}

export function seedHomeNewsNotificationHistory({ user, items = [] } = {}) {
  if (!Array.isArray(items) || !items.length) return { ok: true, seeded: 0 };

  const sentLog = readSentLog(user);
  let seeded = 0;

  items.map(buildNewsNotification).filter(Boolean).forEach((notification) => {
    if (sentLog[notification.key]) return;
    sentLog[notification.key] = new Date().toISOString();
    seeded += 1;
  });

  writeSentLog(user, sentLog);
  return { ok: true, seeded };
}

export async function runVehicleNotificationCheck({ user, vehicle, vehicles, force = false, includeTestWhenEmpty = false } = {}) {
  const prefs = getNotificationPreferences(user);
  const permission = getNotificationPermission();
  const vehicleList = normalizeVehiclesInput(vehicles || vehicle);

  if (!prefs.enabled) {
    return { ok: false, reason: "disabled", sent: 0 };
  }

  if (permission !== "granted") {
    updateNotificationPreferences(user, { enabled: false });
    return { ok: false, reason: permission, sent: 0 };
  }

  if (!vehicleList.length && !includeTestWhenEmpty) {
    return { ok: true, skipped: true, reason: "no_vehicle", sent: 0 };
  }

  if (!force && !shouldRunNotificationCheck(prefs)) {
    return { ok: true, skipped: true, reason: "scheduled_later", sent: 0 };
  }

  const pendingNotifications = await buildVehicleNotifications({ user, vehicles: vehicleList, prefs });
  const sentLog = readSentLog(user);
  let sent = 0;

  for (const notification of pendingNotifications) {
    if (sentLog[notification.key]) continue;

    const shown = await showCopilotNotification(notification);
    if (shown) {
      sentLog[notification.key] = new Date().toISOString();
      sent += 1;
    }
  }

  if (!sent && includeTestWhenEmpty) {
    const shown = await sendTestNotification();
    sent = shown ? 1 : 0;
  }

  writeSentLog(user, sentLog);
  updateNotificationPreferences(user, {
    lastCheckDate: getTodayKey(),
    lastCheckedAt: new Date().toISOString(),
  });

  return { ok: true, sent, pending: pendingNotifications.length, vehicles: vehicleList.length };
}

export function shouldRunNotificationCheck(preferences = {}) {
  const prefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...preferences,
  };

  if (prefs.lastCheckDate === getTodayKey()) return false;
  return getCurrentMinutes() >= parseReminderTime(prefs.dailyReminderTime);
}

export function getMsUntilNextReminderTime(timeValue = DEFAULT_DAILY_REMINDER_TIME) {
  const now = new Date();
  const target = new Date(now);
  const reminderMinutes = parseReminderTime(timeValue);
  const hour = Math.floor(reminderMinutes / 60);
  const minute = reminderMinutes % 60;

  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(1000, target.getTime() - now.getTime());
}

async function buildVehicleNotifications({ vehicles, prefs }) {
  const vehicleList = normalizeVehiclesInput(vehicles);
  if (!vehicleList.length) return [];

  const notificationsByVehicle = await Promise.all(vehicleList.map((vehicle) => buildSingleVehicleNotifications({ vehicle, prefs })));
  return notificationsByVehicle.flat();
}

async function buildSingleVehicleNotifications({ vehicle, prefs }) {
  if (!vehicle) return [];

  const notifications = [];
  const todayKey = getTodayKey();
  const vehicleKey = getVehicleKey(vehicle);

  if (prefs.documentReminders) {
    buildDocumentAlerts(vehicle)
      .filter((alert) => alert.value && (alert.tone === "warning" || alert.tone === "danger"))
      .forEach((alert) => {
        const urgent = alert.tone === "danger";
        notifications.push({
          key: `document:${vehicleKey}:${alert.title}:${alert.value}:${todayKey}`,
          title: urgent ? `${alert.title} vencido` : `${alert.title} por vencer`,
          body: urgent ? `${alert.title} esta vencido para la placa ${vehicle.plate || vehicle.placa || ""}.` : `${alert.title} vence ${formatDaysUntil(alert.days)}.`,
          tag: `copilot-document-${vehicleKey}-${alert.title}`,
          requireInteraction: urgent,
          data: {
            type: "document",
            screen: "alerts",
          },
        });
      });
  }

  if (prefs.picoPlaca) {
    const picoNotification = await buildPicoPlacaNotification(vehicle, todayKey, vehicleKey);
    if (picoNotification) notifications.push(picoNotification);
  }

  return notifications;
}

function normalizeVehiclesInput(vehicleOrVehicles) {
  if (Array.isArray(vehicleOrVehicles)) return vehicleOrVehicles.filter(Boolean);
  return vehicleOrVehicles ? [vehicleOrVehicles] : [];
}

async function buildPicoPlacaNotification(vehicle, todayKey, vehicleKey) {
  const city = vehicle.city || vehicle.ciudad || "";
  const plate = vehicle.plate || vehicle.placa || "";
  const vehicleType = vehicle.type || vehicle.tipoVehiculo || vehicle.tipo || "particular";

  if (!city || !plate || !vehicleType) return null;

  try {
    const result = await checkPicoPlaca({
      city,
      vehicleType,
      plate,
      date: new Date(),
    });

    if (!result?.aplica) return null;

    return {
      key: `pico:${vehicleKey}:${city}:${todayKey}`,
      title: "Hoy tienes Pico y Placa",
      body: `${result.restriccionTexto || result.message || "Tu placa tiene restriccion hoy."} ${formatPicoSchedule(result)}`,
      tag: `copilot-pico-${vehicleKey}-${todayKey}`,
      requireInteraction: true,
      data: {
        type: "pico-placa",
        screen: "home",
      },
    };
  } catch (error) {
    console.warn("No se pudo preparar la notificacion de Pico y Placa", error);
    return null;
  }
}

function buildNewsNotification(item) {
  const key = getNewsNotificationKey(item);
  if (!key) return null;

  return {
    key,
    title: item.title || `Nueva publicacion en ${APP_NAME}`,
    body: item.description || "Hay una nueva novedad disponible para conductores.",
    tag: key,
    data: {
      type: "news",
      screen: "home",
      newsId: item.id || "",
    },
  };
}

async function showCopilotNotification(notification) {
  const capability = getNotificationCapability();
  if (!capability.supported || capability.permission !== "granted") return false;

  const options = {
    body: notification.body,
    icon: getIconUrl(),
    badge: getBadgeUrl(),
    tag: notification.tag,
    renotify: false,
    requireInteraction: Boolean(notification.requireInteraction),
    data: {
      url: getAppUrl(),
      ...notification.data,
    },
  };

  const registration = await getReadyServiceWorkerRegistration();
  if (registration?.showNotification) {
    try {
      await registration.showNotification(notification.title, options);
      return true;
    } catch (error) {
      console.warn("No se pudo mostrar notificacion desde el service worker", error);
    }
  }

  try {
    const directNotification = new Notification(notification.title, options);
    directNotification.onclick = () => {
      window.focus();
      directNotification.close();
    };
    return true;
  } catch (error) {
    console.warn("No se pudo mostrar notificacion", error);
    return false;
  }
}

async function registerPushDevice(userOrEmail) {
  const registration = await getReadyServiceWorkerRegistration();

  try {
    const result = await registerFirebaseMessagingToken({ serviceWorkerRegistration: registration || undefined });
    if (!result.ok) return result;

    const payload = {
      token: result.token,
      userEmail: normalizeUserEmail(userOrEmail),
      permission: getNotificationPermission(),
      platform: getDevicePlatform(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      appVersion: import.meta.env.VITE_APP_VERSION || "",
      updatedAt: new Date().toISOString(),
    };

    const saveResult = await savePushSubscription(payload);
    if (!saveResult?.ok) {
      return {
        ok: false,
        reason: "subscription_save_failed",
        message: saveResult?.message || saveResult?.error || "No se pudo guardar el token push.",
      };
    }

    return { ok: true, token: result.token, server: saveResult };
  } catch (error) {
    console.warn("No se pudo registrar el dispositivo para push", error);
    return { ok: false, reason: "registration_failed", message: error.message };
  }
}

function buildFirebaseForegroundNotification(payload = {}) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || payload.title || APP_NAME;

  return {
    title,
    body: notification.body || data.body || payload.body || DEFAULT_PUSH_BODY,
    tag: data.tag || notification.tag || payload.tag || `copilot-push-${Date.now()}`,
    requireInteraction: data.requireInteraction === "true" || payload.requireInteraction === true,
    data: {
      type: data.type || payload.type || "push",
      url: data.url || payload.fcmOptions?.link || getAppUrl(),
    },
  };
}

async function getReadyServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
    if (existing) return existing;
  } catch {
    // Seguimos con el fallback de navigator.serviceWorker.ready.
  }

  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => {
        window.setTimeout(() => resolve(null), 800);
      }),
    ]);
  } catch {
    return null;
  }
}

function getDevicePlatform() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgentData?.platform || navigator.platform || "";
}

function formatPicoSchedule(result) {
  if (result?.horarioInicio && result?.horarioFin) {
    return `Horario: ${result.horarioInicio} - ${result.horarioFin}.`;
  }

  return "";
}

function formatDaysUntil(days) {
  if (days === 0) return "hoy";
  if (days === 1) return "manana";
  if (days > 1) return `en ${days.toLocaleString("es-CO")} dias`;
  if (days === -1) return "ayer";
  return `hace ${Math.abs(days).toLocaleString("es-CO")} dias`;
}

function getPreferencesKey(userOrEmail) {
  return `${PREFS_KEY_PREFIX}${normalizeUserEmail(userOrEmail) || "anon"}`;
}

function getSentLogKey(userOrEmail) {
  return `${SENT_KEY_PREFIX}${normalizeUserEmail(userOrEmail) || "anon"}`;
}

function getVehicleKey(vehicle) {
  return String(vehicle?.id || vehicle?.vehicleId || vehicle?.plate || vehicle?.placa || "vehicle")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function getNewsNotificationKey(item) {
  const id = String(item?.id || [item?.title, item?.date].join("|")).trim();
  if (!id || id === "|") return "";
  return `news:${id.toLowerCase()}`;
}

function normalizeUserEmail(userOrEmail) {
  const value = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return String(value || "").trim().toLowerCase();
}

function normalizeReminderTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return DEFAULT_DAILY_REMINDER_TIME;

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseReminderTime(value) {
  const [hour, minute] = normalizeReminderTime(value).split(":").map(Number);
  return hour * 60 + minute;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getTodayKey() {
  return todayISO();
}

function getIconUrl() {
  if (typeof window === "undefined") return APP_ICON_URL;
  return new URL(APP_ICON_URL, window.location.origin).toString();
}

function getBadgeUrl() {
  if (typeof window === "undefined") return "/copilot-icon-192.png";
  return new URL(`${import.meta.env.BASE_URL}copilot-icon-192.png`, window.location.origin).toString();
}

function getAppUrl() {
  if (typeof window === "undefined") return import.meta.env.BASE_URL || "/";
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

function readSentLog(userOrEmail) {
  return readJSON(getSentLogKey(userOrEmail), {});
}

function writeSentLog(userOrEmail, log) {
  writeJSON(getSentLogKey(userOrEmail), pruneSentLog(log));
}

function pruneSentLog(log = {}) {
  const entries = Object.entries(log).slice(-120);
  return Object.fromEntries(entries);
}

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Las notificaciones son una mejora progresiva; si falla storage no bloqueamos la app.
  }
}

function dispatchNotificationPreferencesUpdated(preferences) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("copilot:notification-preferences-updated", { detail: preferences }));
}
