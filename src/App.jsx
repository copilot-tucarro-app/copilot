import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import Alerts from "./screens/Alerts";
import Calculator from "./screens/Calculator";
import Center from "./screens/Center";
import ForcePasswordChange from "./screens/ForcePasswordChange";
import Home from "./screens/Home";
import Login from "./screens/Login";
import NotificationManager from "./components/NotificationManager";
import PhotoFines from "./screens/PhotoFines";
import SalesAgent from "./screens/SalesAgent";
import TransitCode from "./screens/TransitCode";
import Vehicle from "./screens/Vehicle";
import InstallAppPrompt from "./components/InstallAppPrompt";
import SessionSplash from "./components/SessionSplash";
import VersionGate from "./components/VersionGate";
import { hasAppAccess, isAllyProgramEnabled, isCdaAllyUser, isSalesAgentEnabled } from "./utils/auth";
import { clearStoredUser, getStoredUser, setStoredUser } from "./utils/storage";

const AllyProgram = lazy(() => import("./modules/allies/AllyProgram"));
const PublicAllyPreRegistration = lazy(() => import("./modules/allies/PublicAllyPreRegistration"));
const SESSION_SPLASH_DURATION_MS = 1500;

const screens = {
  home: Home,
  vehicle: Vehicle,
  travel: lazy(() => import("./screens/Travel")),
  alerts: Alerts,
  center: Center,
  calculator: Calculator,
  code: TransitCode,
  photoFines: PhotoFines,
  allies: AllyProgram,
};

export default function App() {
  const vehicleSaveHandlerRef = useRef(null);
  const sessionSplashTimerRef = useRef(null);
  const [user, setUser] = useState(() => {
    const storedUser = getStoredUser();
    if (storedUser && !hasAppAccess(storedUser)) {
      clearStoredUser();
      return null;
    }
    return storedUser;
  });
  const [activeScreen, setActiveScreen] = useState("home");
  const [vehicleHasUnsavedChanges, setVehicleHasUnsavedChanges] = useState(false);
  const [pendingVehicleNavigation, setPendingVehicleNavigation] = useState(null);
  const [isSavingVehicleNavigation, setIsSavingVehicleNavigation] = useState(false);
  const [sessionSplashVisible, setSessionSplashVisible] = useState(false);
  const [referralCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("ref") || "";
  });
  const canUseSalesAgent = isSalesAgentEnabled(user);
  const canUseAllies = isAllyProgramEnabled(user);
  const isCdaUser = isCdaAllyUser(user);
  const requiresPasswordChange = Boolean(user?.mustChangePassword || user?.passwordChangeRequired);

  useEffect(() => {
    return () => {
      if (sessionSplashTimerRef.current) {
        window.clearTimeout(sessionSplashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user && !hasAppAccess(user)) {
      clearStoredUser();
      setUser(null);
      setActiveScreen("home");
    }
  }, [user]);

  useEffect(() => {
    if (activeScreen === "agent" && !canUseSalesAgent) {
      setActiveScreen("home");
    }
    if (activeScreen === "allies" && !canUseAllies) {
      setActiveScreen("home");
    }
    if (isCdaUser && activeScreen !== "center" && activeScreen !== "allies") {
      setActiveScreen("center");
    }
  }, [activeScreen, canUseAllies, canUseSalesAgent, isCdaUser]);

  useEffect(() => {
    if (!user || referralCode || requiresPasswordChange || typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [activeScreen, referralCode, requiresPasswordChange, user]);

  const handleVehicleUnsavedChange = useCallback((hasChanges) => {
    setVehicleHasUnsavedChanges(Boolean(hasChanges));
  }, []);

  const registerVehicleSaveHandler = useCallback((handler) => {
    vehicleSaveHandlerRef.current = typeof handler === "function" ? handler : null;
  }, []);

  const runSessionTransition = useCallback((commitSessionChange) => {
    if (sessionSplashTimerRef.current) {
      window.clearTimeout(sessionSplashTimerRef.current);
    }

    setSessionSplashVisible(true);
    sessionSplashTimerRef.current = window.setTimeout(() => {
      sessionSplashTimerRef.current = null;
      commitSessionChange();
      window.requestAnimationFrame(() => setSessionSplashVisible(false));
    }, SESSION_SPLASH_DURATION_MS);
  }, []);

  const handleLogin = useCallback(
    (nextUser) => {
      runSessionTransition(() => setUser(nextUser));
    },
    [runSessionTransition],
  );

  function resolveScreen(nextScreen) {
    if (isCdaUser) {
      return nextScreen === "allies" ? "allies" : "center";
    }

    if (nextScreen === "allies" && !canUseAllies) {
      return "home";
    }

    return nextScreen;
  }

  function changeScreen(nextScreen) {
    const resolvedScreen = resolveScreen(nextScreen);

    if (activeScreen === "vehicle" && vehicleHasUnsavedChanges && resolvedScreen !== "vehicle") {
      setPendingVehicleNavigation(resolvedScreen);
      return;
    }

    setActiveScreen(resolvedScreen);
  }

  function discardVehicleChangesAndNavigate() {
    const nextScreen = pendingVehicleNavigation;
    setPendingVehicleNavigation(null);
    setVehicleHasUnsavedChanges(false);
    if (nextScreen) {
      setActiveScreen(nextScreen);
    }
  }

  async function saveVehicleChangesAndNavigate() {
    const nextScreen = pendingVehicleNavigation;
    const saveVehicle = vehicleSaveHandlerRef.current;

    setIsSavingVehicleNavigation(true);
    try {
      if (saveVehicle) {
        await saveVehicle();
      }
      setPendingVehicleNavigation(null);
      setVehicleHasUnsavedChanges(false);
      if (nextScreen) {
        setActiveScreen(nextScreen);
      }
    } finally {
      setIsSavingVehicleNavigation(false);
    }
  }

  function openAgent() {
    if (canUseSalesAgent) {
      setActiveScreen("agent");
    }
  }

  function closeAgent() {
    setActiveScreen(user ? "home" : "login");
  }

  function logout() {
    runSessionTransition(() => {
      clearStoredUser();
      setUser(null);
      setActiveScreen("home");
      setPendingVehicleNavigation(null);
      setVehicleHasUnsavedChanges(false);
      setIsSavingVehicleNavigation(false);
    });
  }

  if (referralCode) {
    return (
      <>
        <Suspense fallback={<PublicLoading />}>
          <PublicAllyPreRegistration refCode={referralCode} />
        </Suspense>
        <SessionSplash visible={sessionSplashVisible} />
        <VersionGate />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <InstallAppPrompt />
        <SessionSplash visible={sessionSplashVisible} />
        <VersionGate />
      </>
    );
  }

  if (requiresPasswordChange) {
    return (
      <>
        <ForcePasswordChange user={user} onPasswordChanged={handlePasswordChanged} onLogout={logout} />
        <InstallAppPrompt />
        <SessionSplash visible={sessionSplashVisible} />
        <VersionGate />
      </>
    );
  }

  if (activeScreen === "agent" && canUseSalesAgent) {
    return (
      <>
        <NotificationManager user={user} />
        <SalesAgent onBack={closeAgent} />
        <InstallAppPrompt />
        <SessionSplash visible={sessionSplashVisible} />
        <VersionGate />
      </>
    );
  }

  const safeActiveScreen = isCdaUser ? (activeScreen === "allies" ? "allies" : "center") : activeScreen === "allies" && !canUseAllies ? "home" : activeScreen;
  const ActiveScreen = screens[safeActiveScreen] || Home;

  return (
    <>
      <NotificationManager user={user} />
      <Suspense fallback={<ScreenLoading user={user} onLogout={logout} />}>
        <ActiveScreen
          user={user}
          onLogout={logout}
          onNavigate={changeScreen}
          onOpenAgent={openAgent}
          canUseSalesAgent={canUseSalesAgent}
          canUseAllies={canUseAllies}
          alliesOnly={isCdaUser}
          onUnsavedChange={handleVehicleUnsavedChange}
          onRegisterSave={registerVehicleSaveHandler}
        />
      </Suspense>
      <InstallAppPrompt withBottomNav />
      <BottomNav activeScreen={safeActiveScreen} onChange={changeScreen} alliesOnly={isCdaUser} />
      {pendingVehicleNavigation ? (
        <UnsavedVehicleChangesModal
          isSaving={isSavingVehicleNavigation}
          onDiscard={discardVehicleChangesAndNavigate}
          onSave={saveVehicleChangesAndNavigate}
        />
      ) : null}
      <SessionSplash visible={sessionSplashVisible} />
      <VersionGate withBottomNav />
    </>
  );

  function handlePasswordChanged(updatedUser) {
    setStoredUser(updatedUser);
    runSessionTransition(() => setUser(updatedUser));
  }
}

function UnsavedVehicleChangesModal({ isSaving, onDiscard, onSave }) {
  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="unsaved-vehicle-title">
      <div className="app-modal-panel app-modal-panel-sm p-5">
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-100">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Cambios sin guardar</p>
          <h2 id="unsaved-vehicle-title" className="mt-1 text-xl font-black leading-tight">
            No guardaste los cambios del vehículo
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-800/85">
            Si sales ahora, los cambios que hiciste en esta pantalla se perderán. Puedes guardarlos antes de continuar.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="secondary-button min-h-12" onClick={onDiscard} disabled={isSaving}>
            No guardar
          </button>
          <button type="button" className="primary-button min-h-12" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicLoading() {
  return (
    <main className="screen-shell">
      <div className="rounded-[1.75rem] bg-white/95 p-5 text-sm font-semibold text-slate-500 shadow-soft ring-1 ring-slate-100">Preparando pre-registro...</div>
    </main>
  );
}

function ScreenLoading({ user, onLogout }) {
  return (
    <main className="screen-shell">
      <Header user={user} onLogout={onLogout} title="Cargando" subtitle="Preparando el modulo." />
      <div className="rounded-[1.75rem] bg-white/95 p-5 text-sm font-semibold text-slate-500 shadow-soft ring-1 ring-slate-100">Un momento...</div>
    </main>
  );
}
