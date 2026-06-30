import { DEFAULT_ALLY_EMAIL_TEMPLATES } from "./constants";

export function normalizeAllyTemplates(cda = {}) {
  return {
    ...DEFAULT_ALLY_EMAIL_TEMPLATES,
    ...(cda.emailTemplates || {}),
  };
}

export function renderTemplate(template, values = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value === null || typeof value === "undefined" ? "" : String(value);
  });
}

export function getTemplatePreviewValues(cda = {}) {
  return {
    nombreCDA: cda.nombreCDA || "Aliado",
    codigoAliado: cda.codigoAliado || "ALIADO-DEMO",
    nombreCliente: "Laura",
    documento: "SOAT",
    diasRestantes: "12",
    placa: "ABC123",
    ciudad: cda.ciudad || "Medellin",
    fecha: "15/06/2026",
  };
}

export function isPublicImageUrl(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;

  try {
    const url = new URL(text);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getEmbeddableImageUrl(value = "", size = 160) {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const url = new URL(text);
    if (!url.hostname.includes("drive.google.com")) return text;

    const idFromQuery = url.searchParams.get("id");
    const idFromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    const fileId = idFromQuery || idFromPath;
    if (!fileId) return text;

    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${Number(size) || 160}`;
  } catch {
    return text;
  }
}
