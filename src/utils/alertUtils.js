import { getDateStatus } from "./dateUtils";

const DOCUMENT_FIELDS = [
  { key: "soatExpiry", noticeKey: "soatNoticeDays", label: "SOAT" },
  { key: "techReviewExpiry", noticeKey: "techReviewNoticeDays", label: "Tecnomecanica" },
  { key: "licenseExpiry", noticeKey: "licenseNoticeDays", label: "Licencia" },
  { key: "taxExpiry", noticeKey: "taxNoticeDays", label: "Impuesto vehicular" },
  { key: "insuranceExpiry", noticeKey: "insuranceNoticeDays", label: "Seguro vehicular" },
  { key: "creditExpiry", noticeKey: "creditNoticeDays", label: "Credito de vehiculo" },
];

export function buildDocumentAlerts(vehicle) {
  if (!vehicle) return [];

  return DOCUMENT_FIELDS.map((item) => {
    const noticeDays = Number(vehicle[item.noticeKey] || 30);
    return {
      id: `${vehicle.id || vehicle.plate}-${item.key}`,
      type: "Documento",
      title: item.label,
      value: vehicle[item.key],
      noticeDays,
      vehicle,
      ...getDateStatus(vehicle[item.key], noticeDays),
    };
  }).concat(buildWarrantyDateAlert(vehicle));
}

export function buildMaintenanceAlerts(vehicle) {
  if (!vehicle) return [];
  const currentKm = Number(vehicle.currentMileage || 0);
  const maintenanceItems = [
    { key: "nextEngineOilKm", label: "Cambio de aceite motor" },
    { key: "nextGearboxOilKm", label: "Cambio de aceite de caja" },
    { key: "warrantyExpiryKm", label: "Garantia de fabrica por kilometraje" },
  ];

  return maintenanceItems.map((item) => {
    const targetKm = Number(vehicle[item.key] || 0);
    const remainingKm = targetKm - currentKm;
    let tone = "success";
    let label = "Al dia";

    if (!targetKm) {
      tone = "neutral";
      label = "Sin dato";
    } else if (remainingKm <= 0) {
      tone = "danger";
      label = "Urgente";
    } else if (remainingKm <= 500) {
      tone = "warning";
      label = "Proximo";
    }

    return {
      id: `${vehicle.id || vehicle.plate}-${item.key}`,
      type: "Mantenimiento",
      title: item.label,
      value: targetKm,
      remainingKm,
      vehicle,
      tone,
      label,
    };
  });
}

export function getOverallTone(alerts) {
  if (alerts.some((alert) => alert.tone === "danger")) return "danger";
  if (alerts.some((alert) => alert.tone === "warning")) return "warning";
  if (alerts.some((alert) => alert.tone === "neutral")) return "neutral";
  return "success";
}

export function isVehicleUpToDate(vehicle) {
  if (!vehicle) return false;
  const alerts = [...buildDocumentAlerts(vehicle), ...buildMaintenanceAlerts(vehicle)];
  return alerts.length > 0 && alerts.every((alert) => alert.tone === "success");
}

export function isFleetUpToDate(vehicles) {
  const vehicleList = normalizeVehiclesInput(vehicles);
  return vehicleList.length > 0 && vehicleList.every(isVehicleUpToDate);
}

export function buildHomePriorityAlerts(vehicleOrVehicles) {
  const vehicleList = normalizeVehiclesInput(vehicleOrVehicles);
  if (!vehicleList.length) return [];

  return vehicleList.flatMap(buildVehicleHomePriorityAlerts).sort(sortPriorityAlerts);
}

function buildVehicleHomePriorityAlerts(vehicle) {
  const vehicleLabel = getVehicleLabel(vehicle);

  const documentAlerts = buildDocumentAlerts(vehicle)
    .filter((alert) => alert.tone === "danger" || alert.tone === "warning")
    .map((alert) => {
      const isExpired = alert.tone === "danger";
      const isTax = alert.title === "Impuesto vehicular";

      return {
        id: `home-${alert.id}`,
        tone: isExpired && !isTax ? "danger" : "warning",
        eyebrow: getDocumentEyebrow(isExpired, isTax),
        title: isExpired ? `${alert.title} vencido` : `${alert.title} vence ${formatDaysUntil(alert.days)}`,
        message: `${vehicleLabel}: ${getDocumentMessage(alert, isExpired, isTax)}`,
      };
    });

  const maintenanceAlerts = buildMaintenanceAlerts(vehicle)
    .filter((alert) => alert.tone === "danger" || alert.tone === "warning")
    .map((alert) => ({
      id: `home-${alert.id}`,
      tone: "warning",
      eyebrow: alert.tone === "danger" ? "Mantenimiento vencido" : "Mantenimiento proximo",
      title: alert.title,
      message:
        alert.tone === "danger"
          ? `${vehicleLabel}: el kilometraje objetivo ya se paso por ${Math.abs(alert.remainingKm).toLocaleString("es-CO")} km. Programa este servicio para evitar danos mayores.`
          : `${vehicleLabel}: faltan ${Math.max(alert.remainingKm, 0).toLocaleString("es-CO")} km para este servicio. Puedes programarlo con tiempo.`,
    }));

  return [...documentAlerts, ...maintenanceAlerts];
}

function buildWarrantyDateAlert(vehicle) {
  if (!vehicle?.warrantyStartDate || !vehicle?.warrantyYears) return [];

  const expiryDate = getWarrantyExpiryDate(vehicle.warrantyStartDate, vehicle.warrantyYears);
  if (!expiryDate) return [];

  const noticeDays = Number(vehicle.warrantyNoticeDays || 30);
  return [
    {
      id: `${vehicle.id || vehicle.plate}-warrantyDate`,
      type: "Documento",
      title: "Garantia de fabrica",
      value: expiryDate,
      noticeDays,
      vehicle,
      ...getDateStatus(expiryDate, noticeDays),
    },
  ];
}

function getWarrantyExpiryDate(startDate, years) {
  const parsedYears = Number(years);
  if (!startDate || !Number.isFinite(parsedYears) || parsedYears <= 0) return "";

  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  date.setFullYear(date.getFullYear() + parsedYears);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeVehiclesInput(vehicleOrVehicles) {
  if (Array.isArray(vehicleOrVehicles)) return vehicleOrVehicles.filter(Boolean);
  return vehicleOrVehicles ? [vehicleOrVehicles] : [];
}

function sortPriorityAlerts(left, right) {
  const toneScore = { danger: 0, warning: 1, neutral: 2, success: 3 };
  return (toneScore[left.tone] ?? 9) - (toneScore[right.tone] ?? 9);
}

function getVehicleLabel(vehicle) {
  const name = [vehicle.brand, vehicle.model].filter(Boolean).join(" ").trim();
  const plate = vehicle.plate || vehicle.placa || "";
  if (name && plate) return `${name} (${plate})`;
  return plate || name || "Vehiculo";
}

function getDocumentEyebrow(isExpired, isTax) {
  if (isExpired && isTax) return "Obligacion vencida";
  if (isExpired) return "No puedes circular";
  return "Documento por vencer";
}

function getDocumentMessage(alert, isExpired, isTax) {
  if (isExpired && isTax) {
    return "El impuesto vehicular esta vencido. Aunque no es Pico y Placa, conviene resolverlo cuanto antes para mantener tu vehiculo al dia.";
  }

  if (isExpired) {
    return `${alert.title} esta vencido. Aunque no tengas Pico y Placa, no puedes circular hasta actualizar este documento.`;
  }

  if (isTax) {
    return `El impuesto vehicular vence ${formatDaysUntil(alert.days)}. Dejalo listo para mantener el vehiculo al dia.`;
  }

  return `${alert.title} vence ${formatDaysUntil(alert.days)}. Renueva antes de la fecha para evitar bloqueos al salir.`;
}

function formatDaysUntil(days) {
  if (days === 0) return "hoy";
  if (days === 1) return "manana";
  if (days > 1) return `en ${days.toLocaleString("es-CO")} dias`;
  if (days === -1) return "desde ayer";
  return `hace ${Math.abs(days).toLocaleString("es-CO")} dias`;
}
