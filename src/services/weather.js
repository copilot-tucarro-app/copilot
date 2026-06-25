const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const RAIN_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57,
  61, 63, 65, 66, 67,
  80, 81, 82,
  95, 96, 99,
]);

export async function getRouteWeatherSummary(route) {
  const points = sampleRouteWeatherPoints(route?.geometry?.coordinates || []);

  if (!points.length) {
    return {
      status: "unavailable",
      label: "Clima no disponible",
      raining: false,
      maxPrecipitation: 0,
    };
  }

  const params = new URLSearchParams({
    latitude: points.map((point) => point.lat).join(","),
    longitude: points.map((point) => point.lng).join(","),
    current: "precipitation,rain,showers,weather_code",
    timezone: "auto",
    forecast_days: "1",
  });

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);
  if (!response.ok) throw new Error("No se pudo consultar el clima de la ruta.");

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : [payload];
  const readings = items.map((item, index) => normalizeWeatherReading(item, points[index])).filter(Boolean);
  const rainyReadings = readings.filter((reading) => reading.raining);
  const maxPrecipitation = Math.max(0, ...readings.map((reading) => reading.precipitation));

  if (rainyReadings.length) {
    return {
      status: "rain",
      label: rainyReadings.some((reading) => reading.role === "destination") ? "Lluvia en destino" : "Lluvia en ruta",
      raining: true,
      maxPrecipitation,
    };
  }

  return {
    status: "clear",
    label: "Sin lluvia",
    raining: false,
    maxPrecipitation,
  };
}

function sampleRouteWeatherPoints(coordinates) {
  const validCoordinates = coordinates
    .filter((coordinate) => Array.isArray(coordinate) && Number.isFinite(Number(coordinate[0])) && Number.isFinite(Number(coordinate[1])));

  if (!validCoordinates.length) return [];

  const indexes = Array.from(new Set([
    Math.floor(validCoordinates.length * 0.25),
    Math.floor(validCoordinates.length * 0.5),
    Math.floor(validCoordinates.length * 0.75),
    validCoordinates.length - 1,
  ])).filter((index) => index >= 0 && index < validCoordinates.length);

  return indexes.map((index) => ({
    lng: Number(validCoordinates[index][0]),
    lat: Number(validCoordinates[index][1]),
    role: index === validCoordinates.length - 1 ? "destination" : "route",
  }));
}

function normalizeWeatherReading(item, point) {
  const current = item?.current || {};
  const precipitation = Number(current.precipitation || 0);
  const rain = Number(current.rain || 0);
  const showers = Number(current.showers || 0);
  const weatherCode = Number(current.weather_code);

  return {
    ...point,
    precipitation: precipitation + rain + showers,
    raining: precipitation > 0 || rain > 0 || showers > 0 || RAIN_WEATHER_CODES.has(weatherCode),
    weatherCode,
  };
}
