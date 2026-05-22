import { Lock, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import Card from "../components/Card";
import { APP_ICON_URL, APP_NAME } from "../config/appConfig";
import { cityOptions } from "../data/mockData";
import { registerUser, validateLogin } from "../services/api";
import { normalizeIdentifier } from "../utils/auth";
import { createId } from "../utils/idUtils";
import { setStoredUser } from "../utils/storage";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  city: "Medellin",
  password: "",
};

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password || (isRegister && (!form.name || !form.phone))) {
      setError("Completa los campos principales para continuar.");
      return;
    }

    const identifier = normalizeIdentifier(form.email);

    setLoading(true);

    try {
      if (!isRegister) {
        const result = await validateLogin(identifier, form.password);

        if (!result?.ok || !result.user) {
          setError(result?.message || "Usuario o contraseña incorrectos.");
          return;
        }

        const sessionUser = { ...result.user, sheetValidated: true };
        setStoredUser(sessionUser);
        onLogin(sessionUser);
        return;
      }

      if (identifier === "jrudas") {
        setError("Esta cuenta esta reservada.");
        return;
      }

      const user = {
          id: createId("user"),
          name: form.name,
          phone: form.phone,
          email: identifier,
          city: form.city,
          password: form.password,
          role: "driver",
          canUseSalesAgent: false,
          createdAt: new Date().toISOString(),
          source: "self-register",
        };

      await registerUser(user);
      const { password, ...sessionUser } = user;
      const validatedSessionUser = { ...sessionUser, sheetValidated: true };
      setStoredUser(validatedSessionUser);
      onLogin(validatedSessionUser);
    } catch (error) {
      setError(error.message || "No se pudo validar con Google Sheets.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-6 sm:px-6">
      <section className="mb-7 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
        <div className="relative px-6 py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.55),transparent_26rem)]" />
          <div className="relative">
            <div className="mb-6 inline-flex size-16 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 shadow-lift ring-1 ring-white/15">
              <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-blue-200">{APP_NAME}</p>
            <h1 className="text-4xl font-black leading-tight">Tu vehículo siempre al día.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Vencimientos, mantenimiento, gasolina, fotomultas y pico y placa en una app hecha para conductores en Colombia.
            </p>
          </div>
        </div>
      </section>

      <Card className="p-5">
        <div className="mb-5 flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${!isRegister ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${isRegister ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
          >
            Registro
          </button>
        </div>

        <form className="space-y-3" onSubmit={submitForm}>
          {isRegister ? (
            <>
              <label className="block">
                <span className="label mb-1 block">Nombre</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-11" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nombre completo" />
                </div>
              </label>
              <label className="block">
                <span className="label mb-1 block">Celular</span>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-11" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="300 000 0000" inputMode="tel" />
                </div>
              </label>
            </>
          ) : null}

          <label className="block">
            <span className="label mb-1 block">Correo</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="input pl-11" type="text" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="correo o usuario" autoComplete="username" />
            </div>
          </label>

          {isRegister ? (
            <label className="block">
              <span className="label mb-1 block">Ciudad</span>
              <select className="input" value={form.city} onChange={(event) => updateField("city", event.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="label mb-1 block">Contraseña</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="input pl-11" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
          </label>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

          <button type="submit" className="primary-button w-full" disabled={loading}>
            {loading ? "Validando..." : isRegister ? "Registrarme" : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex items-start gap-3 rounded-3xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          <ShieldCheck size={20} className="mt-0.5 shrink-0" />
          <p>
            El módulo Agente de ventas se habilita automáticamente al ingresar con la cuenta autorizada.
          </p>
        </div>
      </Card>
    </main>
  );
}
