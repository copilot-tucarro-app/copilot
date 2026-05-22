export function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function todayStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function todayISO() {
  return todayStart().toISOString().slice(0, 10);
}

export function daysUntil(value) {
  const target = parseLocalDate(value);
  if (!target) return null;
  const diff = target.getTime() - todayStart().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDateStatus(value, soonDays = 30) {
  const days = daysUntil(value);
  if (days === null) {
    return { tone: "neutral", label: "Sin fecha", days: null };
  }
  if (days < 0) {
    return { tone: "danger", label: "Vencido", days };
  }
  if (days <= soonDays) {
    return { tone: "warning", label: "Próximo", days };
  }
  return { tone: "success", label: "Al día", days };
}

export function formatShortDate(value) {
  const date = parseLocalDate(value);
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
