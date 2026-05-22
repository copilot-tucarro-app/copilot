function toNumber(value) {
  const text = String(value || "").replace(/[^\d,.-]/g, "");
  if (!text) return 0;
  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, "")) || 0;
  }
  return Number(text) || 0;
}

function divideSafely(numerator, denominator) {
  const safeDenominator = toNumber(denominator);
  if (!safeDenominator) return 0;
  return toNumber(numerator) / safeDenominator;
}

export function calculateGallons(priceGallon, availableMoney) {
  return divideSafely(availableMoney, priceGallon);
}

export function calculateCostPerKm(priceGallon, autonomy) {
  return divideSafely(priceGallon, autonomy);
}

export function calculateTripCost(distance, priceGallon, autonomy) {
  return divideSafely(distance, autonomy) * toNumber(priceGallon);
}

export function calculateWeeklyMonthlyCost(dailyKm, daysPerWeek, priceGallon, autonomy) {
  const weeklyKm = toNumber(dailyKm) * toNumber(daysPerWeek);
  const weeklyCost = divideSafely(weeklyKm, autonomy) * toNumber(priceGallon);
  return {
    weeklyKm,
    weeklyCost,
    monthlyCost: weeklyCost * 4,
  };
}

export function calculateRemainingRange(currentGallons, autonomyPerGallon) {
  return toNumber(currentGallons) * toNumber(autonomyPerGallon);
}

export function calculateSavings(monthlyKm, priceGallon, currentAutonomy, optimizedAutonomy) {
  const currentCost = divideSafely(monthlyKm, currentAutonomy) * toNumber(priceGallon);
  const optimizedCost = divideSafely(monthlyKm, optimizedAutonomy) * toNumber(priceGallon);
  return {
    currentCost,
    optimizedCost,
    savings: currentCost - optimizedCost,
  };
}
