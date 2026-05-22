import { BookOpen, ListChecks, Maximize2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import { transitArticles } from "../data/mockData";
import { getCachedTransitArticlesFromSheet, refreshTransitArticlesFromSheet } from "../services/api";
import { polishSpanishText } from "../utils/textUtils";

function getInitialTransitArticles() {
  const cachedResult = getCachedTransitArticlesFromSheet();
  return cachedResult?.ok && cachedResult.items?.length ? cachedResult.items : transitArticles;
}

export default function TransitCode({ user, onLogout }) {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState(() => getInitialTransitArticles());
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    refreshTransitArticlesFromSheet()
      .then((result) => {
        if (result?.ok && result.items?.length) {
          setArticles(result.items);
        }
      })
      .catch((error) => console.warn("No se pudo cargar código de tránsito desde Sheets", error));
  }, []);

  const filteredArticles = useMemo(() => {
    const text = normalizeSearchText(query);
    if (!text) return articles;
    return articles.filter((article) => {
      const haystack = normalizeSearchText(
        `${article.article} ${article.title} ${article.summary} ${getDetailParagraphs(article).join(" ")} ${getRecommendations(article).join(" ")} ${getKeywords(article).join(" ")}`,
      );
      return haystack.includes(text);
    });
  }, [articles, query]);

  return (
    <main className="screen-shell">
      <Header user={user} onLogout={onLogout} title="Código de Tránsito" subtitle="Busca conceptos frecuentes sin salir de la app." />

      <Card className="mb-5 p-4">
        <label className="block">
          <span className="label mb-1 block">Buscar por palabra</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SOAT, licencia, casco, velocidad..." />
          </div>
        </label>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">Resultados</h2>
        <StatusBadge tone="info">{filteredArticles.length} artículos</StatusBadge>
      </div>

      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <TransitArticleCard key={article.id} article={article} onOpen={() => setSelectedArticle(article)} />
        ))}
      </div>

      {selectedArticle ? <TransitArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} /> : null}
    </main>
  );
}

function TransitArticleCard({ article, onOpen }) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
      <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => handleCardKeyDown(event, onOpen)} className="cursor-pointer p-5 text-left">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <StatusBadge tone="neutral">{article.article}</StatusBadge>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
            <Maximize2 size={13} />
            Ver más
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-950">{polishSpanishText(article.title)}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{polishSpanishText(article.summary)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {getKeywords(article).slice(0, 4).map((keyword) => (
            <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {polishSpanishText(keyword)}
            </span>
          ))}
        </div>
      </article>
    </Card>
  );
}

function TransitArticleDetailModal({ article, onClose }) {
  const keywords = getKeywords(article);
  const details = getDetailParagraphs(article);
  const recommendations = getRecommendations(article);

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 p-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Código de tránsito</p>
            <h2 className="truncate text-lg font-black text-slate-950">{polishSpanishText(article.title)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar detalle"
            title="Cerrar detalle"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-950 p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-blue-600 text-white shadow-lift">
              <BookOpen size={24} />
            </div>
            <div className="min-w-0">
              <StatusBadge tone="info">{article.article}</StatusBadge>
              <h3 className="mt-3 text-2xl font-black leading-tight">{polishSpanishText(article.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{polishSpanishText(article.summary)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <section>
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">Más información</h4>
            <div className="mt-3 space-y-3">
              {details.map((detail) => (
                <p key={detail} className="text-sm leading-7 text-slate-600">
                  {polishSpanishText(detail)}
                </p>
              ))}
            </div>
          </section>

          {recommendations.length ? (
            <section className="rounded-3xl bg-blue-50 p-4 ring-1 ring-blue-100">
              <div className="mb-3 flex items-center gap-2 text-blue-700">
                <ListChecks size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide">Ten en cuenta</h4>
              </div>
              <ul className="space-y-2">
                {recommendations.map((recommendation) => (
                  <li key={recommendation} className="flex gap-2 text-sm leading-6 text-blue-950">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{polishSpanishText(recommendation)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {keywords.length ? (
            <section>
              <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">Palabras clave</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    {polishSpanishText(keyword)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getKeywords(article) {
  if (Array.isArray(article.keywords)) return article.keywords;
  return String(article.keywords || "")
    .split(/[,;\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function getDetailParagraphs(article) {
  const explicitDetails = splitTextList(article.details || article.detail || article.moreInfo || article.masInformacion);
  const details = explicitDetails.length ? explicitDetails : getFallbackDetails(article);
  const uniqueDetails = details.filter((detail) => normalizeSearchText(detail) !== normalizeSearchText(article.summary));
  return uniqueDetails.length ? uniqueDetails : getFallbackDetails(article).filter((detail) => normalizeSearchText(detail) !== normalizeSearchText(article.summary));
}

function getRecommendations(article) {
  if (Array.isArray(article.recommendations) && article.recommendations.length) return article.recommendations;
  const explicitRecommendations = splitTextList(article.recommendations || article.tips || article.consejos);
  return explicitRecommendations.length ? explicitRecommendations : getFallbackRecommendations(article);
}

function splitTextList(value) {
  return String(value || "")
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFallbackDetails(article) {
  const topic = getArticleTopic(article);
  const commonDetail = "Usa esta referencia como guía rápida dentro de la app y contrasta el caso puntual con la autoridad de tránsito correspondiente.";

  if (hasTopic(topic, ["documentos", "soat", "licencia", "revision", "tecnomecanica", "tarjetapropiedad"])) {
    return [
      article.summary,
      "Este tema se relaciona con los soportes que acreditan que el conductor y el vehículo pueden circular. En un control de vía pueden solicitar documentos físicos o digitales, según el caso.",
      commonDetail,
    ].filter(Boolean);
  }

  if (hasTopic(topic, ["velocidad", "limite", "fotomulta"])) {
    return [
      article.summary,
      "La velocidad permitida depende de la señalización, el tipo de vía y las condiciones del entorno. En lluvia, baja visibilidad, obra o alto flujo peatonal conviene reducir incluso por debajo del límite.",
      commonDetail,
    ].filter(Boolean);
  }

  if (hasTopic(topic, ["casco", "moto", "motociclista"])) {
    return [
      article.summary,
      "La proteccion aplica para conductor y acompanante. El casco debe estar ajustado, abrochado y en buen estado durante todo el recorrido.",
      commonDetail,
    ].filter(Boolean);
  }

  if (hasTopic(topic, ["parqueo", "estacionar", "anden", "prohibido"])) {
    return [
      article.summary,
      "El estacionamiento indebido puede bloquear peatones, accesos, transporte público o visibilidad en cruces. Algunas situaciones pueden terminar en inmovilización o retiro del vehículo.",
      commonDetail,
    ].filter(Boolean);
  }

  if (hasTopic(topic, ["comparendo", "infraccion", "multa", "sancion"])) {
    return [
      article.summary,
      "El comparendo inicia un trámite frente a una presunta infracción. Revisa la notificación, los plazos y el organismo competente para decidir si pagas, haces curso o solicitas revisión.",
      commonDetail,
    ].filter(Boolean);
  }

  if (hasTopic(topic, ["senal", "senales", "senalizacion", "transito", "via"])) {
    return [
      article.summary,
      "Las señales pueden ordenar, prohibir, advertir riesgos u orientar el recorrido. Su lectura debe ajustarse al tramo actual, especialmente cuando hay obras, cierres o cambios temporales.",
      commonDetail,
    ].filter(Boolean);
  }

  return [article.summary, commonDetail].filter(Boolean);
}

function getFallbackRecommendations(article) {
  const topic = getArticleTopic(article);

  if (hasTopic(topic, ["documentos", "soat", "licencia", "revision", "tecnomecanica", "tarjetapropiedad"])) {
    return ["Verifica vigencias antes de conducir.", "Confirma que los datos correspondan a la placa y al conductor.", "Ten una copia digital disponible para controles."];
  }

  if (hasTopic(topic, ["velocidad", "limite", "fotomulta"])) {
    return ["Respeta la señalización del tramo.", "Reduce velocidad en lluvia, curvas, colegios y zonas residenciales.", "Aumenta la distancia de seguridad."];
  }

  if (hasTopic(topic, ["casco", "moto", "motociclista"])) {
    return ["Usa casco certificado y ajustado.", "Asegura también el casco del acompañante.", "Reemplaza cascos con golpes fuertes o piezas deterioradas."];
  }

  if (hasTopic(topic, ["parqueo", "estacionar", "anden", "prohibido"])) {
    return ["Revisa señales y demarcación antes de estacionar.", "No bloquees andenes, rampas, hidrantes ni accesos.", "Usa parqueaderos autorizados cuando tengas duda."];
  }

  if (hasTopic(topic, ["comparendo", "infraccion", "multa", "sancion"])) {
    return ["Consulta el estado en canales oficiales.", "Guarda soportes de pago, curso o audiencia.", "Atiende los plazos para evitar recargos."];
  }

  if (hasTopic(topic, ["senal", "senales", "senalizacion", "transito", "via"])) {
    return ["Prioriza la señalización vigente del tramo.", "Reduce velocidad ante señales preventivas.", "Atiende cambios temporales por obra o eventos."];
  }

  return ["Revisa el contexto de la vía antes de actuar.", "Conserva soportes cuando el tema involucre documentos o comparendos.", "Consulta el canal oficial si necesitas confirmar un caso puntual."];
}

function getArticleTopic(article) {
  return normalizeSearchText(`${article.article} ${article.title} ${article.summary} ${getKeywords(article).join(" ")}`);
}

function hasTopic(topic, terms) {
  return terms.some((term) => topic.includes(normalizeSearchText(term)));
}

function handleCardKeyDown(event, onOpen) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}
