import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
let firebaseApp;
let messagingSupportPromise;

export function isFirebaseMessagingConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId && vapidKey);
}

export async function getFirebaseMessagingCapability() {
  if (!isFirebaseMessagingConfigured()) {
    return { supported: false, configured: false, reason: "missing_config" };
  }

  if (!messagingSupportPromise) {
    messagingSupportPromise = isSupported().catch(() => false);
  }

  const supported = await messagingSupportPromise;
  return { supported, configured: true, reason: supported ? "" : "unsupported" };
}

export async function registerFirebaseMessagingToken({ serviceWorkerRegistration } = {}) {
  const capability = await getFirebaseMessagingCapability();

  if (!capability.configured || !capability.supported) {
    return { ok: false, reason: capability.reason };
  }

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return { ok: false, reason: "permission" };
  }

  const messaging = getFirebaseMessaging();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) {
    return { ok: false, reason: "empty_token" };
  }

  return { ok: true, token };
}

export async function listenForForegroundMessages(callback) {
  const capability = await getFirebaseMessagingCapability();
  if (!capability.configured || !capability.supported) return () => undefined;

  return onMessage(getFirebaseMessaging(), callback);
}

function getFirebaseMessaging() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getMessaging(firebaseApp);
}
