export function normalizeCity(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getLastPlateDigit(plate = "") {
  const digits = plate.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits.at(-1));
}

export function isMotorcycleType(vehicleType = "") {
  return normalizeCity(vehicleType).includes("moto");
}

export function getPlateRestrictionDigit(plate = "", vehicleType = "") {
  const digits = plate.replace(/\D/g, "");
  if (!digits) {
    return {
      digit: null,
      position: isMotorcycleType(vehicleType) ? "first" : "last",
      label: isMotorcycleType(vehicleType) ? "primer número" : "último número",
    };
  }

  const motorcycle = isMotorcycleType(vehicleType);
  return {
    digit: Number(motorcycle ? digits.at(0) : digits.at(-1)),
    position: motorcycle ? "first" : "last",
    label: motorcycle ? "primer número" : "último número",
  };
}

export function getPicoRule(city, rules) {
  const normalizedCity = normalizeCity(city);
  return rules.find((rule) => normalizeCity(rule.city) === normalizedCity || normalizeCity(rule.label).includes(normalizedCity));
}

export function checkPicoPlaca({ city, plate, vehicleType = "Carro", rules, date = new Date() }) {
  const rule = getPicoRule(city, rules);
  const restrictionDigit = getPlateRestrictionDigit(plate, vehicleType);
  const selectedDigit = restrictionDigit.digit;
  const day = date.getDay();

  if (!plate || selectedDigit === null) {
    return {
      status: "neutral",
      restricted: false,
      title: "Ingresa una placa",
      message: `Necesitamos el ${restrictionDigit.label} de la placa para validar la restricción.`,
      lastDigit: null,
      selectedDigit: null,
      digitPosition: restrictionDigit.position,
      rule,
    };
  }

  if (!rule) {
    return {
      status: "neutral",
      restricted: false,
      title: "Ciudad sin regla simulada",
      message: "No hay regla local configurada todavía. Se podrá conectar con Google Sheets después.",
      lastDigit: selectedDigit,
      selectedDigit,
      digitPosition: restrictionDigit.position,
      rule: null,
    };
  }

  const restrictedDigits = rule.schedule[day] || [];
  const restricted = restrictedDigits.includes(selectedDigit);
  const plateDigitText = `La placa tiene ${restrictionDigit.label} ${selectedDigit}`;

  return {
    status: restricted ? "danger" : "success",
    restricted,
    title: restricted ? "Tienes pico y placa" : "Puedes circular",
    message: restricted
      ? `${plateDigitText}, que está restringido para la fecha consultada en ${rule.label}.`
      : `${plateDigitText}; no aparece restringido para la fecha consultada en ${rule.label}.`,
    lastDigit: selectedDigit,
    selectedDigit,
    digitPosition: restrictionDigit.position,
    restrictedDigits,
    rule,
  };
}
