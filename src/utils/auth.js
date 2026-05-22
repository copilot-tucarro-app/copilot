import { OWNER_ACCESS_EMAIL, OWNER_ACCESS_PASSWORD } from "../config/appConfig";

export function normalizeIdentifier(value = "") {
  return value.trim().toLowerCase();
}

export function isOwnerCredentials(identifier, password) {
  return normalizeIdentifier(identifier) === normalizeIdentifier(OWNER_ACCESS_EMAIL) && password === OWNER_ACCESS_PASSWORD;
}

export function isSalesAgentEnabled(user) {
  return Boolean(user?.canUseSalesAgent && normalizeIdentifier(user?.email) === normalizeIdentifier(OWNER_ACCESS_EMAIL));
}

export function buildOwnerUser(identifier = OWNER_ACCESS_EMAIL) {
  return {
    id: "owner-jrudas",
    name: "Jrudas",
    phone: "",
    email: normalizeIdentifier(identifier),
    city: "Medellin",
    role: "owner",
    canUseSalesAgent: true,
    createdAt: new Date().toISOString(),
    source: "owner-login",
  };
}
