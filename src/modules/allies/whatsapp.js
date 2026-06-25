import { APP_NAME, APP_PUBLIC_URL } from "../../config/appConfig";
import { buildWhatsAppUrl } from "../../utils/whatsappUtils";
import { normalizeAllyTemplates, renderTemplate } from "./templates";

export function buildCopilotActivationMessage({ nombreCliente, nombreCDA, codigoAliado, emailTemplates, usuarioAcceso, passwordTemporal }) {
  const templates = normalizeAllyTemplates({ emailTemplates });
  const welcomeText = renderTemplate(templates.welcome, {
    nombreCDA,
    codigoAliado,
    nombreCliente,
    documento: "",
    diasRestantes: "",
    placa: "",
    ciudad: "",
    fecha: "",
  });
  const accessBlock = usuarioAcceso
    ? `
Datos de acceso:
Usuario: ${usuarioAcceso}
Clave temporal: ${passwordTemporal || ""}`
    : "";

  return `Hola ${nombreCliente} 🚗

${welcomeText}

Tu servicio ${APP_NAME} Conductores quedó activado por 1 año.

Ahora podrás recibir:
✅ Recordatorios automáticos
✅ Pico y placa
✅ Alertas importantes
✅ Navegación tipo Waze
✅ Novedades de tránsito

Ingresa aquí:
${APP_PUBLIC_URL}
${accessBlock}

Gracias por activar tu servicio con ${nombreCDA}.

Powered By ${APP_NAME}.`;
}

export function openActivationWhatsApp(client) {
  const message = buildCopilotActivationMessage(client);
  window.open(buildWhatsAppUrl(client.whatsappCliente || client.whatsapp, message), "_blank", "noopener,noreferrer");
}

export function buildPendingActivationMessage({ nombreCliente, codigoActivacion, nombreCDA }) {
  return `Hola ${nombreCliente} 🚗

El ${nombreCDA} en alianza con ${APP_NAME} tiene tu servicio listo para activarse.

Acércate a caja en ${nombreCDA} y comparte este código:
${codigoActivacion}

Finaliza el pago en caja y comienza a recibir alertas automáticas.

Powered By ${APP_NAME}.`;
}

export function openPendingWhatsApp(client) {
  const message = buildPendingActivationMessage(client);
  window.open(buildWhatsAppUrl(client.whatsapp, message), "_blank", "noopener,noreferrer");
}
