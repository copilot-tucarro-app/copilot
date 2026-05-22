import { APP_NAME, APP_PUBLIC_URL } from "../config/appConfig";

export function cleanColombianPhone(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length > 10) {
    return digits.slice(2);
  }
  return digits;
}

export function buildAgentWelcomeMessage({ name, email }) {
  return `Hola ${name}, bienvenido a ${APP_NAME} 🚗

Tu registro fue creado correctamente.

Estos son tus datos de acceso:

Correo: ${email}
Contraseña: Copiloto123

Ingresa aquí:
${APP_PUBLIC_URL}

${APP_NAME} te ayudará a recordar vencimientos de SOAT, tecnomecánica, mantenimientos, pico y placa y más.

Tu vehículo siempre al día.`;
}

export function buildWhatsAppUrl(phone, message) {
  const cleanPhone = cleanColombianPhone(phone);
  return `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`;
}
