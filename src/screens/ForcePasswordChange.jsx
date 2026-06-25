import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Card from "../components/Card";
import { APP_LOGIN_LOGO_URL, APP_NAME } from "../config/appConfig";
import { updateActivatedDriverPassword } from "../modules/allies/storage";
import { updateUserPassword } from "../services/api";

const PASSWORD_MIN_LENGTH = 6;

export default function ForcePasswordChange({ user, onPasswordChanged, onLogout }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    const currentPassword = form.currentPassword.trim();
    const newPassword = form.newPassword.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Completa la clave temporal, la nueva contrasena y la confirmacion.");
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`La nueva contrasena debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }

    if (newPassword === currentPassword) {
      setError("La nueva contrasena debe ser diferente a la clave temporal.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmacion no coincide con la nueva contrasena.");
      return;
    }

    setLoading(true);

    try {
      const localResult = updateActivatedDriverPassword(user.id || user.email, newPassword);
      if (localResult.found && !localResult.ok) {
        setError(localResult.message || "No pudimos actualizar la contrasena.");
        return;
      }

      await updateUserPassword({
        userId: user.id,
        email: user.email,
        newPassword,
        source: user.source,
      });

      onPasswordChanged({
        ...user,
        mustChangePassword: false,
        passwordChangeRequired: false,
        passwordUpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setError(error.message || "No pudimos actualizar la contrasena. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[100vw] flex-col justify-center px-4 py-8 sm:max-w-3xl sm:px-6 sm:py-10">
      <div className="mb-5 flex justify-center">
        <img
          src={APP_LOGIN_LOGO_URL}
          alt={APP_NAME}
          className="size-44 rounded-[2rem] bg-slate-950 object-contain shadow-[0_20px_45px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/10 sm:size-48"
        />
      </div>

      <section className="mb-5 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-soft">
        <div className="relative px-6 py-7 sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.55),transparent_26rem)]" />
          <div className="relative">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-blue-200">{APP_NAME}</p>
            <h1 className="text-3xl font-black leading-tight">Crea tu contrasena personal</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Entraste con una clave temporal entregada por {user.nombreCDA || "un CDA aliado"}. Para proteger tu cuenta, debes cambiarla antes de continuar.
            </p>
          </div>
        </div>
      </section>

      <Card className="p-5">
        <div className="mb-5 flex items-start gap-3 rounded-3xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-700" />
          <p className="leading-6">
            La clave temporal solo sirve para el primer ingreso. Despues de actualizarla podras usar {APP_NAME} normalmente con tu nueva contrasena.
          </p>
        </div>

        <form className="space-y-3" onSubmit={submitForm}>
          <label className="block">
            <span className="label mb-1 block">Clave temporal actual</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input pl-11"
                type="password"
                value={form.currentPassword}
                onChange={(event) => updateField("currentPassword", event.target.value)}
                placeholder="Clave que recibiste del CDA"
                autoComplete="current-password"
              />
            </div>
          </label>

          <label className="block">
            <span className="label mb-1 block">Nueva contrasena</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input pl-11"
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField("newPassword", event.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
          </label>

          <label className="block">
            <span className="label mb-1 block">Confirmar nueva contrasena</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input pl-11"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repite la nueva contrasena"
                autoComplete="new-password"
              />
            </div>
          </label>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

          <button type="submit" className="primary-button w-full" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar contrasena y continuar"}
          </button>
        </form>

        <button type="button" onClick={onLogout} className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          Cerrar sesion
        </button>
      </Card>
    </main>
  );
}
