import { AlertTriangle, CarFront, CheckCircle2, Clock3, Info, MapPin, RotateCcw, ShieldCheck, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { APP_NAME } from "../config/appConfig";
import { checkPicoPlaca, getCachedPicoPlacaRulesPayload } from "../services/picoPlacaService";
import { polishSpanishText } from "../utils/textUtils";

export default function PicoPlacaWidget({ vehicle, syncStatus = "idle" }) {
  const profile = useMemo(() => resolveVehicleProfile(vehicle), [vehicle]);
  const [state, setState] = useState({ status: "idle", result: null });

  useEffect(() => {
    let isActive = true;
    let freshResolved = false;

    if (!profile.city || !profile.plate || !profile.vehicleType) {
      setState({ status: "no-data", result: null });
      return () => {
        isActive = false;
      };
    }

    setState((current) => ({ ...current, status: current.result ? "refreshing" : "loading" }));

    const cachedRulesPayload = getCachedPicoPlacaRulesPayload();

    checkPicoPlaca({
      city: profile.city,
      vehicleType: profile.vehicleType,
      plate: profile.plate,
      date: new Date(),
      rules: cachedRulesPayload.rules,
      rulesSource: cachedRulesPayload.source,
    })
      .then((result) => {
        if (isActive && !freshResolved) setState({ status: "ready", result });
      })
      .catch((error) => console.warn("No se pudo calcular Pico y Placa desde caché", error));

    checkPicoPlaca({
      city: profile.city,
      vehicleType: profile.vehicleType,
      plate: profile.plate,
      date: new Date(),
    })
      .then((result) => {
        freshResolved = true;
        if (isActive) setState({ status: "ready", result });
      })
      .catch((error) => {
        console.warn("No se pudo calcular Pico y Placa", error);
        if (isActive) setState({ status: "error", result: null });
      });

    return () => {
      isActive = false;
    };
  }, [profile.city, profile.plate, profile.vehicleType]);

  if (state.status === "no-data") {
    return <PicoEmptyCard syncStatus={syncStatus} />;
  }

  if (state.status === "loading" || state.status === "idle") {
    return <PicoLoadingCard />;
  }

  if (state.status === "error") {
    return <PicoErrorCard />;
  }

  return <PicoResultCard result={state.result} isRefreshing={state.status === "refreshing"} syncStatus={syncStatus} />;
}

function PicoResultCard({ result, isRefreshing, syncStatus }) {
  const visual = getVisualState(result);
  const Icon = visual.icon;
  const sourceLabel = getSourceLabel(result.origenReglas);
  const showOffline = result.origenReglas && result.origenReglas !== "remote" && result.origenReglas !== "provided";

  return (
    <Card className={`mb-5 overflow-hidden ring-1 ${visual.ring}`}>
      <div className={`relative p-5 text-white ${visual.header}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-white/45" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/80">
                <ShieldCheck size={13} />
                Asistente vehicular
              </span>
              {isRefreshing || syncStatus === "updating" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black text-white/80">
                  <RotateCcw className="animate-spin" size={13} />
                  Actualizando
                </span>
              ) : null}
              {showOffline ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black text-white/80">
                  <WifiOff size={13} />
                  {sourceLabel}
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl font-black leading-tight">{polishSpanishText(result.title)}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/80">{polishSpanishText(result.message)}</p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-white/20 ring-1 ring-white/25">
            <Icon size={27} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <InfoPill icon={CarFront} label="Vehículo" value={`${result.placa || "Sin placa"} · ${formatVehicleType(result.tipoVehiculo)}`} />
        <InfoPill icon={MapPin} label="Ciudad" value={polishSpanishText(result.label || result.ciudad || "Sin ciudad")} />
        <InfoPill icon={Clock3} label="Horario" value={formatSchedule(result)} />
      </div>

      {result.nota || result.urlFuente ? (
        <div className="border-t border-slate-100 px-4 pb-4 pt-1">
          <p className="text-xs font-semibold leading-5 text-slate-500">
            {polishSpanishText(result.nota || "Regla actualizada.")}
            {result.urlFuente ? (
              <>
                {" "}
                <a className="font-black text-blue-600 underline-offset-4 hover:underline" href={result.urlFuente} target="_blank" rel="noreferrer">
                  Ver fuente
                </a>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function PicoEmptyCard({ syncStatus }) {
  return (
    <Card className="mb-5 p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600">
          <Info size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-slate-950">Pico y Placa inteligente</h2>
            {syncStatus === "loading" ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">Sincronizando</span> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">Configura tu vehículo para consultar Pico y Placa automáticamente.</p>
        </div>
      </div>
    </Card>
  );
}

function PicoLoadingCard() {
  return (
    <Card className="mb-5 p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 animate-pulse place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <CarFront size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-slate-950">Analizando Pico y Placa</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Consultando ciudad, placa, fecha y reglas vigentes.</p>
        </div>
      </div>
    </Card>
  );
}

function PicoErrorCard() {
  return (
    <Card className="mb-5 p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <WifiOff size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-slate-950">No pudimos consultar Pico y Placa</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{APP_NAME} intentará usar el caché local en la próxima consulta.</p>
        </div>
      </div>
    </Card>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-black leading-snug text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function getVisualState(result) {
  if (result?.status === "ciudad_sin_restriccion" || result?.status === "sin_reglas") {
    return {
      icon: Info,
      header: "bg-gradient-to-br from-sky-600 to-cyan-500",
      ring: "ring-sky-100",
    };
  }

  if (result?.aplica) {
    return {
      icon: AlertTriangle,
      header: "bg-gradient-to-br from-red-600 to-rose-500",
      ring: "ring-red-100",
    };
  }

  return {
    icon: CheckCircle2,
    header: "bg-gradient-to-br from-emerald-600 to-teal-500",
    ring: "ring-emerald-100",
  };
}

function resolveVehicleProfile(vehicle) {
  return {
    city: vehicle?.city || vehicle?.ciudad || "",
    plate: vehicle?.plate || vehicle?.placa || "",
    vehicleType: vehicle?.type || vehicle?.tipoVehiculo || "particular",
  };
}

function formatSchedule(result) {
  if (!result?.horarioInicio && !result?.horarioFin) return "Sin horario";
  if (result.horarioInicio && result.horarioFin) {
    return `${formatTime(result.horarioInicio)} - ${formatTime(result.horarioFin)}`;
  }
  return result.horarioInicio ? `Desde ${formatTime(result.horarioInicio)}` : `Hasta ${formatTime(result.horarioFin)}`;
}

function formatTime(value = "") {
  const cleanValue = normalizeTimeValue(value);
  const [hourValue, minuteValue = "00"] = cleanValue.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour)) return cleanValue || value;

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hour, Number.isNaN(minute) ? 0 : minute));
}

function normalizeTimeValue(value = "") {
  if (!value) return "";

  const text = String(value).trim();
  const isoTime = text.match(/T(\d{2}):(\d{2})/);
  const plainTime = text.match(/^(\d{1,2}):(\d{2})/);

  if (isoTime) {
    const date = new Date(text);

    if (!Number.isNaN(date.getTime())) {
      const formatter = new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        timeZone: "America/Bogota",
      });
      return formatter.format(date);
    }

    return `${isoTime[1]}:${isoTime[2]}`;
  }

  if (plainTime) {
    return `${plainTime[1].padStart(2, "0")}:${plainTime[2]}`;
  }

  return text;
}

function formatVehicleType(value = "") {
  const text = String(value || "").trim();
  return text || "Vehículo";
}

function getSourceLabel(source = "") {
  const labels = {
    cache: "Offline",
    cache_expired: "Offline",
    fallback: "Fallback",
  };

  return labels[source] || "Local";
}
