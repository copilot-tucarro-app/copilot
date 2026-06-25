import { ArrowLeft, CheckCircle2, FileText, KeyRound, Lock, Mail, Phone, UserRound, X } from "lucide-react";
import { useState } from "react";
import { APP_LOGIN_LOGO_URL, APP_NAME } from "../config/appConfig";
import { cityOptions } from "../data/mockData";
import { validateActivatedDriverLogin, validateCdaAllyLogin } from "../modules/allies/storage";
import { registerUser, requestPasswordReset, resetPasswordWithCode, validateLogin } from "../services/api";
import { normalizeIdentifier } from "../utils/auth";
import { createId } from "../utils/idUtils";
import { setStoredUser } from "../utils/storage";

const TRIAL_DAYS = 15;
const PASSWORD_MIN_LENGTH = 6;
const DATA_TREATMENT_VERSION = "CO-LEY-1581-2012-v1";
const LOGIN_BACKGROUND_VIDEO_URL = `${import.meta.env.BASE_URL}login-premium-drive.mp4`;
const LOGIN_LABEL_CLASS = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wide text-slate-500";
const LOGIN_INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-black focus:bg-slate-50 focus:ring-4 focus:ring-black/10";
const LOGIN_SELECT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-black focus:bg-slate-50 focus:ring-4 focus:ring-black/10 [&>option]:bg-white [&>option]:text-slate-950";
const LOGIN_ICON_CLASS = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";
const LOGIN_PRIMARY_BUTTON_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-black bg-black px-5 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5 hover:bg-neutral-900 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-white/55";
const LOGIN_SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white bg-white px-5 py-3 text-sm font-black text-black shadow-[0_16px_36px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-white/92 active:translate-y-0";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  city: "Medellin",
  password: "",
  resetCode: "",
  newPassword: "",
  confirmPassword: "",
  dataTreatmentAccepted: false,
};

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("choice");
  const [resetStep, setResetStep] = useState("email");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDataTreatment, setShowDataTreatment] = useState(false);

  const isChoice = mode === "choice";
  const isRegister = mode === "register";
  const isRecovery = mode === "recovery";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    if (nextMode !== "recovery") {
      setResetStep("email");
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isRecovery) {
      await submitPasswordRecovery();
      return;
    }

    if (!form.email || !form.password || (isRegister && (!form.name || !form.phone))) {
      setError("Completa los campos principales para continuar.");
      return;
    }

    const identifier = normalizeIdentifier(form.email);

    if (!isRegister) {
      const allyLogin = validateCdaAllyLogin(identifier, form.password);
      if (allyLogin.ok) {
        setStoredUser(allyLogin.user);
        onLogin(allyLogin.user);
        return;
      }

      if (allyLogin.blocked) {
        setError(allyLogin.message || "Este aliado no se encuentra disponible actualmente.");
        return;
      }

      const activatedDriverLogin = validateActivatedDriverLogin(identifier, form.password);
      if (activatedDriverLogin.ok) {
        setStoredUser(activatedDriverLogin.user);
        onLogin(activatedDriverLogin.user);
        return;
      }

      if (activatedDriverLogin.blocked) {
        setError(activatedDriverLogin.message || "La membresia del conductor no se encuentra activa.");
        return;
      }
    }

    if (isRegister && !isLikelyEmail(identifier)) {
      setError("Ingresa un correo electrónico válido para crear tu cuenta.");
      return;
    }

    if (isRegister && form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }

    if (isRegister && !form.dataTreatmentAccepted) {
      setError("Debes aceptar el tratamiento de datos personales para registrarte.");
      return;
    }

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
        setError("Esta cuenta está reservada.");
        return;
      }

      const trialStartedAt = new Date();
      const trialEndsAt = addDays(trialStartedAt, TRIAL_DAYS);
      const dataTreatmentAcceptedAt = new Date().toISOString();
      const user = {
        id: createId("user"),
        name: form.name.trim(),
        phone: form.phone,
        email: identifier,
        city: form.city,
        password: form.password,
        role: "driver",
        canUseSalesAgent: false,
        subscriptionStatus: "trial",
        trialStartedAt: trialStartedAt.toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
        dataTreatmentAcceptedAt,
        dataTreatmentVersion: DATA_TREATMENT_VERSION,
        createdAt: dataTreatmentAcceptedAt,
        source: "self-register",
      };

      await registerUser(user);
      const { password, ...sessionUser } = user;
      const validatedSessionUser = {
        ...sessionUser,
        accessActive: true,
        accessType: "trial",
        trialDays: TRIAL_DAYS,
        sheetValidated: true,
      };
      setStoredUser(validatedSessionUser);
      onLogin(validatedSessionUser);
    } catch (error) {
      setError(error.message || "No se pudo validar la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPasswordRecovery() {
    const identifier = normalizeIdentifier(form.email);

    if (!identifier || !isLikelyEmail(identifier)) {
      setError("Ingresa el correo electrónico de tu cuenta.");
      return;
    }

    if (resetStep === "email") {
      setLoading(true);

      try {
        const result = await requestPasswordReset(identifier);
        if (!result?.ok) {
          setError(result?.message || "No pudimos enviar el código de verificación.");
          return;
        }

        setResetStep("code");
        setSuccess("Te enviamos un código al correo registrado. Revisa tu bandeja de entrada.");
      } catch (error) {
        setError(error.message || "No pudimos enviar el código de verificación.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!form.resetCode || form.resetCode.trim().length < 6) {
      setError("Ingresa el código de 6 dígitos que recibiste por correo.");
      return;
    }

    if (form.newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPasswordWithCode(identifier, form.resetCode, form.newPassword);
      if (!result?.ok) {
        setError(result?.message || "El código no es válido o ya venció.");
        return;
      }

      setForm((current) => ({
        ...current,
        password: "",
        resetCode: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setMode("login");
      setResetStep("email");
      setSuccess("Contraseña actualizada. Ya puedes entrar con tu nueva contraseña.");
    } catch (error) {
      setError(error.message || "No pudimos actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-slate-950 px-4 py-6 text-slate-900 sm:px-6">
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src={LOGIN_BACKGROUND_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(15,23,42,0.32)_42%,rgba(15,23,42,0.72)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-between gap-8 pb-8 pt-3 sm:min-h-[calc(100vh-4rem)] sm:pb-10 sm:pt-4">
        <div className="login-transition-logo">
        <div className="mb-5 flex justify-center">
          <img
            src={APP_LOGIN_LOGO_URL}
            alt={APP_NAME}
            className="h-auto w-36 object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] sm:w-44"
          />
        </div>

        <section className="login-transition-copy text-center text-white">
          <h1 className="text-xl font-black leading-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] sm:text-2xl">Tu vehículo siempre al día.</h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/78 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)] sm:text-sm">
            Todo lo que necesitas para conducir tranquilo: alertas, mantenimiento, navegación y control total de tu vehículo.
          </p>
        </section>
        </div>

        {isChoice ? (
          <div className="login-transition-actions space-y-3">
            <button type="button" onClick={() => changeMode("login")} className={LOGIN_PRIMARY_BUTTON_CLASS}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => changeMode("register")} className={LOGIN_SECONDARY_BUTTON_CLASS}>
              Registrarse
            </button>
          </div>
        ) : (
          <section className={`login-transition-actions rounded-[1.75rem] border border-white bg-white p-5 text-slate-950 shadow-[0_26px_70px_rgba(2,6,23,0.28)] ${!isRegister && !isRecovery ? "mb-8 sm:mb-10" : ""}`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {isRecovery ? "Recuperar acceso" : isRegister ? "Crear cuenta" : "Acceso privado"}
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight text-slate-950">{isRecovery ? "Restablece tu clave" : isRegister ? "Regístrate" : "Iniciar sesión"}</h2>
              </div>
              <button type="button" onClick={() => changeMode("choice")} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-slate-50">
                <ArrowLeft size={15} />
                Cambiar
              </button>
            </div>

        <form className="space-y-3" onSubmit={submitForm}>
          {isRegister ? (
            <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
              <p>Si tu suscripción aún no está activa, tu cuenta inicia con una prueba gratis de {TRIAL_DAYS} días.</p>
            </div>
          ) : null}

          {isRegister ? (
            <>
              <label className="block">
                <span className={LOGIN_LABEL_CLASS}>Nombre</span>
                <div className="relative">
                  <UserRound className={LOGIN_ICON_CLASS} size={18} />
                  <input className={`${LOGIN_INPUT_CLASS} pl-11`} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nombre completo" autoComplete="name" />
                </div>
              </label>
              <label className="block">
                <span className={LOGIN_LABEL_CLASS}>Celular</span>
                <div className="relative">
                  <Phone className={LOGIN_ICON_CLASS} size={18} />
                  <input className={`${LOGIN_INPUT_CLASS} pl-11`} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="300 000 0000" inputMode="tel" autoComplete="tel" />
                </div>
              </label>
            </>
          ) : null}

          <label className="block">
            <span className={LOGIN_LABEL_CLASS}>{isRegister ? "Correo" : "Correo, WhatsApp o placa"}</span>
            <div className="relative">
              <Mail className={LOGIN_ICON_CLASS} size={18} />
              <input className={`${LOGIN_INPUT_CLASS} pl-11`} type={isRegister ? "email" : "text"} value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder={isRegister ? "correo@ejemplo.com" : "correo@ejemplo.com, 3001234567 o ABC123"} autoComplete="username" />
            </div>
          </label>

          {isRegister ? (
            <label className="block">
              <span className={LOGIN_LABEL_CLASS}>Ciudad</span>
              <select className={LOGIN_SELECT_CLASS} value={form.city} onChange={(event) => updateField("city", event.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
          ) : null}

          {!isRecovery ? (
            <label className="block">
              <span className={LOGIN_LABEL_CLASS}>Contraseña</span>
              <div className="relative">
                <Lock className={LOGIN_ICON_CLASS} size={18} />
                <input
                  className={`${LOGIN_INPUT_CLASS} pl-11`}
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>
            </label>
          ) : null}

          {!isRegister && !isRecovery ? (
            <div className="flex justify-end">
              <button type="button" onClick={() => changeMode("recovery")} className="text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-black">
                ¿Olvidaste la contraseña?
              </button>
            </div>
          ) : null}

          {isRecovery && resetStep === "code" ? (
            <>
              <label className="block">
                <span className={LOGIN_LABEL_CLASS}>Código</span>
                <div className="relative">
                  <KeyRound className={LOGIN_ICON_CLASS} size={18} />
                  <input className={`${LOGIN_INPUT_CLASS} pl-11`} value={form.resetCode} onChange={(event) => updateField("resetCode", event.target.value)} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" />
                </div>
              </label>
              <label className="block">
                <span className={LOGIN_LABEL_CLASS}>Nueva contraseña</span>
                <div className="relative">
                  <Lock className={LOGIN_ICON_CLASS} size={18} />
                  <input className={`${LOGIN_INPUT_CLASS} pl-11`} type="password" value={form.newPassword} onChange={(event) => updateField("newPassword", event.target.value)} placeholder="Nueva contraseña" autoComplete="new-password" />
                </div>
              </label>
              <label className="block">
                <span className={LOGIN_LABEL_CLASS}>Confirmar contraseña</span>
                <div className="relative">
                  <Lock className={LOGIN_ICON_CLASS} size={18} />
                  <input className={`${LOGIN_INPUT_CLASS} pl-11`} type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="Repite la contraseña" autoComplete="new-password" />
                </div>
              </label>
            </>
          ) : null}

          {isRegister ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="data-treatment"
                  type="checkbox"
                  checked={form.dataTreatmentAccepted}
                  onChange={(event) => updateField("dataTreatmentAccepted", event.target.checked)}
                  className="mt-1 size-5 rounded border-slate-300 bg-white text-black focus:ring-black/20"
                />
                <div className="text-sm leading-5 text-slate-600">
                  <label htmlFor="data-treatment" className="font-semibold text-slate-950">
                    Acepto el tratamiento de mis datos personales.
                  </label>{" "}
                  <button type="button" onClick={() => setShowDataTreatment(true)} className="font-bold text-slate-950 underline decoration-slate-300 underline-offset-4">
                    Ver tratamiento de datos
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}

          <button type="submit" className={LOGIN_PRIMARY_BUTTON_CLASS} disabled={loading}>
            {getSubmitLabel({ isRegister, isRecovery, resetStep, loading })}
          </button>
        </form>
          </section>
        )}
      </div>

      {showDataTreatment ? <DataTreatmentModal onClose={() => setShowDataTreatment(false)} /> : null}
    </main>
  );
}

function getSubmitLabel({ isRegister, isRecovery, resetStep, loading }) {
  if (loading) return "Procesando...";
  if (isRecovery) return resetStep === "email" ? "Enviar código" : "Actualizar contraseña";
  return isRegister ? "Registrarme" : "Entrar";
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function DataTreatmentModal({ onClose }) {
  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="data-treatment-title">
      <div className="app-modal-panel p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <FileText size={20} />
            </div>
            <h2 id="data-treatment-title" className="text-2xl font-black leading-tight text-slate-950">
              Tratamiento de datos personales
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Resumen de autorización conforme al régimen colombiano de protección de datos.</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900" aria-label="Cerrar">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <section>
            <h3 className="font-black text-slate-900">Marco legal</h3>
            <p>
              La Ley 1581 de 2012 reconoce el derecho de las personas a conocer, actualizar y rectificar la información que se recoja sobre ellas. El Decreto 1377 de 2013 reglamenta la autorización del titular, el aviso de privacidad y las reglas para responsables y encargados del tratamiento.
            </p>
          </section>

          <section>
            <h3 className="font-black text-slate-900">Datos y finalidad</h3>
            <p>
              {APP_NAME} puede tratar nombre, correo, celular, ciudad, datos del vehículo y actividad básica de uso para crear la cuenta, autenticar el acceso, gestionar recordatorios, enviar comunicaciones operativas, prestar soporte y mejorar la seguridad de la app.
            </p>
          </section>

          <section>
            <h3 className="font-black text-slate-900">Derechos del titular</h3>
            <p>
              Puedes solicitar acceso, actualización, corrección, prueba de la autorización, información sobre el uso de tus datos, revocatoria de la autorización o supresión cuando sea procedente, respetando las obligaciones legales o contractuales aplicables.
            </p>
          </section>

          <section>
            <h3 className="font-black text-slate-900">Autorización</h3>
            <p>
              Al marcar la casilla aceptas de forma previa, expresa e informada que {APP_NAME} trate tus datos para las finalidades indicadas. Esta autorización queda registrada con fecha, versión del texto y correo de la cuenta.
            </p>
          </section>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">
          Fuentes normativas:{" "}
          <a className="font-bold text-slate-950 underline decoration-slate-300 underline-offset-4" href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981" target="_blank" rel="noreferrer">
            Ley 1581 de 2012
          </a>{" "}
          y{" "}
          <a className="font-bold text-slate-950 underline decoration-slate-300 underline-offset-4" href="https://www.suin-juriscol.gov.co/viewDocument.asp?id=1276081" target="_blank" rel="noreferrer">
            Decreto 1377 de 2013
          </a>
          .
        </div>

        <button type="button" onClick={onClose} className="primary-button mt-5 w-full">
          Entendido
        </button>
      </div>
    </div>
  );
}
