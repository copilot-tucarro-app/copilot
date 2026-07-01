import { createId } from "./idUtils";

const KEYS = {
  user: "copiloto:user",
  vehicle: "copiloto:vehicle",
  vehicles: "copiloto:vehicles",
  activeVehicleId: "copiloto:activeVehicleId",
  settings: "copiloto:settings",
  agentBuyers: "copiloto:agentBuyers",
};

function normalizeUserEmail(userOrEmail) {
  const value = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return String(value || "").trim().toLowerCase();
}

function getCurrentUserEmail() {
  const user = readJSON(KEYS.user, null);
  return normalizeUserEmail(user);
}

function getVehicleKey(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  return email ? `${KEYS.vehicle}:${email}` : "";
}

function getVehiclesKey(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  return email ? `${KEYS.vehicles}:${email}` : KEYS.vehicles;
}

function getActiveVehicleIdKey(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  return email ? `${KEYS.activeVehicleId}:${email}` : KEYS.activeVehicleId;
}

function readJSON(key, fallback) {
  if (typeof window === "undefined" || !key) return fallback;

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  if (typeof window === "undefined" || !key) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredUser() {
  const user = readJSON(KEYS.user, null);
  if (user?.email === "jonathhandavid" && user?.role === "owner") {
    localStorage.removeItem(KEYS.user);
    return null;
  }
  if (user && !user.sheetValidated) {
    localStorage.removeItem(KEYS.user);
    return null;
  }
  return user;
}

export function setStoredUser(user) {
  writeJSON(KEYS.user, user);
}

export function clearStoredUser() {
  localStorage.removeItem(KEYS.user);
}

function normalizeVehicle(vehicle) {
  if (!vehicle) return null;

  return {
    ...vehicle,
    id: pickVehicleValue(vehicle, ["id", "vehicleId"]) || createId("vehicle"),
    plate: String(pickVehicleValue(vehicle, ["plate", "placa"]) || "").trim().toUpperCase(),
    brand: pickVehicleValue(vehicle, ["brand", "marca"]) || "",
    model: pickVehicleValue(vehicle, ["model", "modelo"]) || "",
    year: pickVehicleValue(vehicle, ["year", "anio", "ano"]) || "",
    type: pickVehicleValue(vehicle, ["type", "tipo", "tipoVehiculo"]) || "Carro",
    city: pickVehicleValue(vehicle, ["city", "ciudad"]) || "",
    fuel: pickVehicleValue(vehicle, ["fuel", "combustible"]) || "",
    currentMileage: pickVehicleValue(vehicle, ["currentMileage", "kilometrajeActual"]) || "",
    autonomyPerGallon: pickVehicleValue(vehicle, ["autonomyPerGallon", "autonomiaPorGalon"]) || "",
    soatExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["soatExpiry", "soatVence"])),
    techReviewExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["techReviewExpiry", "tecnomecanicaVence", "techReviewVence"])),
    licenseExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["licenseExpiry", "licenciaVence"])),
    taxExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["taxExpiry", "impuestoVence"])),
    insuranceExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["insuranceExpiry", "seguroVence"])),
    creditExpiry: normalizeVehicleDate(pickVehicleValue(vehicle, ["creditExpiry", "creditoVence", "vehicleCreditExpiry"])),
    warrantyStartDate: normalizeVehicleDate(pickVehicleValue(vehicle, ["warrantyStartDate", "garantiaInicio"])),
    warrantyYears: pickVehicleValue(vehicle, ["warrantyYears", "garantiaVigenciaAnios"]) || "",
    warrantyExpiryKm: pickVehicleValue(vehicle, ["warrantyExpiryKm", "garantiaVenceKm"]) || "",
    soatNoticeDays: pickVehicleValue(vehicle, ["soatNoticeDays", "soatAvisoDias"]) || "30",
    techReviewNoticeDays: pickVehicleValue(vehicle, ["techReviewNoticeDays", "tecnomecanicaAvisoDias", "techReviewAvisoDias"]) || "30",
    licenseNoticeDays: pickVehicleValue(vehicle, ["licenseNoticeDays", "licenciaAvisoDias"]) || "30",
    taxNoticeDays: pickVehicleValue(vehicle, ["taxNoticeDays", "impuestoAvisoDias"]) || "30",
    insuranceNoticeDays: pickVehicleValue(vehicle, ["insuranceNoticeDays", "seguroAvisoDias"]) || "30",
    creditNoticeDays: pickVehicleValue(vehicle, ["creditNoticeDays", "creditoAvisoDias"]) || "30",
    warrantyNoticeDays: pickVehicleValue(vehicle, ["warrantyNoticeDays", "garantiaAvisoDias"]) || "30",
    lastEngineOilKm: pickVehicleValue(vehicle, ["lastEngineOilKm", "ultimoAceiteMotorKm"]) || "",
    nextEngineOilKm: pickVehicleValue(vehicle, ["nextEngineOilKm", "proximoAceiteMotorKm"]) || "",
    lastGearboxOilKm: pickVehicleValue(vehicle, ["lastGearboxOilKm", "ultimoAceiteCajaKm"]) || "",
    nextGearboxOilKm: pickVehicleValue(vehicle, ["nextGearboxOilKm", "proximoAceiteCajaKm"]) || "",
    maintenanceNotes: pickVehicleValue(vehicle, ["maintenanceNotes", "observaciones"]) || "",
    notificationContacts: normalizeNotificationContacts(pickVehicleValue(vehicle, ["notificationContacts", "contactosNotificacion"])),
  };
}

function normalizeNotificationContacts(value) {
  let contacts = value;

  if (typeof value === "string") {
    try {
      contacts = JSON.parse(value);
    } catch {
      contacts = [];
    }
  }

  return (Array.isArray(contacts) ? contacts : [])
    .slice(0, 2)
    .map((contact) => ({
      name: String(contact?.name || "").trim(),
      email: String(contact?.email || "").trim().toLowerCase(),
      notificationTypes: Array.isArray(contact?.notificationTypes) ? contact.notificationTypes.map((type) => String(type || "").trim()).filter(Boolean) : [],
    }));
}

function pickVehicleValue(vehicle, keys) {
  const sourceKeys = Object.keys(vehicle || {});

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(vehicle, key) && isVehicleValuePresent(vehicle[key])) {
      return vehicle[key];
    }

    const normalizedKey = normalizeStorageKey(key);
    const matchingKey = sourceKeys.find((sourceKey) => normalizeStorageKey(sourceKey) === normalizedKey);

    if (matchingKey && isVehicleValuePresent(vehicle[matchingKey])) {
      return vehicle[matchingKey];
    }
  }

  return "";
}

function isVehicleValuePresent(value) {
  return value !== null && typeof value !== "undefined" && value !== "";
}

function normalizeStorageKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizeVehicleDate(value) {
  if (!value) return "";

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const localMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (localMatch) {
    return `${localMatch[3]}-${localMatch[2].padStart(2, "0")}-${localMatch[1].padStart(2, "0")}`;
  }

  const parsedDate = new Date(text);
  if (Number.isNaN(parsedDate.getTime())) return text;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLegacyVehicleFromList() {
  const vehicles = readJSON(KEYS.vehicles, null);
  if (Array.isArray(vehicles) && vehicles.length) {
    const activeVehicleId = localStorage.getItem(KEYS.activeVehicleId);
    return normalizeVehicle(vehicles.find((vehicle) => vehicle.id === activeVehicleId) || vehicles[0]);
  }

  return null;
}

function normalizeVehicleList(vehicles, userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  const normalizedVehicles = (Array.isArray(vehicles) ? vehicles : [])
    .map((vehicle) => normalizeVehicle(email ? { ...vehicle, userEmail: email } : vehicle))
    .filter(Boolean);

  return ensureSinglePrincipal(dedupeVehicles(normalizedVehicles));
}

function dedupeVehicles(vehicles) {
  const seen = new Set();
  return vehicles.filter((vehicle) => {
    const key = String(vehicle.id || vehicle.plate || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ensureSinglePrincipal(vehicles) {
  if (!vehicles.length) return [];
  const principalIndex = vehicles.findIndex((vehicle) => vehicle.principal);
  const safePrincipalIndex = principalIndex >= 0 ? principalIndex : 0;

  return vehicles.map((vehicle, index) => ({
    ...vehicle,
    principal: index === safePrincipalIndex,
  }));
}

function getScopedVehicles(userOrEmail) {
  const vehicles = readJSON(getVehiclesKey(userOrEmail), null);
  return Array.isArray(vehicles) ? normalizeVehicleList(vehicles, userOrEmail) : [];
}

export function getVehicles(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  const scopedVehicles = getScopedVehicles(email);

  if (scopedVehicles.length) return scopedVehicles;

  const scopedSingleVehicle = normalizeVehicle(readJSON(getVehicleKey(email), null));
  if (scopedSingleVehicle) {
    return setVehicles([scopedSingleVehicle], email, { activeVehicleId: scopedSingleVehicle.id, silent: true });
  }

  const legacySingleVehicle = normalizeVehicle(readJSON(KEYS.vehicle, null));
  if (legacySingleVehicle && (!email || normalizeUserEmail(legacySingleVehicle.userEmail) === email)) {
    return setVehicles([legacySingleVehicle], email, { activeVehicleId: legacySingleVehicle.id, silent: true });
  }

  const legacyVehicles = normalizeVehicleList(readJSON(KEYS.vehicles, null), email).filter((vehicle) => !email || normalizeUserEmail(vehicle.userEmail) === email);
  if (legacyVehicles.length) {
    return setVehicles(legacyVehicles, email, { activeVehicleId: getActiveVehicleId(email) || legacyVehicles[0].id, silent: true });
  }

  return [];
}

export function setVehicles(vehicles, userOrEmail, options = {}) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  const normalizedVehicles = normalizeVehicleList(vehicles, email);
  const activeVehicleId = options.activeVehicleId || getActiveVehicleId(email) || normalizedVehicles.find((vehicle) => vehicle.principal)?.id || normalizedVehicles[0]?.id || "";

  writeJSON(getVehiclesKey(email), normalizedVehicles);

  if (activeVehicleId && typeof window !== "undefined") {
    localStorage.setItem(getActiveVehicleIdKey(email), activeVehicleId);
  }

  const activeVehicle = normalizedVehicles.find((vehicle) => vehicle.id === activeVehicleId) || normalizedVehicles.find((vehicle) => vehicle.principal) || normalizedVehicles[0] || null;
  if (activeVehicle) {
    writeJSON(getVehicleKey(email), activeVehicle);
  }

  if (!options.silent && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("copilot:vehicles-updated", { detail: { email, vehicles: normalizedVehicles, activeVehicleId } }));
    window.dispatchEvent(new CustomEvent("copilot:vehicle-updated", { detail: { email, vehicle: activeVehicle } }));
  }

  return normalizedVehicles;
}

export function getActiveVehicleId(userOrEmail) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getActiveVehicleIdKey(userOrEmail)) || "";
}

export function setActiveVehicleId(vehicleId, userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  if (typeof window !== "undefined" && vehicleId) {
    localStorage.setItem(getActiveVehicleIdKey(email), vehicleId);
    window.dispatchEvent(new CustomEvent("copilot:active-vehicle-updated", { detail: { email, activeVehicleId: vehicleId } }));
  }
  return vehicleId;
}

export function getVehicle(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
  const vehicles = getScopedVehicles(email);
  if (vehicles.length) {
    const activeVehicleId = getActiveVehicleId(email);
    return vehicles.find((vehicle) => vehicle.id === activeVehicleId) || vehicles.find((vehicle) => vehicle.principal) || vehicles[0];
  }

  const scopedKey = getVehicleKey(email);
  const savedVehicle = scopedKey ? normalizeVehicle(readJSON(scopedKey, null)) : null;
  if (savedVehicle) return savedVehicle;

  const legacySingleVehicle = normalizeVehicle(readJSON(KEYS.vehicle, null));
  if (legacySingleVehicle && normalizeUserEmail(legacySingleVehicle.userEmail) === email) {
    writeJSON(scopedKey, legacySingleVehicle);
    return legacySingleVehicle;
  }

  const legacyVehicle = getLegacyVehicleFromList();
  if (legacyVehicle && normalizeUserEmail(legacyVehicle.userEmail) === email) {
    writeJSON(scopedKey, legacyVehicle);
    return legacyVehicle;
  }

  return null;
}

export function setVehicle(vehicle, userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || normalizeUserEmail(vehicle?.userEmail) || getCurrentUserEmail();
  const normalizedVehicle = normalizeVehicle(email ? { ...vehicle, userEmail: email } : vehicle);
  const scopedKey = getVehicleKey(email);

  if (scopedKey) {
    writeJSON(scopedKey, normalizedVehicle);
  }

  if (normalizedVehicle?.id) {
    const currentVehicles = getScopedVehicles(email);
    const nextVehicles = currentVehicles.some((currentVehicle) => currentVehicle.id === normalizedVehicle.id)
      ? currentVehicles.map((currentVehicle) => (currentVehicle.id === normalizedVehicle.id ? normalizedVehicle : currentVehicle))
      : [normalizedVehicle, ...currentVehicles];

    setVehicles(nextVehicles, email, { activeVehicleId: normalizedVehicle.id, silent: true });
    localStorage.setItem(getActiveVehicleIdKey(email), normalizedVehicle.id);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("copilot:vehicle-updated", { detail: { email, vehicle: normalizedVehicle } }));
    window.dispatchEvent(new CustomEvent("copilot:vehicles-updated", { detail: { email, vehicles: getScopedVehicles(email), activeVehicleId: normalizedVehicle?.id } }));
  }

  return normalizedVehicle;
}

export function getSettings() {
  return readJSON(KEYS.settings, {});
}

export function setSettings(settings) {
  writeJSON(KEYS.settings, settings);
}

export function getAgentBuyers() {
  return readJSON(KEYS.agentBuyers, []);
}

export function saveAgentBuyer(buyer) {
  const buyers = getAgentBuyers();
  const updatedBuyers = [buyer, ...buyers].slice(0, 50);
  writeJSON(KEYS.agentBuyers, updatedBuyers);
  return updatedBuyers;
}
