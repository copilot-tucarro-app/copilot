function buildWeekRules({
  ciudad,
  label = ciudad,
  tipoVehiculo = "particular",
  criterioPlaca = "ultimo",
  horarioInicio = "06:00",
  horarioFin = "20:00",
  schedule,
  nota = "Regla local vigente.",
}) {
  return Object.entries(schedule).map(([diaSemana, digitosRestriccion]) => ({
    ciudad,
    label,
    tipoVehiculo,
    diaSemana,
    tipoRegla: "lista",
    digitosRestriccion: Array.isArray(digitosRestriccion) ? digitosRestriccion.join(",") : digitosRestriccion,
    criterioPlaca,
    horarioInicio,
    horarioFin,
    activo: true,
    fechaInicio: "",
    fechaFin: "",
    nota,
    fuenteOficial: "Fallback local de copilot360",
    urlFuente: "",
  }));
}

function buildNoRestrictionRule({
  ciudad,
  label = ciudad,
  tipoVehiculo = "particular",
  nota = "Tu ciudad actualmente no tiene restricción configurada para este tipo de vehículo.",
}) {
  return {
    ciudad,
    label,
    tipoVehiculo,
    diaSemana: "todos",
    tipoRegla: "ninguno",
    digitosRestriccion: "",
    criterioPlaca: "ultimo",
    horarioInicio: "",
    horarioFin: "",
    activo: true,
    fechaInicio: "",
    fechaFin: "",
    nota,
    fuenteOficial: "Fallback local de copilot360",
    urlFuente: "",
  };
}

// Mantiene la PWA operativa offline.
export const picoPlacaFallbackRules = [
  ...buildWeekRules({
    ciudad: "Bogota",
    label: "Bogota",
    horarioInicio: "06:00",
    horarioFin: "21:00",
    schedule: {
      1: "1,3,5,7,9",
      2: "0,2,4,6,8",
      3: "1,3,5,7,9",
      4: "0,2,4,6,8",
      5: "1,3,5,7,9",
    },
  }),
  ...buildWeekRules({
    ciudad: "Medellin",
    label: "Medellin y Area Metropolitana",
    horarioInicio: "05:00",
    horarioFin: "20:00",
    schedule: {
      1: "6,9",
      2: "5,7",
      3: "1,4",
      4: "8,0",
      5: "2,3",
    },
  }),
  ...buildWeekRules({
    ciudad: "Medellin",
    label: "Motos Medellin y Area Metropolitana",
    tipoVehiculo: "moto",
    criterioPlaca: "primero",
    horarioInicio: "05:00",
    horarioFin: "20:00",
    schedule: {
      1: "6,9",
      2: "5,7",
      3: "1,4",
      4: "8,0",
      5: "2,3",
    },
  }),
  ...buildWeekRules({
    ciudad: "Cali",
    label: "Cali",
    horarioInicio: "06:00",
    horarioFin: "20:00",
    schedule: {
      1: "3,4",
      2: "5,6",
      3: "7,8",
      4: "9,0",
      5: "1,2",
    },
  }),
  ...buildWeekRules({
    ciudad: "Bucaramanga",
    label: "Bucaramanga",
    schedule: {
      1: "1,2",
      2: "3,4",
      3: "5,6",
      4: "7,8",
      5: "9,0",
    },
  }),
  ...buildWeekRules({
    ciudad: "Armenia",
    label: "Armenia",
    schedule: {
      1: "1,2",
      2: "3,4",
      3: "5,6",
      4: "7,8",
      5: "9,0",
    },
  }),
  ...buildWeekRules({
    ciudad: "Pasto",
    label: "Pasto",
    schedule: {
      1: "0,1",
      2: "2,3",
      3: "4,5",
      4: "6,7",
      5: "8,9",
    },
  }),
  buildNoRestrictionRule({
    ciudad: "Barranquilla",
    label: "Barranquilla",
  }),
  buildNoRestrictionRule({
    ciudad: "Cartagena",
    label: "Cartagena",
  }),
  ...buildWeekRules({
    ciudad: "Manizales",
    label: "Manizales",
    schedule: {
      1: "1,2",
      2: "3,4",
      3: "5,6",
      4: "7,8",
      5: "9,0",
    },
  }),
  ...buildWeekRules({
    ciudad: "Pereira",
    label: "Pereira",
    schedule: {
      1: "0,1",
      2: "2,3",
      3: "4,5",
      4: "6,7",
      5: "8,9",
    },
  }),
  ...buildWeekRules({
    ciudad: "Cucuta",
    label: "Cucuta",
    schedule: {
      1: "1,2",
      2: "3,4",
      3: "5,6",
      4: "7,8",
      5: "9,0",
    },
  }),
];

export default picoPlacaFallbackRules;
