import { BookOpen, BriefcaseBusiness, Calculator, Camera } from "lucide-react";

export const centerTools = [
  {
    id: "calculator",
    title: "Calculadora",
    eyebrow: "Costos",
    description: "Gasolina, viajes, ahorro y gasto por kilometro.",
    icon: Calculator,
    tone: "blue",
  },
  {
    id: "code",
    title: "Código",
    eyebrow: "Consulta",
    description: "Normas de tránsito organizadas para revisar rápido.",
    icon: BookOpen,
    tone: "emerald",
  },
  {
    id: "photoFines",
    title: "Fotos",
    eyebrow: "Fotomultas",
    description: "Consulta camaras y puntos de control relevantes.",
    icon: Camera,
    tone: "amber",
  },
  {
    id: "allies",
    title: "Aliados",
    eyebrow: "Servicios",
    description: "Gestiona aliados, registros y oportunidades del programa.",
    icon: BriefcaseBusiness,
    tone: "violet",
    requiresAllies: true,
  },
];

export function getVisibleCenterTools({ canUseAllies = false, alliesOnly = false } = {}) {
  if (alliesOnly) return centerTools.filter((tool) => tool.id === "allies");
  return centerTools.filter((tool) => !tool.requiresAllies || canUseAllies);
}

export function isCenterScreen(screenId) {
  return centerTools.some((tool) => tool.id === screenId);
}
