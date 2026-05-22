import { ArrowLeft, CheckCircle2, Send, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import Card from "../components/Card";
import { DEFAULT_AGENT_PASSWORD } from "../config/appConfig";
import { cityOptions } from "../data/mockData";
import { registerBuyerFromAgent } from "../services/api";
import { createId } from "../utils/idUtils";
import { saveAgentBuyer } from "../utils/storage";
import { buildAgentWelcomeMessage, buildWhatsAppUrl, cleanColombianPhone } from "../utils/whatsappUtils";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  city: "Medellin",
  plate: "",
};

export default function SalesAgent({ onBack }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitBuyer(event) {
    event.preventDefault();
    setStatus(null);

    if (!form.name || !form.email || !form.phone || !form.city) {
      setStatus({ tone: "danger", message: "Completa nombre, correo, teléfono y ciudad." });
      return;
    }

    const cleanPhone = cleanColombianPhone(form.phone);
    if (cleanPhone.length < 10) {
      setStatus({ tone: "danger", message: "Revisa el número de teléfono del comprador." });
      return;
    }

    setLoading(true);

    const buyer = {
      id: createId("buyer"),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: cleanPhone,
      city: form.city,
      plate: form.plate.trim().toUpperCase(),
      password: DEFAULT_AGENT_PASSWORD,
      source: "sales-agent",
      createdAt: new Date().toISOString(),
    };

    saveAgentBuyer(buyer);
    await registerBuyerFromAgent(buyer);

    const message = buildAgentWelcomeMessage(buyer);
    const whatsappUrl = buildWhatsAppUrl(buyer.phone, message);
    setStatus({ tone: "success", message: `Comprador registrado. Se abrirá WhatsApp para enviar bienvenida a ${buyer.name}.` });
    setForm(initialForm);
    setLoading(false);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-5 sm:px-6">
      <button type="button" onClick={onBack} className="secondary-button mb-4">
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="mb-5 rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="grid size-14 place-items-center rounded-3xl bg-blue-600 shadow-lift">
            <UserPlus size={28} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/20">
            <ShieldCheck size={14} />
            Venta presencial
          </div>
        </div>
        <h1 className="text-3xl font-black leading-tight">Agente de ventas</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Registra compradores en segundos desde una bomba, lavadero o lubricentro y envía sus datos por WhatsApp.
        </p>
      </section>

      <Card className="p-5">
        <form className="space-y-3" onSubmit={submitBuyer}>
          <label className="block">
            <span className="label mb-1 block">Nombre del comprador</span>
            <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ej. Laura Gómez" />
          </label>
          <label className="block">
            <span className="label mb-1 block">Correo electrónico</span>
            <input className="input" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="correo@ejemplo.com" />
          </label>
          <label className="block">
            <span className="label mb-1 block">Número de teléfono</span>
            <input className="input" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="300 000 0000" inputMode="tel" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label mb-1 block">Ciudad</span>
              <select className="input" value={form.city} onChange={(event) => updateField("city", event.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label mb-1 block">Placa opcional</span>
              <input className="input uppercase" value={form.plate} onChange={(event) => updateField("plate", event.target.value)} placeholder="ABC123" maxLength={7} />
            </label>
          </div>

          <div className="rounded-3xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
            <p className="font-black">Contraseña por defecto</p>
            <p className="mt-1 font-mono text-lg font-black">{DEFAULT_AGENT_PASSWORD}</p>
          </div>

          {status ? (
            <div
              className={`flex items-start gap-3 rounded-3xl px-4 py-3 text-sm font-semibold ${
                status.tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              <span>{status.message}</span>
            </div>
          ) : null}

          <button type="submit" className="primary-button w-full" disabled={loading}>
            <Send size={18} />
            {loading ? "Registrando..." : "Registrar comprador"}
          </button>
        </form>
      </Card>
    </main>
  );
}
