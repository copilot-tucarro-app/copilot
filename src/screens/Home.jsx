import { BriefcaseBusiness, CalendarClock, Fuel, Info, Mail, Maximize2, PlayCircle, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { AlertTriangle, ArrowRight, FileWarning, Wrench } from "lucide-react";
import Card from "../components/Card";
import Header from "../components/Header";
import PicoPlacaWidget from "../components/PicoPlacaWidget";
import StatusBadge from "../components/StatusBadge";
import UpToDateMedal from "../components/UpToDateMedal";
import { APP_ICON_INVERSE_URL, APP_NAME } from "../config/appConfig";
import { homeSections, weeklyNews } from "../data/mockData";
import { getCachedHomeNewsFromSheet, getCachedVehicleByUser, refreshHomeNewsFromSheet, refreshVehicleByUser } from "../services/api";
import { buildHomePriorityAlerts, isVehicleUpToDate } from "../utils/alertUtils";
import { formatShortDate } from "../utils/dateUtils";
import { getDirectImageUrl } from "../utils/mediaUtils";
import { notifyNewHomeNews } from "../utils/notificationUtils";
import { getVehicle, setVehicle } from "../utils/storage";
import { polishSpanishText } from "../utils/textUtils";

const sectionIcons = {
  "Alertas importantes": ShieldAlert,
  "Tips para conductores": Fuel,
  "Novedades de tránsito": CalendarClock,
  "Novedades de transito": CalendarClock,
};

const contactInfo = {
  email: "copilot.tucarro@gmail.com",
};

function getInitialHomeNews() {
  const cachedNews = getCachedHomeNewsFromSheet();
  const cachedItems = getNewsItemsFromResult(cachedNews);
  return cachedItems.length ? cachedItems : sortNewsByDate(weeklyNews);
}

function getNewsItemsFromResult(result) {
  return result?.ok && Array.isArray(result.items) ? sortNewsByDate(result.items.filter((item) => item?.title)) : [];
}

function sortNewsByDate(items) {
  return [...items].sort((left, right) => getNewsDateTime(right) - getNewsDateTime(left));
}

function getNewsDateTime(item) {
  const timestamp = Date.parse(item?.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLatestSectionDateTime(section, items) {
  return Math.max(0, ...items.filter((item) => item.section === section).map(getNewsDateTime));
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

export default function Home({ user, onLogout, onNavigate, onOpenAgent, canUseSalesAgent }) {
  const [showInfo, setShowInfo] = useState(false);
  const [newsItems, setNewsItems] = useState(() => getInitialHomeNews());
  const [activeVehicle, setActiveVehicle] = useState(() => getVehicle(user));
  const [vehicleSyncStatus, setVehicleSyncStatus] = useState(() => (getVehicle(user) ? "local" : "loading"));
  const [selectedNews, setSelectedNews] = useState(null);
  const sections = useMemo(() => {
    const sheetSections = newsItems.map((item) => item.section).filter(Boolean);
    return Array.from(new Set([...homeSections, ...sheetSections])).sort((left, right) => getLatestSectionDateTime(right, newsItems) - getLatestSectionDateTime(left, newsItems));
  }, [newsItems]);
  const priorityAlerts = useMemo(() => buildHomePriorityAlerts(activeVehicle), [activeVehicle]);
  const vehicleIsUpToDate = useMemo(() => isVehicleUpToDate(activeVehicle), [activeVehicle]);

  useEffect(() => {
    if (!user?.email) return;
    let isActive = true;
    const localVehicle = getVehicle(user);
    const cachedVehicle = getCachedSheetVehicle(user, localVehicle);
    const immediateVehicle = pickNewestVehicle(localVehicle, cachedVehicle);

    if (immediateVehicle) {
      const savedImmediateVehicle = setVehicle(mergeVehicleLocalOnlyFields(immediateVehicle, localVehicle), user);
      setActiveVehicle(savedImmediateVehicle);
    } else {
      setActiveVehicle(null);
    }

    setVehicleSyncStatus(immediateVehicle ? "updating" : "loading");

    refreshVehicleByUser(user.email)
      .then((result) => {
        if (!isActive) return;

        if (result?.ok && result.vehicle) {
          const currentLocalVehicle = getVehicle(user) || localVehicle;
          const sheetVehicle = mergeVehicleLocalOnlyFields(result.vehicle, currentLocalVehicle);
          const savedVehicle = setVehicle(pickNewestVehicle(currentLocalVehicle, sheetVehicle), user);
          setActiveVehicle(savedVehicle);
          setVehicleSyncStatus("ready");
          return;
        }

        setVehicleSyncStatus(immediateVehicle ? "local" : "noVehicle");
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn("No se pudo cargar vehículo remoto", error);
        setVehicleSyncStatus(immediateVehicle ? "local" : "error");
      });

    return () => {
      isActive = false;
    };
  }, [user?.email]);

  useEffect(() => {
    const newsTimer = window.setTimeout(() => {
      const cachedNews = getCachedHomeNewsFromSheet();
      const cachedItems = getNewsItemsFromResult(cachedNews);
      if (cachedItems.length) {
        setNewsItems(cachedItems);
      }

      refreshHomeNewsFromSheet()
        .then((result) => {
          if (result?.ok && result.items?.length) {
            const freshNewsItems = getNewsItemsFromResult(result);
            setNewsItems(freshNewsItems);
            notifyNewHomeNews({ user, items: freshNewsItems }).catch((error) => console.warn("No se pudo notificar novedades", error));
          }
        })
        .catch((error) => console.warn("No se pudieron cargar novedades remotas", error));
    }, 0);

    return () => window.clearTimeout(newsTimer);
  }, []);

  return (
    <main className="screen-shell">
      <Header
        user={user}
        onLogout={onLogout}
        subtitle="Controla lo importante antes de que se vuelva urgente."
        action={
          <>
            {canUseSalesAgent ? (
          <button
            type="button"
            onClick={onOpenAgent}
            className="grid size-11 place-items-center rounded-2xl bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5"
            aria-label="Agente de ventas"
            title="Agente de ventas"
          >
            <BriefcaseBusiness size={19} />
          </button>
            ) : null}
            {vehicleIsUpToDate ? <UpToDateMedal vehicleLabel={activeVehicle?.plate || "Vehiculo principal"} /> : null}
            <button
              type="button"
              onClick={() => setShowInfo((current) => !current)}
              className="grid size-11 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-black"
              aria-label="Información"
              title="Información"
            >
              <Info size={19} />
            </button>
          </>
        }
      />

      {showInfo ? <ContactInfoCard onClose={() => setShowInfo(false)} /> : null}

      <TrialSubscriptionBanner user={user} />

      <HomePriorityAlerts alerts={priorityAlerts} onOpenVehicle={() => onNavigate?.("vehicle")} />

      <PicoPlacaWidget vehicle={activeVehicle} syncStatus={vehicleSyncStatus} />

      <section className="mb-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
        <div className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(37,99,235,0.6),transparent_20rem)]" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-3xl bg-slate-950 ring-1 ring-white/15">
              <img src={APP_ICON_INVERSE_URL} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Resumen inteligente</p>
              <h2 className="mt-1 text-xl font-black">Tu semana en modo conductor</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">Novedades, tips y alertas para moverte con confianza.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-7">
        {sections.map((section) => {
          const Icon = sectionIcons[section];
          const items = newsItems.filter((item) => item.section === section);
          if (!items.length) return null;

          return (
            <section key={section}>
              <div className="mb-3 flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  {Icon ? <Icon size={18} /> : <Sparkles size={18} />}
                </div>
                <h2 className="text-lg font-black text-slate-950">{formatHomeSectionTitle(section)}</h2>
              </div>

              <div className="grid gap-4">
                {items.map((item) => (
                  <NewsCard key={item.id} item={item} onOpen={() => setSelectedNews(item)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selectedNews ? <NewsDetailModal item={selectedNews} onClose={() => setSelectedNews(null)} /> : null}
    </main>
  );
}

function HomePriorityAlerts({ alerts, onOpenVehicle }) {
  if (!alerts.length) return null;

  const hasDanger = alerts.some((alert) => alert.tone === "danger");
  const iconStyles = hasDanger ? "bg-red-50 text-red-600 ring-red-100" : "bg-amber-50 text-amber-600 ring-amber-100";

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`grid size-9 shrink-0 place-items-center rounded-2xl ring-1 ${iconStyles}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Alertas del vehículo</h2>
            <p className="text-sm leading-5 text-slate-500">Revisa lo vencido y lo próximo.</p>
          </div>
        </div>
        <StatusBadge tone={hasDanger ? "danger" : "warning"}>{alerts.length}</StatusBadge>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert) => (
          <PriorityAlertButton key={alert.id} alert={alert} onOpenVehicle={onOpenVehicle} />
        ))}
      </div>
    </section>
  );
}

function formatHomeSectionTitle(section) {
  const titles = {
    "Novedades de transito": "Novedades de tránsito",
  };

  return polishSpanishText(titles[section] || section);
}

function TrialSubscriptionBanner({ user }) {
  const trial = getTrialState(user);
  if (!trial) return null;

  const mailSubject = encodeURIComponent(`Quiero activar mi suscripción a ${APP_NAME}`);
  const mailBody = encodeURIComponent(
    [
      `Hola, quiero activar mi suscripción a ${APP_NAME}.`,
      "",
      `Nombre: ${user?.name || ""}`,
      `Correo: ${user?.email || ""}`,
      `Prueba gratis: ${trial.message}`,
    ].join("\n"),
  );

  return (
    <section className="mb-5 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-blue-950 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">Prueba gratis activa</p>
            <h2 className="mt-1 text-base font-black leading-tight">{trial.message}</h2>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">Suscríbete para mantener tus alertas y datos activos sin interrupciones.</p>
          </div>
        </div>

        <a href={`mailto:${contactInfo.email}?subject=${mailSubject}&body=${mailBody}`} className="primary-button min-h-11 shrink-0 px-4 py-2">
          Suscribirme
        </a>
      </div>
    </section>
  );
}

function getTrialState(user) {
  const accessType = String(user?.accessType || user?.subscriptionStatus || "").trim().toLowerCase();
  const isTrial = accessType === "trial" || Boolean(user?.trialEndsAt);
  if (!isTrial) return null;

  const endsAt = parseTrialDate(user?.trialEndsAt);
  if (!endsAt) return null;

  const daysRemaining = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) return null;

  const dateText = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(endsAt);

  return {
    daysRemaining,
    message:
      daysRemaining === 0
        ? `Tu prueba gratis vence hoy, ${dateText}.`
        : `Te ${daysRemaining === 1 ? "queda" : "quedan"} ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"} de prueba gratis. Vence el ${dateText}.`,
  };
}

function parseTrialDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function PriorityAlertButton({ alert, onOpenVehicle }) {
  const urgent = alert.tone === "danger";
  const Icon = alert.eyebrow.startsWith("Mantenimiento") ? Wrench : FileWarning;
  const containerStyles = urgent
    ? "border-red-100 bg-red-50 text-red-950 hover:border-red-200"
    : "border-amber-100 bg-amber-50 text-amber-950 hover:border-amber-200";
  const iconStyles = urgent ? "bg-red-600 text-white" : "bg-amber-500 text-white";
  const eyebrowStyles = urgent ? "text-red-700" : "text-amber-700";

  return (
    <button type="button" onClick={onOpenVehicle} className={`w-full rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${containerStyles}`}>
      <div className="flex items-start gap-3">
        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${iconStyles}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-black uppercase tracking-wide ${eyebrowStyles}`}>{alert.eyebrow}</p>
          <h3 className="mt-1 text-base font-black leading-tight">{alert.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 opacity-80">{alert.message}</p>
        </div>
        <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-2xl bg-white/80 text-slate-700">
          <ArrowRight size={17} />
        </div>
      </div>
    </button>
  );
}

function NewsCard({ item, onOpen }) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
      <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => handleCardKeyDown(event, onOpen)} className="cursor-pointer text-left">
        <NewsMedia item={item} className="h-48" />
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">{polishSpanishText(item.category)}</StatusBadge>
            <span className="text-xs font-semibold text-slate-400">{formatShortDate(item.date)}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
              <Maximize2 size={13} />
              Ver
            </span>
          </div>
          <h3 className="text-lg font-black leading-tight text-slate-950">{polishSpanishText(item.title)}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{polishSpanishText(item.description)}</p>
        </div>
      </article>
    </Card>
  );
}

function NewsDetailModal({ item, onClose }) {
  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 p-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Publicación</p>
            <h2 className="truncate text-lg font-black text-slate-950">{polishSpanishText(item.title)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar publicación"
            title="Cerrar publicación"
          >
            <X size={18} />
          </button>
        </div>

        <NewsMedia item={item} className="h-56 max-h-[36dvh] sm:h-80 sm:max-h-none" expanded />

        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">{polishSpanishText(item.category)}</StatusBadge>
            <span className="text-xs font-semibold text-slate-400">{formatShortDate(item.date)}</span>
            {item.videoUrl ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                <PlayCircle size={14} />
                Video
              </span>
            ) : null}
          </div>
          <h3 className="text-2xl font-black leading-tight text-slate-950">{polishSpanishText(item.title)}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{polishSpanishText(item.description)}</p>
        </div>
      </div>
    </div>
  );
}

function NewsMedia({ item, className = "", expanded = false }) {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(item.videoUrl);
  const imageUrl = getDirectImageUrl(item.imageUrl);

  if (youtubeEmbedUrl) {
    return (
      <div className={`relative w-full overflow-hidden bg-slate-950 ${className}`} onClick={(event) => event.stopPropagation()}>
        <iframe
          className="h-full w-full"
          src={youtubeEmbedUrl}
          title={polishSpanishText(item.title)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading={expanded ? "eager" : "lazy"}
        />
      </div>
    );
  }

  if (item.videoUrl) {
    return (
      <div className={`relative w-full overflow-hidden bg-slate-950 ${className}`} onClick={(event) => event.stopPropagation()}>
        <video className={`h-full w-full ${expanded ? "object-contain" : "object-cover"}`} controls preload="metadata" poster={imageUrl}>
          <source src={item.videoUrl} type="video/mp4" />
        </video>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div className={`w-full overflow-hidden bg-slate-100 ${className}`}>
      <img src={imageUrl} alt={polishSpanishText(item.title)} className={`h-full w-full ${expanded ? "object-contain" : "object-cover"}`} loading={expanded ? "eager" : "lazy"} />
    </div>
  );
}

function handleCardKeyDown(event, onOpen) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

function getYouTubeEmbedUrl(url = "") {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/").filter(Boolean)[1] || "";
      } else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        videoId = parsedUrl.searchParams.get("v") || "";
      }
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

function ContactInfoCard({ onClose }) {
  return (
    <Card className="mb-5 overflow-hidden">
      <div className="bg-slate-950 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Contacto</p>
            <h2 className="mt-1 text-2xl font-black">Información de {APP_NAME}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Estamos listos para ayudarte con tu vehículo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Cerrar información"
            title="Cerrar información"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <ContactRow icon={Mail} label="Correo" value={contactInfo.email} href={`mailto:${contactInfo.email}`} tone="blue" />
      </div>
    </Card>
  );
}

function mergeVehicleLocalOnlyFields(sheetVehicle, localVehicle) {
  if (!localVehicle) return sheetVehicle;

  return {
    ...sheetVehicle,
    vehiclePhotoDataUrl: localVehicle.vehiclePhotoDataUrl || sheetVehicle.vehiclePhotoDataUrl || "",
    vehiclePhotoUpdatedAt: localVehicle.vehiclePhotoUpdatedAt || sheetVehicle.vehiclePhotoUpdatedAt || "",
  };
}

function ContactRow({ icon: Icon, label, value, href, tone }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`flex items-center gap-3 rounded-3xl p-4 ring-1 transition hover:-translate-y-0.5 ${colors[tone]}`}>
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/75">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
        <p className="truncate text-sm font-black sm:text-base">{value}</p>
      </div>
    </a>
  );
}
