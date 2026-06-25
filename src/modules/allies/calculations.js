import { APP_PUBLIC_URL } from "../../config/appConfig";
import { ALLY_CDA_COMMISSION, ALLY_COPILOT_VALUE, ALLY_PRICE_ANNUAL, LIQUIDATION_STATUS, PRE_REGISTRATION_STATUS } from "./constants";

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("es-CO").format(Number(value) || 0);
}

export function buildReferralUrl(codigoAliado = "") {
  const baseUrl = APP_PUBLIC_URL.endsWith("/") ? APP_PUBLIC_URL : `${APP_PUBLIC_URL}/`;
  const url = new URL(baseUrl);
  if (codigoAliado) {
    url.searchParams.set("ref", codigoAliado);
  }
  return url.toString();
}

export function buildQrUrl(referralUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=16&data=${encodeURIComponent(referralUrl)}`;
}

export function buildActivationCode(codigoAliado = "C360") {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${codigoAliado}-${suffix}`;
}

export function calculateActivationSplit(count = 1) {
  const activations = Number(count) || 0;
  return {
    totalRecaudado: activations * ALLY_PRICE_ANNUAL,
    comisionCDA: activations * ALLY_CDA_COMMISSION,
    valorCopilot: activations * ALLY_COPILOT_VALUE,
  };
}

export function calculateCdaStats(cda, preRegistrations = [], sales = [], liquidations = []) {
  const cdaSales = sales.filter((sale) => sale.idCDA === cda.idCDA);
  const cdaPreRegistrations = preRegistrations.filter((item) => item.idCDA === cda.idCDA);
  const pendingPreRegistrations = cdaPreRegistrations.filter((item) => item.estado === PRE_REGISTRATION_STATUS.pendingPayment);
  const todaySales = cdaSales.filter((sale) => isToday(sale.fechaActivacion));
  const monthSales = cdaSales.filter((sale) => isCurrentMonth(sale.fechaActivacion));
  const paidLiquidations = liquidations.filter((item) => item.idCDA === cda.idCDA && item.estado === LIQUIDATION_STATUS.paid);
  const paidToCopilot = paidLiquidations.reduce((total, item) => total + Number(item.valorCopilot || 0), 0);
  const split = calculateActivationSplit(cdaSales.length);
  const conversionRate = cdaPreRegistrations.length ? Math.round((cdaSales.length / cdaPreRegistrations.length) * 100) : 0;

  return {
    ventasDia: todaySales.length,
    ventasMes: monthSales.length,
    totalUsuarios: cdaSales.length,
    totalVentas: split.totalRecaudado,
    comisionGenerada: split.comisionCDA,
    valorCopilotGenerado: split.valorCopilot,
    saldoPendientePorPagarACopilot: Math.max(0, split.valorCopilot - paidToCopilot),
    saldoPagado: paidToCopilot,
    preRegistros: cdaPreRegistrations.length,
    activacionesPendientes: pendingPreRegistrations.length,
    tasaConversion: conversionRate,
  };
}

export function calculateGlobalStats(cdas = [], preRegistrations = [], sales = [], liquidations = []) {
  const activeCdas = cdas.filter((cda) => cda.estado === "activo");
  const pendingPreRegistrations = preRegistrations.filter((item) => item.estado === PRE_REGISTRATION_STATUS.pendingPayment);
  const monthSales = sales.filter((sale) => isCurrentMonth(sale.fechaActivacion));
  const split = calculateActivationSplit(sales.length);
  const paidToCopilot = liquidations
    .filter((item) => item.estado === LIQUIDATION_STATUS.paid)
    .reduce((total, item) => total + Number(item.valorCopilot || 0), 0);
  const conversionRate = preRegistrations.length ? Math.round((sales.length / preRegistrations.length) * 100) : 0;

  return {
    aliadosActivos: activeCdas.length,
    ventasDia: sales.filter((sale) => isToday(sale.fechaActivacion)).length,
    ventasMes: monthSales.length,
    activacionesPendientes: pendingPreRegistrations.length,
    conversion: conversionRate,
    usuariosActivos: sales.length,
    renovacionesProximas: sales.filter((sale) => daysUntil(sale.fechaVencimiento) <= 30 && daysUntil(sale.fechaVencimiento) >= 0).length,
    ingresosCDA: split.comisionCDA,
    ingresosCopilot: split.valorCopilot,
    saldoPendienteCopilot: Math.max(0, split.valorCopilot - paidToCopilot),
  };
}

export function buildLiquidationSummary(cda, sales = [], periodoInicio, periodoFin) {
  const start = parseDateOnly(periodoInicio);
  const end = parseDateOnly(periodoFin, true);
  const periodSales = sales.filter((sale) => {
    if (sale.idCDA !== cda.idCDA) return false;
    const saleDate = new Date(sale.fechaActivacion);
    return saleDate >= start && saleDate <= end;
  });
  const split = calculateActivationSplit(periodSales.length);

  return {
    idCDA: cda.idCDA,
    nombreCDA: cda.nombreCDA,
    periodoInicio,
    periodoFin,
    usuariosActivados: periodSales.length,
    totalRecaudado: split.totalRecaudado,
    comisionCDA: split.comisionCDA,
    valorCopilot: split.valorCopilot,
    saldoPendiente: split.valorCopilot,
  };
}

export function getTopCdas(cdas = [], preRegistrations = [], sales = [], liquidations = []) {
  return [...cdas]
    .map((cda) => ({
      ...cda,
      stats: calculateCdaStats(cda, preRegistrations, sales, liquidations),
    }))
    .sort((left, right) => right.stats.totalUsuarios - left.stats.totalUsuarios);
}

export function getElapsedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "Ahora";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function addOneYearISO(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function isCurrentMonth(value) {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function daysUntil(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function parseDateOnly(value, endOfDay = false) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}
