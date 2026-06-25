import { getPicoPlacaRulesFromSheet } from "./api";
import { picoPlacaFallbackRules } from "./picoPlacaFallback";

const CACHE_KEY = "copiloto:picoPlacaRules:v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_RULE = {
  tipoVehiculo: "particular",
  tipoRegla: "lista",
  criterioPlaca: "ultimo",
  activo: true,
};

export async function getPicoPlacaRules() {
  const payload = await loadRulesWithSource();
  return payload.rules;
}

export function getCachedPicoPlacaRules() {
  return getCachedPicoPlacaRulesPayload().rules;
}

export function getCachedPicoPlacaRulesPayload() {
  const cached = readCachedRules();
  if (cached.rules.length) {
    return { rules: cached.rules, source: cached.isFresh ? "cache" : "cache_expired" };
  }

  return { rules: normalizeRules(picoPlacaFallbackRules), source: "fallback" };
}

export function getActiveRulesByCity(input = {}) {
  const params = typeof input === "string" ? { city: input } : input;
  const rules = normalizeRules(params.rules || getCachedPicoPlacaRules());
  const date = parseDate(params.date) || new Date();
  const cityKey = normalizeText(params.city);
  const vehicleType = normalizeVehicleType(params.vehicleType || params.tipoVehiculo || "particular");

  return rules.filter((rule) => {
    if (!cityKey || normalizeText(rule.ciudad) !== cityKey) return false;
    if (!vehicleTypeMatches(rule.tipoVehiculo, vehicleType)) return false;
    if (!isRuleActive(rule, date)) return false;
    return matchesWeekday(rule.diaSemana, date);
  });
}

export async function checkPicoPlaca({ city, vehicleType = "particular", plate, date = new Date(), rules, rulesSource = "provided" } = {}) {
  const resolvedDate = parseDate(date) || new Date();
  const cleanCity = String(city || "").trim();
  const cleanPlate = normalizePlate(plate);
  const normalizedVehicleType = normalizeVehicleType(vehicleType);

  if (!cleanCity || !cleanPlate || !normalizedVehicleType) {
    return buildResult({
      status: "sin_datos",
      aplica: false,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      title: "Configura tu vehículo",
      message: "Configura ciudad, placa y tipo de vehículo para consultar Pico y Placa.",
    });
  }

  const payload = Array.isArray(rules)
    ? { rules: normalizeRules(rules), source: rulesSource }
    : await loadRulesWithSource();

  const allRules = payload.rules;
  const cityRules = findRulesByCityAndType({
    city: cleanCity,
    vehicleType: normalizedVehicleType,
    date: resolvedDate,
    rules: allRules,
    matchDay: false,
  });
  const activeRules = findRulesByCityAndType({
    city: cleanCity,
    vehicleType: normalizedVehicleType,
    date: resolvedDate,
    rules: allRules,
    matchDay: true,
  });
  const noRestrictionRule = activeRules.find((rule) => rule.tipoRegla === "ninguno");

  if (noRestrictionRule) {
    return buildResult({
      status: "ciudad_sin_restriccion",
      aplica: false,
      rule: noRestrictionRule,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      source: payload.source,
      title: "Tu ciudad no maneja restricción",
      message: `${noRestrictionRule.label} actualmente no tiene restricción para ${formatVehicleType(vehicleType)}.`,
    });
  }

  if (!cityRules.length) {
    return buildResult({
      status: "sin_reglas",
      aplica: false,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      source: payload.source,
      title: "Sin regla configurada",
      message: `No encontramos una regla activa para ${cleanCity} y ${formatVehicleType(vehicleType)}.`,
    });
  }

  if (!activeRules.length) {
    const referenceRule = cityRules[0];
    return buildResult({
      status: "sin_restriccion_hoy",
      aplica: false,
      rule: referenceRule,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      source: payload.source,
      title: "Hoy puedes circular",
      message: "No tienes restricción activa para la fecha consultada.",
    });
  }

  const evaluatedRules = activeRules.map((rule) => {
    const digitoEvaluado = getPlateDigit(cleanPlate, rule.criterioPlaca);
    return {
      rule,
      digitoEvaluado,
      restricted: isDigitRestricted(rule, digitoEvaluado),
    };
  });
  const restrictedMatch = evaluatedRules.find((item) => item.restricted);
  const selected = restrictedMatch || evaluatedRules[0];

  if (selected.digitoEvaluado === null) {
    return buildResult({
      status: "sin_digito",
      aplica: false,
      rule: selected.rule,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      source: payload.source,
      title: "Placa sin dígitos",
      message: "Necesitamos un dígito en la placa para validar la restricción.",
    });
  }

  if (restrictedMatch) {
    return buildResult({
      status: "aplica",
      aplica: true,
      rule: selected.rule,
      ciudad: cleanCity,
      tipoVehiculo: vehicleType,
      placa: cleanPlate,
      digitoEvaluado: selected.digitoEvaluado,
      source: payload.source,
      title: "Hoy tienes Pico y Placa",
      message: `${formatRestriction(selected.rule)}. Tu placa evalúa el dígito ${selected.digitoEvaluado}.`,
    });
  }

  return buildResult({
    status: "no_aplica",
    aplica: false,
    rule: selected.rule,
    ciudad: cleanCity,
    tipoVehiculo: vehicleType,
    placa: cleanPlate,
    digitoEvaluado: selected.digitoEvaluado,
    source: payload.source,
    title: "Hoy puedes circular",
    message: "No tienes restricción activa para tu placa.",
  });
}

async function loadRulesWithSource() {
  try {
    const result = await getPicoPlacaRulesFromSheet();
    const rules = normalizeRules(result?.items || result?.rules || []);

    if (result?.ok && rules.length) {
      writeCachedRules(rules);
      return { rules, source: "remote" };
    }
  } catch (error) {
    console.warn("No se pudieron cargar reglas remotas de Pico y Placa", error);
  }

  const cached = readCachedRules();
  if (cached.rules.length) {
    return { rules: cached.rules, source: cached.isFresh ? "cache" : "cache_expired" };
  }

  return { rules: normalizeRules(picoPlacaFallbackRules), source: "fallback" };
}

function normalizeRules(rules = []) {
  return rules.flatMap(expandRule).map(normalizeRule).filter((rule) => rule.ciudad);
}

function expandRule(rule) {
  if (!rule?.schedule || typeof rule.schedule !== "object") return [rule];

  return Object.entries(rule.schedule).map(([diaSemana, digitosRestriccion]) => ({
    ciudad: rule.ciudad || rule.city,
    label: rule.label,
    tipoVehiculo: rule.tipoVehiculo || rule.vehicleType || "particular",
    diaSemana,
    tipoRegla: "lista",
    digitosRestriccion,
    criterioPlaca: rule.criterioPlaca || rule.plateCriteria || "ultimo",
    horarioInicio: rule.horarioInicio || rule.startTime || "",
    horarioFin: rule.horarioFin || rule.endTime || "",
    activo: rule.activo,
    fechaInicio: rule.fechaInicio || "",
    fechaFin: rule.fechaFin || "",
    nota: rule.nota || rule.note || "",
    fuenteOficial: rule.fuenteOficial || "",
    urlFuente: rule.urlFuente || "",
  }));
}

function normalizeRule(rule = {}) {
  const merged = { ...DEFAULT_RULE, ...rule };
  const tipoRegla = normalizeRuleType(pick(merged, ["tipoRegla", "ruleType"]) || DEFAULT_RULE.tipoRegla);

  return {
    ciudad: String(pick(merged, ["ciudad", "city", "municipio"]) || "").trim(),
    label: String(pick(merged, ["label", "nombre", "zona"]) || pick(merged, ["ciudad", "city", "municipio"]) || "").trim(),
    tipoVehiculo: normalizeVehicleType(pick(merged, ["tipoVehiculo", "vehicleType", "tipo"]) || DEFAULT_RULE.tipoVehiculo),
    diaSemana: normalizeWeekday(pick(merged, ["diaSemana", "weekday", "dia"])),
    tipoRegla,
    digitosRestriccion: normalizeRestrictionValue(pick(merged, ["digitosRestriccion", "restrictedDigits", "digitos", "restriccion"]), tipoRegla),
    criterioPlaca: normalizePlateCriteria(pick(merged, ["criterioPlaca", "plateCriteria"]) || DEFAULT_RULE.criterioPlaca),
    horarioInicio: String(pick(merged, ["horarioInicio", "startTime"]) || "").trim(),
    horarioFin: String(pick(merged, ["horarioFin", "endTime"]) || "").trim(),
    activo: parseActive(pick(merged, ["activo", "active", "estado"])),
    fechaInicio: formatDateOnly(pick(merged, ["fechaInicio", "startDate"])),
    fechaFin: formatDateOnly(pick(merged, ["fechaFin", "endDate"])),
    nota: String(pick(merged, ["nota", "note", "observacion"]) || "").trim(),
    fuenteOficial: String(pick(merged, ["fuenteOficial", "officialSource", "fuente"]) || "").trim(),
    urlFuente: String(pick(merged, ["urlFuente", "sourceUrl", "url"]) || "").trim(),
  };
}

function findRulesByCityAndType({ city, vehicleType, date, rules, matchDay }) {
  const cityKey = normalizeText(city);
  const normalizedType = normalizeVehicleType(vehicleType);

  return normalizeRules(rules).filter((rule) => {
    if (normalizeText(rule.ciudad) !== cityKey) return false;
    if (!vehicleTypeMatches(rule.tipoVehiculo, normalizedType)) return false;
    if (!isRuleActive(rule, date)) return false;
    return matchDay ? matchesWeekday(rule.diaSemana, date) : true;
  });
}

function buildResult({
  status,
  aplica,
  rule = {},
  ciudad = "",
  tipoVehiculo = "",
  placa = "",
  digitoEvaluado = null,
  source = "local",
  title = "",
  message = "",
}) {
  const criterioPlaca = rule.criterioPlaca || normalizePlateCriteria("");

  return {
    aplica,
    ciudad: rule.ciudad || ciudad,
    label: rule.label || ciudad || "Pico y Placa",
    tipoVehiculo: tipoVehiculo || rule.tipoVehiculo || "",
    placa,
    digitoEvaluado,
    criterioPlaca,
    horarioInicio: rule.horarioInicio || "",
    horarioFin: rule.horarioFin || "",
    nota: rule.nota || "",
    fuenteOficial: rule.fuenteOficial || "",
    urlFuente: rule.urlFuente || "",
    status,
    title,
    message,
    tipoRegla: rule.tipoRegla || "",
    digitosRestriccion: Array.isArray(rule.digitosRestriccion) ? rule.digitosRestriccion.join(",") : rule.digitosRestriccion || "",
    restriccionTexto: rule.tipoRegla ? formatRestriction(rule) : "",
    origenReglas: source,
  };
}

function isDigitRestricted(rule, digit) {
  if (rule.tipoRegla === "ninguno" || digit === null) return false;

  if (rule.tipoRegla === "pares_impares") {
    const parity = digit % 2 === 0 ? "PAR" : "IMPAR";
    return rule.digitosRestriccion.includes(parity);
  }

  return rule.digitosRestriccion.includes(Number(digit));
}

function formatRestriction(rule) {
  const target = rule.criterioPlaca === "primero" ? "que empiezan por" : "terminadas en";

  if (rule.tipoRegla === "pares_impares") {
    return `Restricción para placas ${rule.digitosRestriccion.join(" o ").toLowerCase()}`;
  }

  if (rule.tipoRegla === "ninguno") {
    return "Sin restricción activa";
  }

  return `Restricción para placas ${target} ${formatList(rule.digitosRestriccion)}`;
}

function getPlateDigit(plate, criterioPlaca) {
  const digits = String(plate || "").match(/\d/g) || [];
  if (!digits.length) return null;
  return Number(criterioPlaca === "primero" ? digits[0] : digits[digits.length - 1]);
}

function normalizeRestrictionValue(value, tipoRegla) {
  const rawValue = Array.isArray(value) ? value.join(",") : String(value || "");

  if (tipoRegla === "pares_impares") {
    const tokens = rawValue
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^A-Z]+/)
      .filter(Boolean);
    const values = [];
    if (tokens.some((token) => token === "PAR" || token === "PARES")) values.push("PAR");
    if (tokens.some((token) => token === "IMPAR" || token === "IMPARES")) values.push("IMPAR");
    return values;
  }

  const digits = rawValue.match(/\d/g);
  return digits ? digits.map(Number) : [];
}

function normalizeRuleType(value = "") {
  const text = normalizeText(value);
  if (text.includes("ninguno") || text.includes("sinrestriccion")) return "ninguno";
  if (text.includes("par") || text.includes("impar")) return "pares_impares";
  return "lista";
}

function normalizePlateCriteria(value = "") {
  const text = normalizeText(value);
  return text.includes("primer") || text === "first" || text === "primero" ? "primero" : "ultimo";
}

function normalizeVehicleType(value = "") {
  const text = normalizeText(value);
  if (!text || ["todos", "todo", "all", "cualquiera"].includes(text)) return "todos";
  if (text.includes("moto")) return "moto";
  if (text.includes("taxi")) return "taxi";
  if (text.includes("carro") || text.includes("auto") || text.includes("particular") || text.includes("camioneta")) {
    return "particular";
  }
  return text;
}

function vehicleTypeMatches(ruleVehicleType, vehicleType) {
  const ruleType = normalizeVehicleType(ruleVehicleType);
  const selectedType = normalizeVehicleType(vehicleType);
  return ruleType === "todos" || ruleType === selectedType;
}

function isRuleActive(rule, date) {
  if (!rule.activo) return false;

  const targetDate = startOfDay(date);
  const startDate = parseDate(rule.fechaInicio);
  const endDate = parseDate(rule.fechaFin);

  if (startDate && targetDate < startOfDay(startDate)) return false;
  if (endDate && targetDate > startOfDay(endDate)) return false;
  return true;
}

function matchesWeekday(diaSemana, date) {
  if (diaSemana === "todos") return true;
  return Number(diaSemana) === date.getDay();
}

function normalizeWeekday(value) {
  const text = normalizeText(value);
  if (!text || text === "*" || text === "todos" || text === "all" || text === "diario") return "todos";
  if (/^\d+$/.test(text)) {
    const day = Number(text);
    return day === 7 ? 0 : day;
  }

  const days = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  return Object.prototype.hasOwnProperty.call(days, text) ? days[text] : "todos";
}

function parseActive(value) {
  if (value === false) return false;
  if (value === true || value === "" || value === null || typeof value === "undefined") return true;
  const text = normalizeText(value);
  return !["false", "no", "0", "inactivo", "inactive"].includes(text);
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(value) {
  const date = parseDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9*]/g, "")
    .toLowerCase();
}

function normalizePlate(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function formatVehicleType(value = "") {
  const type = normalizeVehicleType(value);
  if (type === "moto") return "motos";
  if (type === "taxi") return "taxis";
  if (type === "particular") return "particulares";
  return value || "vehículos";
}

function formatList(values = []) {
  const items = values.map(String);
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function pick(source, keys) {
  const normalizedSourceKeys = Object.keys(source || {});

  for (let index = 0; index < keys.length; index += 1) {
    const wantedKey = keys[index];
    if (Object.prototype.hasOwnProperty.call(source, wantedKey) && source[wantedKey] !== "") {
      return source[wantedKey];
    }

    const normalizedWantedKey = normalizeText(wantedKey);
    const matchingKey = normalizedSourceKeys.find((key) => normalizeText(key) === normalizedWantedKey);
    if (matchingKey && source[matchingKey] !== "") {
      return source[matchingKey];
    }
  }

  return "";
}

function readCachedRules() {
  if (typeof window === "undefined") return { rules: [], isFresh: false };

  try {
    const payload = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
    const rules = normalizeRules(payload?.rules || []);
    const timestamp = Number(payload?.timestamp || 0);

    return {
      rules,
      isFresh: Boolean(timestamp && Date.now() - timestamp <= CACHE_TTL_MS),
    };
  } catch {
    return { rules: [], isFresh: false };
  }
}

function writeCachedRules(rules) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        rules,
      }),
    );
  } catch {
    // El cache offline es una mejora; no debe bloquear la consulta principal.
  }
}
