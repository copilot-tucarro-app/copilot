import {
  BadgeCheck,
  CalendarClock,
  Camera,
  CarFront,
  ChevronDown,
  Fuel,
  Gauge,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import { cityOptions, fuelOptions, vehicleTypeOptions } from "../data/mockData";
import { getCachedVehicleByUser, refreshVehicleByUser, saveVehicleToSheet } from "../services/api";
import { daysUntil, formatShortDate } from "../utils/dateUtils";
import { createId } from "../utils/idUtils";
import { getVehicle, setVehicle } from "../utils/storage";
import { polishSpanishText } from "../utils/textUtils";

const defaultVehicle = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  type: "Carro",
  city: "Medellin",
  fuel: "Gasolina corriente",
  currentMileage: "",
  autonomyPerGallon: "",
  soatExpiry: "",
  techReviewExpiry: "",
  licenseExpiry: "",
  taxExpiry: "",
  soatNoticeDays: "30",
  techReviewNoticeDays: "30",
  licenseNoticeDays: "30",
  taxNoticeDays: "30",
  nextEngineOilKm: "",
  nextGearboxOilKm: "",
  vehiclePhotoDataUrl: "",
  vehiclePhotoUpdatedAt: "",
};

const localOnlyVehicleFields = ["vehiclePhotoDataUrl", "vehiclePhotoUpdatedAt"];

function getInitialStoredVehicle(user) {
  return getVehicle(user) || getCachedSheetVehicle(user, null);
}

function getCachedSheetVehicle(user, localVehicle) {
  const cachedResult = getCachedVehicleByUser(user?.email);
  if (!cachedResult?.ok || !cachedResult.vehicle) return null;
  return mergeVehicleLocalOnlyFields(cachedResult.vehicle, localVehicle);
}

function pickNewestVehicle(localVehicle, cachedVehicle) {
  if (!localVehicle) return cachedVehicle;
  if (!cachedVehicle) return localVehicle;

  const localUpdatedAt = getVehicleUpdatedAt(localVehicle);
  const cachedUpdatedAt = getVehicleUpdatedAt(cachedVehicle);

  return cachedUpdatedAt > localUpdatedAt ? cachedVehicle : localVehicle;
}

function getVehicleUpdatedAt(vehicle) {
  const timestamp = Date.parse(vehicle?.updatedAt || vehicle?.vehiclePhotoUpdatedAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const heroImages = {
  Moto: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
  Taxi: "https://images.unsplash.com/photo-1592853625600-5d18dba5f59f?auto=format&fit=crop&w=1200&q=80",
  Camioneta: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
};

const documentRows = [
  {
    label: "SOAT",
    dateField: "soatExpiry",
    noticeField: "soatNoticeDays",
  },
  {
    label: "Tecnomecánica",
    dateField: "techReviewExpiry",
    noticeField: "techReviewNoticeDays",
  },
  {
    label: "Licencia",
    dateField: "licenseExpiry",
    noticeField: "licenseNoticeDays",
  },
  {
    label: "Impuesto vehicular",
    dateField: "taxExpiry",
    noticeField: "taxNoticeDays",
  },
];

export default function Vehicle({ user, onLogout }) {
  const storedVehicle = useMemo(() => getInitialStoredVehicle(user), [user]);
  const [vehicle, setVehicleForm] = useState(storedVehicle || { ...defaultVehicle, id: createId("vehicle"), city: user?.city || "Medellin" });
  const [saved, setSaved] = useState(Boolean(storedVehicle));
  const [syncMessage, setSyncMessage] = useState("");
  const [openSection, setOpenSection] = useState("data");
  const [isVehicleSyncing, setIsVehicleSyncing] = useState(Boolean(user?.email && !storedVehicle));
  const localMutationVersionRef = useRef(0);
  const vehicleRef = useRef(vehicle);

  useEffect(() => {
    vehicleRef.current = vehicle;
  }, [vehicle]);

  useEffect(() => {
    if (!user?.email) return;
    let isActive = true;
    const localVehicleAtStart = getVehicle(user);
    const cachedVehicleAtStart = getCachedSheetVehicle(user, localVehicleAtStart);
    const immediateVehicle = pickNewestVehicle(localVehicleAtStart, cachedVehicleAtStart);
    const syncStartVersion = localMutationVersionRef.current;

    setIsVehicleSyncing(true);

    if (immediateVehicle) {
      const savedImmediateVehicle = setVehicle(mergeVehicleLocalOnlyFields(immediateVehicle, localVehicleAtStart), user);
      setVehicleForm(savedImmediateVehicle);
      setSaved(true);
      setSyncMessage(cachedVehicleAtStart && !localVehicleAtStart ? "Vehículo cargado desde caché local." : "");
    }

    refreshVehicleByUser(user.email)
      .then((result) => {
        if (!isActive) return;

        if (result?.ok && result.vehicle) {
          const currentLocalVehicle = getVehicle(user) || localVehicleAtStart;
          const sheetVehicle = mergeVehicleLocalOnlyFields(result.vehicle, currentLocalVehicle);
          const newestVehicle = pickNewestVehicle(currentLocalVehicle, sheetVehicle);

          if (localMutationVersionRef.current !== syncStartVersion) {
            setSyncMessage("Datos de Sheets disponibles. Conservamos los cambios locales recientes.");
            return;
          }

          const savedSheetVehicle = setVehicle(newestVehicle, user);
          setVehicleForm(savedSheetVehicle);
          setSaved(true);
          setSyncMessage(result.cacheHit ? "Vehículo cargado desde caché local." : "Vehículo cargado desde Google Sheets.");
          return;
        }

        if (!immediateVehicle) {
          setSyncMessage("No encontramos vehículo guardado. Puedes registrar uno nuevo.");
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn("No se pudo cargar vehículo desde Google Sheets", error);
        setSyncMessage("Usando datos locales del vehículo.");
      })
      .finally(() => {
        if (isActive) setIsVehicleSyncing(false);
      });

    return () => {
      isActive = false;
    };
  }, [user?.email]);

  function updateField(field, value) {
    localMutationVersionRef.current += 1;
    setVehicleForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function submitVehicle(event) {
    event.preventDefault();
    const normalizedVehicle = {
      ...vehicle,
      id: vehicle.id || createId("vehicle"),
      plate: vehicle.plate.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    localMutationVersionRef.current += 1;
    const savedVehicle = setVehicle(normalizedVehicle, user);
    saveVehicleToSheet(omitLocalOnlyFields(savedVehicle), user).catch((error) => console.warn("No se pudo guardar vehículo en Google Sheets", error));
    setVehicleForm(savedVehicle);
    setSaved(true);
    setSyncMessage("Vehículo guardado y asociado a tu usuario.");
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSyncMessage("Selecciona una imagen válida del vehículo.");
      return;
    }

    resizeVehiclePhoto(file)
      .then((photoDataUrl) => {
        const localVehicle = {
          ...vehicleRef.current,
          vehiclePhotoDataUrl: photoDataUrl,
          vehiclePhotoUpdatedAt: new Date().toISOString(),
        };

        try {
          setVehicle(localVehicle, user);
        } catch (error) {
          console.warn("No se pudo guardar la foto en localStorage", error);
          setSyncMessage("La foto pesa demasiado para guardarla en este dispositivo.");
          return;
        }

        localMutationVersionRef.current += 1;
        setVehicleForm(localVehicle);
        setSyncMessage("Foto guardada solo en este dispositivo.");
      })
      .catch((error) => {
        console.warn("No se pudo procesar la foto del vehículo", error);
        setSyncMessage("No se pudo cargar la foto. Intenta con otra imagen.");
      });
  }

  function removeVehiclePhoto() {
    const localVehicle = {
      ...vehicleRef.current,
      vehiclePhotoDataUrl: "",
      vehiclePhotoUpdatedAt: "",
    };

    try {
      setVehicle(localVehicle, user);
    } catch (error) {
      console.warn("No se pudo eliminar la foto local", error);
    }

    localMutationVersionRef.current += 1;
    setVehicleForm(localVehicle);
    setSyncMessage("Foto local eliminada.");
  }

  const heroImage = vehicle.vehiclePhotoDataUrl || heroImages[vehicle.type] || heroImages.default;
  const vehicleTitle = [vehicle.brand || "Marca", vehicle.model || "modelo"].join(" ");
  const yearLabel = vehicle.year ? `Modelo ${vehicle.year}` : "Modelo pendiente";
  const mileageLabel = formatMileage(vehicle.currentMileage);
  const fuelLabel = polishSpanishText(vehicle.fuel || "Combustible pendiente");
  const cityLabel = polishSpanishText(vehicle.city || user?.city || "Ciudad pendiente");
  const showVehicleSyncing = isVehicleSyncing && !saved;

  return (
    <main className="screen-shell">
      <Header user={user} onLogout={onLogout} title="Mi Vehículo" subtitle="Gestiona identidad, documentos y mantenimiento desde un solo lugar." />

      {syncMessage ? (
        <p className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">{syncMessage}</p>
      ) : null}

      <form className="space-y-4" onSubmit={submitVehicle}>
        {showVehicleSyncing ? <VehicleLoadingNotice /> : null}

        <fieldset className="m-0 space-y-4 border-0 p-0">
          <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
          <div className="relative min-h-[21rem] sm:min-h-[18rem]">
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur">
                Vehículo principal
              </div>
              <StatusBadge tone={saved ? "success" : "warning"}>{saved ? "Guardado" : "Sin guardar"}</StatusBadge>
            </div>

            <div className="relative flex min-h-[21rem] flex-col justify-end p-5 sm:min-h-[18rem]">
              <div className="max-w-xl">
                <p className="inline-flex rounded-xl bg-yellow-300 px-3 py-1.5 font-mono text-2xl font-black tracking-[0.2em] text-slate-950 shadow-lg sm:text-3xl">
                  {vehicle.plate?.trim() ? vehicle.plate.trim().toUpperCase() : "ABC123"}
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{vehicleTitle}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-200">{yearLabel}</p>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <HeroMetric icon={MapPin} label="Ciudad" value={cityLabel} />
                <HeroMetric icon={Fuel} label="Combustible" value={fuelLabel} />
                <HeroMetric icon={Gauge} label="Kilometraje" value={mileageLabel} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5">
                  {vehicle.vehiclePhotoDataUrl ? <Camera size={18} /> : <ImagePlus size={18} />}
                  {vehicle.vehiclePhotoDataUrl ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
                </label>
                {vehicle.vehiclePhotoDataUrl ? (
                  <button
                    type="button"
                    onClick={removeVehiclePhoto}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    <Trash2 size={18} />
                    Quitar foto
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          </section>

          <div className="space-y-3">
          <Accordion
            id="data"
            title="Datos del vehículo"
            description="Identificación, ciudad, combustible y rendimiento."
            icon={CarFront}
            isOpen={openSection === "data"}
            onToggle={() => setOpenSection((current) => (current === "data" ? "" : "data"))}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Placa">
                <input className="input uppercase" value={vehicle.plate} onChange={(event) => updateField("plate", event.target.value)} placeholder="ABC123" maxLength={7} />
              </Field>
              <Field label="Marca">
                <input className="input" value={vehicle.brand} onChange={(event) => updateField("brand", event.target.value)} placeholder="Toyota" />
              </Field>
              <Field label="Modelo">
                <input className="input" value={vehicle.model} onChange={(event) => updateField("model", event.target.value)} placeholder="Corolla" />
              </Field>
              <Field label="Año">
                <input className="input" value={vehicle.year} onChange={(event) => updateField("year", event.target.value)} placeholder="2022" inputMode="numeric" />
              </Field>
              <Field label="Tipo de vehículo">
                <select className="input" value={vehicle.type} onChange={(event) => updateField("type", event.target.value)}>
                  {vehicleTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad">
                <select className="input" value={vehicle.city} onChange={(event) => updateField("city", event.target.value)}>
                  {cityOptions.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </Field>
              <Field label="Combustible">
                <select className="input" value={vehicle.fuel} onChange={(event) => updateField("fuel", event.target.value)}>
                  {fuelOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Kilometraje actual">
                <input className="input" value={vehicle.currentMileage} onChange={(event) => updateField("currentMileage", event.target.value)} placeholder="45000" inputMode="numeric" />
              </Field>
              <Field label="Autonomía por galón">
                <input className="input" value={vehicle.autonomyPerGallon} onChange={(event) => updateField("autonomyPerGallon", event.target.value)} placeholder="38" inputMode="decimal" />
              </Field>
            </div>
          </Accordion>

          <Accordion
            id="documents"
            title="Vencimientos y avisos"
            description="Fechas críticas y días de anticipación para cada alerta."
            icon={BadgeCheck}
            isOpen={openSection === "documents"}
            onToggle={() => setOpenSection((current) => (current === "documents" ? "" : "documents"))}
          >
            <div className="grid gap-3">
              {documentRows.map((document) => (
                <DocumentField
                  key={document.label}
                  label={document.label}
                  dateValue={vehicle[document.dateField]}
                  daysValue={vehicle[document.noticeField]}
                  onDateChange={(value) => updateField(document.dateField, value)}
                  onDaysChange={(value) => updateField(document.noticeField, value)}
                />
              ))}
            </div>
          </Accordion>

          <Accordion
            id="maintenance"
            title="Mantenimiento"
            description="Control por kilometraje para aceite de motor y caja."
            icon={Wrench}
            isOpen={openSection === "maintenance"}
            onToggle={() => setOpenSection((current) => (current === "maintenance" ? "" : "maintenance"))}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MaintenanceField
                label="Aceite motor"
                value={vehicle.nextEngineOilKm}
                currentMileage={vehicle.currentMileage}
                onChange={(value) => updateField("nextEngineOilKm", value)}
                placeholder="50000"
              />
              <MaintenanceField
                label="Aceite de caja"
                value={vehicle.nextGearboxOilKm}
                currentMileage={vehicle.currentMileage}
                onChange={(value) => updateField("nextGearboxOilKm", value)}
                placeholder="60000"
              />
            </div>
          </Accordion>
          </div>

          <button type="submit" className="primary-button w-full">
          <Save size={18} />
          Guardar vehículo
          </button>
        </fieldset>
      </form>
    </main>
  );
}

function VehicleLoadingNotice() {
  return (
    <div className="rounded-3xl bg-white/95 p-4 shadow-soft ring-1 ring-blue-100">
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Loader2 className="animate-spin" size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-slate-950">Sincronizando vehículo</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Puedes avanzar mientras actualizamos los datos desde Google Sheets.</p>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 p-3 text-white ring-1 ring-white/20 backdrop-blur">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-300">{label}</p>
        <p className="truncate text-sm font-black">{value}</p>
      </div>
    </div>
  );
}

function Accordion({ id, title, description, icon: Icon, isOpen, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-soft shadow-slate-200/60 backdrop-blur">
      <button
        type="button"
        id={`${id}-button`}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <Icon size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">{description}</p>
        </div>
        <ChevronDown className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} size={20} />
      </button>

      {isOpen ? (
        <div id={`${id}-content`} role="region" aria-labelledby={`${id}-button`} className="border-t border-slate-100 p-4 pt-5 sm:p-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function DocumentField({ label, dateValue, daysValue, onDateChange, onDaysChange }) {
  const remainingDays = daysUntil(dateValue);
  const noticeDays = Number(daysValue || 30);
  const badgeTone = getDocumentDaysBadgeTone(remainingDays, noticeDays);

  return (
    <div className="rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-emerald-600 ring-1 ring-emerald-100">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-950">{label}</p>
            <p className="truncate text-xs font-semibold text-slate-500">{formatShortDate(dateValue)}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeTone}`}>
          {formatDocumentDaysBadge(remainingDays)}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <Field label={`Vencimiento ${label}`}>
          <input className="input" type="date" value={dateValue || ""} onChange={(event) => onDateChange(event.target.value)} />
        </Field>
        <Field label="Avisar antes">
          <input className="input" value={daysValue ?? ""} onChange={(event) => onDaysChange(event.target.value)} placeholder="30" inputMode="numeric" />
        </Field>
      </div>
    </div>
  );
}

function getDocumentDaysBadgeTone(days, noticeDays) {
  if (days === null) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (days < 0) return "bg-red-50 text-red-700 ring-red-100";
  if (days <= noticeDays) return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function formatDocumentDaysBadge(days) {
  if (days === null) return "Sin fecha";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Falta 1 día";
  if (days > 1) return `Faltan ${days.toLocaleString("es-CO")} días`;
  if (days === -1) return "Vencido ayer";
  return `Vencido hace ${Math.abs(days).toLocaleString("es-CO")} días`;
}

function MaintenanceField({ label, value, currentMileage, onChange, placeholder }) {
  const current = Number(currentMileage);
  const next = Number(value);
  const remaining = Number.isFinite(current) && Number.isFinite(next) && current > 0 && next > 0 ? next - current : null;

  return (
    <div className="rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 ring-1 ring-amber-100">
          <CalendarClock size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-slate-950">{label}</p>
          <p className="text-xs font-semibold text-slate-500">{formatRemainingKm(remaining)}</p>
        </div>
      </div>
      <Field label="Proximo servicio por km">
        <input className="input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode="numeric" />
      </Field>
    </div>
  );
}

function formatRemainingKm(value) {
  if (value === null) return "Ingresa kilometraje actual y próximo servicio";
  if (value < 0) return "Servicio vencido por kilometraje";
  return `Faltan ${value.toLocaleString("es-CO")} km`;
}

function formatMileage(value) {
  const mileage = Number(value);
  if (!value || !Number.isFinite(mileage)) return "Kilometraje pendiente";
  return `${mileage.toLocaleString("es-CO")} km`;
}

function omitLocalOnlyFields(vehicle) {
  return Object.fromEntries(Object.entries(vehicle || {}).filter(([key]) => !localOnlyVehicleFields.includes(key)));
}

function mergeVehicleLocalOnlyFields(sheetVehicle, localVehicle) {
  if (!localVehicle) return sheetVehicle;

  return {
    ...sheetVehicle,
    vehiclePhotoDataUrl: localVehicle.vehiclePhotoDataUrl || sheetVehicle.vehiclePhotoDataUrl || "",
    vehiclePhotoUpdatedAt: localVehicle.vehiclePhotoUpdatedAt || sheetVehicle.vehiclePhotoUpdatedAt || "",
  };
}

function resizeVehiclePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSide = 1400;
        const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("No se pudo preparar la imagen."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = () => reject(new Error("Imagen inválida."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}
