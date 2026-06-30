import { createId } from "../../utils/idUtils";
import { setVehicle } from "../../utils/storage";
import { buildActivationCode, buildQrUrl, buildReferralUrl, calculateCdaStats, addOneYearISO } from "./calculations";
import { ALLY_CDA_COMMISSION, ALLY_COPILOT_VALUE, ALLY_PRICE_ANNUAL, ALLY_ROLES, CDA_STATUS, DEFAULT_ALLY_EMAIL_TEMPLATES, LIQUIDATION_STATUS, MEMBERSHIP_STATUS, PRE_REGISTRATION_STATUS } from "./constants";
import { mockCdas, mockLiquidations, mockPreRegistrations, mockSales } from "./mockData";

const KEYS = {
  cdas: "copiloto:allies:cdas",
  preRegistrations: "copiloto:allies:preRegistrations",
  sales: "copiloto:allies:sales",
  drivers: "copiloto:allies:drivers",
  liquidations: "copiloto:allies:liquidations",
};

export function getAllyProgramSnapshot() {
  initializeAllyProgramData();
  const storedCdas = migrateCdaAccess(readJSON(KEYS.cdas, []));
  const preRegistrations = readJSON(KEYS.preRegistrations, []);
  const sales = readJSON(KEYS.sales, []);
  const drivers = migrateActivatedDrivers(readJSON(KEYS.drivers, null), sales, preRegistrations);
  const liquidations = readJSON(KEYS.liquidations, []);
  const cdas = enrichCdas(storedCdas, preRegistrations, sales, liquidations);

  return {
    cdas,
    preRegistrations,
    sales,
    drivers,
    liquidations,
  };
}

export function saveCda(cda) {
  const snapshot = getAllyProgramSnapshot();
  const existing = snapshot.cdas.find((item) => item.idCDA === cda.idCDA);
  const codigoAliado = normalizeAllyCode(cda.codigoAliado || cda.nombreComercial || cda.nombreCDA);
  const urlReferido = buildReferralUrl(codigoAliado);
  const normalized = ensureCdaAccess({
    ...existing,
    ...cda,
    idCDA: cda.idCDA || createId("cda"),
    estado: cda.estado || existing?.estado || CDA_STATUS.active,
    codigoAliado,
    urlReferido,
    qrReferido: buildQrUrl(urlReferido),
    fechaRegistro: cda.fechaRegistro || existing?.fechaRegistro || new Date().toISOString(),
  });
  const nextCdas = existing ? snapshot.cdas.map((item) => (item.idCDA === normalized.idCDA ? normalized : item)) : [normalized, ...snapshot.cdas];
  writeJSON(KEYS.cdas, stripComputedCdaFields(nextCdas));
  return getAllyProgramSnapshot();
}

export function regenerateCdaAccess(idCDA) {
  const snapshot = getAllyProgramSnapshot();
  const nextCdas = snapshot.cdas.map((cda) =>
    cda.idCDA === idCDA
      ? ensureCdaAccess(
          {
            ...cda,
            passwordTemporal: buildCdaAccessPassword(cda),
            credencialesActualizadasEn: new Date().toISOString(),
          },
          { forcePassword: true },
        )
      : cda,
  );
  writeJSON(KEYS.cdas, stripComputedCdaFields(nextCdas));
  return getAllyProgramSnapshot();
}

export function validateCdaAllyLogin(identifier, password) {
  const email = normalizeText(identifier);
  const snapshot = getAllyProgramSnapshot();
  const cda = snapshot.cdas.find((item) => normalizeText(item.usuarioAcceso) === email || normalizeText(item.correo) === email);

  if (!cda) {
    return { ok: false };
  }

  if (cda.estado !== CDA_STATUS.active) {
    return {
      ok: false,
      blocked: true,
      message: "Este aliado no se encuentra disponible actualmente.",
    };
  }

  if (String(cda.passwordTemporal || "") !== String(password || "")) {
    return { ok: false };
  }

  return {
    ok: true,
    user: {
      id: `cda-user-${cda.idCDA}`,
      name: cda.nombreComercial || cda.nombreCDA,
      email: cda.usuarioAcceso || cda.correo,
      phone: cda.whatsapp || cda.telefono || "",
      city: cda.ciudad || "",
      role: ALLY_ROLES.cda,
      idCDA: cda.idCDA,
      codigoAliado: cda.codigoAliado,
      nombreCDA: cda.nombreCDA,
      canUseAllyProgram: true,
      accessActive: true,
      sheetValidated: true,
      source: "cda-ally-login",
      createdAt: new Date().toISOString(),
    },
  };
}

export function validateActivatedDriverLogin(identifier, password) {
  const cleanIdentifier = normalizeLoginIdentifier(identifier);
  if (!cleanIdentifier || !password) return { ok: false };

  const snapshot = getAllyProgramSnapshot();
  const driver = snapshot.drivers.find((item) => {
    const aliases = [item.usuarioAcceso, item.correo, item.whatsappCliente, item.placa].map(normalizeLoginIdentifier).filter(Boolean);
    return aliases.includes(cleanIdentifier);
  });

  if (!driver) return { ok: false };

  if (String(driver.password || driver.passwordTemporal || "") !== String(password || "")) {
    return { ok: false };
  }

  if (driver.estadoMembresia !== MEMBERSHIP_STATUS.active) {
    return {
      ok: false,
      blocked: true,
      message: "La membresía del conductor no se encuentra activa.",
    };
  }

  return {
    ok: true,
    user: buildSessionUserFromDriver(driver),
  };
}

export function updateActivatedDriverPassword(identifier, newPassword) {
  const cleanIdentifier = normalizeLoginIdentifier(identifier);
  const password = String(newPassword || "");
  if (!cleanIdentifier || password.length < 6) {
    return {
      ok: false,
      found: false,
      message: "La nueva contrasena debe tener al menos 6 caracteres.",
    };
  }

  const snapshot = getAllyProgramSnapshot();
  let updatedDriver = null;
  const nextDrivers = snapshot.drivers.map((driver) => {
    const aliases = [driver.idUsuario, driver.usuarioAcceso, driver.correo, driver.whatsappCliente, driver.placa].map(normalizeLoginIdentifier).filter(Boolean);
    if (!aliases.includes(cleanIdentifier)) return driver;

    updatedDriver = {
      ...driver,
      password,
      mustChangePassword: false,
      passwordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return updatedDriver;
  });

  if (!updatedDriver) {
    return {
      ok: false,
      found: false,
      message: "No encontramos este usuario localmente.",
    };
  }

  writeJSON(KEYS.drivers, nextDrivers);
  return {
    ok: true,
    found: true,
    driver: updatedDriver,
  };
}

export function updateCdaStatus(idCDA, estado) {
  const snapshot = getAllyProgramSnapshot();
  writeJSON(
    KEYS.cdas,
    stripComputedCdaFields(snapshot.cdas.map((cda) => (cda.idCDA === idCDA ? { ...cda, estado } : cda))),
  );
  return getAllyProgramSnapshot();
}

export function deleteCda(idCDA) {
  const snapshot = getAllyProgramSnapshot();
  writeJSON(KEYS.cdas, stripComputedCdaFields(snapshot.cdas.filter((cda) => cda.idCDA !== idCDA)));
  return getAllyProgramSnapshot();
}

export function createPublicPreRegistration({ ref, nombreCliente, whatsapp, placa, ciudad }) {
  const snapshot = getAllyProgramSnapshot();
  const referralCode = String(ref || "").trim();
  const cda = snapshot.cdas.find((item) => normalizeText(item.codigoAliado) === normalizeText(referralCode));

  if (cda && cda.estado !== CDA_STATUS.active) {
    return {
      ok: false,
      reason: "cda_suspended",
      message: "Este aliado no se encuentra disponible actualmente.",
    };
  }

  const codigoAliado = cda?.codigoAliado || (referralCode ? normalizeAllyCode(referralCode) : "SIN-ALIADO");
  const fallbackAllyName = referralCode ? `Aliado ${codigoAliado}` : "Registro sin aliado";
  const preRegistration = {
    idPreRegistro: createId("pre"),
    idCDA: cda?.idCDA || (referralCode ? buildReferralAllyId(codigoAliado) : ""),
    codigoAliado,
    nombreCDA: cda?.nombreCDA || fallbackAllyName,
    nombreCliente: String(nombreCliente || "").trim(),
    whatsapp: String(whatsapp || "").trim(),
    placa: String(placa || "").trim().toUpperCase(),
    ciudad: String(ciudad || "").trim(),
    fechaHoraPreRegistro: new Date().toISOString(),
    codigoActivacion: buildActivationCode(codigoAliado),
    estado: PRE_REGISTRATION_STATUS.pendingPayment,
    fuente: referralCode ? "qr" : "sin_aliado",
  };

  writeJSON(KEYS.preRegistrations, [preRegistration, ...snapshot.preRegistrations]);
  return {
    ok: true,
    cda,
    preRegistration,
    snapshot: getAllyProgramSnapshot(),
  };
}

export function createManualActivation(form, cda) {
  const snapshot = getAllyProgramSnapshot();
  if (cda && cda.estado !== CDA_STATUS.active) {
    return {
      ok: false,
      snapshot,
      message: "Este aliado no se encuentra disponible actualmente.",
    };
  }

  const activationDate = new Date();
  const saleDraft = buildSaleFromClient({
    ...form,
    idCDA: cda?.idCDA || "",
    codigoAliado: cda?.codigoAliado || form.codigoAliado || "SIN-ALIADO",
    nombreCDA: cda?.nombreCDA || "Registro sin aliado",
    fechaActivacion: activationDate.toISOString(),
    fechaVencimiento: addOneYearISO(activationDate),
    source: "manual-caja",
  });
  const driver = buildDriverFromActivation({ ...saleDraft, ...form }, cda);
  const sale = {
    ...saleDraft,
    idUsuario: driver.idUsuario,
    usuarioAcceso: driver.usuarioAcceso,
    passwordTemporal: driver.passwordTemporal,
  };
  const nextDrivers = upsertDriver(snapshot.drivers, driver);

  writeJSON(KEYS.sales, [sale, ...snapshot.sales]);
  writeJSON(KEYS.drivers, nextDrivers);
  saveActivatedVehicle(driver);
  return {
    ok: true,
    snapshot: getAllyProgramSnapshot(),
    sale,
    driver,
  };
}

export function activatePreRegistration(idPreRegistro, paymentData = {}) {
  const snapshot = getAllyProgramSnapshot();
  const preRegistration = snapshot.preRegistrations.find((item) => item.idPreRegistro === idPreRegistro);
  if (!preRegistration) {
    return {
      ok: false,
      snapshot,
      message: "No encontramos este pre-registro.",
    };
  }

  const cda = snapshot.cdas.find((item) => item.idCDA === preRegistration.idCDA);
  if (cda && cda.estado !== CDA_STATUS.active) {
    return {
      ok: false,
      snapshot,
      message: "Este aliado no se encuentra disponible actualmente.",
    };
  }

  const activationDate = new Date();
  const saleDraft = buildSaleFromClient({
    idPreRegistro: preRegistration.idPreRegistro,
    idCDA: preRegistration.idCDA,
    codigoAliado: preRegistration.codigoAliado,
    nombreCDA: preRegistration.nombreCDA,
    nombreCliente: preRegistration.nombreCliente,
    whatsappCliente: preRegistration.whatsapp,
    correo: paymentData.correoCliente || paymentData.correo || preRegistration.correo || "",
    placa: preRegistration.placa,
    ciudad: preRegistration.ciudad,
    metodoPago: paymentData.metodoPago || "Caja",
    cajero: paymentData.cajero || "",
    fechaActivacion: activationDate.toISOString(),
    fechaVencimiento: addOneYearISO(activationDate),
    source: "pre-registro",
  });
  const driver = buildDriverFromActivation(saleDraft, cda);
  const sale = {
    ...saleDraft,
    idUsuario: driver.idUsuario,
    usuarioAcceso: driver.usuarioAcceso,
    passwordTemporal: driver.passwordTemporal,
  };
  const nextPreRegistrations = snapshot.preRegistrations.map((item) =>
    item.idPreRegistro === idPreRegistro
      ? {
          ...item,
          estado: PRE_REGISTRATION_STATUS.active,
          fechaActivacion: activationDate.toISOString(),
          fechaVencimiento: sale.fechaVencimiento,
          metodoPago: sale.metodoPago,
          correo: sale.correo,
        }
      : item,
  );
  const nextSales = [sale, ...snapshot.sales];
  const nextDrivers = upsertDriver(snapshot.drivers, driver);

  writeJSON(KEYS.preRegistrations, nextPreRegistrations);
  writeJSON(KEYS.sales, nextSales);
  writeJSON(KEYS.drivers, nextDrivers);
  saveActivatedVehicle(driver);

  if (cda) {
    const cdas = enrichCdas(snapshot.cdas, nextPreRegistrations, nextSales, snapshot.liquidations);
    writeJSON(KEYS.cdas, stripComputedCdaFields(cdas));
  }

  return {
    ok: true,
    snapshot: getAllyProgramSnapshot(),
    sale,
    driver,
  };
}

export function cancelPreRegistration(idPreRegistro) {
  const snapshot = getAllyProgramSnapshot();
  writeJSON(
    KEYS.preRegistrations,
    snapshot.preRegistrations.map((item) => (item.idPreRegistro === idPreRegistro ? { ...item, estado: PRE_REGISTRATION_STATUS.cancelled } : item)),
  );
  return getAllyProgramSnapshot();
}

export function mergeRemotePreRegistrations(remotePreRegistrations = []) {
  if (!Array.isArray(remotePreRegistrations) || !remotePreRegistrations.length) {
    return getAllyProgramSnapshot();
  }

  const snapshot = getAllyProgramSnapshot();
  const byId = new Map(snapshot.preRegistrations.map((item) => [item.idPreRegistro, item]));

  remotePreRegistrations.forEach((item) => {
    if (!item?.idPreRegistro) return;
    const existing = byId.get(item.idPreRegistro);
    const matchingCda = snapshot.cdas.find((cda) => normalizeText(cda.codigoAliado) === normalizeText(item.codigoAliado));
    byId.set(item.idPreRegistro, {
      ...existing,
      ...item,
      idCDA: matchingCda?.idCDA || item.idCDA || existing?.idCDA || "",
      nombreCDA: matchingCda?.nombreCDA || item.nombreCDA || existing?.nombreCDA || "",
      placa: String(item.placa || existing?.placa || "").trim().toUpperCase(),
      remoteSynced: true,
    });
  });

  const nextPreRegistrations = Array.from(byId.values()).sort((left, right) => new Date(right.fechaHoraPreRegistro || 0).getTime() - new Date(left.fechaHoraPreRegistro || 0).getTime());
  writeJSON(KEYS.preRegistrations, nextPreRegistrations);
  return getAllyProgramSnapshot();
}

export function createLiquidation(liquidationDraft) {
  const snapshot = getAllyProgramSnapshot();
  const liquidation = {
    idLiquidacion: createId("liq"),
    estado: LIQUIDATION_STATUS.pending,
    fechaPago: "",
    comprobantePago: "",
    observaciones: "",
    ...liquidationDraft,
  };
  writeJSON(KEYS.liquidations, [liquidation, ...snapshot.liquidations]);
  return getAllyProgramSnapshot();
}

export function markLiquidationPaid(idLiquidacion, comprobantePago = "") {
  const snapshot = getAllyProgramSnapshot();
  writeJSON(
    KEYS.liquidations,
    snapshot.liquidations.map((item) =>
      item.idLiquidacion === idLiquidacion
        ? {
            ...item,
            estado: LIQUIDATION_STATUS.paid,
            saldoPendiente: 0,
            fechaPago: new Date().toISOString().slice(0, 10),
            comprobantePago: comprobantePago || item.comprobantePago || `PAGO-${Date.now().toString().slice(-6)}`,
          }
        : item,
    ),
  );
  return getAllyProgramSnapshot();
}

export function resetAllyProgramDemoData() {
  writeJSON(KEYS.cdas, mockCdas);
  writeJSON(KEYS.preRegistrations, mockPreRegistrations);
  writeJSON(KEYS.sales, mockSales);
  writeJSON(KEYS.drivers, buildDriversFromSales(mockSales));
  writeJSON(KEYS.liquidations, mockLiquidations);
  return getAllyProgramSnapshot();
}

function initializeAllyProgramData() {
  if (!readJSON(KEYS.cdas, null)) {
    writeJSON(KEYS.cdas, mockCdas);
  }
  if (!readJSON(KEYS.preRegistrations, null)) {
    writeJSON(KEYS.preRegistrations, mockPreRegistrations);
  }
  if (!readJSON(KEYS.sales, null)) {
    writeJSON(KEYS.sales, mockSales);
  }
  if (!readJSON(KEYS.drivers, null)) {
    writeJSON(KEYS.drivers, buildDriversFromSales(readJSON(KEYS.sales, mockSales)));
  }
  if (!readJSON(KEYS.liquidations, null)) {
    writeJSON(KEYS.liquidations, mockLiquidations);
  }
}

function migrateCdaAccess(cdas) {
  const migratedCdas = cdas.map((cda) => ensureCdaAccess(cda));
  const changed = JSON.stringify(cdas) !== JSON.stringify(migratedCdas);
  if (changed) {
    writeJSON(KEYS.cdas, stripComputedCdaFields(migratedCdas));
  }
  return migratedCdas;
}

function buildSaleFromClient(client) {
  return {
    idVenta: createId("sale"),
    idUsuario: client.idUsuario || "",
    idCDA: client.idCDA || "",
    codigoAliado: client.codigoAliado || "SIN-ALIADO",
    nombreCDA: client.nombreCDA || "",
    idPreRegistro: client.idPreRegistro || "",
    nombreCliente: String(client.nombreCliente || client.name || "").trim(),
    whatsappCliente: String(client.whatsappCliente || client.whatsapp || "").trim(),
    correo: String(client.correo || "").trim(),
    placa: String(client.placa || "").trim().toUpperCase(),
    tipoVehiculo: client.tipoVehiculo || "",
    ciudad: client.ciudad || "",
    fechaSOAT: client.fechaSOAT || "",
    fechaTecno: client.fechaTecno || "",
    metodoPago: client.metodoPago || "Caja",
    valorPagado: Number(client.valorPagado || ALLY_PRICE_ANNUAL),
    comisionCDA: ALLY_CDA_COMMISSION,
    valorCopilot: ALLY_COPILOT_VALUE,
    estadoMembresia: client.estadoMembresia || MEMBERSHIP_STATUS.active,
    fechaActivacion: client.fechaActivacion || new Date().toISOString(),
    fechaVencimiento: client.fechaVencimiento || addOneYearISO(),
    cajero: client.cajero || "",
    source: client.source || "manual",
  };
}

function buildDriverFromActivation(client, cda) {
  const phone = cleanPhone(client.whatsappCliente || client.whatsapp || "");
  const correo = normalizeAccessEmail(client.correo || "");
  const usuarioAcceso = correo || phone;
  const activationDate = client.fechaActivacion || new Date().toISOString();
  const expirationDate = client.fechaVencimiento || addOneYearISO(activationDate);
  const idUsuario = client.idUsuario || findExistingDriverId(usuarioAcceso, client.placa) || createId("driver");
  const passwordTemporal = client.passwordTemporal || buildDriverAccessPassword({ whatsappCliente: phone, placa: client.placa });

  return {
    idUsuario,
    nombreCliente: String(client.nombreCliente || client.name || "").trim(),
    whatsappCliente: phone,
    correo,
    usuarioAcceso,
    password: client.password || passwordTemporal,
    passwordTemporal,
    mustChangePassword: typeof client.mustChangePassword === "boolean" ? client.mustChangePassword : isCdaDriverSource(client),
    passwordChangeRequired: typeof client.passwordChangeRequired === "boolean" ? client.passwordChangeRequired : isCdaDriverSource(client),
    passwordUpdatedAt: client.passwordUpdatedAt || "",
    idCDA: cda?.idCDA || client.idCDA || "",
    codigoAliado: cda?.codigoAliado || client.codigoAliado || "SIN-ALIADO",
    nombreCDA: cda?.nombreCDA || client.nombreCDA || "Registro sin aliado",
    placa: String(client.placa || "").trim().toUpperCase(),
    tipoVehiculo: client.tipoVehiculo || "Carro",
    ciudad: client.ciudad || cda?.ciudad || "",
    fechaSOAT: client.fechaSOAT || "",
    fechaTecno: client.fechaTecno || "",
    metodoPago: client.metodoPago || "Caja",
    valorPagado: Number(client.valorPagado || ALLY_PRICE_ANNUAL),
    estadoMembresia: client.estadoMembresia || MEMBERSHIP_STATUS.active,
    subscriptionStatus: "active",
    accessActive: true,
    fechaActivacion: activationDate,
    fechaVencimiento: expirationDate,
    subscriptionEndsAt: expirationDate,
    role: ALLY_ROLES.driver,
    source: client.source || "caja",
    updatedAt: new Date().toISOString(),
  };
}

function buildDriversFromSales(sales = []) {
  return sales.reduce((drivers, sale) => upsertDriver(drivers, buildDriverFromActivation(sale, null)), []);
}

function migrateActivatedDrivers(drivers, sales, preRegistrations) {
  let nextDrivers = Array.isArray(drivers) ? drivers.map(normalizeActivatedDriver) : buildDriversFromSales(sales);

  preRegistrations
    .filter((item) => item.estado === PRE_REGISTRATION_STATUS.active)
    .forEach((item) => {
      const matchingSale = sales.find((sale) => sale.idPreRegistro === item.idPreRegistro);
      nextDrivers = upsertDriver(nextDrivers, buildDriverFromActivation({ ...item, ...matchingSale }, null));
    });

  if (!Array.isArray(drivers) || JSON.stringify(drivers) !== JSON.stringify(nextDrivers)) {
    writeJSON(KEYS.drivers, nextDrivers);
  }

  return nextDrivers;
}

function normalizeActivatedDriver(driver) {
  const cdaDriver = isCdaDriverSource(driver);
  const passwordTemporal = driver.passwordTemporal || buildDriverAccessPassword(driver);
  const mustChangePassword =
    typeof driver.mustChangePassword === "boolean"
      ? driver.mustChangePassword
      : typeof driver.passwordChangeRequired === "boolean"
        ? driver.passwordChangeRequired
        : cdaDriver && !driver.passwordUpdatedAt;

  return {
    ...driver,
    password: driver.password || passwordTemporal,
    passwordTemporal,
    mustChangePassword,
    passwordChangeRequired: mustChangePassword,
  };
}

function isCdaDriverSource(driver) {
  const source = String(driver.source || "").toLowerCase();
  return Boolean(driver.idCDA || driver.codigoAliado) && source !== "self-register";
}

function upsertDriver(drivers, driver) {
  const existingIndex = drivers.findIndex((item) => {
    if (driver.idUsuario && item.idUsuario === driver.idUsuario) return true;
    if (driver.usuarioAcceso && normalizeLoginIdentifier(item.usuarioAcceso) === normalizeLoginIdentifier(driver.usuarioAcceso)) return true;
    return item.placa && driver.placa && item.placa === driver.placa && item.idCDA === driver.idCDA;
  });

  if (existingIndex < 0) return [driver, ...drivers];

  return drivers.map((item, index) => (index === existingIndex ? { ...item, ...driver, idUsuario: item.idUsuario || driver.idUsuario } : item));
}

function findExistingDriverId(usuarioAcceso, placa) {
  const drivers = readJSON(KEYS.drivers, []);
  const existing = drivers.find((driver) => {
    if (usuarioAcceso && normalizeLoginIdentifier(driver.usuarioAcceso) === normalizeLoginIdentifier(usuarioAcceso)) return true;
    return placa && driver.placa === String(placa).trim().toUpperCase();
  });
  return existing?.idUsuario || "";
}

export function buildDriverAccessPassword(client) {
  const digits = cleanPhone(client.whatsappCliente || client.whatsapp || "");
  const plate = String(client.placa || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = digits.slice(-4) || plate.slice(-4) || "2026";
  return `C360-${suffix}`;
}

function buildSessionUserFromDriver(driver) {
  return {
    id: driver.idUsuario,
    name: driver.nombreCliente,
    email: driver.usuarioAcceso || driver.correo || driver.whatsappCliente,
    phone: driver.whatsappCliente || "",
    city: driver.ciudad || "Medellin",
    role: "driver",
    subscriptionStatus: "active",
    subscriptionEndsAt: driver.fechaVencimiento || driver.subscriptionEndsAt || "",
    accessActive: true,
    accessType: "active",
    idCDA: driver.idCDA || "",
    codigoAliado: driver.codigoAliado || "",
    nombreCDA: driver.nombreCDA || "",
    mustChangePassword: isCdaDriverSource(driver) ? driver.mustChangePassword !== false : false,
    passwordChangeRequired: isCdaDriverSource(driver) ? driver.passwordChangeRequired !== false : false,
    passwordUpdatedAt: driver.passwordUpdatedAt || "",
    sheetValidated: true,
    source: driver.source || "ally-driver-login",
  };
}

function saveActivatedVehicle(driver) {
  const userEmail = driver.usuarioAcceso || driver.correo || driver.whatsappCliente;
  if (!userEmail || !driver.placa) return;

  setVehicle(
    {
      id: `vehicle-${driver.idUsuario}`,
      userEmail,
      plate: driver.placa,
      type: driver.tipoVehiculo || "Carro",
      city: driver.ciudad || "Medellin",
      soatExpiry: driver.fechaSOAT || "",
      techReviewExpiry: driver.fechaTecno || "",
      soatNoticeDays: "30",
      techReviewNoticeDays: "30",
      updatedAt: new Date().toISOString(),
    },
    userEmail,
  );
}

function enrichCdas(cdas, preRegistrations, sales, liquidations) {
  return cdas.map((cda) => {
    const urlReferido = buildReferralUrl(cda.codigoAliado);
    return {
      ...cda,
      urlReferido,
      qrReferido: buildQrUrl(urlReferido),
      ...calculateCdaStats(cda, preRegistrations, sales, liquidations),
    };
  });
}

function stripComputedCdaFields(cdas) {
  const computed = new Set([
    "totalUsuarios",
    "totalVentas",
    "comisionGenerada",
    "valorCopilotGenerado",
    "saldoPendientePorPagarACopilot",
    "saldoPagado",
    "preRegistros",
    "activacionesPendientes",
    "tasaConversion",
    "ventasDia",
    "ventasMes",
  ]);
  return cdas.map((cda) => Object.fromEntries(Object.entries(cda).filter(([key]) => !computed.has(key))));
}

function ensureCdaAccess(cda, options = {}) {
  const codigoAliado = normalizeAllyCode(cda.codigoAliado || cda.nombreComercial || cda.nombreCDA);
  const usuarioAcceso = normalizeAccessEmail(cda.usuarioAcceso || cda.correo);
  const shouldSetPassword = options.forcePassword || !cda.passwordTemporal;

  return {
    ...cda,
    codigoAliado,
    usuarioAcceso,
    rolAcceso: ALLY_ROLES.cda,
    logoCdaUrl: String(cda.logoCdaUrl || "").trim(),
    emailTemplates: {
      ...DEFAULT_ALLY_EMAIL_TEMPLATES,
      ...(cda.emailTemplates || {}),
    },
    passwordTemporal: shouldSetPassword ? buildCdaAccessPassword({ ...cda, codigoAliado }) : cda.passwordTemporal,
    credencialesActualizadasEn: cda.credencialesActualizadasEn || new Date().toISOString(),
  };
}

export function buildCdaAccessPassword(cda) {
  const code = normalizeAllyCode(cda.codigoAliado || cda.nombreComercial || cda.nombreCDA);
  const digits = String(cda.whatsapp || cda.telefono || "").replace(/\D/g, "");
  const lastFour = (digits.slice(-4) || "2026").padStart(4, "0");
  return `${code}-${lastFour}`;
}

function normalizeAccessEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function cleanPhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function normalizeLoginIdentifier(value = "") {
  const text = String(value || "").trim().toLowerCase();
  return text.includes("@") ? text : text.replace(/\D/g, "") || text;
}

function normalizeAllyCode(value = "") {
  const clean = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
  if (clean.startsWith("CDA-") || clean.startsWith("ALIADO-")) return clean;
  return `ALIADO-${clean || Date.now().toString().slice(-4)}`;
}

function buildReferralAllyId(codigoAliado = "") {
  const clean = String(codigoAliado || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `ally-${clean || Date.now().toString().slice(-6)}`;
}

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
