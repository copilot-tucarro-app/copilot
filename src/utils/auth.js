export function normalizeIdentifier(value = "") {
  return value.trim().toLowerCase();
}

export function isSalesAgentEnabled(user) {
  return isEnabledFlag(user?.canUseSalesAgent);
}

export function isAllyProgramEnabled(user) {
  if (!user) return false;
  const role = normalizeIdentifier(user.role);
  return ["owner", "cda_aliado", "cda_ally"].includes(role) || isEnabledFlag(user?.canUseAllyProgram);
}

export function isCdaAllyUser(user) {
  const role = normalizeIdentifier(user?.role || "");
  return role === "cda_aliado" || role === "cda_ally";
}

export function hasAppAccess(user) {
  if (!user) return false;
  if (normalizeIdentifier(user.role) === "owner") return true;
  if (user.accessActive === true && !user.trialEndsAt && !user.subscriptionEndsAt) return true;

  const subscriptionStatus = normalizeIdentifier(user.subscriptionStatus);
  if (["active", "activa", "paid", "pagada", "subscribed", "suscripcion_activa"].includes(subscriptionStatus)) {
    return !isAccessDateExpired(user.subscriptionEndsAt);
  }

  const accessType = normalizeIdentifier(user.accessType || subscriptionStatus);
  if (accessType === "trial" || accessType === "prueba" || user.trialEndsAt) {
    return !isAccessDateExpired(user.trialEndsAt);
  }

  return false;
}

export function isEnabledFlag(value) {
  if (value === true) return true;
  if (value === false || value === null || typeof value === "undefined") return false;

  const text = normalizeIdentifier(String(value));
  return text === "true" || text === "si" || text === "sí" || text === "1" || text === "yes";
}

function isAccessDateExpired(value) {
  if (!value) return false;

  const text = String(value).trim();
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]), 23, 59, 59, 999)
    : new Date(text);

  if (Number.isNaN(date.getTime())) return false;
  return Date.now() > date.getTime();
}
