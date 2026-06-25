export function isAppleMobileDevice() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const isModernIpad = platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /iPhone|iPad|iPod/.test(userAgent) || isModernIpad;
}
