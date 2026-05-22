import { useState } from "react";
import BottomNav from "./components/BottomNav";
import Alerts from "./screens/Alerts";
import Calculator from "./screens/Calculator";
import Home from "./screens/Home";
import Login from "./screens/Login";
import PhotoFines from "./screens/PhotoFines";
import SalesAgent from "./screens/SalesAgent";
import TransitCode from "./screens/TransitCode";
import Vehicle from "./screens/Vehicle";
import { isSalesAgentEnabled } from "./utils/auth";
import { clearStoredUser, getStoredUser } from "./utils/storage";

const screens = {
  home: Home,
  vehicle: Vehicle,
  alerts: Alerts,
  calculator: Calculator,
  code: TransitCode,
  photoFines: PhotoFines,
};

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [activeScreen, setActiveScreen] = useState("home");

  function openAgent() {
    if (isSalesAgentEnabled(user)) {
      setActiveScreen("agent");
    }
  }

  function closeAgent() {
    setActiveScreen(user ? "home" : "login");
  }

  function logout() {
    clearStoredUser();
    setUser(null);
    setActiveScreen("home");
  }

  if (activeScreen === "agent" && isSalesAgentEnabled(user)) {
    return <SalesAgent onBack={closeAgent} />;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const ActiveScreen = screens[activeScreen] || Home;

  return (
    <>
      <ActiveScreen user={user} onLogout={logout} onNavigate={setActiveScreen} onOpenAgent={openAgent} canUseSalesAgent={isSalesAgentEnabled(user)} />
      <BottomNav activeScreen={activeScreen} onChange={setActiveScreen} />
    </>
  );
}
