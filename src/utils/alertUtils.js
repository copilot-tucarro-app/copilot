import { getDateStatus } from "./dateUtils";

const DOCUMENT_FIELDS = [
  { key: "soatExpiry", noticeKey: "soatNoticeDays", label: "SOAT" },
  { key: "techReviewExpiry", noticeKey: "techReviewNoticeDays", label: "Tecnomecánica" },
  { key: "licenseExpiry", noticeKey: "licenseNoticeDays", label: "Licencia" },
  { key: "taxExpiry", noticeKey: "taxNoticeDays", label: "Impuesto vehicular" },
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
  });
}

export function buildMaintenanceAlerts(vehicle) {
  if (!vehicle) return [];
  const currentKm = Number(vehicle.currentMileage || 0);
  const maintenanceItems = [
    { key: "nextEngineOilKm", label: "Cambio de aceite motor" },
    { key: "nextGearboxOilKm", label: "Cambio de aceite de caja" },
  ];

  return maintenanceItems.map((item) => {
    const targetKm = Number(vehicle[item.key] || 0);
    const remainingKm = targetKm - currentKm;
    let tone = "success";
    let label = "Al día";

    if (!targetKm) {
      tone = "neutral";
      label = "Sin dato";
    } else if (remainingKm <= 0) {
      tone = "danger";
      label = "Urgente";
    } else if (remainingKm <= 500) {
      tone = "warning";
      label = "Próximo";
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

export function buildHomePriorityAlerts(vehicle) {
  if (!vehicle) return [];

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
        message: getDocumentMessage(alert, isExpired, isTax),
      };
    });

  const maintenanceAlerts = buildMaintenanceAlerts(vehicle)
    .filter((alert) => alert.tone === "danger" || alert.tone === "warning")
    .map((alert) => ({
      id: `home-${alert.id}`,
      tone: "warning",
      eyebrow: alert.tone === "danger" ? "Mantenimiento vencido" : "Mantenimiento próximo",
      title: alert.title,
      message:
        alert.tone === "danger"
          ? `El kilometraje objetivo ya se pasó por ${Math.abs(alert.remainingKm).toLocaleString("es-CO")} km. Programa este servicio para evitar daños mayores.`
          : `Faltan ${Math.max(alert.remainingKm, 0).toLocaleString("es-CO")} km para este servicio. Puedes programarlo con tiempo.`,
    }));

  return [...documentAlerts, ...maintenanceAlerts];
}

function getDocumentEyebrow(isExpired, isTax) {
  if (isExpired && isTax) return "Obligación vencida";
  if (isExpired) return "No puedes circular";
  return "Documento por vencer";
}

function getDocumentMessage(alert, isExpired, isTax) {
  if (isExpired && isTax) {
    return "El impuesto vehicular está vencido. Aunque no es Pico y Placa, conviene resolverlo cuanto antes para mantener tu vehículo al día.";
  }

  if (isExpired) {
    return `${alert.title} está vencido. Aunque no tengas Pico y Placa, no puedes circular hasta actualizar este documento.`;
  }

  if (isTax) {
    return `El impuesto vehicular vence ${formatDaysUntil(alert.days)}. Déjalo listo para mantener el vehículo al día.`;
  }

  return `${alert.title} vence ${formatDaysUntil(alert.days)}. Renueva antes de la fecha para evitar bloqueos al salir.`;
}

function formatDaysUntil(days) {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days > 1) return `en ${days.toLocaleString("es-CO")} días`;
  if (days === -1) return "desde ayer";
  return `hace ${Math.abs(days).toLocaleString("es-CO")} días`;
}
