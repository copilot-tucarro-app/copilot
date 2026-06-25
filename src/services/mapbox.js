import { APPS_SCRIPT_URL, MAPBOX_ACCESS_TOKEN } from "../config/appConfig";

const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6";
const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1";
const MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox/driving-traffic";
const MAPBOX_TOKEN_CACHE_KEY = "copiloto:mapboxAccessToken";
const MAPBOX_TOKEN_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const SEARCHBOX_TYPES = "address,street,poi,place,neighborhood,locality";
const GEOCODE_TYPES = "address,street,place,locality,neighborhood";
let cachedMapboxAccessToken = MAPBOX_ACCESS_TOKEN || readStoredMapboxToken();
let mapboxTokenRequest = null;

export function isMapboxConfigured() {
  return Boolean(cachedMapboxAccessToken);
}

export async function loadMapboxAccessToken() {
  if (cachedMapboxAccessToken) return cachedMapboxAccessToken;
  if (!isAppsScriptConfigured()) return "";

  if (!mapboxTokenRequest) {
    mapboxTokenRequest = fetchClientConfig()
      .then((result) => {
        cachedMapboxAccessToken = result?.mapboxAccessToken || "";
        storeMapboxToken(cachedMapboxAccessToken);
        return cachedMapboxAccessToken;
      })
      .catch(() => "")
      .finally(() => {
        mapboxTokenRequest = null;
      });
  }

  return mapboxTokenRequest;
}

function readStoredMapboxToken() {
  if (typeof window === "undefined") return "";

  try {
    const rawValue = window.localStorage.getItem(MAPBOX_TOKEN_CACHE_KEY);
    if (!rawValue) return "";

    const cachedValue = JSON.parse(rawValue);
    if (!cachedValue?.token || Date.now() - Number(cachedValue.savedAt || 0) > MAPBOX_TOKEN_CACHE_TTL_MS) {
      window.localStorage.removeItem(MAPBOX_TOKEN_CACHE_KEY);
      return "";
    }

    return cachedValue.token;
  } catch {
    return "";
  }
}

function storeMapboxToken(token) {
  if (typeof window === "undefined" || !token) return;

  try {
    window.localStorage.setItem(
      MAPBOX_TOKEN_CACHE_KEY,
      JSON.stringify({
        token,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // El token publico puede seguir funcionando sin cache local.
  }
}

export async function searchMapboxPlaces(query, options = {}) {
  const accessToken = await loadMapboxAccessToken();
  if (!accessToken) return [];

  const cleanQuery = String(query || "").trim();
  if (cleanQuery.length < 3) return [];

  const sessionToken = options.sessionToken || createMapboxSessionToken();
  const params = new URLSearchParams({
    q: cleanQuery,
    access_token: accessToken,
    session_token: sessionToken,
    country: "CO",
    language: "es",
    limit: "10",
    types: SEARCHBOX_TYPES,
  });

  if (hasCoordinates(options.proximity)) {
    params.set("proximity", `${options.proximity.lng},${options.proximity.lat}`);
  }

  const suggestionsRequest = fetch(`${MAPBOX_SEARCHBOX_URL}/suggest?${params.toString()}`)
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo buscar el lugar en Mapbox.");
      return response.json();
    })
    .then((data) => (data.suggestions || []).map((suggestion) => formatSearchBoxSuggestion(suggestion, sessionToken, options.proximity)))
    .catch(() => []);
  const geocodeRequest = searchMapboxPlacesByText(cleanQuery, { ...options, accessToken }).catch(() => []);

  const [suggestions, geocodeResults] = await Promise.all([suggestionsRequest, geocodeRequest]);
  const orderedResults = looksLikeAddressQuery(cleanQuery) ? [...geocodeResults, ...suggestions] : [...suggestions, ...geocodeResults];

  return dedupePlaces(orderedResults).slice(0, 10);
}

export async function resolveMapboxPlace(place) {
  const accessToken = await loadMapboxAccessToken();
  if (!accessToken || !place?.mapboxId) return place;

  const params = new URLSearchParams({
    access_token: accessToken,
    session_token: place.sessionToken || createMapboxSessionToken(),
    language: "es",
  });

  const response = await fetch(`${MAPBOX_SEARCHBOX_URL}/retrieve/${encodeURIComponent(place.mapboxId)}?${params.toString()}`);
  if (!response.ok) throw new Error("No se pudo leer la ubicacion seleccionada.");

  const data = await response.json();
  const feature = data.features?.[0];
  return feature ? formatSearchBoxFeature(feature, place) : place;
}

export async function reverseMapboxGeocode({ lng, lat }) {
  const accessToken = await loadMapboxAccessToken();
  if (!accessToken || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    access_token: accessToken,
    language: "es",
  });

  const response = await fetch(`${MAPBOX_GEOCODE_URL}/reverse?${params.toString()}`);
  if (!response.ok) throw new Error("No se pudo identificar el origen.");

  const data = await response.json();
  const feature = data.features?.[0];
  return feature ? formatFeature(feature) : null;
}

export async function getTrafficRoutes(origin, destination) {
  const accessToken = await loadMapboxAccessToken();
  if (!accessToken) {
    return {
      routes: [],
      message: "Mapbox no esta configurado.",
    };
  }

  if (!hasCoordinates(origin) || !hasCoordinates(destination)) {
    return {
      routes: [],
      message: "Selecciona origen y destino.",
    };
  }

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    alternatives: "true",
    annotations: "distance,duration,speed,congestion,congestion_numeric",
    banner_instructions: "true",
    overview: "full",
    geometries: "geojson",
    language: "es",
    roundabout_exits: "true",
    steps: "true",
    voice_instructions: "true",
    voice_units: "metric",
    access_token: accessToken,
  });

  const response = await fetch(`${MAPBOX_DIRECTIONS_URL}/${coordinates}?${params.toString()}`);
  if (!response.ok) throw new Error("No se pudieron calcular rutas con trafico.");

  const data = await response.json();
  const routes = (data.routes || []).map((route, index) => formatRoute(route, index));

  return {
    routes,
    waypoints: data.waypoints || [],
  };
}

function formatFeature(feature) {
  const coordinates = feature.geometry?.coordinates || [];
  const properties = feature.properties || {};
  const context = properties.context || {};
  const placeName = properties.full_address || properties.place_formatted || properties.name || feature.place_name || "";

  return {
    id: properties.mapbox_id || feature.id || placeName,
    name: properties.name || placeName,
    label: placeName,
    address: properties.full_address || properties.place_formatted || "",
    lng: Number(coordinates[0]),
    lat: Number(coordinates[1]),
    city: context.place?.name || context.locality?.name || context.region?.name || "",
  };
}

function formatSearchBoxSuggestion(suggestion, sessionToken, proximity) {
  const coordinates = suggestion.coordinates || suggestion.properties?.coordinates || {};
  const lng = Number(coordinates.longitude ?? coordinates.lng);
  const lat = Number(coordinates.latitude ?? coordinates.lat);
  const context = suggestion.context || {};
  const address = suggestion.full_address || suggestion.address || suggestion.place_formatted || "";
  const name = suggestion.name || address || "";
  const label = buildPlaceLabel(name, address || suggestion.place_formatted);
  const location = { lng, lat };

  return {
    id: suggestion.mapbox_id || suggestion.id || label,
    mapboxId: suggestion.mapbox_id || suggestion.id || "",
    sessionToken,
    name,
    label,
    address,
    placeFormatted: suggestion.place_formatted || "",
    category: formatCategory(suggestion.poi_category || suggestion.category),
    type: suggestion.feature_type || suggestion.type || "",
    typeLabel: formatPlaceType(suggestion.feature_type || suggestion.type),
    lng,
    lat,
    distanceMeters: getPlaceDistanceMeters(suggestion, location, proximity),
    neighborhood: pickContextName(context, ["neighborhood", "locality", "district"]),
    city: pickContextName(context, ["place", "locality", "region"]),
  };
}

function formatSearchBoxFeature(feature, fallback = {}, proximity) {
  const properties = feature.properties || {};
  const coordinates = properties.coordinates || {};
  const geometryCoordinates = feature.geometry?.coordinates || [];
  const lng = Number(coordinates.longitude ?? geometryCoordinates[0]);
  const lat = Number(coordinates.latitude ?? geometryCoordinates[1]);
  const context = properties.context || {};
  const address = properties.full_address || properties.address || properties.place_formatted || fallback.address || "";
  const name = properties.name || fallback.name || address || fallback.label || "";
  const label = buildPlaceLabel(name, address || properties.place_formatted || fallback.placeFormatted || fallback.label);
  const location = { lng, lat };

  return {
    ...fallback,
    id: properties.mapbox_id || feature.id || fallback.id || label,
    mapboxId: properties.mapbox_id || fallback.mapboxId || "",
    name,
    label,
    address,
    placeFormatted: properties.place_formatted || fallback.placeFormatted || "",
    category: formatCategory(properties.poi_category || properties.category || fallback.category),
    type: properties.feature_type || fallback.type || "",
    typeLabel: formatPlaceType(properties.feature_type || fallback.type),
    lng,
    lat,
    distanceMeters: getPlaceDistanceMeters(properties, location, proximity) ?? fallback.distanceMeters,
    neighborhood: pickContextName(context, ["neighborhood", "locality", "district"]) || fallback.neighborhood || "",
    city: pickContextName(context, ["place", "locality", "region"]) || fallback.city || "",
  };
}

async function searchMapboxPlacesByText(query, options = {}) {
  const accessToken = options.accessToken || (await loadMapboxAccessToken());
  if (!accessToken) return [];

  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    country: "CO",
    language: "es",
    limit: "10",
    autocomplete: "true",
    types: GEOCODE_TYPES,
  });

  if (hasCoordinates(options.proximity)) {
    params.set("proximity", `${options.proximity.lng},${options.proximity.lat}`);
  }

  const response = await fetch(`${MAPBOX_GEOCODE_URL}/forward?${params.toString()}`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.features || []).map((feature) => formatSearchBoxFeature(feature, {}, options.proximity));
}

function dedupePlaces(places) {
  const seen = new Set();
  return places.filter((place) => {
    const key = normalizePlaceText(place.mapboxId || place.id || `${place.label}:${place.lng}:${place.lat}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeAddressQuery(query) {
  const normalizedQuery = normalizePlaceText(query);
  return /\d/.test(normalizedQuery) || /\b(cl|calle|cra|carrera|av|avenida|diag|diagonal|transversal|tv|autopista|km)\b/.test(normalizedQuery);
}

function buildPlaceLabel(name, detail) {
  const cleanName = String(name || "").trim();
  const cleanDetail = String(detail || "").trim();
  if (!cleanName) return cleanDetail;
  if (!cleanDetail || normalizePlaceText(cleanDetail).includes(normalizePlaceText(cleanName))) return cleanDetail || cleanName;
  return `${cleanName} - ${cleanDetail}`;
}

function formatCategory(category) {
  if (Array.isArray(category)) return String(category[0] || "").trim();
  return String(category || "").trim();
}

function formatPlaceType(type) {
  const labels = {
    address: "Direccion",
    locality: "Zona",
    neighborhood: "Barrio",
    place: "Ciudad",
    poi: "Lugar",
    street: "Via",
  };

  return labels[normalizePlaceText(type)] || "";
}

function pickContextName(context, keys) {
  for (const key of keys) {
    const value = context?.[key];
    const name = typeof value === "string" ? value : value?.name || value?.text;
    if (name) return name;
  }

  return "";
}

function getPlaceDistanceMeters(source, location, proximity) {
  const distance = Number(source?.distance);
  if (Number.isFinite(distance) && distance >= 0) return distance;
  if (hasCoordinates(location) && hasCoordinates(proximity)) return getDistanceMeters(location, proximity);
  return null;
}

function getDistanceMeters(left, right) {
  if (!hasCoordinates(left) || !hasCoordinates(right)) return 0;

  const earthRadiusMeters = 6371000;
  const leftLat = toRadians(left.lat);
  const rightLat = toRadians(right.lat);
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function normalizePlaceText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatRoute(route, index) {
  const leg = route.legs?.[0] || {};
  const annotation = leg.annotation || {};
  const congestion = annotation.congestion || [];
  const congestionNumeric = annotation.congestion_numeric || [];
  const trafficScore = getAverageCongestion(congestionNumeric, congestion);
  const durationTypical = Number(route.duration_typical || leg.duration_typical || 0);

  return {
    id: `route-${index}`,
    index,
    summary: leg.summary || (index === 0 ? "Ruta sugerida" : `Alternativa ${index + 1}`),
    distanceMeters: Number(route.distance || 0),
    durationSeconds: Number(route.duration || 0),
    durationTypicalSeconds: durationTypical,
    trafficScore,
    congestion,
    geometry: route.geometry || null,
    steps: (route.legs || []).flatMap((routeLeg) => routeLeg.steps || []).map(formatStep),
  };
}

function formatStep(step, index) {
  const maneuver = step.maneuver || {};
  const bannerInstruction = step.bannerInstructions?.[0] || step.banner_instructions?.[0] || {};
  const voiceInstructions = step.voiceInstructions || step.voice_instructions || [];

  return {
    id: `step-${index}`,
    index,
    distanceMeters: Number(step.distance || 0),
    durationSeconds: Number(step.duration || 0),
    instruction: maneuver.instruction || bannerInstruction.primary?.text || "Continua",
    maneuverType: maneuver.type || "",
    maneuverModifier: maneuver.modifier || "",
    location: Array.isArray(maneuver.location)
      ? {
          lng: Number(maneuver.location[0]),
          lat: Number(maneuver.location[1]),
        }
      : null,
    geometry: step.geometry || null,
    voiceInstructions: voiceInstructions.map((instruction) => ({
      distanceAlongGeometry: Number(instruction.distanceAlongGeometry || instruction.distance_along_geometry || 0),
      announcement: instruction.announcement || "",
    })),
  };
}

function getAverageCongestion(values, labels) {
  if (Array.isArray(values) && values.length) {
    const numericValues = values.map(Number).filter(Number.isFinite);
    if (numericValues.length) {
      return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
    }
  }

  const weights = {
    unknown: 0,
    low: 1,
    moderate: 2,
    heavy: 3,
    severe: 4,
  };
  const mapped = (labels || []).map((label) => weights[label] ?? 0);
  if (!mapped.length) return 0;
  return mapped.reduce((total, value) => total + value, 0) / mapped.length;
}

function hasCoordinates(value) {
  return Number.isFinite(value?.lng) && Number.isFinite(value?.lat);
}

export function createMapboxSessionToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function isAppsScriptConfigured() {
  return APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("TU_DEPLOYMENT_ID");
}

function fetchClientConfig() {
  const params = new URLSearchParams({
    action: "getClientConfig",
  });

  return fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
  })
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo leer la configuracion.");
      return response.json();
    })
    .catch(() => readClientConfigWithJsonp());
}

function readClientConfigWithJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = `copilotoMapbox${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const query = new URLSearchParams({
      action: "getClientConfig",
      callback: callbackName,
      _ts: Date.now().toString(),
    });
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("No se recibio configuracion de Mapbox."));
    }, 9000);

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
      reject(new Error("No se pudo conectar con la configuracion."));
    };
    script.src = `${APPS_SCRIPT_URL}?${query.toString()}`;
    document.head.appendChild(script);
  });
}
