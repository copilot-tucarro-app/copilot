import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

hideBootSplash();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => undefined);
  });
}

function hideBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;

  const startedAt = window.__COPILOT_BOOT_SPLASH_STARTED_AT || performance.now();
  const elapsed = performance.now() - startedAt;
  const delay = Math.max(0, 1500 - elapsed);

  window.setTimeout(() => {
    splash.classList.add("boot-splash-hide");
    window.setTimeout(() => splash.remove(), 220);
  }, delay);
}
