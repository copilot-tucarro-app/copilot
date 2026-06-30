import { APP_NAME } from "../../config/appConfig";

export const ALLY_PRICE_ANNUAL = 24900;
export const ALLY_CDA_COMMISSION = 5000;
export const ALLY_COPILOT_VALUE = 19900;

export const ALLY_ROLES = {
  admin: "admin_copilot",
  cda: "cda_aliado",
  driver: "conductor",
};

export const CDA_STATUS = {
  active: "activo",
  inactive: "inactivo",
  suspended: "suspendido",
};

export const PRE_REGISTRATION_STATUS = {
  pendingPayment: "pendiente_pago",
  active: "activo",
  expired: "vencido",
  cancelled: "cancelado",
};

export const MEMBERSHIP_STATUS = {
  preRegistration: "pre_registro",
  pendingPayment: "pendiente_pago",
  active: "activo",
  suspended: "suspendido",
  expired: "vencido",
};

export const LIQUIDATION_STATUS = {
  pending: "pendiente",
  paid: "pagada",
};

export const PAYMENT_METHODS = ["Caja", "Efectivo", "Tarjeta", "Transferencia", "Nequi", "Daviplata"];

export const VEHICLE_TYPES = ["Carro", "Moto", "Camioneta", "Taxi", "Servicio publico"];

export const DEFAULT_ALLY_EMAIL_TEMPLATES = {
  welcome: `Tu aliado {nombreCDA} en alianza con ${APP_NAME} te da la bienvenida. Tu servicio ${APP_NAME} Conductores quedo activado por 1 ano.`,
  documentReminder: `Tu aliado {nombreCDA} en alianza con ${APP_NAME} te recuerda que tu {documento} se vence en {diasRestantes} dias.`,
  picoPlaca: `Tu aliado {nombreCDA} en alianza con ${APP_NAME} te recuerda que hoy tienes pico y placa para la placa {placa}.`,
  importantAlert: `Tu aliado {nombreCDA} en alianza con ${APP_NAME} tiene una alerta importante para tu vehiculo {placa}.`,
};
