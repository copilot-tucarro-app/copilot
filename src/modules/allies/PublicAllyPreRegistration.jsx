import { BellRing, CalendarCheck2, CheckCircle2, ChevronDown, Clipboard, Newspaper, Route, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../../components/Card";
import { APP_ICON_INVERSE_URL, APP_NAME } from "../../config/appConfig";
import { cityOptions } from "../../data/mockData";
import { registerAllyPreRegistration } from "../../services/api";
import { formatCurrency } from "./calculations";
import { ALLY_PRICE_ANNUAL, CDA_STATUS } from "./constants";
import { createPublicPreRegistration, getAllyProgramSnapshot } from "./storage";

const initialForm = {
  nombreCliente: "",
  whatsapp: "",
  placa: "",
  ciudad: "Medellin",
};

const benefits = [
  {
    icon: BellRing,
    label: "Recordatorios automáticos",
    detail: "Evita vencimientos costosos y mantén tu carro al día sin perseguir fechas.",
    value: "Copilot360 te ayuda a recordar SOAT, tecnomecánica, licencia e impuestos antes de que se conviertan en una urgencia. Menos multas, menos filas de último minuto y más tranquilidad cada vez que sales.",
  },
  {
    icon: CalendarCheck2,
    label: "Pico y placa",
    detail: "Confirma si puedes circular antes de prender el carro.",
    value: "Consulta la restricción de tu ciudad con tu placa y toma mejores decisiones: salir a tiempo, cambiar la ruta, pedir otro medio de transporte o evitar una sanción innecesaria.",
  },
  {
    icon: TriangleAlert,
    label: "Alertas importantes",
    detail: "Recibe avisos claros sobre lo que realmente puede afectar tu movilidad.",
    value: "Centraliza señales clave de tu vehículo en un solo lugar para actuar rápido. La idea es simple: que el conductor se entere antes, no cuando ya tiene el problema encima.",
  },
  {
    icon: Route,
    label: "Navegación tipo Waze",
    detail: "Muévete con guía, ruta y contexto de tráfico desde el celular.",
    value: "Ideal para conductores que quieren ahorrar tiempo en sus recorridos diarios. Planea mejor, encuentra alternativas y mantén una conducción más informada sin salir de la app.",
  },
  {
    icon: Newspaper,
    label: "Novedades de tránsito",
    detail: "Entérate de cambios que pueden impactar tu rutina como conductor.",
    value: "Copilot360 acerca información útil de movilidad, seguridad vial y normas de tránsito para que no dependas de enterarte tarde por redes o por un comparendo.",
  },
];

export default function PublicAllyPreRegistration({ refCode }) {
  const [snapshot, setSnapshot] = useState(() => getAllyProgramSnapshot());
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [openBenefit, setOpenBenefit] = useState(benefits[0].label);
  const cda = useMemo(() => snapshot.cdas.find((item) => item.codigoAliado.toLowerCase() === String(refCode || "").toLowerCase()), [snapshot.cdas, refCode]);
  const isSuspended = cda && cda.estado !== CDA_STATUS.active;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setStatus(null);

    if (!form.nombreCliente || !form.whatsapp || !form.placa || !form.ciudad) {
      setStatus({ tone: "danger", message: "Completa nombre, WhatsApp, placa y ciudad para continuar." });
      return;
    }

    const response = createPublicPreRegistration({ ref: refCode, ...form });
    if (!response.ok) {
      setStatus({ tone: "danger", message: response.message || "No pudimos crear el pre-registro." });
      setSnapshot(getAllyProgramSnapshot());
      return;
    }

    setSnapshot(response.snapshot);
    setResult(response.preRegistration);
    try {
      await registerAllyPreRegistration(response.preRegistration);
    } catch {
      setStatus({ tone: "success", message: "Pre-registro creado. Si caja no lo ve de inmediato, comparte el codigo de activacion." });
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(result?.codigoActivacion || "");
    setStatus({ tone: "success", message: "Código copiado." });
  }

  if (isSuspended) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6">
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <ShieldAlert size={30} />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Este aliado no se encuentra disponible actualmente.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Puedes registrarte sin aliado o consultar directamente con {APP_NAME}.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
        <div className="relative p-5 sm:p-7">
          <img src={APP_ICON_INVERSE_URL} alt="" className="mb-5 size-16 rounded-3xl object-cover ring-4 ring-white/10" />
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Servicio {APP_NAME} Conductores</p>
          <h1 className="mt-2 text-4xl font-black leading-tight">Bienvenido a {APP_NAME} 🚗</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Tu {APP_NAME} está listo para activarse 🚗</p>
          <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-sm text-slate-300">Activa tu servicio anual por</p>
            <p className="text-3xl font-black">{formatCurrency(ALLY_PRICE_ANNUAL)}</p>
          </div>
          <p className="mt-4 text-sm font-bold text-emerald-200">{cda ? `Aliado autorizado: ${cda.nombreCDA}` : refCode ? `Aliado: ${refCode}` : "Puedes continuar con registro sin aliado."}</p>
        </div>
      </section>

      {result ? (
        <Card className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight text-slate-950">Tu servicio {APP_NAME} está casi listo ✅</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Finaliza el pago en caja y comienza a recibir alertas automáticas.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Código de activación</p>
            <p className="mt-2 break-all font-mono text-3xl font-black">{result.codigoActivacion}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Acércate a caja para finalizar la activación en {result.nombreCDA}.</p>
          </div>

          {status ? <StatusMessage status={status} /> : null}

          <button type="button" onClick={copyCode} className="primary-button mt-4 w-full">
            <Clipboard size={18} />
            Copiar código
          </button>
        </Card>
      ) : (
        <>
          <section className="mb-5 grid gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              const isOpen = openBenefit === benefit.label;
              return (
                <article key={benefit.label} className="overflow-hidden rounded-[1.35rem] bg-white text-slate-950 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                  <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50" aria-expanded={isOpen} onClick={() => setOpenBenefit(isOpen ? "" : benefit.label)}>
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-950 ring-1 ring-slate-200">
                      <Icon size={22} strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.95rem] font-black leading-snug">{benefit.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{benefit.detail}</p>
                    </div>
                    <ChevronDown className={`size-5 shrink-0 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 px-4 pb-4 pl-[4.75rem] pr-5">
                      <p className="pt-3 text-sm font-semibold leading-6 text-slate-700">{benefit.value}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Registra tus datos</h2>
                <p className="text-sm leading-6 text-slate-500">El QR no procesa pagos. Te lleva a caja para finalizar.</p>
              </div>
            </div>

            <form className="space-y-3" onSubmit={submitForm}>
              <Field label="Nombre">
                <input className="input" value={form.nombreCliente} onChange={(event) => updateField("nombreCliente", event.target.value)} placeholder="Nombre completo" autoComplete="name" />
              </Field>
              <Field label="WhatsApp">
                <input className="input" value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} placeholder="300 000 0000" inputMode="tel" autoComplete="tel" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Placa">
                  <input className="input uppercase" value={form.placa} onChange={(event) => updateField("placa", event.target.value)} placeholder="ABC123" maxLength={7} />
                </Field>
                <Field label="Ciudad">
                  <select className="input" value={form.ciudad} onChange={(event) => updateField("ciudad", event.target.value)}>
                    {cityOptions.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {status ? <StatusMessage status={status} /> : null}

              <button type="submit" className="primary-button w-full">
                Generar código de activación
              </button>
            </form>
          </Card>
        </>
      )}
    </main>
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

function StatusMessage({ status }) {
  return <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${status.tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status.message}</p>;
}
