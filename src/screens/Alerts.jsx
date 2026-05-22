import { AlertTriangle, BellRing, CalendarCheck2, Gauge, ShieldCheck } from "lucide-react";
import Card from "../components/Card";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import UpToDateMedal from "../components/UpToDateMedal";
import { APP_NAME } from "../config/appConfig";
import { buildDocumentAlerts, buildMaintenanceAlerts, getOverallTone, isVehicleUpToDate } from "../utils/alertUtils";
import { formatShortDate } from "../utils/dateUtils";
import { getVehicle } from "../utils/storage";

const toneMeta = {
  success: { title: "Todo al día", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { title: "Hay pendientes cercanos", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  danger: { title: "Atención urgente", icon: BellRing, color: "text-red-600", bg: "bg-red-50" },
  neutral: { title: "Completa tus datos", icon: CalendarCheck2, color: "text-slate-600", bg: "bg-slate-100" },
};

export default function Alerts({ user, onLogout }) {
  const vehicle = getVehicle(user);
  const documentAlerts = buildDocumentAlerts(vehicle);
  const maintenanceAlerts = buildMaintenanceAlerts(vehicle);
  const overallTone = getOverallTone([...documentAlerts, ...maintenanceAlerts]);
  const vehicleIsUpToDate = isVehicleUpToDate(vehicle);
  const meta = toneMeta[overallTone] || toneMeta.neutral;
  const Icon = meta.icon;

  return (
    <main className="screen-shell">
      <Header
        user={user}
        onLogout={onLogout}
        title="Alertas"
        subtitle="Documentos, mantenimientos y movilidad para hoy."
        action={vehicleIsUpToDate ? <UpToDateMedal vehicleLabel={vehicle?.plate || "Vehiculo principal"} /> : null}
      />

      {!vehicle ? (
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-3xl bg-blue-50 text-blue-600">
            <CalendarCheck2 size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-950">Registra tu vehículo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Cuando guardes placa, ciudad, vencimientos y kilometraje, {APP_NAME} activará tus alertas.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-5 p-5">
            <div className="flex items-center gap-4">
              <div className={`grid size-14 place-items-center rounded-3xl ${meta.bg} ${meta.color}`}>
                <Icon size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">{vehicle.plate || "Vehículo principal"}</p>
                <h2 className="text-2xl font-black text-slate-950">{meta.title}</h2>
              </div>
            </div>
          </Card>

          <Section title="Documentos">
            {documentAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                icon={CalendarCheck2}
                title={alert.title}
                subtitle={`${formatShortDate(alert.value)} · aviso ${alert.noticeDays} días antes`}
                tone={alert.tone}
                label={alert.label}
              />
            ))}
          </Section>

          <Section title="Mantenimiento">
            {maintenanceAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                icon={Gauge}
                title={alert.title}
                subtitle={alert.value ? `${Math.max(alert.remainingKm, 0).toLocaleString("es-CO")} km restantes` : "Sin kilometraje objetivo"}
                tone={alert.tone}
                label={alert.label}
              />
            ))}
          </Section>
        </>
      )}
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function AlertRow({ icon: Icon, title, subtitle, tone, label }) {
  const color = {
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
    neutral: "bg-slate-100 text-slate-500",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${color}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-slate-950">{title}</h3>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">{subtitle}</p>
        </div>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
    </Card>
  );
}
