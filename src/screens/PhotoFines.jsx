import { Camera, Gauge, MapPin, Navigation, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BackToCenterButton from "../components/BackToCenterButton";
import Card from "../components/Card";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import { photoDetectionCameras } from "../data/mockData";
import { getCachedPhotoFinesFromSheet, refreshPhotoFinesFromSheet } from "../services/api";
import { polishSpanishText } from "../utils/textUtils";

function getMapsUrl(coordinates) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
}

function getInitialPhotoFines() {
  const cachedResult = getCachedPhotoFinesFromSheet();
  return cachedResult?.ok && cachedResult.items?.length ? cachedResult.items : photoDetectionCameras;
}

export default function PhotoFines({ user, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [cameras, setCameras] = useState(() => getInitialPhotoFines());

  useEffect(() => {
    refreshPhotoFinesFromSheet()
      .then((result) => {
        if (result?.ok && result.items?.length) {
          setCameras(result.items);
        }
      })
      .catch((error) => console.warn("No se pudieron cargar cámaras remotas", error));
  }, []);

  const filteredCameras = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return cameras;
    return cameras.filter((camera) => `${camera.municipality} ${camera.address}`.toLowerCase().includes(text));
  }, [cameras, query]);

  return (
    <main className="screen-shell">
      <Header
        user={user}
        onLogout={onLogout}
        title="Fotomultas"
        subtitle="Galería simulada de cámaras de fotodetección del Valle de Aburrá."
        backAction={<BackToCenterButton onNavigate={onNavigate} />}
      />

      <Card className="mb-5 p-4">
        <label className="block">
          <span className="label mb-1 block">Buscar municipio o dirección</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Medellin, Envigado, Autopista..." />
          </div>
        </label>
      </Card>

      <div className="grid gap-4">
        {filteredCameras.map((camera) => (
          <Card key={camera.id} className="overflow-hidden">
            {camera.imageUrl ? <img src={camera.imageUrl} alt={polishSpanishText(camera.address)} className="h-44 w-full object-cover" loading="lazy" /> : null}
            <div className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="info">{polishSpanishText(camera.municipality)}</StatusBadge>
                <StatusBadge tone="neutral">{polishSpanishText(camera.type)}</StatusBadge>
              </div>
              <h3 className="text-lg font-black text-slate-950">{polishSpanishText(camera.address)}</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <Gauge size={18} className="text-blue-600" />
                  <span className="font-bold">{camera.speedLimit} km/h max.</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <MapPin size={18} className="text-blue-600" />
                  <span className="font-bold">{camera.coordinates || "Sin coordenadas"}</span>
                </div>
              </div>
              {camera.coordinates ? (
                <a
                  href={getMapsUrl(camera.coordinates)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:bg-neutral-900"
                  aria-label={`Abrir ubicación en Google Maps de ${polishSpanishText(camera.address)}`}
                >
                  <Navigation size={18} />
                  Ver ubicación en Maps
                </a>
              ) : (
                <button type="button" disabled className="mt-4 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400">
                  <Navigation size={18} />
                  Sin ubicación disponible
                </button>
              )}
            </div>
          </Card>
        ))}

        {!filteredCameras.length ? (
          <Card className="p-6 text-center">
            <Camera className="mx-auto mb-3 text-slate-400" size={30} />
            <h2 className="font-black text-slate-950">Sin resultados</h2>
            <p className="mt-1 text-sm text-slate-500">Prueba con otro municipio o dirección.</p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
