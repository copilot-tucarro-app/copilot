import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clipboard,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Image,
  KeyRound,
  Link as LinkIcon,
  MessageCircle,
  PauseCircle,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BackToCenterButton from "../../components/BackToCenterButton";
import Card from "../../components/Card";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { APP_NAME } from "../../config/appConfig";
import { cityOptions } from "../../data/mockData";
import { getAllyPreRegistrationsFromSheet, registerAllyPreRegistration, registerUser, saveVehicleToSheet, uploadAllyLogoToDrive } from "../../services/api";
import { createId } from "../../utils/idUtils";
import {
  buildLiquidationSummary,
  calculateGlobalStats,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getElapsedLabel,
  getTopCdas,
} from "./calculations";
import { ALLY_PRICE_ANNUAL, CDA_STATUS, PAYMENT_METHODS, PRE_REGISTRATION_STATUS, VEHICLE_TYPES } from "./constants";
import { exportRowsAsCsv } from "./csv";
import {
  activatePreRegistration,
  cancelPreRegistration,
  createLiquidation,
  createManualActivation,
  deleteCda,
  buildCdaAccessPassword,
  getAllyProgramSnapshot,
  markLiquidationPaid,
  mergeRemotePreRegistrations,
  regenerateCdaAccess,
  resetAllyProgramDemoData,
  saveCda,
  updateCdaStatus,
} from "./storage";
import { getEmbeddableImageUrl, getTemplatePreviewValues, isPublicImageUrl, normalizeAllyTemplates, renderTemplate } from "./templates";
import { openActivationWhatsApp, openPendingWhatsApp } from "./whatsapp";

const emptyCda = {
  idCDA: "",
  nombreCDA: "",
  nombreComercial: "",
  ciudad: "Medellin",
  zona: "",
  direccion: "",
  telefono: "",
  whatsapp: "",
  correo: "",
  nombreContacto: "",
  estado: CDA_STATUS.active,
  codigoAliado: "",
  logoCdaUrl: "",
  emailTemplates: undefined,
  observaciones: "",
};

const emptyManualForm = {
  nombreCliente: "",
  whatsappCliente: "",
  correo: "",
  placa: "",
  tipoVehiculo: "Carro",
  ciudad: "Medellin",
  fechaSOAT: "",
  fechaTecno: "",
  metodoPago: "Caja",
  valorPagado: ALLY_PRICE_ANNUAL,
  estadoMembresia: "activo",
};

const allyTemplateOptions = [
  {
    id: "welcome",
    label: "Bienvenida",
    description: "Mensaje que recibe el conductor al activar el servicio anual.",
  },
  {
    id: "documentReminder",
    label: "Vencimientos",
    description: "Recordatorios de SOAT, tecnomecanica, licencia e impuesto.",
  },
  {
    id: "picoPlaca",
    label: "Pico y placa",
    description: "Avisos de restriccion diaria por ciudad y placa.",
  },
  {
    id: "importantAlert",
    label: "Alertas importantes",
    description: "Comunicaciones operativas o preventivas para el conductor.",
  },
];

export default function AllyProgram({ user, onLogout, onNavigate }) {
  const [snapshot, setSnapshot] = useState(() => getSnapshotForSessionUser(user));
  const [activeTab, setActiveTab] = useState(() => (isAdminUser(user) ? "admin" : "dashboard"));
  const [selectedCdaId, setSelectedCdaId] = useState(() => user?.idCDA || (isAdminUser(user) ? snapshot.cdas[0]?.idCDA : "") || "");
  const [editingCda, setEditingCda] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const canAdmin = isAdminUser(user);
  const availableCdas = canAdmin ? snapshot.cdas : snapshot.cdas.filter((cda) => isAllyOwnedByUser(cda, user));
  const selectedCda = availableCdas.find((cda) => cda.idCDA === selectedCdaId) || availableCdas[0] || null;
  const globalStats = useMemo(() => calculateGlobalStats(snapshot.cdas, snapshot.preRegistrations, snapshot.sales, snapshot.liquidations), [snapshot]);
  const topCdas = useMemo(() => getTopCdas(snapshot.cdas, snapshot.preRegistrations, snapshot.sales, snapshot.liquidations), [snapshot]);
  const pendingCount = selectedCda ? snapshot.preRegistrations.filter((item) => item.idCDA === selectedCda.idCDA && item.estado === PRE_REGISTRATION_STATUS.pendingPayment).length : 0;

  useEffect(() => {
    if (!selectedCda?.codigoAliado && !selectedCda?.idCDA) return;

    let cancelled = false;
    getAllyPreRegistrationsFromSheet({ codigoAliado: selectedCda.codigoAliado, idCDA: selectedCda.idCDA })
      .then((result) => {
        if (cancelled || !result?.ok || !Array.isArray(result.items) || !result.items.length) return;
        refresh(mergeRemotePreRegistrations(result.items));
      })
      .catch((error) => {
        console.warn("No se pudieron cargar los pre-registros remotos.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCda?.codigoAliado, selectedCda?.idCDA]);

  function refresh(nextSnapshot = getAllyProgramSnapshot()) {
    setSnapshot(nextSnapshot);
  }

  function copyText(value, message = "Copiado.") {
    navigator.clipboard?.writeText(value || "");
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function handleSaveCda(cda) {
    const isNewCda = !snapshot.cdas.some((item) => item.idCDA === cda.idCDA);
    const nextSnapshot = saveCda(cda);
    const savedCda = nextSnapshot.cdas.find((item) => item.idCDA === cda.idCDA) || nextSnapshot.cdas[0];
    refresh(nextSnapshot);
    setEditingCda(null);
    setNotice(`Aliado guardado. Usuario: ${savedCda?.usuarioAcceso || savedCda?.correo || "sin correo"} | Clave: ${savedCda?.passwordTemporal || "pendiente"}`);
    void syncCdaAccessRemote(savedCda, { sendWelcomeEmail: isNewCda });
  }

  function handleRegenerateAccess(idCDA) {
    const nextSnapshot = regenerateCdaAccess(idCDA);
    const updatedCda = nextSnapshot.cdas.find((item) => item.idCDA === idCDA);
    refresh(nextSnapshot);
    setNotice(`Credenciales actualizadas. Usuario: ${updatedCda?.usuarioAcceso || updatedCda?.correo || "sin correo"} | Clave: ${updatedCda?.passwordTemporal || "pendiente"}`);
    void syncCdaAccessRemote(updatedCda, { sendWelcomeEmail: true });
  }

  function handleSaveAllySettings(updates) {
    if (!selectedCda) return null;
    const nextSnapshot = saveCda({ ...selectedCda, ...updates });
    const updatedCda = nextSnapshot.cdas.find((item) => item.idCDA === selectedCda.idCDA) || selectedCda;
    refresh(nextSnapshot);
    setNotice("Configuracion del aliado guardada.");
    void syncCdaAccessRemote(updatedCda);
    return updatedCda;
  }

  async function handleUpdateAllyPassword(newPassword) {
    if (!selectedCda) return { ok: false, message: "Selecciona un aliado para actualizar la contrasena." };
    const nextSnapshot = saveCda({
      ...selectedCda,
      passwordTemporal: newPassword,
      credencialesActualizadasEn: new Date().toISOString(),
    });
    const updatedCda = nextSnapshot.cdas.find((item) => item.idCDA === selectedCda.idCDA) || selectedCda;
    refresh(nextSnapshot);
    const remoteResult = await syncCdaAccessRemote(updatedCda);
    if (remoteResult && remoteResult.ok === false) {
      return { ok: false, message: remoteResult.message || "No se pudo sincronizar la contrasena remota." };
    }
    setNotice(`Contrasena actualizada para ${updatedCda.nombreComercial || updatedCda.nombreCDA}.`);
    return { ok: true, cda: updatedCda };
  }

  function handleStatusChange(idCDA, estado) {
    refresh(updateCdaStatus(idCDA, estado));
  }

  function handleDeleteCda(idCDA) {
    if (!window.confirm("¿Eliminar este aliado?")) return;
    const nextSnapshot = deleteCda(idCDA);
    refresh(nextSnapshot);
    setSelectedCdaId(nextSnapshot.cdas[0]?.idCDA || "");
  }

  function handleActivatePreRegistration(preRegistration, paymentData = "Caja") {
    const normalizedPaymentData = typeof paymentData === "string" ? { metodoPago: paymentData } : paymentData;
    const result = activatePreRegistration(preRegistration.idPreRegistro, normalizedPaymentData);
    refresh(result.snapshot);
    setPaymentTarget(null);
    if (!result.ok) {
      setNotice(result.message || "No se pudo activar la membresia.");
      return;
    }

    setNotice(`Membresia activada por 1 ano. Usuario: ${result.driver.usuarioAcceso} | Clave: ${result.driver.passwordTemporal}`);
    const sourceCda = result.snapshot.cdas.find((item) => item.idCDA === result.driver.idCDA) || selectedCda;
    void syncActivatedDriverRemote(result.driver, sourceCda);
    void registerAllyPreRegistration({
      ...preRegistration,
      estado: PRE_REGISTRATION_STATUS.active,
      fechaActivacion: result.sale?.fechaActivacion || new Date().toISOString(),
      correo: result.sale?.correo || "",
      metodoPago: result.sale?.metodoPago || "",
    });

    if (result.sale) {
      openActivationWhatsApp({
        nombreCliente: result.sale.nombreCliente,
        nombreCDA: result.sale.nombreCDA,
        codigoAliado: result.sale.codigoAliado,
        emailTemplates: sourceCda?.emailTemplates,
        whatsappCliente: result.sale.whatsappCliente,
        usuarioAcceso: result.driver.usuarioAcceso,
        passwordTemporal: result.driver.passwordTemporal,
      });
    }
  }

  function handleManualActivation(form) {
    const result = createManualActivation(form, selectedCda);
    refresh(result.snapshot);

    if (!result.ok) {
      setNotice(result.message || "No se pudo crear el usuario.");
      return result;
    }

    setNotice(`Cliente creado y membresia activada. Usuario: ${result.driver.usuarioAcceso} | Clave: ${result.driver.passwordTemporal}`);
    void syncActivatedDriverRemote(result.driver, selectedCda);
    openActivationWhatsApp({
      nombreCliente: result.sale.nombreCliente,
      nombreCDA: result.sale.nombreCDA,
      codigoAliado: result.sale.codigoAliado,
      emailTemplates: selectedCda?.emailTemplates,
      whatsappCliente: result.sale.whatsappCliente,
      usuarioAcceso: result.driver.usuarioAcceso,
      passwordTemporal: result.driver.passwordTemporal,
    });
    return result;
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playSoftBeep();
  }

  const tabs = [
    canAdmin ? { id: "admin", label: "Admin", icon: ShieldCheck } : null,
    { id: "dashboard", label: "Dashboard", icon: Store },
    { id: "cash", label: "Caja", icon: Banknote },
    canAdmin ? { id: "pending", label: `Pendientes ${pendingCount ? `(${pendingCount})` : ""}`, icon: BellRing } : null,
    { id: "liquidations", label: "Liquidaciones", icon: ReceiptText },
    { id: "settings", label: "Configuracion", icon: KeyRound },
    { id: "script", label: "Instructivo cajero", icon: Clipboard },
  ].filter(Boolean);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6">
      <Header
        user={user}
        onLogout={onLogout}
        title={`Programa de Aliados ${APP_NAME}`}
        subtitle={`Aliados oficiales para vender y activar Servicio ${APP_NAME} Conductores.`}
        backAction={<BackToCenterButton onNavigate={onNavigate} />}
      />

      {notice ? <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">{notice}</p> : null}

      {selectedCda ? (
        <CdaAccessPanel
          cda={selectedCda}
          snapshot={snapshot}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onCopy={copyText}
          onGoCash={() => setActiveTab("cash")}
          onGoScript={() => setActiveTab("script")}
          onGoLiquidations={() => setActiveTab("liquidations")}
        />
      ) : null}

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition ${
                active ? "bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <CdaSelector cdas={availableCdas} selectedCdaId={selectedCda?.idCDA} onChange={setSelectedCdaId} canAdmin={canAdmin} />

      {!canAdmin && !selectedCda ? <MissingAllyAccess user={user} /> : null}

      {activeTab === "admin" && canAdmin ? (
        <AdminPanel
          snapshot={snapshot}
          globalStats={globalStats}
          topCdas={topCdas}
          onNewCda={() => setEditingCda({ ...emptyCda, idCDA: createId("cda") })}
          onEditCda={setEditingCda}
          onStatusChange={handleStatusChange}
          onDeleteCda={handleDeleteCda}
          onRegenerateAccess={handleRegenerateAccess}
          onSelectDashboard={(idCDA) => {
            setSelectedCdaId(idCDA);
            setActiveTab("dashboard");
          }}
          onCopy={copyText}
          onReset={() => refresh(resetAllyProgramDemoData())}
        />
      ) : null}

      {activeTab === "dashboard" && selectedCda ? (
        <CdaDashboard
          cda={selectedCda}
          snapshot={snapshot}
          pendingCount={pendingCount}
          onCopy={copyText}
          onGoCash={() => setActiveTab("cash")}
        />
      ) : null}

      {activeTab === "cash" && selectedCda ? (
        <CashDesk
          cda={selectedCda}
          snapshot={snapshot}
          onPayment={setPaymentTarget}
          onCancel={(id) => refresh(cancelPreRegistration(id))}
          onCopy={copyText}
          onManualActivation={handleManualActivation}
        />
      ) : null}

      {activeTab === "pending" && selectedCda ? (
        <PendingRegistrations
          cda={selectedCda}
          preRegistrations={snapshot.preRegistrations}
          onPayment={setPaymentTarget}
          onCancel={(id) => refresh(cancelPreRegistration(id))}
          onCopy={copyText}
        />
      ) : null}

      {activeTab === "liquidations" && selectedCda ? <Liquidations cda={selectedCda} snapshot={snapshot} onRefresh={refresh} /> : null}

      {activeTab === "settings" && selectedCda ? (
        <AllySettings
          cda={selectedCda}
          onSave={handleSaveAllySettings}
          onPasswordChange={handleUpdateAllyPassword}
        />
      ) : null}

      {activeTab === "script" ? <CashierScript /> : null}

      {editingCda ? <CdaModal cda={editingCda} onClose={() => setEditingCda(null)} onSave={handleSaveCda} /> : null}
      {paymentTarget ? <PaymentModal preRegistration={paymentTarget} onClose={() => setPaymentTarget(null)} onConfirm={handleActivatePreRegistration} /> : null}
    </main>
  );
}

async function syncActivatedDriverRemote(driver, cda) {
  if (!driver?.usuarioAcceso) return;

  const user = {
    id: driver.idUsuario,
    name: driver.nombreCliente,
    email: driver.usuarioAcceso,
    phone: driver.whatsappCliente,
    city: driver.ciudad,
    password: driver.passwordTemporal,
    role: "driver",
    source: driver.source || "cda-caja",
    canUseSalesAgent: false,
    subscriptionStatus: "active",
    subscriptionEndsAt: driver.fechaVencimiento,
    sendWelcomeEmail: true,
    mustChangePassword: true,
    passwordChangeRequired: true,
    passwordUpdatedAt: "",
    idCDA: driver.idCDA,
    codigoAliado: driver.codigoAliado,
    nombreCDA: driver.nombreCDA,
    correoCDA: cda?.correo || "",
    logoCdaUrl: cda?.logoCdaUrl || "",
    plantillaBienvenida: cda?.emailTemplates?.welcome || "",
    plantillaVencimiento: cda?.emailTemplates?.documentReminder || "",
    plantillaPicoPlaca: cda?.emailTemplates?.picoPlaca || "",
    plantillaAlerta: cda?.emailTemplates?.importantAlert || "",
  };
  const vehicle = {
    id: `vehicle-${driver.idUsuario}`,
    userEmail: driver.usuarioAcceso,
    plate: driver.placa,
    type: driver.tipoVehiculo || "Carro",
    city: driver.ciudad,
    soatExpiry: driver.fechaSOAT || "",
    techReviewExpiry: driver.fechaTecno || "",
    soatNoticeDays: "30",
    techReviewNoticeDays: "30",
    updatedAt: new Date().toISOString(),
  };

  try {
    await registerUser(user);
    await saveVehicleToSheet(vehicle, user);
  } catch (error) {
    console.warn("No se pudo sincronizar el usuario aliado remoto.", error);
  }
}

async function syncCdaAccessRemote(cda, options = {}) {
  if (!cda?.usuarioAcceso || !cda?.passwordTemporal) return { ok: false, message: "El aliado no tiene usuario o contrasena configurada." };

  const user = {
    id: `cda-user-${cda.idCDA}`,
    name: cda.nombreComercial || cda.nombreCDA,
    email: cda.usuarioAcceso,
    phone: cda.whatsapp || cda.telefono || "",
    city: cda.ciudad || "",
    password: cda.passwordTemporal,
    role: "cda_aliado",
    source: "cda-ally-admin",
    canUseSalesAgent: false,
    subscriptionStatus: "active",
    subscriptionEndsAt: "",
    sendWelcomeEmail: Boolean(options.sendWelcomeEmail),
    mustChangePassword: false,
    passwordChangeRequired: false,
    passwordUpdatedAt: cda.credencialesActualizadasEn || new Date().toISOString(),
    idCDA: cda.idCDA,
    codigoAliado: cda.codigoAliado,
    nombreCDA: cda.nombreCDA,
    correoCDA: cda.correo || "",
    logoCdaUrl: cda.logoCdaUrl || "",
    plantillaBienvenida: cda.emailTemplates?.welcome || "",
    plantillaVencimiento: cda.emailTemplates?.documentReminder || "",
    plantillaPicoPlaca: cda.emailTemplates?.picoPlaca || "",
    plantillaAlerta: cda.emailTemplates?.importantAlert || "",
  };

  try {
    const result = await registerUser(user);
    return result || { ok: true };
  } catch (error) {
    console.warn("No se pudo sincronizar el usuario aliado remoto.", error);
    return { ok: false, message: "No se pudo sincronizar el usuario aliado remoto." };
  }
}

function AdminPanel({ snapshot, globalStats, topCdas, onNewCda, onEditCda, onStatusChange, onDeleteCda, onRegenerateAccess, onSelectDashboard, onCopy, onReset }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Usuarios activos" value={formatNumber(globalStats.usuariosActivos)} />
        <MetricCard icon={BarChart3} label="Tasa de conversión" value={`${globalStats.conversion}%`} />
        <MetricCard icon={WalletCards} label="Ingresos aliados" value={formatCurrency(globalStats.ingresosCDA)} />
        <MetricCard icon={ReceiptText} label={`Ingresos ${APP_NAME}`} value={formatCurrency(globalStats.ingresosCopilot)} />
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="primary-button" onClick={onNewCda}>
          <Plus size={18} />
          Crear aliado
        </button>
        <button type="button" className="secondary-button" onClick={() => exportRowsAsCsv("aliados-copilot360.csv", snapshot.cdas)}>
          <FileSpreadsheet size={18} />
          Exportar CSV
        </button>
        <button type="button" className="secondary-button" onClick={() => exportRowsAsCsv("ventas-aliados-copilot360.csv", snapshot.sales)}>
          <Download size={18} />
          Exportar ventas
        </button>
        <button type="button" className="secondary-button" onClick={onReset}>
          <RotateCcw size={18} />
          Reiniciar demo
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">Aliados</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Ranking, estado comercial, saldos y acciones administrativas.</p>
          </div>
          <StatusBadge tone="info">{topCdas.length} aliados</StatusBadge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Aliado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Acceso</th>
                <th className="px-5 py-3">Usuarios</th>
                <th className="px-5 py-3">Ventas</th>
                <th className="px-5 py-3">Comisión</th>
                <th className="px-5 py-3">Saldo {APP_NAME}</th>
                <th className="px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCdas.map((cda) => (
                <tr key={cda.idCDA} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950">{cda.nombreCDA}</p>
                    <p className="text-xs font-semibold text-slate-500">{cda.ciudad} · {cda.zona}</p>
                  </td>
                  <td className="px-5 py-4">
                    <AllyStatusBadge status={cda.estado} />
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" className="font-mono text-xs font-black text-slate-950 underline decoration-slate-300 underline-offset-4" onClick={() => onCopy(cda.urlReferido, "Link referido copiado.")}>
                      {cda.codigoAliado}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[14rem] truncate text-xs font-black text-slate-800">{cda.usuarioAcceso || cda.correo || "Sin correo"}</p>
                    <button
                      type="button"
                      className="mt-1 font-mono text-xs font-black text-slate-950 underline decoration-slate-300 underline-offset-4"
                      onClick={() => onCopy(buildCredentialText(cda), "Credenciales copiadas.")}
                    >
                      {cda.passwordTemporal || "Sin clave"}
                    </button>
                  </td>
                  <td className="px-5 py-4 font-black">{formatNumber(cda.totalUsuarios)}</td>
                  <td className="px-5 py-4 font-black">{formatCurrency(cda.totalVentas)}</td>
                  <td className="px-5 py-4 font-black text-emerald-700">{formatCurrency(cda.comisionGenerada)}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{formatCurrency(cda.saldoPendientePorPagarACopilot)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <IconButton label="Dashboard" icon={Eye} onClick={() => onSelectDashboard(cda.idCDA)} />
                      <IconButton label="Editar" icon={Clipboard} onClick={() => onEditCda(cda)} />
                      <IconButton label="Copiar link" icon={LinkIcon} onClick={() => onCopy(cda.urlReferido, "Link referido copiado.")} />
                      <IconButton label="Generar QR" icon={QrCode} onClick={() => onCopy(cda.qrReferido, "URL del QR copiada.")} />
                      <IconButton label="Regenerar clave" icon={KeyRound} onClick={() => onRegenerateAccess(cda.idCDA)} />
                      {cda.estado === CDA_STATUS.active ? (
                        <IconButton label="Suspender" icon={PauseCircle} onClick={() => onStatusChange(cda.idCDA, CDA_STATUS.suspended)} />
                      ) : (
                        <IconButton label="Activar" icon={CheckCircle2} onClick={() => onStatusChange(cda.idCDA, CDA_STATUS.active)} />
                      )}
                      <IconButton label="Eliminar" icon={Trash2} danger onClick={() => onDeleteCda(cda.idCDA)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CdaAccessPanel({ cda, snapshot, soundEnabled, onToggleSound, onCopy, onGoCash, onGoScript, onGoLiquidations }) {
  const cdaSales = snapshot.sales.filter((sale) => sale.idCDA === cda.idCDA);
  const cdaDrivers = snapshot.drivers
    .filter((driver) => driver.idCDA === cda.idCDA)
    .sort((left, right) => new Date(right.fechaActivacion || right.updatedAt || 0).getTime() - new Date(left.fechaActivacion || left.updatedAt || 0).getTime());

  return (
    <section className="mb-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Aliado autorizado {APP_NAME}</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">{cda.nombreCDA}</h2>
            <p className="mt-2 font-mono text-sm font-black text-emerald-200">{cda.codigoAliado}</p>
          </div>
          <AllyStatusBadge status={cda.estado} />
        </div>
        <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
          <p className="text-xs font-black uppercase tracking-wide text-slate-300">Link referido</p>
          <p className="mt-2 break-all text-sm font-bold text-white">{cda.urlReferido}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="primary-button" onClick={() => onCopy(cda.urlReferido, "Link copiado.")}>
            <LinkIcon size={18} />
            Copiar link
          </button>
          <a className="secondary-button bg-white text-slate-900" href={cda.qrReferido} download={`qr-${cda.codigoAliado}.png`} target="_blank" rel="noreferrer">
            <Download size={18} />
            Descargar QR
          </a>
          <button type="button" className="secondary-button bg-white text-slate-900" onClick={onGoCash}>
            <UserPlus size={18} />
            Registrar cliente
          </button>
          <button type="button" className="secondary-button bg-white text-slate-900" onClick={onGoScript}>
            <Clipboard size={18} />
            Ver instructivo cajero
          </button>
          <button type="button" className="secondary-button bg-white text-slate-900" onClick={() => exportRowsAsCsv(`ventas-${cda.codigoAliado}.csv`, cdaSales)}>
            <FileSpreadsheet size={18} />
            Exportar ventas
          </button>
          <button type="button" className="secondary-button bg-white text-slate-900" onClick={() => exportRowsAsCsv(`usuarios-${cda.codigoAliado}.csv`, cdaDrivers)}>
            <Users size={18} />
            Exportar usuarios
          </button>
          <button type="button" className="secondary-button bg-white text-slate-900" onClick={onGoLiquidations}>
            <History size={18} />
            Ver historial
          </button>
        </div>
      </div>

      <Card className="p-5">
        <div className="mx-auto grid max-w-[14rem] place-items-center rounded-3xl bg-white p-3 ring-1 ring-slate-100">
          <img src={cda.qrReferido} alt={`QR ${cda.codigoAliado}`} className="aspect-square w-full rounded-2xl object-contain" />
        </div>
        <button type="button" onClick={onToggleSound} className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black ring-1 ${soundEnabled ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
          Sonido opcional {soundEnabled ? "activo" : "inactivo"}
        </button>
      </Card>
    </section>
  );
}

function CdaDashboard({ cda, snapshot, pendingCount, onCopy, onGoCash }) {
  const cdaDrivers = snapshot.drivers
    .filter((driver) => driver.idCDA === cda.idCDA)
    .sort((left, right) => new Date(right.fechaActivacion || right.updatedAt || 0).getTime() - new Date(left.fechaActivacion || left.updatedAt || 0).getTime());
  const pending = snapshot.preRegistrations.filter((item) => item.idCDA === cda.idCDA && item.estado === PRE_REGISTRATION_STATUS.pendingPayment);

  return (
    <div className="space-y-5">
      {pendingCount ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-white shadow-sm animate-pulse">
                <BellRing size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black">{pendingCount} activaciones pendientes</h3>
                <p className="text-sm font-semibold">Cliente pendiente de activación en sala.</p>
              </div>
            </div>
            <button type="button" className="secondary-button border-amber-200 text-amber-900" onClick={onGoCash}>
              Confirmar pagos
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Banknote} label="Ventas del día" value={formatNumber(cda.ventasDia)} />
        <MetricCard icon={BarChart3} label="Ventas del mes" value={formatNumber(cda.ventasMes)} />
        <MetricCard icon={Users} label="Total usuarios" value={formatNumber(cda.totalUsuarios)} />
        <MetricCard icon={WalletCards} label="Comisión acumulada" value={formatCurrency(cda.comisionGenerada)} />
        <MetricCard icon={ReceiptText} label="Saldo por transferir" value={formatCurrency(cda.saldoPendientePorPagarACopilot)} />
        <MetricCard icon={BellRing} label="Activaciones pendientes" value={formatNumber(cda.activacionesPendientes)} tone={cda.activacionesPendientes ? "warning" : "success"} />
        <MetricCard icon={Sparkles} label="Tasa de conversión" value={`${cda.tasaConversion}%`} />
        <MetricCard icon={BadgeCheck} label="Liquidaciones" value={formatNumber(snapshot.liquidations.filter((item) => item.idCDA === cda.idCDA).length)} />
      </section>

      <CdaCreatedUsers cda={cda} drivers={cdaDrivers} onCopy={onCopy} />

      <PendingRegistrations cda={cda} preRegistrations={pending} compact onPayment={() => onGoCash()} onCancel={() => {}} onCopy={onCopy} />
    </div>
  );
}

function CashDesk({ cda, snapshot, onPayment, onCancel, onCopy, onManualActivation }) {
  const [query, setQuery] = useState("");
  const [manualForm, setManualForm] = useState({ ...emptyManualForm, ciudad: cda.ciudad || "Medellin" });
  const [manualError, setManualError] = useState("");
  const cdaIsActive = cda.estado === CDA_STATUS.active;
  const pending = snapshot.preRegistrations.filter((item) => item.idCDA === cda.idCDA && item.estado === PRE_REGISTRATION_STATUS.pendingPayment);
  const filtered = pending.filter((item) => {
    const text = `${item.nombreCliente} ${item.whatsapp} ${item.placa} ${item.codigoActivacion}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  function updateManual(field, value) {
    setManualForm((current) => ({ ...current, [field]: value }));
    setManualError("");
  }

  function submitManual(event) {
    event.preventDefault();
    if (!cdaIsActive) {
      setManualError("Este aliado no se encuentra disponible actualmente.");
      return;
    }
    if (!manualForm.nombreCliente.trim() || !manualForm.whatsappCliente.trim() || !manualForm.correo.trim() || !manualForm.placa.trim()) {
      setManualError("Completa nombre, WhatsApp, correo y placa para crear el usuario.");
      return;
    }
    if (!isLikelyEmail(manualForm.correo)) {
      setManualError("Ingresa un correo valido para enviar la bienvenida.");
      return;
    }
    const result = onManualActivation({ ...manualForm, codigoAliado: cda.codigoAliado });
    if (!result?.ok) {
      setManualError(result?.message || "No se pudo crear el usuario.");
      return;
    }
    setManualForm({ ...emptyManualForm, ciudad: cda.ciudad || "Medellin" });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_26rem]">
      <div className="space-y-5">
        <section className="rounded-3xl bg-blue-50 p-4 text-blue-950 ring-1 ring-blue-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="font-black">Recuerda ofrecer activación {APP_NAME} antes de finalizar atención.</h2>
              <p className="mt-1 text-sm leading-6 text-blue-800">El cajero confirma datos, cobra {formatCurrency(ALLY_PRICE_ANNUAL)} y activa la membresía anual.</p>
            </div>
          </div>
        </section>

        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Buscar cliente</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Pre-registros visibles en dashboard y caja.</p>
            </div>
            <StatusBadge tone={pending.length ? "warning" : "success"}>{pending.length} pendientes</StatusBadge>
          </div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, WhatsApp, placa o código" />
          </div>
          <PendingList items={filtered} onPayment={onPayment} onCancel={onCancel} onCopy={onCopy} />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-black text-slate-950">Registro manual cliente</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Activa desde caja cuando el cliente no llegó por QR.</p>
        {!cdaIsActive ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">Este aliado no puede activar membresias mientras no este activo.</p> : null}
        <form className="mt-4 space-y-3" onSubmit={submitManual}>
          <Field label="Nombre cliente">
            <input className="input" value={manualForm.nombreCliente} onChange={(event) => updateManual("nombreCliente", event.target.value)} placeholder="Nombre completo" />
          </Field>
          <Field label="WhatsApp cliente">
            <input className="input" value={manualForm.whatsappCliente} onChange={(event) => updateManual("whatsappCliente", event.target.value)} placeholder="300 000 0000" inputMode="tel" />
          </Field>
          <Field label="Correo cliente">
            <input className="input" type="email" value={manualForm.correo} onChange={(event) => updateManual("correo", event.target.value)} placeholder="correo@ejemplo.com" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Field label="Placa">
              <input className="input uppercase" value={manualForm.placa} onChange={(event) => updateManual("placa", event.target.value)} placeholder="ABC123" maxLength={7} />
            </Field>
            <Field label="Tipo vehículo">
              <select className="input" value={manualForm.tipoVehiculo} onChange={(event) => updateManual("tipoVehiculo", event.target.value)}>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Ciudad">
            <select className="input" value={manualForm.ciudad} onChange={(event) => updateManual("ciudad", event.target.value)}>
              {cityOptions.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Field label="Fecha SOAT opcional">
              <input className="input" type="date" value={manualForm.fechaSOAT} onChange={(event) => updateManual("fechaSOAT", event.target.value)} />
            </Field>
            <Field label="Fecha tecnomecánica opcional">
              <input className="input" type="date" value={manualForm.fechaTecno} onChange={(event) => updateManual("fechaTecno", event.target.value)} />
            </Field>
          </div>
          <Field label="Método pago">
            <select className="input" value={manualForm.metodoPago} onChange={(event) => updateManual("metodoPago", event.target.value)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Valor pagado</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{formatCurrency(ALLY_PRICE_ANNUAL)}</p>
          </div>
          {manualError ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{manualError}</p> : null}
          <button type="submit" className="primary-button w-full" disabled={!cdaIsActive}>
            <CheckCircle2 size={18} />
            Activar membresía
          </button>
        </form>
      </Card>
    </div>
  );
}

function PendingRegistrations({ cda, preRegistrations, compact = false, onPayment, onCancel, onCopy }) {
  const items = preRegistrations.filter((item) => (compact ? true : item.idCDA === cda.idCDA));
  const pendingItems = items.filter((item) => compact || item.estado !== PRE_REGISTRATION_STATUS.cancelled);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Pre-registros pendientes</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Evita perder ventas y mantén visible lo que llegó por QR.</p>
        </div>
        <StatusBadge tone={pendingItems.some((item) => item.estado === PRE_REGISTRATION_STATUS.pendingPayment) ? "warning" : "success"}>{pendingItems.length}</StatusBadge>
      </div>
      <PendingList items={pendingItems} onPayment={onPayment} onCancel={onCancel} onCopy={onCopy} compact={compact} />
    </Card>
  );
}

function PendingList({ items, onPayment, onCancel, onCopy, compact = false }) {
  if (!items.length) {
    return <div className="rounded-3xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500 ring-1 ring-slate-100">Sin activaciones pendientes.</div>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.idPreRegistro} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-slate-950">{item.nombreCliente}</h3>
                <PreRegistrationStatusBadge status={item.estado} />
              </div>
              <div className="grid gap-1 text-sm font-semibold text-slate-500 sm:grid-cols-2">
                <p>WhatsApp: {item.whatsapp}</p>
                <p>Placa: {item.placa}</p>
                <p>Ciudad: {item.ciudad}</p>
                <p>Hace: {getElapsedLabel(item.fechaHoraPreRegistro)}</p>
                <p>Fecha: {formatDateTime(item.fechaHoraPreRegistro)}</p>
                <p className="font-mono text-blue-700">{item.codigoActivacion}</p>
              </div>
            </div>
            {!compact ? (
              <div className="flex flex-wrap gap-2">
                {item.estado === PRE_REGISTRATION_STATUS.pendingPayment ? <IconButton label="Confirmar pago" icon={CheckCircle2} onClick={() => onPayment(item)} /> : null}
                <IconButton label="WhatsApp" icon={MessageCircle} onClick={() => openPendingWhatsApp(item)} />
                <IconButton label="Copiar código" icon={Clipboard} onClick={() => onCopy(item.codigoActivacion, "Código copiado.")} />
                {item.estado === PRE_REGISTRATION_STATUS.pendingPayment ? <IconButton label="Cancelar" icon={X} danger onClick={() => onCancel(item.idPreRegistro)} /> : null}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function CdaCreatedUsers({ cda, drivers, onCopy }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-black text-slate-950">Usuarios registrados por el aliado</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Activaciones creadas desde caja, QR o registro manual para este aliado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={drivers.length ? "success" : "neutral"}>{drivers.length} usuarios</StatusBadge>
          <button type="button" className="secondary-button" onClick={() => exportRowsAsCsv(`usuarios-${cda.codigoAliado}.csv`, drivers)}>
            <FileSpreadsheet size={18} />
            Exportar
          </button>
        </div>
      </div>

      {!drivers.length ? (
        <div className="p-5">
          <div className="rounded-3xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500 ring-1 ring-slate-100">
            Aun no hay usuarios activados por este aliado.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Vehiculo</th>
                <th className="px-5 py-3">Activacion</th>
                <th className="px-5 py-3">Acceso</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((driver) => (
                <tr key={driver.idUsuario} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950">{driver.nombreCliente || "Sin nombre"}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{getDriverSourceLabel(driver.source)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">{driver.whatsappCliente || "Sin WhatsApp"}</p>
                    <p className="mt-1 max-w-[14rem] truncate text-xs font-semibold text-slate-500">{driver.correo || "Sin correo"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-sm font-black text-blue-700">{driver.placa || "Sin placa"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{driver.tipoVehiculo || "Vehiculo"} · {driver.ciudad || cda.ciudad}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">{formatDateTime(driver.fechaActivacion || driver.updatedAt)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Vence: {formatDateTime(driver.fechaVencimiento || driver.subscriptionEndsAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[14rem] truncate text-xs font-black text-slate-800">{driver.usuarioAcceso || driver.correo || driver.whatsappCliente}</p>
                    <button type="button" className="mt-1 font-mono text-xs font-black text-slate-950 underline decoration-slate-300 underline-offset-4" onClick={() => onCopy(buildDriverCredentialText(driver), "Credenciales copiadas.")}>
                      {driver.passwordTemporal || "Sin clave"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <MembershipStatusBadge status={driver.estadoMembresia} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <IconButton label="Copiar credenciales" icon={Clipboard} onClick={() => onCopy(buildDriverCredentialText(driver), "Credenciales copiadas.")} />
                      <IconButton
                        label="Reenviar WhatsApp"
                        icon={MessageCircle}
                        onClick={() =>
                          openActivationWhatsApp({
                            nombreCliente: driver.nombreCliente,
                            nombreCDA: driver.nombreCDA || cda.nombreCDA,
                            codigoAliado: driver.codigoAliado || cda.codigoAliado,
                            emailTemplates: cda.emailTemplates,
                            whatsappCliente: driver.whatsappCliente,
                            usuarioAcceso: driver.usuarioAcceso,
                            passwordTemporal: driver.passwordTemporal,
                          })
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Liquidations({ cda, snapshot, onRefresh }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;
  const [period, setPeriod] = useState({ inicio: monthStart, fin: today });
  const cdaLiquidations = snapshot.liquidations.filter((item) => item.idCDA === cda.idCDA);
  const summary = buildLiquidationSummary(cda, snapshot.sales, period.inicio, period.fin);

  function generateLiquidation() {
    onRefresh(createLiquidation(summary));
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card className="p-5">
          <h2 className="text-xl font-black text-slate-950">Generar liquidación</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Sistema semanal o mensual según el periodo seleccionado.</p>
          <div className="mt-4 grid gap-3">
            <Field label="Periodo inicio">
              <input className="input" type="date" value={period.inicio} onChange={(event) => setPeriod((current) => ({ ...current, inicio: event.target.value }))} />
            </Field>
            <Field label="Periodo fin">
              <input className="input" type="date" value={period.fin} onChange={(event) => setPeriod((current) => ({ ...current, fin: event.target.value }))} />
            </Field>
          </div>
          <button type="button" className="primary-button mt-4 w-full" onClick={generateLiquidation}>
            <ReceiptText size={18} />
            Generar liquidación
          </button>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Users} label="Usuarios activados" value={formatNumber(summary.usuariosActivados)} />
          <MetricCard icon={Banknote} label="Total recaudado" value={formatCurrency(summary.totalRecaudado)} />
          <MetricCard icon={WalletCards} label="Comisión aliado" value={formatCurrency(summary.comisionCDA)} />
          <MetricCard icon={ReceiptText} label={`Valor ${APP_NAME}`} value={formatCurrency(summary.valorCopilot)} />
        </section>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-black text-slate-950">Historial de liquidaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Periodo</th>
                <th className="px-5 py-3">Usuarios</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Comisión</th>
                <th className="px-5 py-3">{APP_NAME}</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Comprobante</th>
                <th className="px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cdaLiquidations.map((item) => (
                <tr key={item.idLiquidacion}>
                  <td className="px-5 py-4 font-bold">{item.periodoInicio} a {item.periodoFin}</td>
                  <td className="px-5 py-4">{item.usuariosActivados}</td>
                  <td className="px-5 py-4 font-black">{formatCurrency(item.totalRecaudado)}</td>
                  <td className="px-5 py-4 font-black text-emerald-700">{formatCurrency(item.comisionCDA)}</td>
                  <td className="px-5 py-4 font-black">{formatCurrency(item.valorCopilot)}</td>
                  <td className="px-5 py-4"><StatusBadge tone={item.estado === "pagada" ? "success" : "warning"}>{item.estado}</StatusBadge></td>
                  <td className="px-5 py-4">{item.comprobantePago || "Pendiente"}</td>
                  <td className="px-5 py-4">
                    {item.estado !== "pagada" ? (
                      <button type="button" className="secondary-button" onClick={() => onRefresh(markLiquidationPaid(item.idLiquidacion))}>
                        Confirmar pago
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AllySettings({ cda, onSave, onPasswordChange }) {
  const [logoCdaUrl, setLogoCdaUrl] = useState(cda.logoCdaUrl || "");
  const [templates, setTemplates] = useState(() => normalizeAllyTemplates(cda));
  const [selectedTemplateId, setSelectedTemplateId] = useState("documentReminder");
  const [saved, setSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState("");
  const [logoUploadStatus, setLogoUploadStatus] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const previewValues = getTemplatePreviewValues(cda);
  const logoIsValid = isPublicImageUrl(logoCdaUrl);
  const selectedTemplate = allyTemplateOptions.find((item) => item.id === selectedTemplateId) || allyTemplateOptions[0];

  function updateTemplate(field, value) {
    setSaved(false);
    setTemplates((current) => ({ ...current, [field]: value }));
  }

  function submitForm(event) {
    event.preventDefault();
    if (!logoIsValid) return;
    onSave({ logoCdaUrl: logoCdaUrl.trim(), emailTemplates: templates });
    setSaved(true);
  }

  async function handleLogoFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoUploadStatus("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoUploadStatus("Selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLogoUploadStatus("La imagen no debe superar 4 MB.");
      return;
    }

    try {
      setLogoUploading(true);
      const base64Data = await readFileAsBase64(file);
      const result = await uploadAllyLogoToDrive({
        idCDA: cda.idCDA,
        codigoAliado: cda.codigoAliado,
        nombreCDA: cda.nombreCDA,
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });
      if (!result?.ok || !(result.logoCdaUrl || result.url)) {
        setLogoUploadStatus(result?.message || result?.error || "No se pudo subir la imagen.");
        return;
      }
      const nextLogoUrl = result.logoCdaUrl || result.url;
      setLogoCdaUrl(nextLogoUrl);
      onSave({ logoCdaUrl: nextLogoUrl, emailTemplates: templates });
      setSaved(true);
      setLogoUploadStatus("Imagen subida a Drive y guardada.");
    } catch (error) {
      setLogoUploadStatus(error.message || "No se pudo subir la imagen.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    const password = passwordForm.newPassword.trim();
    setPasswordStatus("");
    if (password.length < 8) {
      setPasswordStatus("La contrasena debe tener minimo 8 caracteres.");
      return;
    }
    if (password !== passwordForm.confirmPassword.trim()) {
      setPasswordStatus("Las contrasenas no coinciden.");
      return;
    }
    const result = await onPasswordChange(password);
    if (!result?.ok) {
      setPasswordStatus(result?.message || "No se pudo actualizar la contrasena.");
      return;
    }
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordStatus("Contrasena actualizada.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <Card className="p-5">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <KeyRound size={23} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Configuracion del aliado</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">El perfil se mantiene protegido; solo se actualiza la contrasena y la foto/logo del establecimiento.</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <ReadonlyInfo label="Aliado" value={cda.nombreComercial || cda.nombreCDA} />
          <ReadonlyInfo label="Codigo" value={cda.codigoAliado} />
          <ReadonlyInfo label="Usuario" value={cda.usuarioAcceso || cda.correo || "Pendiente"} />
        </div>

        <form className="space-y-4" onSubmit={submitForm}>
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <Image size={18} />
              <p className="font-black">Foto/logo del establecimiento</p>
            </div>
            <Field label="Subir imagen">
              <input className="input file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" type="file" accept="image/*" onChange={handleLogoFileChange} disabled={logoUploading} />
            </Field>
            <p className={`mt-2 text-xs font-semibold leading-5 ${logoIsValid ? "text-slate-500" : "text-red-600"}`}>
              Esta imagen se muestra debajo de "Servicio {APP_NAME} Conductores" y encima de "{cda.nombreCDA} en alianza con {APP_NAME}".
            </p>
            {logoUploading ? <p className="mt-2 text-xs font-black text-blue-700">Subiendo imagen a Drive...</p> : null}
            {logoUploadStatus ? <p className={`mt-2 text-xs font-black ${logoUploadStatus.includes("subida") ? "text-emerald-700" : "text-red-700"}`}>{logoUploadStatus}</p> : null}
            {logoCdaUrl && logoIsValid ? (
              <a className="mt-3 inline-flex text-xs font-black text-blue-700 underline" href={logoCdaUrl} target="_blank" rel="noreferrer">
                Ver imagen guardada
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
            <Field label="Seleccionar plantilla">
              <select className="input" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                {allyTemplateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{selectedTemplate.description}</p>
          </div>

          <TemplateField
            label={`Texto de plantilla: ${selectedTemplate.label}`}
            value={templates[selectedTemplate.id]}
            helper="La previsualización completa de la derecha cambia automáticamente mientras escribes."
            onChange={(value) => updateTemplate(selectedTemplate.id, value)}
          />

          <div className="rounded-3xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 ring-1 ring-blue-100">
            <p className="font-black">Variables disponibles</p>
            <p className="mt-1 font-mono text-xs">{`{nombreCDA} {codigoAliado} {nombreCliente} {documento} {diasRestantes} {placa} {ciudad} {fecha}`}</p>
          </div>

          {saved ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Configuracion guardada.</p> : null}

          <button type="submit" className="primary-button w-full" disabled={!logoIsValid}>
            <Save size={18} />
            Guardar configuracion
          </button>
        </form>

        <form className="mt-5 space-y-4 rounded-3xl bg-white p-4 ring-1 ring-slate-200" onSubmit={submitPassword}>
          <div className="flex items-center gap-2 text-slate-900">
            <KeyRound size={18} />
            <p className="font-black">Actualizar contrasena</p>
          </div>
          <Field label="Nueva contrasena">
            <input
              className="input"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              autoComplete="new-password"
              placeholder="Minimo 8 caracteres"
            />
          </Field>
          <Field label="Confirmar contrasena">
            <input
              className="input"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              autoComplete="new-password"
              placeholder="Repite la nueva contrasena"
            />
          </Field>
          {passwordStatus ? <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${passwordStatus.includes("actualizada") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{passwordStatus}</p> : null}
          <button type="submit" className="secondary-button w-full">
            <KeyRound size={18} />
            Actualizar contrasena
          </button>
        </form>
      </Card>

      <div className="space-y-5">
        <EmailPreview cda={cda} logoCdaUrl={logoCdaUrl} templates={templates} previewValues={previewValues} activeTemplate={selectedTemplate} />
        <Card className="p-5">
          <h3 className="text-xl font-black text-slate-950">Regla de marca</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Todas las comunicaciones de usuarios adquiridos por aliado deben iniciar con el aliado en alianza con {APP_NAME} y cerrar con Powered By {APP_NAME}.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ReadonlyInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value || "Pendiente"}</p>
    </div>
  );
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function TemplateField({ label, value, helper, onChange }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      <textarea className="input min-h-36 resize-y" value={value} onChange={(event) => onChange(event.target.value)} />
      {helper ? <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}

function EmailPreview({ cda, logoCdaUrl, templates, previewValues, activeTemplate }) {
  const logoIsValid = isPublicImageUrl(logoCdaUrl);
  const embeddedLogoUrl = getEmbeddableImageUrl(logoCdaUrl, 160);
  const preview = getEmailPreviewMeta(activeTemplate.id, previewValues);
  const message = renderTemplate(templates[activeTemplate.id], previewValues);

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft ring-1 ring-slate-100">
      <div className="bg-slate-950 px-5 py-6 text-center text-white">
        <img src="/copilot360-logo.png" alt={APP_NAME} className="mx-auto max-h-[54px] max-w-[10rem] object-contain" />
        <p className="mt-3 text-sm font-bold text-slate-300">Servicio {APP_NAME} Conductores</p>
        {embeddedLogoUrl && logoIsValid ? <img src={embeddedLogoUrl} alt={cda.nombreCDA} className="mx-auto mt-3 max-h-[40px] max-w-[5rem] object-contain" /> : null}
        <p className="mt-3 text-sm font-bold text-slate-300">{cda.nombreCDA} en alianza con {APP_NAME}</p>
      </div>
      <div className="p-5">
        <div className="mb-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">Asunto</p>
          <p className="mt-1 text-sm font-black text-slate-950">{preview.subject}</p>
        </div>
        <p className="text-sm leading-6 text-slate-600">Hola <strong>{previewValues.nombreCliente}</strong>,</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
        <div className="my-5 rounded-3xl border-2 border-amber-400 bg-amber-50 p-5 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">{preview.badgeTitle}</p>
          <p className="mt-2 text-4xl font-black text-amber-600">{preview.badgeValue}</p>
          <p className="text-sm font-bold text-amber-700">{preview.badgeCaption}</p>
        </div>
        <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600 ring-1 ring-slate-100">
          {preview.details.map((detail) => (
            <p key={detail.label}>
              <strong>{detail.label}:</strong> {detail.value}
            </p>
          ))}
        </div>
        <p className="text-sm leading-6 text-slate-500">{preview.bodyNote}</p>
        <div className="mt-5 text-center">
          <span className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">{preview.cta}</span>
        </div>
      </div>
      <div className="bg-slate-950 px-5 py-4 text-center text-xs font-bold text-slate-300">Powered By {APP_NAME}</div>
    </div>
  );
}

function getEmailPreviewMeta(templateId, values) {
  if (templateId === "welcome") {
    return {
      subject: `${values.nombreCDA} + ${APP_NAME}: bienvenida a tu servicio`,
      badgeTitle: "Servicio activado",
      badgeValue: "1 año",
      badgeCaption: "membresía activa",
      details: [
        { label: "Aliado", value: values.nombreCDA },
        { label: "Código aliado", value: values.codigoAliado },
        { label: "Placa", value: values.placa },
      ],
      bodyNote: "Ya puedes recibir recordatorios automáticos, pico y placa, alertas importantes y novedades de tránsito.",
      cta: `Entrar a ${APP_NAME}`,
    };
  }

  if (templateId === "picoPlaca") {
    return {
      subject: `${values.nombreCDA} + ${APP_NAME}: pico y placa para ${values.placa}`,
      badgeTitle: "Pico y placa",
      badgeValue: values.placa,
      badgeCaption: `restricción en ${values.ciudad}`,
      details: [
        { label: "Ciudad", value: values.ciudad },
        { label: "Fecha", value: values.fecha },
        { label: "Placa", value: values.placa },
      ],
      bodyNote: "Planea tus recorridos con anticipación para evitar sanciones y contratiempos durante controles de tránsito.",
      cta: "Revisar ruta",
    };
  }

  if (templateId === "importantAlert") {
    return {
      subject: `${values.nombreCDA} + ${APP_NAME}: alerta importante`,
      badgeTitle: "Alerta importante",
      badgeValue: values.placa,
      badgeCaption: "revisa tu vehículo",
      details: [
        { label: "Vehículo", value: values.placa },
        { label: "Ciudad", value: values.ciudad },
        { label: "Fecha", value: values.fecha },
      ],
      bodyNote: "Esta comunicación ayuda al conductor a mantenerse informado sobre novedades relevantes para su vehículo.",
      cta: "Ver alerta",
    };
  }

  return {
    subject: `${values.nombreCDA} + ${APP_NAME}: recordatorio de ${values.documento}`,
    badgeTitle: "Recordatorio importante",
    badgeValue: values.diasRestantes,
    badgeCaption: "días para el vencimiento",
    details: [
      { label: "Documento", value: values.documento },
      { label: "Fecha de vencimiento", value: values.fecha },
      { label: "Placa", value: values.placa },
    ],
    bodyNote: `Revisa y actualiza tus datos desde ${APP_NAME} para mantener tu vehículo al día.`,
    cta: `Revisar en ${APP_NAME}`,
  };
}

function CashierScript() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <Card className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Clipboard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Guion de venta para caja</h2>
            <p className="text-sm leading-6 text-slate-500">Natural, breve y enfocado en tranquilidad.</p>
          </div>
        </div>
        <div className="space-y-4">
          <ScriptStep number="1" title="Frase inicial">¿Quiere que le quede configurado el servicio de recordatorios?</ScriptStep>
          <ScriptStep number="2" title="Si cliente pregunta qué hace">
            Tenemos un servicio llamado {APP_NAME} que le recuerda automáticamente sus vencimientos y además le muestra pico y placa, alertas importantes, novedades de tránsito y navegación tipo Waze.
          </ScriptStep>
          <ScriptStep number="3" title="Refuerzo">Muchos clientes lo activan para evitar olvidos y multas.</ScriptStep>
          <ScriptStep number="4" title="Cierre">¿Desea activarlo?</ScriptStep>
          <ScriptStep number="5" title="Precio">$24.900 el año.</ScriptStep>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="text-xl font-black text-slate-950">Reglas para cajeros</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li className="rounded-2xl bg-red-50 p-3 font-bold text-red-700 ring-1 ring-red-100">NO decir: “Aplicación”.</li>
            <li className="rounded-2xl bg-emerald-50 p-3 font-bold text-emerald-700 ring-1 ring-emerald-100">Decir: “Servicio”.</li>
            <li>No sobreexplicar.</li>
            <li>Sonar natural, sin presionar.</li>
            <li>Enfocarse en tranquilidad y prevención.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black text-slate-950">Factura</h3>
          <p className="mt-3 rounded-2xl bg-slate-950 p-4 text-sm font-black text-white">Servicio {APP_NAME} Conductores — Anual</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{formatCurrency(ALLY_PRICE_ANNUAL)} COP</p>
        </Card>
      </div>
    </div>
  );
}

function CdaModal({ cda, onClose, onSave }) {
  const [form, setForm] = useState(cda);
  const accessUser = form.usuarioAcceso || form.correo || "";
  const canPreviewPassword = Boolean(form.passwordTemporal || form.codigoAliado || form.nombreComercial || form.nombreCDA);
  const accessPassword = canPreviewPassword ? form.passwordTemporal || buildCdaAccessPassword(form) : "Se genera al guardar";

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "correo" ? { usuarioAcceso: value.trim().toLowerCase() } : {}),
    }));
  }

  function submitForm(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal-panel">
        <form onSubmit={submitForm}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 p-5 backdrop-blur">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Aliado</p>
              <h2 className="text-xl font-black text-slate-950">{form.nombreCDA || "Nuevo aliado"}</h2>
            </div>
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Field label="ID aliado"><input className="input" value={form.idCDA} onChange={(event) => updateField("idCDA", event.target.value)} /></Field>
            <Field label="Nombre aliado"><input className="input" value={form.nombreCDA} onChange={(event) => updateField("nombreCDA", event.target.value)} /></Field>
            <Field label="Nombre comercial"><input className="input" value={form.nombreComercial} onChange={(event) => updateField("nombreComercial", event.target.value)} /></Field>
            <Field label="Ciudad"><select className="input" value={form.ciudad} onChange={(event) => updateField("ciudad", event.target.value)}>{cityOptions.map((city) => <option key={city}>{city}</option>)}</select></Field>
            <Field label="Zona"><input className="input" value={form.zona} onChange={(event) => updateField("zona", event.target.value)} /></Field>
            <Field label="Dirección"><input className="input" value={form.direccion} onChange={(event) => updateField("direccion", event.target.value)} /></Field>
            <Field label="Teléfono"><input className="input" value={form.telefono} onChange={(event) => updateField("telefono", event.target.value)} /></Field>
            <Field label="WhatsApp"><input className="input" value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} /></Field>
            <Field label="Correo"><input className="input" type="email" value={form.correo} onChange={(event) => updateField("correo", event.target.value)} /></Field>
            <Field label="Nombre contacto"><input className="input" value={form.nombreContacto} onChange={(event) => updateField("nombreContacto", event.target.value)} /></Field>
            <Field label="Estado">
              <select className="input" value={form.estado} onChange={(event) => updateField("estado", event.target.value)}>
                <option value={CDA_STATUS.active}>activo</option>
                <option value={CDA_STATUS.inactive}>inactivo</option>
                <option value={CDA_STATUS.suspended}>suspendido</option>
              </select>
            </Field>
            <Field label="Código aliado"><input className="input font-mono uppercase" value={form.codigoAliado} onChange={(event) => updateField("codigoAliado", event.target.value)} placeholder="ALIADO-LA33" /></Field>
            <div className="rounded-3xl bg-blue-50 p-4 ring-1 ring-blue-100 sm:col-span-2">
              <div className="mb-3 flex items-center gap-2 text-blue-700">
                <KeyRound size={18} />
                <p className="text-sm font-black">Credenciales aliado</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700/70">Usuario</p>
                  <p className="mt-1 break-all text-sm font-black text-blue-950">{accessUser || "Usa el correo del aliado"}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700/70">Contraseña temporal</p>
                  <p className="mt-1 break-all font-mono text-sm font-black text-blue-950">{accessPassword}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-blue-800">La clave se genera como código aliado + últimos 4 dígitos del WhatsApp.</p>
            </div>
            <label className="block sm:col-span-2">
              <span className="label mb-1 block">Observaciones</span>
              <textarea className="input min-h-28" value={form.observaciones} onChange={(event) => updateField("observaciones", event.target.value)} />
            </label>
          </div>
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white/95 p-5 backdrop-blur">
            <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button">Guardar aliado</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ preRegistration, onClose, onConfirm }) {
  const [method, setMethod] = useState("Caja");
  const [email, setEmail] = useState(preRegistration.correo || "");
  const [error, setError] = useState("");

  function confirmPayment() {
    if (!isLikelyEmail(email)) {
      setError("Ingresa el correo del cliente para enviar la bienvenida.");
      return;
    }

    onConfirm(preRegistration, {
      metodoPago: method,
      correoCliente: email.trim().toLowerCase(),
    });
  }

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal-panel app-modal-panel-sm p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Confirmar pago</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{preRegistration.nombreCliente} · {preRegistration.placa}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Cobrar en caja</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(ALLY_PRICE_ANNUAL)}</p>
          <p className="mt-2 font-mono text-sm font-black text-emerald-200">{preRegistration.codigoActivacion}</p>
        </div>
        <Field label="Método de pago">
          <select className="input mt-4" value={method} onChange={(event) => setMethod(event.target.value)}>
            {PAYMENT_METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Correo cliente">
          <input
            className="input mt-4"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="correo@ejemplo.com"
          />
        </Field>
        {error ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p> : null}
        <button type="button" className="primary-button mt-4 w-full" onClick={confirmPayment}>
          Activar membresía anual
        </button>
      </div>
    </div>
  );
}

function CdaSelector({ cdas, selectedCdaId, onChange, canAdmin }) {
  if (!cdas.length) return null;

  if (!canAdmin) {
    const cda = cdas.find((item) => item.idCDA === selectedCdaId) || cdas[0];
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-100">
        <Store size={19} className="text-blue-600" />
        <span className="text-sm font-black text-slate-700">Aliado activo</span>
        <span className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 ring-1 ring-blue-100">{cda.nombreCDA}</span>
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-100">
      <Store size={19} className="text-blue-600" />
      <span className="text-sm font-black text-slate-700">Aliado activo</span>
      <select className="input max-w-md" value={selectedCdaId} onChange={(event) => onChange(event.target.value)}>
        {cdas.map((cda) => (
          <option key={cda.idCDA} value={cda.idCDA}>{cda.nombreCDA}</option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = "info" }) {
  const tones = {
    info: "bg-blue-50 text-blue-700 ring-blue-100",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return (
    <Card className="p-4">
      <div className={`mb-4 grid size-11 place-items-center rounded-2xl ring-1 ${tones[tone] || tones.info}`}>
        <Icon size={21} />
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-black text-slate-950">{value}</p>
    </Card>
  );
}

function buildCredentialText(cda) {
  return [`Usuario: ${cda.usuarioAcceso || cda.correo || ""}`, `Contraseña: ${cda.passwordTemporal || ""}`, `Aliado: ${cda.nombreCDA || ""}`, `Código aliado: ${cda.codigoAliado || ""}`].join("\n");
}

function buildDriverCredentialText(driver) {
  return [
    `Cliente: ${driver.nombreCliente || ""}`,
    `Usuario: ${driver.usuarioAcceso || driver.correo || driver.whatsappCliente || ""}`,
    `Clave temporal: ${driver.passwordTemporal || ""}`,
    `Placa: ${driver.placa || ""}`,
    `Aliado: ${driver.nombreCDA || ""}`,
    `Codigo aliado: ${driver.codigoAliado || ""}`,
  ].join("\n");
}

function getDriverSourceLabel(source = "") {
  const normalized = String(source || "").toLowerCase();
  if (normalized === "manual-caja") return "Caja manual";
  if (normalized === "pre-registro") return "QR + caja";
  if (normalized === "mock") return "Historico";
  return source || "Caja";
}

function IconButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-10 place-items-center rounded-2xl transition hover:-translate-y-0.5 ${
        danger ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-blue-700"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}

function AllyStatusBadge({ status }) {
  const tone = status === CDA_STATUS.active ? "success" : status === CDA_STATUS.suspended ? "danger" : "neutral";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}

function PreRegistrationStatusBadge({ status }) {
  const tone = status === PRE_REGISTRATION_STATUS.active ? "success" : status === PRE_REGISTRATION_STATUS.expired ? "danger" : status === PRE_REGISTRATION_STATUS.pendingPayment ? "warning" : "neutral";
  const pulse = status === PRE_REGISTRATION_STATUS.pendingPayment ? " animate-pulse" : "";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1${pulse} ${tone === "success" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : tone === "danger" ? "bg-red-50 text-red-700 ring-red-100" : tone === "warning" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>{status}</span>;
}

function MembershipStatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const tone = normalized === "activo" || normalized === "active" ? "success" : normalized === "vencido" || normalized === "expired" ? "danger" : "warning";
  return <StatusBadge tone={tone}>{status || "activo"}</StatusBadge>;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ScriptStep({ number, title, children }) {
  return (
    <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white">{number}</div>
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{children}</p>
        </div>
      </div>
    </section>
  );
}

function isAdminUser(user) {
  const role = String(user?.role || "").toLowerCase();
  return role === "owner";
}

function getSnapshotForSessionUser(user) {
  const snapshot = getAllyProgramSnapshot();
  if (isAdminUser(user) || !isAllyProgramSessionUser(user)) return snapshot;

  const hasMatchingAlly = snapshot.cdas.some((cda) => isAllyOwnedByUser(cda, user));
  if (hasMatchingAlly) return snapshot;

  const sessionAlly = buildAllyFromSessionUser(user);
  return sessionAlly ? saveCda(sessionAlly) : snapshot;
}

function isAllyProgramSessionUser(user) {
  const role = String(user?.role || "").toLowerCase();
  return role === "cda_aliado" || role === "cda_ally" || Boolean(user?.canUseAllyProgram);
}

function isAllyOwnedByUser(cda, user) {
  if (!cda || !user) return false;

  const userId = normalizeComparable(user.idCDA);
  const userCode = normalizeComparable(user.codigoAliado);
  const userEmail = normalizeComparable(user.email);

  return Boolean(
    (userId && normalizeComparable(cda.idCDA) === userId) ||
      (userCode && normalizeComparable(cda.codigoAliado) === userCode) ||
      (userEmail && [cda.usuarioAcceso, cda.correo].some((value) => normalizeComparable(value) === userEmail)),
  );
}

function buildAllyFromSessionUser(user) {
  const codigoAliado = String(user?.codigoAliado || "").trim();
  const email = String(user?.email || "").trim().toLowerCase();
  const name = String(user?.nombreCDA || user?.name || codigoAliado || "Aliado").trim();
  const idCDA = String(user?.idCDA || buildSessionAllyId(codigoAliado || email || name)).trim();

  if (!idCDA && !codigoAliado && !email) return null;

  return {
    idCDA,
    nombreCDA: name,
    nombreComercial: name,
    ciudad: user?.city || "Medellin",
    zona: "",
    direccion: "",
    telefono: user?.phone || "",
    whatsapp: user?.phone || "",
    correo: email,
    usuarioAcceso: email,
    nombreContacto: name,
    estado: CDA_STATUS.active,
    codigoAliado,
    logoCdaUrl: user?.logoCdaUrl || "",
    observaciones: "Sincronizado desde usuario aliado.",
  };
}

function buildSessionAllyId(value) {
  const clean = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `ally-${clean || Date.now().toString().slice(-6)}`;
}

function normalizeComparable(value = "") {
  return String(value || "").trim().toLowerCase();
}

function MissingAllyAccess({ user }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <AlertTriangle size={21} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-950">No encontramos este aliado</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            La sesión no coincide con ningún aliado local. Cierra sesión y vuelve a entrar; si continúa, regenera las credenciales del aliado desde el usuario administrador.
          </p>
          <p className="mt-3 break-all font-mono text-xs font-bold text-slate-500">{user?.email || user?.codigoAliado || user?.idCDA || "Sin identificador"}</p>
        </div>
      </div>
    </Card>
  );
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function playSoftBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch {
    // Sound is optional and should never block the dashboard.
  }
}
