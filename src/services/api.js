import { APPS_SCRIPT_URL } from "../config/appConfig";

const DEFAULT_READ_CACHE_TTL_MS = 1000 * 60 * 5;
const DEFAULT_JSONP_TIMEOUT_MS = 9000;
const READ_CACHE_PREFIX = "copiloto:sheetReadCache:";
const memoryReadCache = new Map();

function isAppsScriptConfigured() {
  return APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("TU_DEPLOYMENT_ID");
}

function readFromAppsScript(action, params = {}, options = {}) {
  if (!isAppsScriptConfigured()) {
    return Promise.resolve({
      ok: false,
      message: "Google Apps Script no esta configurado.",
    });
  }

  const { cache = true, ttlMs = DEFAULT_READ_CACHE_TTL_MS, forceRefresh = false, timeoutMs = DEFAULT_JSONP_TIMEOUT_MS } = options;
  if (!cache) {
    return fetchFromAppsScript(action, params).catch(() => readWithJsonp(action, params, { timeoutMs }));
  }

  const cacheKey = buildReadCacheKey(action, params);
  const cachedMemory = memoryReadCache.get(cacheKey);
  const now = Date.now();

  if (!forceRefresh && cachedMemory?.data && now - cachedMemory.timestamp <= ttlMs) {
    return Promise.resolve(markCacheHit(cachedMemory.data, false));
  }

  if (!forceRefresh && cachedMemory?.promise) {
    return cachedMemory.promise;
  }

  const cachedStorage = readAnyLocalReadCache(cacheKey);
  if (!forceRefresh && cachedStorage?.data && now - cachedStorage.timestamp <= ttlMs) {
    memoryReadCache.set(cacheKey, {
      data: cachedStorage.data,
      timestamp: cachedStorage.timestamp,
    });
    return Promise.resolve(markCacheHit(cachedStorage.data, false));
  }

  const request = fetchFromAppsScript(action, params)
    .catch(() => readWithJsonp(action, params, { timeoutMs }))
    .then((result) => {
      writeReadCache(cacheKey, result);
      return result;
    })
    .catch((error) => {
      if (cachedStorage?.data) {
        return markCacheHit(cachedStorage.data, true);
      }

      throw error;
    })
    .finally(() => {
      const cached = memoryReadCache.get(cacheKey);
      if (cached?.promise === request) {
        memoryReadCache.delete(cacheKey);
      }
    });

  memoryReadCache.set(cacheKey, {
    promise: request,
    timestamp: now,
  });

  return request;
}

function readCachedAppsScript(action, params = {}, options = {}) {
  const { ttlMs = DEFAULT_READ_CACHE_TTL_MS } = options;
  const cacheKey = buildReadCacheKey(action, params);
  const cached = readAnyLocalReadCache(cacheKey);

  if (!cached?.data) return null;

  return markCacheHit(cached.data, Date.now() - cached.timestamp > ttlMs);
}

async function fetchFromAppsScript(action, params = {}) {
  const query = new URLSearchParams({ action, ...params });
  const response = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error("El servicio no respondio correctamente.");
  }

  return JSON.parse(text);
}

function readWithJsonp(action, params = {}, options = {}) {
  const { timeoutMs = DEFAULT_JSONP_TIMEOUT_MS } = options;

  return new Promise((resolve, reject) => {
    const callbackName = `copilotoLogin${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const query = new URLSearchParams({
      action,
      callback: callbackName,
      _ts: Date.now().toString(),
      ...params,
    });
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("No se recibio respuesta del servicio."));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      resolve(response);
    };

    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo conectar con el servicio."));
    };

    script.src = `${APPS_SCRIPT_URL}?${query.toString()}`;
    document.head.appendChild(script);
  });
}

function callJsonpAppsScript(action, params = {}, options = {}) {
  if (!isAppsScriptConfigured()) {
    return Promise.resolve({
      ok: true,
      message: "Google Apps Script no esta configurado.",
      simulated: true,
    });
  }

  return readWithJsonp(action, params, options);
}

async function sendToAppsScript(action, data) {
  const payload = {
    action,
    ...data,
    createdAt: new Date().toISOString(),
  };

  if (!isAppsScriptConfigured()) {
    console.info("Google Apps Script pendiente de configurar", payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      ok: true,
      endpoint: APPS_SCRIPT_URL,
      payload,
      simulated: true,
    };
  }

  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  return {
    ok: true,
    endpoint: APPS_SCRIPT_URL,
    payload,
    delivered: true,
  };
}

function postFormToAppsScript(action, data = {}, options = {}) {
  if (!isAppsScriptConfigured()) {
    return Promise.resolve({
      ok: false,
      message: "Google Apps Script no esta configurado.",
      simulated: true,
    });
  }

  const { timeoutMs = 30000 } = options;
  const requestId = `copilotForm${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    const form = document.createElement("form");
    const input = document.createElement("textarea");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("No se recibio respuesta del servicio."));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      form.remove();
      iframe.remove();
    }

    function onMessage(event) {
      const message = event.data;
      if (!message || message.source !== "copilot360-apps-script" || message.requestId !== requestId) return;
      cleanup();
      resolve(message.data);
    }

    window.addEventListener("message", onMessage);

    iframe.name = requestId;
    iframe.hidden = true;
    form.hidden = true;
    form.method = "POST";
    form.action = APPS_SCRIPT_URL;
    form.target = requestId;
    form.enctype = "application/x-www-form-urlencoded";
    input.name = "payload";
    input.value = JSON.stringify({
      action,
      ...data,
      responseTransport: "postMessage",
      requestId,
      createdAt: new Date().toISOString(),
    });

    form.appendChild(input);
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}

export async function registerBuyerFromAgent(buyer) {
  return sendToAppsScript("registerBuyerFromAgent", { buyer });
}

export async function validateLogin(identifier, password) {
  return readFromAppsScript("validateLogin", { identifier, password }, { cache: false });
}

export async function requestPasswordReset(email) {
  return callJsonpAppsScript("requestPasswordReset", { email: normalizeEmail(email) }, { timeoutMs: 12000 });
}

export async function resetPasswordWithCode(email, code, password) {
  return callJsonpAppsScript(
    "resetPassword",
    {
      email: normalizeEmail(email),
      code: String(code || "").trim(),
      password,
    },
    { timeoutMs: 12000 },
  );
}

export async function getHomeNewsFromSheet() {
  return readFromAppsScript("getHomeNews");
}

export function getCachedHomeNewsFromSheet() {
  return readCachedAppsScript("getHomeNews");
}

export async function refreshHomeNewsFromSheet() {
  return readFromAppsScript("getHomeNews", {}, { forceRefresh: true });
}

export async function getTransitArticlesFromSheet() {
  return readFromAppsScript("getTransitArticles");
}

export function getCachedTransitArticlesFromSheet() {
  return readCachedAppsScript("getTransitArticles");
}

export async function refreshTransitArticlesFromSheet() {
  return readFromAppsScript("getTransitArticles", {}, { forceRefresh: true });
}

export async function getPhotoFinesFromSheet() {
  return readFromAppsScript("getPhotoFines");
}

export function getCachedPhotoFinesFromSheet() {
  return readCachedAppsScript("getPhotoFines");
}

export async function refreshPhotoFinesFromSheet() {
  return readFromAppsScript("getPhotoFines", {}, { forceRefresh: true });
}

export async function getPicoPlacaRulesFromSheet() {
  return readFromAppsScript("getPicoPlacaRules");
}

export async function getPicoBootstrap(email) {
  return readFromAppsScript("getPicoBootstrap", { email: normalizeEmail(email) });
}

export async function getVehicleByUser(email) {
  const cleanEmail = normalizeEmail(email);
  return readFromAppsScript("getVehicleByUser", { email: cleanEmail });
}

export function getCachedVehicleByUser(email) {
  const cleanEmail = normalizeEmail(email);
  return cleanEmail ? readCachedAppsScript("getVehicleByUser", { email: cleanEmail }) : null;
}

export async function refreshVehicleByUser(email) {
  const cleanEmail = normalizeEmail(email);
  return readFromAppsScript("getVehicleByUser", { email: cleanEmail }, { forceRefresh: true });
}

export async function registerUser(user) {
  return sendToAppsScript("registerUser", { user });
}

export async function registerAllyPreRegistration(preRegistration) {
  return sendToAppsScript("registerAllyPreRegistration", { preRegistration });
}

export async function uploadAllyLogoToDrive(logo) {
  return postFormToAppsScript("uploadAllyLogo", { logo }, { timeoutMs: 45000 });
}

export async function getAllyPreRegistrationsFromSheet({ codigoAliado = "", idCDA = "" } = {}) {
  return readFromAppsScript("getAllyPreRegistrations", { codigoAliado, idCDA }, { forceRefresh: true, ttlMs: 0 });
}

export async function updateUserPassword(passwordUpdate) {
  return sendToAppsScript("updateUserPassword", { passwordUpdate });
}

export async function saveVehicleToSheet(vehicle, user) {
  const result = await sendToAppsScript("saveVehicle", { vehicle, user });
  const email = normalizeEmail(user?.email || vehicle?.userEmail);

  if (email) {
    writeReadCache(buildReadCacheKey("getVehicleByUser", { email }), {
      ok: true,
      vehicle,
    });
  }

  return result;
}

export async function sendNotificationContactsTestEmail(vehicle, user) {
  return postFormToAppsScript("sendNotificationContactsTestEmail", { vehicle, user }, { timeoutMs: 30000 });
}

export async function savePushSubscription(subscription) {
  return sendToAppsScript("savePushSubscription", { subscription });
}

export async function logEvent(event) {
  return sendToAppsScript("logEvent", { event });
}

function buildReadCacheKey(action, params = {}) {
  const normalizedParams = Object.entries(params)
    .filter(([, value]) => typeof value !== "undefined" && value !== null)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => [key, String(value)]);

  return `${action}:${JSON.stringify(normalizedParams)}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function markCacheHit(data, stale) {
  return {
    ...data,
    cacheHit: true,
    cacheStale: stale,
  };
}

function readLocalReadCache(cacheKey) {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(`${READ_CACHE_PREFIX}${cacheKey}`);
    if (!rawValue) return null;
    const payload = JSON.parse(rawValue);
    if (!payload?.data || !payload?.timestamp) return null;
    return payload;
  } catch {
    return null;
  }
}

function readAnyLocalReadCache(cacheKey) {
  const cachedMemory = memoryReadCache.get(cacheKey);
  if (cachedMemory?.data) return cachedMemory;

  return readLocalReadCache(cacheKey);
}

function writeReadCache(cacheKey, data) {
  const payload = {
    data,
    timestamp: Date.now(),
  };

  memoryReadCache.set(cacheKey, payload);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(`${READ_CACHE_PREFIX}${cacheKey}`, JSON.stringify(payload));
  } catch {
    // El cache es solo una optimizacion; nunca debe bloquear la app.
  }
}
