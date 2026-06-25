import { buildQrUrl, buildReferralUrl } from "./calculations";
import { APP_NAME } from "../../config/appConfig";
import { ALLY_CDA_COMMISSION, ALLY_COPILOT_VALUE, ALLY_PRICE_ANNUAL, CDA_STATUS, MEMBERSHIP_STATUS, PRE_REGISTRATION_STATUS } from "./constants";

const now = new Date();

function daysAgo(days, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
}

function daysFromNow(days) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const mockCdas = [
  buildCda({
    idCDA: "cda-la33",
    nombreCDA: "CDA Motos La 33",
    nombreComercial: "Motos La 33",
    ciudad: "Medellin",
    zona: "Laureles",
    direccion: "Calle 33 # 74B-21",
    telefono: "604 444 3333",
    whatsapp: "3001234567",
    correo: "aliados@cdala33.co",
    nombreContacto: "Diana Restrepo",
    codigoAliado: "CDA-LA33",
    logoCdaUrl: "",
    observaciones: "Piloto comercial con alto flujo de motos.",
  }),
  buildCda({
    idCDA: "cda-aguacatala",
    nombreCDA: "CDA La Aguacatala",
    nombreComercial: "La Aguacatala",
    ciudad: "Medellin",
    zona: "Poblado",
    direccion: "Cra. 48 # 12 Sur-45",
    telefono: "604 555 1200",
    whatsapp: "3015551200",
    correo: "caja@cdaaguacatala.co",
    nombreContacto: "Santiago Mejia",
    codigoAliado: "CDA-AGUACATALA",
    logoCdaUrl: "",
    observaciones: `Equipo de caja entrenado en servicio ${APP_NAME} Conductores.`,
  }),
  buildCda({
    idCDA: "cda-la80",
    nombreCDA: "CDA La 80 Mediterraneo",
    nombreComercial: "La 80 Mediterraneo",
    ciudad: "Medellin",
    zona: "La 80",
    direccion: "Carrera 80 # 45G-12",
    telefono: "604 448 8080",
    whatsapp: "3024488080",
    correo: "operaciones@cda80.co",
    nombreContacto: "Marcela Alvarez",
    codigoAliado: "CDA-LA80",
    logoCdaUrl: "",
    observaciones: "Aliado listo para campana de renovaciones.",
  }),
];

export const mockPreRegistrations = [
  {
    idPreRegistro: "pre-la33-001",
    idCDA: "cda-la33",
    codigoAliado: "CDA-LA33",
    nombreCDA: "CDA Motos La 33",
    nombreCliente: "Laura Gomez",
    whatsapp: "3009876543",
    placa: "JLK82D",
    ciudad: "Medellin",
    fechaHoraPreRegistro: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
    codigoActivacion: "CDA-LA33-4821",
    estado: PRE_REGISTRATION_STATUS.pendingPayment,
    fuente: "qr",
  },
  {
    idPreRegistro: "pre-la33-002",
    idCDA: "cda-la33",
    codigoAliado: "CDA-LA33",
    nombreCDA: "CDA Motos La 33",
    nombreCliente: "Mateo Rios",
    whatsapp: "3112223344",
    placa: "KTM14F",
    ciudad: "Medellin",
    fechaHoraPreRegistro: new Date(now.getTime() - 1000 * 60 * 42).toISOString(),
    codigoActivacion: "CDA-LA33-7390",
    estado: PRE_REGISTRATION_STATUS.pendingPayment,
    fuente: "qr",
  },
  {
    idPreRegistro: "pre-aguacatala-001",
    idCDA: "cda-aguacatala",
    codigoAliado: "CDA-AGUACATALA",
    nombreCDA: "CDA La Aguacatala",
    nombreCliente: "Camilo Torres",
    whatsapp: "3104402211",
    placa: "HJK412",
    ciudad: "Envigado",
    fechaHoraPreRegistro: daysAgo(1, 16),
    codigoActivacion: "CDA-AGUACATALA-1184",
    estado: PRE_REGISTRATION_STATUS.active,
    fuente: "qr",
  },
  {
    idPreRegistro: "pre-la80-001",
    idCDA: "cda-la80",
    codigoAliado: "CDA-LA80",
    nombreCDA: "CDA La 80 Mediterraneo",
    nombreCliente: "Paula Naranjo",
    whatsapp: "3157770099",
    placa: "LMT892",
    ciudad: "Medellin",
    fechaHoraPreRegistro: daysAgo(8, 12),
    codigoActivacion: "CDA-LA80-9082",
    estado: PRE_REGISTRATION_STATUS.expired,
    fuente: "qr",
  },
];

export const mockSales = [
  buildSale({
    idVenta: "sale-la33-001",
    idCDA: "cda-la33",
    codigoAliado: "CDA-LA33",
    nombreCDA: "CDA Motos La 33",
    idPreRegistro: "pre-sale-la33-001",
    nombreCliente: "Julian Perez",
    whatsappCliente: "3001112233",
    placa: "QWE41F",
    ciudad: "Medellin",
    metodoPago: "Caja",
    fechaActivacion: daysAgo(0, 9),
  }),
  buildSale({
    idVenta: "sale-la33-002",
    idCDA: "cda-la33",
    codigoAliado: "CDA-LA33",
    nombreCDA: "CDA Motos La 33",
    idPreRegistro: "pre-sale-la33-002",
    nombreCliente: "Andrea Molina",
    whatsappCliente: "3010005555",
    placa: "MOL22E",
    ciudad: "Medellin",
    metodoPago: "Tarjeta",
    fechaActivacion: daysAgo(3, 15),
  }),
  buildSale({
    idVenta: "sale-aguacatala-001",
    idCDA: "cda-aguacatala",
    codigoAliado: "CDA-AGUACATALA",
    nombreCDA: "CDA La Aguacatala",
    idPreRegistro: "pre-aguacatala-001",
    nombreCliente: "Camilo Torres",
    whatsappCliente: "3104402211",
    placa: "HJK412",
    ciudad: "Envigado",
    metodoPago: "Efectivo",
    fechaActivacion: daysAgo(1, 16),
  }),
  buildSale({
    idVenta: "sale-la80-001",
    idCDA: "cda-la80",
    codigoAliado: "CDA-LA80",
    nombreCDA: "CDA La 80 Mediterraneo",
    idPreRegistro: "pre-sale-la80-001",
    nombreCliente: "Felipe Ochoa",
    whatsappCliente: "3028088080",
    placa: "FLO944",
    ciudad: "Medellin",
    metodoPago: "Transferencia",
    fechaActivacion: daysAgo(12, 11),
  }),
];

export const mockLiquidations = [
  {
    idLiquidacion: "liq-la33-001",
    idCDA: "cda-la33",
    nombreCDA: "CDA Motos La 33",
    periodoInicio: "2026-05-01",
    periodoFin: "2026-05-15",
    usuariosActivados: 2,
    totalRecaudado: 49800,
    comisionCDA: 10000,
    valorCopilot: 39800,
    saldoPendiente: 0,
    estado: "pagada",
    fechaPago: "2026-05-16",
    comprobantePago: "TR-003194",
    observaciones: "Liquidacion inicial pagada.",
  },
];

function buildCda(cda) {
  const urlReferido = buildReferralUrl(cda.codigoAliado);
  return {
    estado: CDA_STATUS.active,
    fechaRegistro: daysAgo(20, 8),
    totalUsuarios: 0,
    totalVentas: 0,
    comisionGenerada: 0,
    valorCopilotGenerado: 0,
    saldoPendientePorPagarACopilot: 0,
    saldoPagado: 0,
    urlReferido,
    qrReferido: buildQrUrl(urlReferido),
    ...cda,
  };
}

function buildSale(sale) {
  return {
    valorPagado: ALLY_PRICE_ANNUAL,
    comisionCDA: ALLY_CDA_COMMISSION,
    valorCopilot: ALLY_COPILOT_VALUE,
    estadoMembresia: MEMBERSHIP_STATUS.active,
    fechaVencimiento: daysFromNow(365),
    source: "mock",
    ...sale,
  };
}
