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

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
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
    soatNoticeDays: pickVehicleValue(vehicle, ["soatNoticeDays", "soatAvisoDias"]) || "30",
    techReviewNoticeDays: pickVehicleValue(vehicle, ["techReviewNoticeDays", "tecnomecanicaAvisoDias", "techReviewAvisoDias"]) || "30",
    licenseNoticeDays: pickVehicleValue(vehicle, ["licenseNoticeDays", "licenciaAvisoDias"]) || "30",
    taxNoticeDays: pickVehicleValue(vehicle, ["taxNoticeDays", "impuestoAvisoDias"]) || "30",
    nextEngineOilKm: pickVehicleValue(vehicle, ["nextEngineOilKm", "proximoAceiteMotorKm"]) || "",
    nextGearboxOilKm: pickVehicleValue(vehicle, ["nextGearboxOilKm", "proximoAceiteCajaKm"]) || "",
  };
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

export function getVehicle(userOrEmail) {
  const email = normalizeUserEmail(userOrEmail) || getCurrentUserEmail();
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
    localStorage.setItem(`${KEYS.activeVehicleId}:${email}`, normalizedVehicle.id);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("copilot:vehicle-updated", { detail: { email, vehicle: normalizedVehicle } }));
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
