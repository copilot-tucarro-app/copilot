import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Camera,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  EllipsisVertical,
  Gauge,
  IdCard,
  ImagePlus,
  ListChecks,
  Mail,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Star,
  UsersRound,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import { cityOptions, fuelOptions, vehicleTypeOptions } from "../data/mockData";
import { getCachedVehicleByUser, refreshVehicleByUser, saveVehicleToSheet, sendNotificationContactsTestEmail } from "../services/api";
import { checkPicoPlaca, getCachedPicoPlacaRulesPayload } from "../services/picoPlacaService";
import { buildDocumentAlerts, buildMaintenanceAlerts } from "../utils/alertUtils";
import { daysUntil, formatShortDate } from "../utils/dateUtils";
import { createId } from "../utils/idUtils";
import { getActiveVehicleId, getVehicle, getVehicles, setActiveVehicleId, setVehicles } from "../utils/storage";
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
  insuranceExpiry: "",
  techReviewExpiry: "",
  licenseExpiry: "",
  taxExpiry: "",
  taxNoticeDays: "15",
  insuranceNoticeDays: "15",
  creditExpiry: "",
  creditNoticeDays: "15",
  warrantyStartDate: "",
  warrantyYears: "",
  warrantyExpiryKm: "",
  warrantyNoticeDays: "15",
  soatNoticeDays: "15",
  techReviewNoticeDays: "15",
  licenseNoticeDays: "15",
  lastEngineOilKm: "",
  nextEngineOilKm: "",
  lastGearboxOilKm: "",
  nextGearboxOilKm: "",
  maintenanceNotes: "",
  notificationContacts: [],
  vehiclePhotoDataUrl: "",
  vehiclePhotoUpdatedAt: "",
  principal: false,
  guardado: false,
};

const localOnlyVehicleFields = ["vehiclePhotoDataUrl", "vehiclePhotoUpdatedAt"];

const heroImages = {
  Moto: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
  Taxi: "https://images.unsplash.com/photo-1592853625600-5d18dba5f59f?auto=format&fit=crop&w=1200&q=80",
  Camioneta: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
};

const tabs = [
  { id: "data", label: "Datos del vehiculo", icon: IdCard },
  { id: "documents", label: "Vencimientos y avisos", icon: CalendarDays },
  { id: "maintenance", label: "Mantenimiento", icon: Wrench },
  { id: "contacts", label: "Contactos", icon: UsersRound },
];

const documentRows = [
  {
    label: "SOAT",
    dateField: "soatExpiry",
    noticeField: "soatNoticeDays",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    label: "Tecnomecanica",
    dateField: "techReviewExpiry",
    noticeField: "techReviewNoticeDays",
    icon: CalendarDays,
    tone: "amber",
  },
  {
    label: "Licencia de transito",
    dateField: "licenseExpiry",
    noticeField: "licenseNoticeDays",
    icon: IdCard,
    tone: "green",
  },
  {
    label: "Impuesto vehicular",
    dateField: "taxExpiry",
    noticeField: "taxNoticeDays",
    icon: BadgeCheck,
    tone: "blue",
  },
  {
    label: "Seguro vehicular",
    dateField: "insuranceExpiry",
    noticeField: "insuranceNoticeDays",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    label: "Credito de vehiculo",
    dateField: "creditExpiry",
    noticeField: "creditNoticeDays",
    icon: BadgeCheck,
    tone: "amber",
  },
];

const contactNotificationOptions = [
  { id: "documents", label: "Vencimientos" },
  { id: "maintenance", label: "Mantenimiento" },
  { id: "picoPlaca", label: "Pico y placa" },
  { id: "news", label: "Novedades" },
];

export default function Vehicle({ user, onLogout, onUnsavedChange, onRegisterSave }) {
  const initialVehicles = useMemo(() => getInitialVehicleList(user), [user]);
  const [vehicles, setVehicleForms] = useState(initialVehicles);
  const [activeVehicleId, setActiveVehicleIdState] = useState(() => getInitialActiveVehicleId(user, initialVehicles));
  const [activeTab, setActiveTab] = useState("documents");
  const [saved, setSaved] = useState(() => initialVehicles.length > 0 && initialVehicles.every((vehicle) => vehicle.guardado !== false));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [isVehicleSyncing, setIsVehicleSyncing] = useState(Boolean(user?.email && !getVehicles(user).length));
  const [isSendingContactTest, setIsSendingContactTest] = useState(false);
  const [contactTestMessage, setContactTestMessage] = useState("");
  const [openMenuVehicleId, setOpenMenuVehicleId] = useState("");
  const [openMenuPosition, setOpenMenuPosition] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newVehicleDraft, setNewVehicleDraft] = useState(() => buildNewVehicleDraft(user));
  const localMutationVersionRef = useRef(0);
  const vehiclesRef = useRef(vehicles);
  const activeVehicleIdRef = useRef(activeVehicleId);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    activeVehicleIdRef.current = activeVehicleId;
  }, [activeVehicleId]);

  const activeVehicle = useMemo(() => resolveActiveVehicle(vehicles, activeVehicleId), [vehicles, activeVehicleId]);
  const activeAlerts = useMemo(() => {
    if (!activeVehicle) return [];
    return [...buildDocumentAlerts(activeVehicle), ...buildMaintenanceAlerts(activeVehicle)].filter((alert) => alert.tone === "danger" || alert.tone === "warning");
  }, [activeVehicle]);

  const saveVehicle = useCallback(() => {
    const currentVehicles = vehiclesRef.current;
    const currentActiveVehicleId = activeVehicleIdRef.current;
    const now = new Date().toISOString();
    const activeVehicle = currentVehicles.find((vehicle) => vehicle.id === currentActiveVehicleId) || currentVehicles[0] || null;
    const normalizedContacts = normalizeNotificationContacts(activeVehicle?.notificationContacts);
    const normalizedVehicles = currentVehicles.map((vehicle) =>
      vehicle.id === currentActiveVehicleId
        ? {
            ...vehicle,
            id: vehicle.id || createId("vehicle"),
            plate: String(vehicle.plate || "").trim().toUpperCase(),
            notificationContacts: normalizedContacts,
            updatedAt: now,
            guardado: true,
          }
        : {
            ...vehicle,
            notificationContacts: normalizedContacts,
          },
    );
    const savedVehicles = setVehicles(normalizedVehicles, user, { activeVehicleId: currentActiveVehicleId });
    const savedActiveVehicle = resolveActiveVehicle(savedVehicles, currentActiveVehicleId);
    const sheetSave = savedActiveVehicle
      ? saveVehicleToSheet(omitLocalOnlyFields(savedActiveVehicle), user).catch((error) => console.warn("No se pudo guardar vehiculo remoto", error))
      : Promise.resolve();

    vehiclesRef.current = savedVehicles;
    setVehicleForms(savedVehicles);
    setSaved(true);
    setHasUnsavedChanges(false);
    setSyncMessage("Vehiculo actualizado.");

    return sheetSave;
  }, [user]);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
    return () => onUnsavedChange?.(false);
  }, [hasUnsavedChanges, onUnsavedChange]);

  useEffect(() => {
    onRegisterSave?.(saveVehicle);
    return () => onRegisterSave?.(null);
  }, [onRegisterSave, saveVehicle]);

  useEffect(() => {
    if (!user?.email) return;
    let isActive = true;
    const localVehiclesAtStart = getVehicles(user);
    const localVehicleAtStart = getVehicle(user);
    const cachedVehicleAtStart = getCachedSheetVehicle(user, localVehicleAtStart);
    const immediateVehicle = pickNewestVehicle(localVehicleAtStart, cachedVehicleAtStart);
    const syncStartVersion = localMutationVersionRef.current;

    setIsVehicleSyncing(true);

    if (immediateVehicle && localVehiclesAtStart.length) {
      const immediateVehicles = mergeVehicleIntoList(localVehiclesAtStart, mergeVehicleLocalOnlyFields(immediateVehicle, localVehicleAtStart));
      const savedImmediateVehicles = setVehicles(immediateVehicles, user, { activeVehicleId: getActiveVehicleId(user) || immediateVehicle.id });
      setVehicleForms(savedImmediateVehicles);
      setActiveVehicleIdState(getInitialActiveVehicleId(user, savedImmediateVehicles));
      setSaved(true);
      setHasUnsavedChanges(false);
      setSyncMessage(cachedVehicleAtStart && !localVehicleAtStart ? "Vehiculo cargado desde cache local." : "");
    }

    refreshVehicleByUser(user.email)
      .then((result) => {
        if (!isActive) return;

        if (result?.ok && result.vehicle) {
          const currentLocalVehicles = getVehicles(user);
          const currentLocalVehicle = getVehicle(user) || localVehicleAtStart;
          const sheetVehicle = mergeVehicleLocalOnlyFields(result.vehicle, currentLocalVehicle);
          const newestVehicle = pickNewestVehicle(currentLocalVehicle, sheetVehicle);

          if (localMutationVersionRef.current !== syncStartVersion) {
            setSyncMessage("Datos actualizados disponibles. Conservamos los cambios locales recientes.");
            return;
          }

          const savedSheetVehicles = setVehicles(mergeVehicleIntoList(currentLocalVehicles, newestVehicle), user, { activeVehicleId: getActiveVehicleId(user) || newestVehicle.id });
          setVehicleForms(savedSheetVehicles.length ? savedSheetVehicles : vehiclesRef.current);
          setActiveVehicleIdState(getInitialActiveVehicleId(user, savedSheetVehicles.length ? savedSheetVehicles : vehiclesRef.current));
          setSaved(true);
          setHasUnsavedChanges(false);
          setSyncMessage(result.cacheHit ? "Vehiculo cargado desde cache local." : "Vehiculo actualizado.");
          return;
        }

        if (!localVehiclesAtStart.length && !immediateVehicle) {
          setSyncMessage("Puedes registrar varios vehiculos y elegir uno como principal.");
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn("No se pudo cargar vehiculo remoto", error);
        setSyncMessage("Usando datos locales del vehiculo.");
      })
      .finally(() => {
        if (isActive) setIsVehicleSyncing(false);
      });

    return () => {
      isActive = false;
    };
  }, [user?.email]);

  function updateActiveVehicleField(field, value) {
    localMutationVersionRef.current += 1;
    setVehicleForms((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === activeVehicleId
          ? {
              ...vehicle,
              [field]: value,
              guardado: false,
            }
          : vehicle,
      ),
    );
    setSaved(false);
    setHasUnsavedChanges(true);
  }

  function updateNotificationContact(index, field, value) {
    localMutationVersionRef.current += 1;
    setVehicleForms((currentVehicles) => {
      const active = resolveActiveVehicle(currentVehicles, activeVehicleId);
      const contacts = normalizeNotificationContacts(active?.notificationContacts);
      const nextContacts = Array.from({ length: 2 }, (_, contactIndex) => contacts[contactIndex] || buildEmptyNotificationContact());
      nextContacts[index] = {
        ...nextContacts[index],
        [field]: value,
      };

      return currentVehicles.map((vehicle) => ({
        ...vehicle,
        notificationContacts: nextContacts,
        guardado: vehicle.id === activeVehicleId ? false : vehicle.guardado,
      }));
    });
    setSaved(false);
    setHasUnsavedChanges(true);
  }

  async function sendContactTestEmails() {
    const vehicle = resolveActiveVehicle(vehiclesRef.current, activeVehicleIdRef.current);
    if (!vehicle) return;

    setIsSendingContactTest(true);
    setContactTestMessage("");

    try {
      const payloadVehicle = {
        ...omitLocalOnlyFields(vehicle),
        notificationContacts: normalizeNotificationContacts(vehicle.notificationContacts),
      };
      const result = await sendNotificationContactsTestEmail(payloadVehicle, user);

      if (result?.ok) {
        setContactTestMessage(`Correo de prueba enviado a ${result.sent || 0} destinatario${result.sent === 1 ? "" : "s"}.`);
      } else {
        setContactTestMessage(result?.message || "No se pudo enviar el correo de prueba.");
      }
    } catch (error) {
      console.warn("No se pudo enviar prueba de contactos", error);
      setContactTestMessage(error.message || "No se pudo enviar el correo de prueba.");
    } finally {
      setIsSendingContactTest(false);
    }
  }

  function closeVehicleMenu() {
    setOpenMenuVehicleId("");
    setOpenMenuPosition(null);
  }

  function toggleVehicleMenu(vehicleId, event) {
    if (openMenuVehicleId === vehicleId) {
      closeVehicleMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 236;
    const menuHeight = 180;
    const gap = 8;
    const viewportWidth = typeof window === "undefined" ? 390 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 844 : window.innerHeight;
    const left = Math.max(12, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 12));
    const preferredTop = rect.bottom + gap;
    const top = Math.max(12, Math.min(preferredTop, viewportHeight - menuHeight - 12));

    setOpenMenuVehicleId(vehicleId);
    setOpenMenuPosition({ left, top });
  }

  function selectVehicle(vehicleId) {
    setActiveVehicleIdState(vehicleId);
    setActiveVehicleId(vehicleId, user);
    closeVehicleMenu();
  }

  function markVehicleAsPrincipal(vehicleId) {
    localMutationVersionRef.current += 1;
    setVehicleForms((currentVehicles) =>
      currentVehicles.map((vehicle) => ({
        ...vehicle,
        principal: vehicle.id === vehicleId,
        guardado: vehicle.id === vehicleId ? false : vehicle.guardado,
      })),
    );
    setActiveVehicleIdState(vehicleId);
    setActiveVehicleId(vehicleId, user);
    setSaved(false);
    setHasUnsavedChanges(true);
    closeVehicleMenu();
  }

  function deleteVehicle(vehicleId) {
    if (vehicles.length <= 1) return;

    localMutationVersionRef.current += 1;
    const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
    const nextActiveVehicleId = vehicleId === activeVehicleId ? nextVehicles[0]?.id || "" : activeVehicleId;
    setVehicleForms(nextVehicles.map((vehicle, index) => ({ ...vehicle, principal: vehicle.principal || index === 0 })));
    setActiveVehicleIdState(nextActiveVehicleId);
    setActiveVehicleId(nextActiveVehicleId, user);
    setSaved(false);
    setHasUnsavedChanges(true);
    closeVehicleMenu();
  }

  function submitVehicle(event) {
    event.preventDefault();
    void saveVehicle();
  }

  function openAddVehicleModal() {
    setNewVehicleDraft(buildNewVehicleDraft(user));
    setAddModalOpen(true);
  }

  function addVehicle(event) {
    event.preventDefault();
    const vehicle = {
      ...defaultVehicle,
      ...newVehicleDraft,
      id: createId("vehicle"),
      plate: String(newVehicleDraft.plate || "").trim().toUpperCase(),
      city: newVehicleDraft.city || user?.city || "Medellin",
      principal: vehicles.length === 0,
      guardado: false,
    };
    const nextVehicles = [...vehicles, vehicle];

    localMutationVersionRef.current += 1;
    setVehicleForms(nextVehicles);
    setActiveVehicleIdState(vehicle.id);
    setActiveTab("data");
    setAddModalOpen(false);
    setSaved(false);
    setHasUnsavedChanges(true);
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeVehicle) return;

    if (!file.type.startsWith("image/")) {
      setSyncMessage("Selecciona una imagen valida del vehiculo.");
      return;
    }

    resizeVehiclePhoto(file)
      .then((photoDataUrl) => {
        const nextVehicles = vehiclesRef.current.map((vehicle) =>
          vehicle.id === activeVehicleIdRef.current
            ? {
                ...vehicle,
                vehiclePhotoDataUrl: photoDataUrl,
                vehiclePhotoUpdatedAt: new Date().toISOString(),
              }
            : vehicle,
        );

        try {
          setVehicles(nextVehicles, user, { activeVehicleId: activeVehicleIdRef.current });
        } catch (error) {
          console.warn("No se pudo guardar la foto en localStorage", error);
          setSyncMessage("La foto pesa demasiado para guardarla en este dispositivo.");
          return;
        }

        vehiclesRef.current = nextVehicles;
        setVehicleForms(nextVehicles);
        setSyncMessage("Foto guardada solo en este dispositivo.");
      })
      .catch((error) => {
        console.warn("No se pudo procesar la foto del vehiculo", error);
        setSyncMessage("No se pudo cargar la foto. Intenta con otra imagen.");
      });
  }

  function removeVehiclePhoto() {
    const nextVehicles = vehiclesRef.current.map((vehicle) =>
      vehicle.id === activeVehicleIdRef.current
        ? {
            ...vehicle,
            vehiclePhotoDataUrl: "",
            vehiclePhotoUpdatedAt: "",
          }
        : vehicle,
    );

    try {
      setVehicles(nextVehicles, user, { activeVehicleId: activeVehicleIdRef.current });
    } catch (error) {
      console.warn("No se pudo eliminar la foto local", error);
    }

    vehiclesRef.current = nextVehicles;
    setVehicleForms(nextVehicles);
    setSyncMessage("Foto local eliminada.");
  }

  if (!activeVehicle) {
    return (
      <main className="screen-shell">
        <Header user={user} onLogout={onLogout} title="Mi Vehiculo" subtitle="Gestiona identidad, documentos y mantenimiento desde un solo lugar." />
        <EmptyVehicleState onAdd={openAddVehicleModal} />
        {addModalOpen ? (
          <AddVehicleModal draft={newVehicleDraft} onChange={setNewVehicleDraft} onSubmit={addVehicle} onClose={() => setAddModalOpen(false)} />
        ) : null}
      </main>
    );
  }

  return (
    <main className="screen-shell">
      <Header user={user} onLogout={onLogout} title="Mi Vehiculo" subtitle="Gestiona identidad, documentos y mantenimiento desde un solo lugar." />

      <form id="vehicle-form" className="space-y-4 pb-24" onSubmit={submitVehicle}>
        <StatusStrip isSyncing={isVehicleSyncing} saved={saved && !hasUnsavedChanges} message={syncMessage} />

        <HeroVehicleCard
          vehicle={activeVehicle}
          saved={saved && !hasUnsavedChanges}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={removeVehiclePhoto}
        />

        <VehicleQuickSummary vehicle={activeVehicle} alertCount={activeAlerts.length} />

        <VehicleSwitcher
          vehicles={vehicles}
          activeVehicleId={activeVehicle.id}
          openMenuVehicleId={openMenuVehicleId}
          openMenuPosition={openMenuPosition}
          onAdd={openAddVehicleModal}
          onSelect={selectVehicle}
          onToggleMenu={toggleVehicleMenu}
          onCloseMenu={closeVehicleMenu}
          onMarkPrincipal={markVehicleAsPrincipal}
          onDelete={deleteVehicle}
          onEdit={(vehicleId) => {
            selectVehicle(vehicleId);
            setActiveTab("data");
          }}
          onDetail={(vehicleId) => {
            selectVehicle(vehicleId);
            setActiveTab("data");
          }}
        />

        <VehicleTabs activeTab={activeTab} onChange={setActiveTab} />

        <section className="rounded-[1.75rem] bg-white/95 p-4 shadow-soft ring-1 ring-slate-100 sm:p-5">
          {activeTab === "data" ? <DataTab vehicle={activeVehicle} onChange={updateActiveVehicleField} /> : null}
          {activeTab === "documents" ? <DocumentsTab vehicle={activeVehicle} onChange={updateActiveVehicleField} /> : null}
          {activeTab === "maintenance" ? <MaintenanceTab vehicle={activeVehicle} onChange={updateActiveVehicleField} /> : null}
          {activeTab === "contacts" ? (
            <ContactsTab
              vehicle={activeVehicle}
              onChange={updateNotificationContact}
              onSendTest={sendContactTestEmails}
              isSendingTest={isSendingContactTest}
              testMessage={contactTestMessage}
            />
          ) : null}
        </section>

        {hasUnsavedChanges ? (
          <button
            type="submit"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem)] right-4 z-30 grid size-16 place-items-center rounded-full bg-black text-white shadow-[0_22px_38px_rgba(0,0,0,0.32)] ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-neutral-900 sm:right-[calc(50%-22rem)]"
            aria-label="Guardar vehiculo"
            title="Guardar vehiculo"
          >
            <Save size={25} />
          </button>
        ) : null}
      </form>

      {addModalOpen ? (
        <AddVehicleModal draft={newVehicleDraft} onChange={setNewVehicleDraft} onSubmit={addVehicle} onClose={() => setAddModalOpen(false)} />
      ) : null}
    </main>
  );
}

function StatusStrip({ isSyncing, saved, message }) {
  const Icon = isSyncing ? Loader2 : saved ? CheckCircle2 : Bell;
  const styles = saved || isSyncing ? "bg-emerald-50 text-emerald-950 ring-emerald-100" : "bg-amber-50 text-amber-950 ring-amber-100";
  const label = isSyncing ? "Sincronizando vehiculos." : saved ? "Vehiculo actualizado." : "Cambios pendientes por guardar.";

  return (
    <div className={`flex items-center gap-3 rounded-3xl px-4 py-3 font-black shadow-sm ring-1 ${styles}`}>
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/80 text-black ring-1 ring-black/10">
        <Icon className={isSyncing ? "animate-spin" : ""} size={20} />
      </div>
      <p className="min-w-0 text-sm">{message || label}</p>
    </div>
  );
}

function HeroVehicleCard({ vehicle, saved, onPhotoUpload, onRemovePhoto }) {
  const heroImage = getVehicleImage(vehicle);
  const vehicleTitle = getVehicleTitle(vehicle);

  return (
    <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_50px_rgba(15,23,42,0.24)] ring-1 ring-black/5">
      <div className="relative min-h-[25rem] sm:min-h-[22rem]">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-2xl bg-yellow-300 px-4 py-2 font-mono text-base font-black uppercase tracking-[0.22em] text-black shadow-lg">
              {vehicle.plate?.trim() ? vehicle.plate.trim().toUpperCase() : "ABC123"}
            </span>
            {vehicle.principal ? <Badge tone="blue">Principal</Badge> : null}
          </div>
          <Badge tone={saved || vehicle.guardado ? "green" : "amber"} icon={saved || vehicle.guardado ? CheckCircle2 : Bell}>
            {saved || vehicle.guardado ? "Guardado" : "Pendiente"}
          </Badge>
        </div>

        <div className="relative flex min-h-[25rem] flex-col justify-end p-5 sm:min-h-[22rem]">
          <div className="max-w-lg">
            <h2 className="text-4xl font-black leading-none tracking-normal sm:text-5xl">{vehicleTitle}</h2>
            <p className="mt-2 text-base font-semibold text-white/85">{vehicle.year ? `Modelo ${vehicle.year}` : "Modelo pendiente"}</p>
          </div>

          <div className="mt-5 grid gap-3 min-[520px]:grid-cols-2">
            <HeroMetric icon={MapPin} label="Ciudad" value={polishSpanishText(vehicle.city || "Ciudad pendiente")} />
            <HeroMetric icon={Gauge} label="Kilometraje" value={formatMileage(vehicle.currentMileage)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:-translate-y-0.5">
              {vehicle.vehiclePhotoDataUrl ? <Camera size={18} /> : <ImagePlus size={18} />}
              Subir foto
              <input type="file" accept="image/*" className="sr-only" onChange={onPhotoUpload} />
            </label>
            {vehicle.vehiclePhotoDataUrl ? (
              <button
                type="button"
                onClick={onRemovePhoto}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-4 py-2 text-sm font-black text-white ring-1 ring-white/25 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                <Trash2 size={18} />
                Quitar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-3xl bg-black/40 p-3 text-white ring-1 ring-white/15 backdrop-blur-md">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-black">
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/75">{label}</p>
        <p className="truncate text-lg font-black leading-tight">{value}</p>
      </div>
    </div>
  );
}

function VehicleQuickSummary({ vehicle, alertCount }) {
  const items = [
    {
      icon: CalendarDays,
      label: "Proximo SOAT",
      value: formatShortDate(vehicle.soatExpiry),
      tone: "blue",
    },
    {
      icon: ShieldCheck,
      label: "Seguro activo",
      value: vehicle.insuranceExpiry ? `Hasta ${formatShortDate(vehicle.insuranceExpiry)}` : "Sin fecha",
      tone: "green",
    },
    {
      icon: CalendarDays,
      label: "Tecnomecanica",
      value: formatShortDate(vehicle.techReviewExpiry),
      tone: "purple",
    },
    {
      icon: Bell,
      label: `${alertCount} alertas`,
      value: alertCount ? "Revisar hoy" : "Todo al dia",
      tone: "amber",
    },
  ];

  return (
    <section className="overflow-x-auto rounded-[1.75rem] bg-white/95 p-3 shadow-soft ring-1 ring-slate-100">
      <div className="grid min-w-[42rem] grid-cols-4 divide-x divide-slate-200">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 items-center gap-3 px-3 py-2 first:pl-1 last:pr-1">
            <SoftIcon icon={item.icon} tone={item.tone} />
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-950">{item.label}</p>
              <p className={`truncate text-sm font-black ${getValueToneClass(item.tone)}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VehicleSwitcher({ vehicles, activeVehicleId, openMenuVehicleId, openMenuPosition, onAdd, onSelect, onToggleMenu, onCloseMenu, onMarkPrincipal, onDelete, onEdit, onDetail }) {
  const openMenuVehicle = vehicles.find((vehicle) => vehicle.id === openMenuVehicleId);

  return (
    <section className="rounded-[1.75rem] bg-white/95 p-4 shadow-soft ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">Mis vehiculos</h2>
        <button type="button" onClick={onAdd} className="primary-button min-h-11 rounded-2xl px-4 py-2">
          <Plus size={18} />
          Nuevo vehiculo
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {vehicles.map((vehicle) => (
          <VehicleMiniCard
            key={vehicle.id}
            vehicle={vehicle}
            active={vehicle.id === activeVehicleId}
            onSelect={() => onSelect(vehicle.id)}
            onToggleMenu={(event) => onToggleMenu(vehicle.id, event)}
          />
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="grid min-h-[7.4rem] min-w-[8.5rem] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-center text-sm font-black text-black transition hover:-translate-y-0.5 hover:border-black"
        >
          <span className="grid gap-2">
            <Plus className="mx-auto" size={25} />
            Agregar
          </span>
        </button>
      </div>

      {openMenuVehicle ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Cerrar menu de vehiculo" onClick={onCloseMenu} />
          <div
            className="fixed z-50 grid w-[14.75rem] grid-cols-1 gap-1 rounded-2xl bg-white p-2 text-sm font-black text-slate-700 shadow-[0_24px_60px_rgba(15,23,42,0.28)] ring-1 ring-slate-200"
            style={{
              left: `${openMenuPosition?.left ?? 12}px`,
              top: `${openMenuPosition?.top ?? 12}px`,
            }}
          >
            <MenuAction icon={Pencil} label="Editar" onClick={() => onEdit(openMenuVehicle.id)} />
            <MenuAction icon={Star} label="Marcar como principal" onClick={() => onMarkPrincipal(openMenuVehicle.id)} />
            <MenuAction icon={ChevronRight} label="Ver detalle" onClick={() => onDetail(openMenuVehicle.id)} />
            <MenuAction icon={Trash2} label="Eliminar vehiculo" onClick={() => onDelete(openMenuVehicle.id)} disabled={vehicles.length <= 1} danger />
          </div>
        </>
      ) : null}
    </section>
  );
}

function VehicleMiniCard({ vehicle, active, onSelect, onToggleMenu }) {
  return (
    <div
      className={`relative flex min-h-[7.4rem] min-w-[17rem] items-center gap-3 rounded-3xl p-3 shadow-sm ring-1 transition ${
        active ? "bg-black text-white ring-black shadow-[0_18px_32px_rgba(0,0,0,0.22)]" : "bg-white text-black ring-slate-200 hover:ring-slate-300"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <img src={getVehicleImage(vehicle)} alt="" className="h-16 w-24 shrink-0 rounded-2xl object-cover" />
        <span className="min-w-0">
          {vehicle.principal ? (
            <span className={`mb-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${active ? "bg-white text-black" : "bg-black text-white"}`}>
              Principal
            </span>
          ) : null}
          <span className={`block truncate text-sm font-black ${active ? "text-white" : "text-slate-950"}`}>{getVehicleTitle(vehicle)}</span>
          <span className={`block truncate text-xs font-semibold ${active ? "text-white/70" : "text-slate-500"}`}>
            {vehicle.year || "Ano"} - {vehicle.plate || "Sin placa"}
          </span>
          <VehicleMiniStatusBadge vehicle={vehicle} />
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleMenu}
        className={`grid size-9 shrink-0 place-items-center rounded-2xl ${active ? "text-white hover:bg-white/10" : "text-black hover:bg-slate-100"}`}
        aria-label="Acciones del vehiculo"
        title="Acciones"
      >
        <EllipsisVertical size={18} />
      </button>

    </div>
  );
}

function VehicleMiniStatusBadge({ vehicle }) {
  const expiredDocument = useMemo(() => getExpiredDocumentStatus(vehicle), [vehicle]);
  const [picoStatus, setPicoStatus] = useState(() => ({
    label: "Sin pico y placa",
    className: "bg-emerald-50 text-emerald-700",
  }));

  useEffect(() => {
    let isActive = true;

    if (expiredDocument) return undefined;

    const city = vehicle.city || vehicle.ciudad || "";
    const plate = vehicle.plate || vehicle.placa || "";
    const vehicleType = vehicle.type || vehicle.tipoVehiculo || vehicle.tipo || "particular";

    if (!city || !plate || !vehicleType) {
      setPicoStatus({
        label: "Sin pico y placa",
        className: "bg-emerald-50 text-emerald-700",
      });
      return undefined;
    }

    const cachedRulesPayload = getCachedPicoPlacaRulesPayload();

    checkPicoPlaca({
      city,
      vehicleType,
      plate,
      date: new Date(),
      rules: cachedRulesPayload.rules,
      rulesSource: cachedRulesPayload.source,
    })
      .then((result) => {
        if (!isActive) return;
        setPicoStatus(
          result?.aplica
            ? {
                label: "Pico y placa hoy",
                className: "bg-amber-50 text-amber-700",
              }
            : {
                label: "Sin pico y placa",
                className: "bg-emerald-50 text-emerald-700",
              },
        );
      })
      .catch(() => {
        if (!isActive) return;
        setPicoStatus({
          label: "Sin pico y placa",
          className: "bg-emerald-50 text-emerald-700",
        });
      });

    return () => {
      isActive = false;
    };
  }, [expiredDocument, vehicle]);

  const status = expiredDocument || picoStatus;

  return <span className={`mt-1 inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>;
}

function getExpiredDocumentStatus(vehicle) {
  const expiredDocument = documentRows
    .map((document) => ({
      label: document.label,
      days: daysUntil(vehicle[document.dateField]),
    }))
    .filter((document) => typeof document.days === "number" && document.days < 0)
    .sort((left, right) => left.days - right.days)[0];

  if (!expiredDocument) return null;

  return {
    label: `${getShortDocumentLabel(expiredDocument.label)} vencido`,
    className: "bg-red-50 text-red-700",
  };
}

function getShortDocumentLabel(label) {
  if (label === "Licencia de transito") return "Licencia";
  if (label === "Impuesto vehicular") return "Impuesto";
  return label;
}

function MenuAction({ icon: Icon, label, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 ${danger ? "text-red-600 hover:bg-red-50" : ""}`}
    >
      <Icon size={16} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function VehicleTabs({ activeTab, onChange }) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] bg-white/95 p-1 shadow-sm ring-1 ring-slate-200">
      <div className="grid min-w-[42rem] grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${
                active ? "bg-black text-white shadow-[0_14px_26px_rgba(0,0,0,0.22)]" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-black"
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FleetTab({ vehicles, activeVehicleId, onSelect }) {
  return (
    <div>
      <SectionTitle title="Mis vehiculos" detail="Administra todos los vehiculos que tienes registrados." />
      <div className="grid gap-3">
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => onSelect(vehicle.id)}
            className={`flex min-w-0 items-center gap-3 rounded-3xl p-3 text-left ring-1 transition hover:-translate-y-0.5 ${
              vehicle.id === activeVehicleId ? "bg-black text-white ring-black" : "bg-slate-50 text-slate-950 ring-slate-100"
            }`}
          >
            <img src={getVehicleImage(vehicle)} alt="" className="h-16 w-24 shrink-0 rounded-2xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate font-black">{getVehicleTitle(vehicle)}</span>
                {vehicle.principal ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">Principal</span> : null}
              </span>
              <span className={`mt-1 block text-xs font-semibold ${vehicle.id === activeVehicleId ? "text-white/70" : "text-slate-500"}`}>
                {vehicle.plate || "Sin placa"} Â· {vehicle.year || "Ano pendiente"} Â· {polishSpanishText(vehicle.city || "Sin ciudad")}
              </span>
            </span>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
    </div>
  );
}

function DataTab({ vehicle, onChange }) {
  return (
    <div>
      <SectionTitle title="Datos del vehiculo" detail="Identidad, ciudad, combustible y rendimiento." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Placa">
          <input className="input uppercase" value={vehicle.plate} onChange={(event) => onChange("plate", event.target.value)} placeholder="ABC123" maxLength={7} />
        </Field>
        <Field label="Marca">
          <input className="input" value={vehicle.brand} onChange={(event) => onChange("brand", event.target.value)} placeholder="GWM" />
        </Field>
        <Field label="Modelo">
          <input className="input" value={vehicle.model} onChange={(event) => onChange("model", event.target.value)} placeholder="M4" />
        </Field>
        <Field label="Ano">
          <input className="input" value={vehicle.year} onChange={(event) => onChange("year", event.target.value)} placeholder="2016" inputMode="numeric" />
        </Field>
        <Field label="Tipo de vehiculo">
          <select className="input" value={vehicle.type} onChange={(event) => onChange("type", event.target.value)}>
            {vehicleTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Ciudad">
          <select className="input" value={vehicle.city} onChange={(event) => onChange("city", event.target.value)}>
            {cityOptions.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </Field>
        <Field label="Combustible">
          <select className="input" value={vehicle.fuel} onChange={(event) => onChange("fuel", event.target.value)}>
            {fuelOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Kilometraje actual">
          <input className="input" value={vehicle.currentMileage} onChange={(event) => onChange("currentMileage", event.target.value)} placeholder="102760" inputMode="numeric" />
        </Field>
        <Field label="Autonomia por galon">
          <input className="input" value={vehicle.autonomyPerGallon} onChange={(event) => onChange("autonomyPerGallon", event.target.value)} placeholder="38" inputMode="decimal" />
        </Field>
      </div>
    </div>
  );
}

function DocumentsTab({ vehicle, onChange }) {
  const maxNoticeDays = Math.max(0, ...documentRows.map((item) => Number(vehicle[item.noticeField] || 0)));
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle title="Vencimientos y avisos" detail="Estados de documentos, Pico y Placa y anticipacion." noMargin />
        <span className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
          <Bell size={15} />
          Alertas anticipadas: {maxNoticeDays || 15} dias antes
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {documentRows.map((document) => (
          <DocumentCard key={document.dateField} document={document} vehicle={vehicle} onChange={onChange} />
        ))}
        <WarrantyCard vehicle={vehicle} onChange={onChange} />
        <PicoPreviewCard vehicle={vehicle} />
        <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 sm:col-span-2">
          <div className="flex items-center gap-3">
            <SoftIcon icon={Bell} tone="purple" />
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-slate-950">Alertas anticipadas</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Recibiras avisos antes del vencimiento de cada documento.</p>
            </div>
            <Badge tone="slate">Configurado</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarrantyCard({ vehicle, onChange }) {
  const currentMileage = Number(vehicle.currentMileage || 0);
  const warrantyKm = Number(vehicle.warrantyExpiryKm || 0);
  const remainingKm = Number.isFinite(currentMileage) && Number.isFinite(warrantyKm) && warrantyKm > 0 ? warrantyKm - currentMileage : null;
  const status = getWarrantyBadgeMeta(vehicle.warrantyStartDate, vehicle.warrantyYears, remainingKm, Number(vehicle.warrantyNoticeDays || 15));

  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 sm:col-span-2">
      <div className="mb-3 flex items-start gap-3">
        <SoftIcon icon={ShieldCheck} tone="purple" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">Garantia de fabrica</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">{formatWarrantySummary(vehicle, remainingKm)}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Inicio garantia">
          <input className="input" type="date" value={vehicle.warrantyStartDate || ""} onChange={(event) => onChange("warrantyStartDate", event.target.value)} />
        </Field>
        <Field label="Anios vigencia">
          <input className="input" value={vehicle.warrantyYears || ""} onChange={(event) => onChange("warrantyYears", event.target.value)} placeholder="3" inputMode="numeric" />
        </Field>
        <Field label="Vence en km">
          <input className="input" value={vehicle.warrantyExpiryKm || ""} onChange={(event) => onChange("warrantyExpiryKm", event.target.value)} placeholder="100000" inputMode="numeric" />
        </Field>
        <Field label="Avisar antes">
          <input className="input" value={vehicle.warrantyNoticeDays || ""} onChange={(event) => onChange("warrantyNoticeDays", event.target.value)} placeholder="15" inputMode="numeric" />
        </Field>
      </div>
    </div>
  );
}

function DocumentCard({ document, vehicle, onChange }) {
  const Icon = document.icon;
  const dateValue = vehicle[document.dateField];
  const noticeValue = vehicle[document.noticeField];
  const remainingDays = daysUntil(dateValue);
  const status = getDateBadgeMeta(remainingDays, Number(noticeValue || 15));

  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="mb-3 flex items-start gap-3">
        <SoftIcon icon={Icon} tone={document.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">{document.label}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">Vence {formatShortDate(dateValue)}</p>
        </div>
        <ChevronRight className="mt-3 text-slate-400" size={19} />
      </div>
      <div className="grid gap-2 min-[520px]:grid-cols-[1fr_7.5rem]">
        <Field label="Vencimiento">
          <input className="input" type="date" value={dateValue || ""} onChange={(event) => onChange(document.dateField, event.target.value)} />
        </Field>
        <Field label="Avisar antes">
          <input className="input" value={noticeValue ?? ""} onChange={(event) => onChange(document.noticeField, event.target.value)} placeholder="15" inputMode="numeric" />
        </Field>
      </div>
    </div>
  );
}

function PicoPreviewCard({ vehicle }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <SoftIcon icon={CarFront} tone="blue" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">Pico y placa</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{getPicoPreview(vehicle)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">Lunes a viernes Â· {polishSpanishText(vehicle.city || "Sin ciudad")}</p>
        </div>
        <ChevronRight className="text-slate-400" size={19} />
      </div>
    </div>
  );
}

function MaintenanceTab({ vehicle, onChange }) {
  return (
    <div>
      <SectionTitle title="Mantenimiento" detail="Control por kilometraje para motor, caja y observaciones." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kilometraje actual">
          <input className="input" value={vehicle.currentMileage} onChange={(event) => onChange("currentMileage", event.target.value)} placeholder="102760" inputMode="numeric" />
        </Field>
        <MaintenanceMetric label="Estado aceite motor" currentMileage={vehicle.currentMileage} nextMileage={vehicle.nextEngineOilKm} />
        <Field label="Ultimo cambio de aceite motor">
          <input className="input" value={vehicle.lastEngineOilKm} onChange={(event) => onChange("lastEngineOilKm", event.target.value)} placeholder="100000" inputMode="numeric" />
        </Field>
        <Field label="Proximo cambio de aceite motor">
          <input className="input" value={vehicle.nextEngineOilKm} onChange={(event) => onChange("nextEngineOilKm", event.target.value)} placeholder="105000" inputMode="numeric" />
        </Field>
        <Field label="Ultimo cambio de aceite caja">
          <input className="input" value={vehicle.lastGearboxOilKm} onChange={(event) => onChange("lastGearboxOilKm", event.target.value)} placeholder="90000" inputMode="numeric" />
        </Field>
        <Field label="Proximo cambio de aceite caja">
          <input className="input" value={vehicle.nextGearboxOilKm} onChange={(event) => onChange("nextGearboxOilKm", event.target.value)} placeholder="120000" inputMode="numeric" />
        </Field>
        <Field label="Observaciones" className="sm:col-span-2">
          <textarea className="input min-h-28 resize-none" value={vehicle.maintenanceNotes} onChange={(event) => onChange("maintenanceNotes", event.target.value)} placeholder="Notas de taller, repuestos o pendientes." />
        </Field>
      </div>
    </div>
  );
}

function ContactsTab({ vehicle, onChange, onSendTest, isSendingTest, testMessage }) {
  const contacts = normalizeNotificationContacts(vehicle.notificationContacts);
  const activeContactCount = contacts.filter((contact) => contact.email && contact.notificationTypes.length).length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle title="Contactos de notificacion" detail="El usuario recibe siempre. Agrega hasta 2 contactos adicionales y elige que alertas reciben." noMargin />
        <button
          type="button"
          onClick={onSendTest}
          disabled={isSendingTest}
          className="secondary-button w-full justify-center sm:w-auto"
        >
          {isSendingTest ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Probar correos
        </button>
      </div>
      <div className="mb-4 rounded-3xl bg-blue-50 p-4 text-blue-950 ring-1 ring-blue-100">
        <div className="flex items-center gap-3">
          <SoftIcon icon={Mail} tone="blue" />
          <div className="min-w-0">
            <p className="text-sm font-black">Destinatario principal</p>
            <p className="mt-1 text-sm font-semibold text-blue-900/75">El correo del usuario se mantiene incluido en todas las notificaciones.</p>
          </div>
        </div>
      </div>
      {testMessage ? <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">{testMessage}</p> : null}
      {!activeContactCount ? (
        <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-100">
          La prueba enviara al usuario. Los contactos adicionales reciben prueba cuando tienen correo y al menos una notificacion seleccionada.
        </p>
      ) : null}

      <div className="grid gap-3">
        {Array.from({ length: 2 }, (_, index) => contacts[index] || buildEmptyNotificationContact()).map((contact, index) => (
          <NotificationContactCard key={index} contact={contact} index={index} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function NotificationContactCard({ contact, index, onChange }) {
  const selectedTypes = Array.isArray(contact.notificationTypes) ? contact.notificationTypes : [];

  function toggleType(typeId) {
    const nextTypes = selectedTypes.includes(typeId) ? selectedTypes.filter((item) => item !== typeId) : [...selectedTypes, typeId];
    onChange(index, "notificationTypes", nextTypes);
  }

  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <SoftIcon icon={UsersRound} tone={index === 0 ? "green" : "amber"} />
        <div>
          <h3 className="font-black text-slate-950">Contacto adicional {index + 1}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Recibe solo las notificaciones seleccionadas.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Nombre">
          <input className="input" value={contact.name || ""} onChange={(event) => onChange(index, "name", event.target.value)} placeholder="Nombre del contacto" />
        </Field>
        <Field label="Correo">
          <input className="input" type="email" value={contact.email || ""} onChange={(event) => onChange(index, "email", event.target.value)} placeholder="correo@ejemplo.com" />
        </Field>
      </div>
      <div className="mt-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-500">
          <ListChecks size={15} />
          Notificaciones aplicables
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {contactNotificationOptions.map((option) => (
            <label key={option.id} className="flex min-h-12 items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
              <input
                type="checkbox"
                className="size-4 accent-black"
                checked={selectedTypes.includes(option.id)}
                onChange={() => toggleType(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function MaintenanceMetric({ label, currentMileage, nextMileage }) {
  const current = Number(currentMileage);
  const next = Number(nextMileage);
  const remaining = Number.isFinite(current) && Number.isFinite(next) && current > 0 && next > 0 ? next - current : null;
  const urgent = remaining !== null && remaining <= 0;

  return (
    <div className={`rounded-3xl p-4 ring-1 ${urgent ? "bg-red-50 text-red-950 ring-red-100" : "bg-emerald-50 text-emerald-950 ring-emerald-100"}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-lg font-black">{formatRemainingKm(remaining)}</p>
    </div>
  );
}

function AddVehicleModal({ draft, onChange, onSubmit, onClose }) {
  function updateDraft(field, value) {
    onChange((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title">
      <form onSubmit={onSubmit} className="app-modal-panel app-modal-panel-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 bg-black p-5 text-white">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Nuevo registro</p>
            <h2 id="add-vehicle-title" className="mt-1 text-2xl font-black">
              Nuevo vehiculo
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 p-5">
          <Field label="Placa">
            <input className="input uppercase" value={draft.plate} onChange={(event) => updateDraft("plate", event.target.value)} placeholder="ABC123" maxLength={7} required />
          </Field>
          <Field label="Marca">
            <input className="input" value={draft.brand} onChange={(event) => updateDraft("brand", event.target.value)} placeholder="Mazda" />
          </Field>
          <Field label="Modelo">
            <input className="input" value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} placeholder="3" />
          </Field>
          <Field label="Ano">
            <input className="input" value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} placeholder="2019" inputMode="numeric" />
          </Field>
          <Field label="Ciudad">
            <select className="input" value={draft.city} onChange={(event) => updateDraft("city", event.target.value)}>
              {cityOptions.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              <CirclePlus size={18} />
              Agregar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function EmptyVehicleState({ onAdd }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-6 text-center shadow-soft ring-1 ring-slate-100">
      <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-slate-100 text-black">
        <CarFront size={30} />
      </div>
      <h2 className="mt-4 text-2xl font-black text-slate-950">Registra tu primer vehiculo</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">Guarda documentos, kilometraje y avisos en un solo lugar.</p>
      <button type="button" onClick={onAdd} className="primary-button mt-5">
        <Plus size={18} />
        Nuevo vehiculo
      </button>
    </section>
  );
}

function SectionTitle({ title, detail, noMargin = false }) {
  return (
    <div className={noMargin ? "" : "mb-4"}>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function SoftIcon({ icon: Icon, tone = "blue" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ring-1 ${styles[tone] || styles.blue}`}>
      <Icon size={21} />
    </div>
  );
}

function Badge({ children, tone = "slate", icon: Icon }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black uppercase ring-1 ${styles[tone] || styles.slate}`}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

function getInitialVehicleList(user) {
  const storedVehicles = getVehicles(user);
  if (storedVehicles.length) return storedVehicles;

  const storedVehicle = getVehicle(user) || getCachedSheetVehicle(user, null);
  if (storedVehicle) {
    return [
      {
        ...defaultVehicle,
        ...storedVehicle,
        principal: storedVehicle.principal ?? true,
        guardado: storedVehicle.guardado ?? true,
      },
    ];
  }

  return buildDemoVehicles(user);
}

function getInitialActiveVehicleId(user, vehicles) {
  const storedActiveVehicleId = getActiveVehicleId(user);
  return storedActiveVehicleId || vehicles.find((vehicle) => vehicle.principal)?.id || vehicles[0]?.id || "";
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

function buildDemoVehicles(user) {
  return [
    {
      ...defaultVehicle,
      id: "vehicle-gwm-m4",
      userEmail: user?.email || "",
      plate: "ISW009",
      brand: "GWM",
      model: "M4",
      year: "2016",
      type: "Camioneta",
      city: user?.city || "Medellin",
      fuel: "Gasolina corriente",
      currentMileage: "102760",
      autonomyPerGallon: "38",
      soatExpiry: "2024-11-20",
      insuranceExpiry: "2024-12-12",
      techReviewExpiry: "2025-01-15",
      licenseExpiry: "2027-09-03",
      lastEngineOilKm: "100000",
      nextEngineOilKm: "105000",
      lastGearboxOilKm: "90000",
      nextGearboxOilKm: "120000",
      maintenanceNotes: "Revisar frenos y llantas en el proximo servicio.",
      principal: true,
      guardado: true,
    },
    {
      ...defaultVehicle,
      id: "vehicle-mazda-3",
      userEmail: user?.email || "",
      plate: "ABC123",
      brand: "Mazda",
      model: "3",
      year: "2019",
      type: "Carro",
      city: user?.city || "Medellin",
      fuel: "Gasolina corriente",
      currentMileage: "68420",
      autonomyPerGallon: "42",
      soatExpiry: "2026-11-20",
      insuranceExpiry: "2026-12-12",
      techReviewExpiry: "2027-01-15",
      licenseExpiry: "2028-09-03",
      lastEngineOilKm: "65000",
      nextEngineOilKm: "70000",
      lastGearboxOilKm: "60000",
      nextGearboxOilKm: "90000",
      principal: false,
      guardado: true,
    },
  ];
}

function buildNewVehicleDraft(user) {
  return {
    plate: "",
    brand: "",
    model: "",
    year: "",
    city: user?.city || "Medellin",
  };
}

function resolveActiveVehicle(vehicles, activeVehicleId) {
  return vehicles.find((vehicle) => vehicle.id === activeVehicleId) || vehicles.find((vehicle) => vehicle.principal) || vehicles[0] || null;
}

function mergeVehicleIntoList(vehicles, vehicle) {
  const vehicleList = Array.isArray(vehicles) ? vehicles.filter(Boolean) : [];
  if (!vehicle) return vehicleList;

  const vehicleKey = getVehicleMergeKey(vehicle);
  const exists = vehicleList.some((item) => getVehicleMergeKey(item) === vehicleKey);
  const nextVehicle = {
    ...defaultVehicle,
    ...vehicle,
    principal: vehicle.principal ?? !vehicleList.some((item) => item.principal),
    guardado: vehicle.guardado ?? true,
  };

  if (!exists) return [nextVehicle, ...vehicleList];
  return vehicleList.map((item) => (getVehicleMergeKey(item) === vehicleKey ? { ...item, ...nextVehicle } : item));
}

function getVehicleMergeKey(vehicle) {
  return String(vehicle?.id || vehicle?.plate || vehicle?.placa || "").trim().toLowerCase();
}

function getVehicleImage(vehicle) {
  return vehicle.vehiclePhotoDataUrl || vehicle.fotoUrl || vehicle.photoUrl || heroImages[vehicle.type] || heroImages.default;
}

function getVehicleTitle(vehicle) {
  return [vehicle.brand || "Marca", vehicle.model || "modelo"].join(" ").trim();
}

function formatMileage(value) {
  const mileage = Number(value);
  if (!value || !Number.isFinite(mileage)) return "Kilometraje pendiente";
  return `${mileage.toLocaleString("es-CO")} km`;
}

function getValueToneClass(tone) {
  const styles = {
    blue: "text-blue-700",
    green: "text-emerald-700",
    amber: "text-amber-700",
    purple: "text-violet-700",
  };
  return styles[tone] || "text-slate-700";
}

function getDateBadgeMeta(days, noticeDays) {
  if (days === null) return { label: "Sin fecha", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  if (days < 0) return { label: "Vencido", className: "bg-red-50 text-red-700 ring-red-100" };
  if (days <= noticeDays) return { label: "Proxima", className: "bg-amber-50 text-amber-700 ring-amber-100" };
  return { label: "Vigente", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
}

function getPicoPreview(vehicle) {
  const city = normalizeCity(vehicle.city);
  const weekday = new Date().getDay();
  const medellinSchedule = {
    1: "6 - 9",
    2: "5 - 7",
    3: "1 - 4",
    4: "8 - 0",
    5: "2 - 3",
  };

  if (city === "medellin" && medellinSchedule[weekday]) return `Hoy: ${medellinSchedule[weekday]}`;
  return "Ver en Home";
}

function normalizeCity(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatRemainingKm(value) {
  if (value === null) return "Ingresa kilometraje";
  if (value < 0) return `Vencido por ${Math.abs(value).toLocaleString("es-CO")} km`;
  return `Faltan ${value.toLocaleString("es-CO")} km`;
}

function buildEmptyNotificationContact() {
  return {
    name: "",
    email: "",
    notificationTypes: [],
  };
}

function normalizeNotificationContacts(contacts) {
  const normalizedContacts = (Array.isArray(contacts) ? contacts : [])
    .slice(0, 2)
    .map((contact) => ({
      name: String(contact?.name || "").trim(),
      email: String(contact?.email || "").trim().toLowerCase(),
      notificationTypes: Array.isArray(contact?.notificationTypes)
        ? contact.notificationTypes.filter((type) => contactNotificationOptions.some((option) => option.id === type))
        : [],
    }));

  while (normalizedContacts.length < 2) {
    normalizedContacts.push(buildEmptyNotificationContact());
  }

  return normalizedContacts;
}

function getWarrantyExpiryDate(startDate, years) {
  const parsedYears = Number(years);
  if (!startDate || !Number.isFinite(parsedYears) || parsedYears <= 0) return "";

  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  date.setFullYear(date.getFullYear() + parsedYears);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWarrantyBadgeMeta(startDate, years, remainingKm, noticeDays) {
  const expiryDate = getWarrantyExpiryDate(startDate, years);
  const dateStatus = getDateBadgeMeta(daysUntil(expiryDate), noticeDays);

  if (remainingKm !== null && remainingKm <= 0) {
    return { label: "Vencida por km", className: "bg-red-50 text-red-700 ring-red-100" };
  }

  if (remainingKm !== null && remainingKm <= 500) {
    return { label: "Proxima por km", className: "bg-amber-50 text-amber-700 ring-amber-100" };
  }

  return dateStatus;
}

function formatWarrantySummary(vehicle, remainingKm) {
  const expiryDate = getWarrantyExpiryDate(vehicle.warrantyStartDate, vehicle.warrantyYears);
  const dateText = expiryDate ? `vence ${formatShortDate(expiryDate)}` : "fecha pendiente";
  const kmText = remainingKm === null ? "km pendiente" : `${Math.max(remainingKm, 0).toLocaleString("es-CO")} km restantes`;
  return `${dateText} - ${kmText}`;
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

      image.onerror = () => reject(new Error("Imagen invalida."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

