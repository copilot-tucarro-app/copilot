import { useEffect } from "react";
import { getNotificationPreferences, getMsUntilNextReminderTime, runVehicleNotificationCheck } from "../utils/notificationUtils";
import { getVehicles } from "../utils/storage";

export default function NotificationManager({ user }) {
  useEffect(() => {
    if (!user?.email || typeof window === "undefined") return undefined;

    let cancelled = false;
    let timeoutId = 0;

    async function checkNotifications(force = false) {
      if (cancelled) return;

      await runVehicleNotificationCheck({
        user,
        vehicles: getVehicles(user),
        force,
      });
    }

    function scheduleNextCheck() {
      window.clearTimeout(timeoutId);
      if (cancelled) return;

      const preferences = getNotificationPreferences(user);
      if (!preferences.enabled) return;

      timeoutId = window.setTimeout(async () => {
        await checkNotifications(false);
        scheduleNextCheck();
      }, getMsUntilNextReminderTime(preferences.dailyReminderTime));
    }

    function handleVisibilityChange() {
      if (document.hidden) return;
      checkNotifications(false);
      scheduleNextCheck();
    }

    function handleVehicleUpdated() {
      checkNotifications(true);
      scheduleNextCheck();
    }

    function handlePreferencesUpdated() {
      checkNotifications(false);
      scheduleNextCheck();
    }

    checkNotifications(false);
    scheduleNextCheck();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("copilot:vehicle-updated", handleVehicleUpdated);
    window.addEventListener("copilot:vehicles-updated", handleVehicleUpdated);
    window.addEventListener("copilot:notification-preferences-updated", handlePreferencesUpdated);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("copilot:vehicle-updated", handleVehicleUpdated);
      window.removeEventListener("copilot:vehicles-updated", handleVehicleUpdated);
      window.removeEventListener("copilot:notification-preferences-updated", handlePreferencesUpdated);
    };
  }, [user]);

  return null;
}
