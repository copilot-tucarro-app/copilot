const SPREADSHEET_ID = '1fsDw-bFuLcX_uzIOCyLZ7ZeiiY9KdNDPSXRuT99IxS8';
const APP_PUBLIC_URL = 'https://copilot-tucarro-app.github.io/copilot/';
const DEFAULT_AGENT_PASSWORD = 'Copiloto123';
const OWNER_ACCESS_EMAIL = 'jrudas';
const OWNER_ACCESS_PASSWORD = 'Rudas2025*';
const DAILY_REMINDER_TRIGGER_HOUR = 0;
const DAILY_REMINDER_TRIGGER_MINUTE = 0;
const DOCUMENT_REMINDER_TRIGGER_HOUR = DAILY_REMINDER_TRIGGER_HOUR;
const DOCUMENT_REMINDER_DEFINITIONS = [
  {
    key: 'soat',
    label: 'SOAT',
    htmlLabel: 'SOAT',
    htmlName: 'SOAT',
    plainName: 'SOAT',
    articleHtml: 'el',
    plainArticle: 'el',
    expiredPlainAdjective: 'vencido',
    expiryField: 'soatVence',
    noticeField: 'soatAvisoDias',
  },
  {
    key: 'tecnomecanica',
    label: 'Tecnomecanica',
    htmlLabel: 'Tecnomec&aacute;nica',
    htmlName: 'tecnomec&aacute;nica',
    plainName: 'tecnomecanica',
    articleHtml: 'la',
    plainArticle: 'la',
    expiredPlainAdjective: 'vencida',
    expiryField: 'tecnomecanicaVence',
    noticeField: 'tecnomecanicaAvisoDias',
  },
  {
    key: 'licencia',
    label: 'Licencia',
    htmlLabel: 'Licencia',
    htmlName: 'licencia',
    plainName: 'licencia',
    articleHtml: 'la',
    plainArticle: 'la',
    expiredPlainAdjective: 'vencida',
    expiryField: 'licenciaVence',
    noticeField: 'licenciaAvisoDias',
  },
  {
    key: 'impuesto',
    label: 'Impuesto vehicular',
    htmlLabel: 'Impuesto vehicular',
    htmlName: 'impuesto vehicular',
    plainName: 'impuesto vehicular',
    articleHtml: 'el',
    plainArticle: 'el',
    expiredPlainAdjective: 'vencido',
    expiryField: 'impuestoVence',
    noticeField: 'impuestoAvisoDias',
  },
];

const SHEETS = {
  compradores: {
    name: 'Compradores',
    headers: ['createdAt', 'buyerId', 'nombre', 'correo', 'telefono', 'ciudad', 'placa', 'password', 'source', 'status', 'appPublicUrl'],
  },
  usuarios: {
    name: 'Usuarios',
    headers: ['createdAt', 'userId', 'nombre', 'correo', 'telefono', 'ciudad', 'password', 'role', 'source', 'canUseSalesAgent'],
  },
  vehiculos: {
    name: 'Vehiculos',
    headers: [
      'updatedAt',
      'userEmail',
      'vehicleId',
      'placa',
      'marca',
      'modelo',
      'year',
      'tipo',
      'ciudad',
      'combustible',
      'kilometrajeActual',
      'autonomiaPorGalon',
      'soatVence',
      'soatAvisoDias',
      'tecnomecanicaVence',
      'tecnomecanicaAvisoDias',
      'licenciaVence',
      'licenciaAvisoDias',
      'impuestoVence',
      'impuestoAvisoDias',
      'proximoAceiteMotorKm',
      'proximoAceiteCajaKm',
    ],
  },
  apiLog: {
    name: 'ApiLog',
    headers: ['timestamp', 'action', 'status', 'message', 'rawPayload'],
  },
  correosVencimientos: {
    name: 'CorreosVencimientos',
    headers: ['timestamp', 'notificationKey', 'userEmail', 'nombre', 'vehicleId', 'placa', 'documento', 'fechaVencimiento', 'diasRestantes', 'tipoRecordatorio', 'status', 'message'],
  },
  correosPicoPlaca: {
    name: 'CorreosPicoPlaca',
    headers: ['timestamp', 'notificationKey', 'userEmail', 'nombre', 'vehicleId', 'placa', 'ciudad', 'tipoVehiculo', 'fechaRestriccion', 'digitoEvaluado', 'horario', 'status', 'message'],
  },
  novedades: {
    name: 'Novedades',
    headers: ['id', 'seccion', 'titulo', 'descripcion', 'categoria', 'fecha', 'imageUrl', 'videoUrl', 'activo'],
  },
  codigoTransito: {
    name: 'CodigoTransito',
    headers: ['id', 'articulo', 'titulo', 'resumen', 'detalle', 'recomendaciones', 'palabrasClave', 'activo'],
  },
  fotomultas: {
    name: 'Fotomultas',
    headers: ['id', 'municipio', 'direccion', 'velocidadMaxima', 'tipoCamara', 'imagenUrl', 'coordenadas', 'activo'],
  },
  picoPlacaReglas: {
    name: 'PicoPlacaReglas',
    headers: [
      'ciudad',
      'label',
      'tipoVehiculo',
      'diaSemana',
      'tipoRegla',
      'digitosRestriccion',
      'criterioPlaca',
      'horarioInicio',
      'horarioFin',
      'activo',
      'fechaInicio',
      'fechaFin',
      'nota',
      'fuenteOficial',
      'urlFuente',
    ],
  },
};

function setupCopilotSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.values(SHEETS).forEach((definition) => ensureSheet_(ss, definition.name, definition.headers));
  ensureOwnerUser_();
  return { ok: true, message: 'COPILOT sheets ready' };
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'health';
  const callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : '';

  if (action === 'setup') {
    return json_(setupCopilotSheets());
  }

  if (action === 'validateLogin') {
    const result = validateLogin_(e.parameter.identifier || e.parameter.email || '', e.parameter.password || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getHomeNews') {
    const result = getHomeNews_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getTransitArticles') {
    const result = getTransitArticles_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getPhotoFines') {
    const result = getPhotoFines_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getPicoPlacaRules') {
    const result = getPicoPlacaRules_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getPicoBootstrap') {
    const result = getPicoBootstrap_(e.parameter.email || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getVehicleByUser') {
    const result = getVehicleByUser_(e.parameter.email || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  const result = {
    ok: true,
    app: 'COPILOT',
    action,
    timestamp: new Date().toISOString(),
  };

  return callback ? jsonp_(callback, result) : json_(result);
}

function doPost(e) {
  const payload = parsePayload_(e);

  try {
    setupCopilotSheets();
    const result = handleAction_(payload);
    appendApiLog_(payload.action || 'unknown', 'ok', result.message || 'OK', payload);
    return json_(result);
  } catch (error) {
    appendApiLog_(payload.action || 'unknown', 'error', error.message, payload);
    return json_({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

function handleAction_(payload) {
  const action = payload.action;

  if (action === 'registerBuyerFromAgent') {
    return registerBuyerFromAgent_(payload.buyer || {});
  }

  if (action === 'registerUser') {
    return registerUser_(payload.user || {});
  }

  if (action === 'saveVehicle') {
    return saveVehicle_(payload.vehicle || {}, payload.user || {});
  }

  if (action === 'logEvent') {
    appendApiLog_('clientEvent', 'ok', 'Client event', payload.event || {});
    return { ok: true, message: 'Event logged' };
  }

  throw new Error('Unsupported action: ' + action);
}

function registerBuyerFromAgent_(buyer) {
  if (!buyer.name || !buyer.email || !buyer.phone) {
    throw new Error('Buyer requires name, email and phone');
  }

  const createdAt = buyer.createdAt || new Date().toISOString();
  const buyerId = buyer.id || Utilities.getUuid();
  const email = String(buyer.email).trim().toLowerCase();

  appendRow_(SHEETS.compradores.name, [
    createdAt,
    buyerId,
    buyer.name || '',
    email,
    cleanPhone_(buyer.phone),
    buyer.city || '',
    buyer.plate || '',
    buyer.password || DEFAULT_AGENT_PASSWORD,
    buyer.source || 'sales-agent',
    'registered',
    APP_PUBLIC_URL,
  ]);

  appendRow_(SHEETS.usuarios.name, [
    createdAt,
    buyerId,
    buyer.name || '',
    email,
    cleanPhone_(buyer.phone),
    buyer.city || '',
    buyer.password || DEFAULT_AGENT_PASSWORD,
    'buyer',
    buyer.source || 'sales-agent',
    false,
  ]);

  if (buyer.plate) {
    appendRow_(SHEETS.vehiculos.name, [
      createdAt,
      email,
      Utilities.getUuid(),
      String(buyer.plate).trim().toUpperCase(),
      '',
      '',
      '',
      '',
      buyer.city || '',
      '',
      '',
      '',
      '',
      30,
      '',
      30,
      '',
      30,
      '',
      30,
      '',
      '',
    ]);
  }

  return { ok: true, message: 'Buyer registered', buyerId };
}

function registerUser_(user) {
  const createdAt = user.createdAt || new Date().toISOString();
  const userId = user.id || Utilities.getUuid();

  appendRow_(SHEETS.usuarios.name, [
    createdAt,
    userId,
    user.name || '',
    String(user.email || '').trim().toLowerCase(),
    cleanPhone_(user.phone || ''),
    user.city || '',
    user.password || '',
    user.role || 'driver',
    user.source || 'self-register',
    Boolean(user.canUseSalesAgent),
  ]);

  return { ok: true, message: 'User registered', userId };
}

function validateLogin_(identifier, password) {
  const cleanIdentifier = String(identifier || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanIdentifier || !cleanPassword) {
    return { ok: false, message: 'Correo/usuario y contraseña son obligatorios' };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.usuarios.name);
  const rows = getRowsAsObjects_(sheet);
  const user = rows
    .slice()
    .reverse()
    .find((row) => String(row.correo || '').trim().toLowerCase() === cleanIdentifier);

  if (!user) {
    return { ok: false, message: 'Usuario no encontrado' };
  }

  let storedPassword = String(user.password || '');

  if (!storedPassword && String(user.role || '').toLowerCase() === 'buyer') {
    const buyer = findBuyerByEmail_(cleanIdentifier);
    storedPassword = buyer ? String(buyer.password || '') : '';
  }

  if (storedPassword !== cleanPassword) {
    return { ok: false, message: 'Contraseña incorrecta' };
  }

  return {
    ok: true,
    message: 'Login validado',
    user: {
      id: user.userId || Utilities.getUuid(),
      name: user.nombre || cleanIdentifier,
      email: cleanIdentifier,
      phone: cleanPhone_(user.telefono || ''),
      city: user.ciudad || 'Medellin',
      role: user.role || 'driver',
      source: user.source || 'sheet-login',
      canUseSalesAgent: parseBoolean_(user.canUseSalesAgent),
      sheetValidated: true,
    },
  };
}

function ensureOwnerUser_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.usuarios.name);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((header) => String(header || '').trim());
  const emailIndex = headers.indexOf('correo');
  const ownerRowIndex = values.findIndex((row, index) => index > 0 && String(row[emailIndex] || '').trim().toLowerCase() === OWNER_ACCESS_EMAIL);

  if (ownerRowIndex === -1) {
    appendRow_(SHEETS.usuarios.name, [
      new Date().toISOString(),
      'owner-jrudas',
      'Jrudas',
      OWNER_ACCESS_EMAIL,
      '',
      'Medellin',
      OWNER_ACCESS_PASSWORD,
      'owner',
      'owner-login',
      true,
    ]);
    return;
  }

  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'userId', 'owner-jrudas');
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'nombre', 'Jrudas');
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'correo', OWNER_ACCESS_EMAIL);
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'ciudad', 'Medellin');
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'password', OWNER_ACCESS_PASSWORD);
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'role', 'owner');
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'source', 'owner-login');
  setCellByHeader_(sheet, ownerRowIndex + 1, headers, 'canUseSalesAgent', true);
}

function saveVehicle_(vehicle, user) {
  const updatedAt = vehicle.updatedAt || new Date().toISOString();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const cleanEmail = String(user.email || vehicle.userEmail || '').trim().toLowerCase();
  const cleanPlate = String(vehicle.plate || '').trim().toUpperCase();
  const existingRowNumber = findVehicleRowNumber_(sheet, SHEETS.vehiculos.headers, {
    userEmail: cleanEmail,
    vehicleId: vehicle.id,
    plate: cleanPlate,
  });
  const vehicleId = vehicle.id || getVehicleIdFromRow_(sheet, SHEETS.vehiculos.headers, existingRowNumber) || Utilities.getUuid();

  const rowValues = [
    updatedAt,
    cleanEmail,
    vehicleId,
    cleanPlate,
    vehicle.brand || '',
    vehicle.model || '',
    vehicle.year || '',
    vehicle.type || '',
    vehicle.city || '',
    vehicle.fuel || '',
    vehicle.currentMileage || '',
    vehicle.autonomyPerGallon || '',
    vehicle.soatExpiry || '',
    vehicle.soatNoticeDays || 30,
    vehicle.techReviewExpiry || '',
    vehicle.techReviewNoticeDays || 30,
    vehicle.licenseExpiry || '',
    vehicle.licenseNoticeDays || 30,
    vehicle.taxExpiry || '',
    vehicle.taxNoticeDays || 30,
    vehicle.nextEngineOilKm || '',
    vehicle.nextGearboxOilKm || '',
  ];

  if (existingRowNumber) {
    sheet.getRange(existingRowNumber, 1, 1, rowValues.length).setValues([rowValues]);
    return { ok: true, message: 'Vehicle updated', vehicleId };
  }

  sheet.appendRow(rowValues);
  return { ok: true, message: 'Vehicle created', vehicleId };
}

function findVehicleRowNumber_(sheet, headers, criteria) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const emailIndex = headers.indexOf('userEmail');
  const vehicleIdIndex = headers.indexOf('vehicleId');
  const plateIndex = headers.indexOf('placa');
  const cleanEmail = String(criteria.userEmail || '').trim().toLowerCase();
  const cleanVehicleId = String(criteria.vehicleId || '').trim();
  const cleanPlate = String(criteria.plate || '').trim().toUpperCase();

  if (cleanEmail && emailIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      if (String(values[rowIndex][emailIndex] || '').trim().toLowerCase() === cleanEmail) {
        return rowIndex + 1;
      }
    }
  }

  if (cleanVehicleId && vehicleIdIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      if (String(values[rowIndex][vehicleIdIndex] || '').trim() === cleanVehicleId) {
        return rowIndex + 1;
      }
    }
  }

  if (cleanPlate && plateIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      if (String(values[rowIndex][plateIndex] || '').trim().toUpperCase() === cleanPlate) {
        return rowIndex + 1;
      }
    }
  }

  return null;
}

function getVehicleIdFromRow_(sheet, headers, rowNumber) {
  if (!rowNumber) return '';
  const vehicleIdIndex = headers.indexOf('vehicleId');
  if (vehicleIdIndex < 0) return '';
  return String(sheet.getRange(rowNumber, vehicleIdIndex + 1).getValue() || '').trim();
}

function getVehicleByUser_(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { ok: false, message: 'Email requerido' };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.vehiculos.name);
  const row = getRowsAsObjects_(sheet)
    .slice()
    .reverse()
    .find((item) => String(item.userEmail || '').trim().toLowerCase() === cleanEmail);

  if (!row) {
    return { ok: true, vehicle: null };
  }

  return {
    ok: true,
    vehicle: {
      id: row.vehicleId || Utilities.getUuid(),
      userEmail: cleanEmail,
      plate: row.placa || '',
      brand: row.marca || '',
      model: row.modelo || '',
      year: row.year || '',
      type: row.tipo || 'Carro',
      city: row.ciudad || 'Medellin',
      fuel: row.combustible || '',
      currentMileage: row.kilometrajeActual || '',
      autonomyPerGallon: row.autonomiaPorGalon || '',
      soatExpiry: formatSheetDate_(row.soatVence),
      soatNoticeDays: row.soatAvisoDias || 30,
      techReviewExpiry: formatSheetDate_(row.tecnomecanicaVence),
      techReviewNoticeDays: row.tecnomecanicaAvisoDias || 30,
      licenseExpiry: formatSheetDate_(row.licenciaVence),
      licenseNoticeDays: row.licenciaAvisoDias || 30,
      taxExpiry: formatSheetDate_(row.impuestoVence),
      taxNoticeDays: row.impuestoAvisoDias || 30,
      nextEngineOilKm: row.proximoAceiteMotorKm || '',
      nextGearboxOilKm: row.proximoAceiteCajaKm || '',
      updatedAt: formatSheetDateTime_(row.updatedAt),
    },
  };
}

function getPicoBootstrap_(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const vehicleResult = cleanEmail ? getVehicleByUser_(cleanEmail) : { ok: true, vehicle: null };
  const rulesResult = getPicoPlacaRules_();

  return {
    ok: true,
    vehicle: vehicleResult.vehicle || null,
    picoRules: rulesResult.items || [],
  };
}

function getHomeNews_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.novedades.name);
  const items = getRowsAsObjects_(sheet)
    .filter((row) => isActive_(row.activo))
    .map((row, index) => ({
      id: row.id || 'news-' + index,
      section: row.seccion || 'Novedades de transito',
      title: row.titulo || '',
      description: row.descripcion || '',
      category: row.categoria || 'General',
      date: formatSheetDate_(row.fecha) || '',
      imageUrl: row.imageUrl || '',
      videoUrl: row.videoUrl || '',
    }))
    .filter((item) => item.title);

  return { ok: true, items };
}

function getTransitArticles_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.codigoTransito.name);
  const items = getRowsAsObjects_(sheet)
    .filter((row) => isActive_(getValue_(row, ['activo', 'estado', 'visible'])))
    .map((row, index) => ({
      id: getValue_(row, ['id', 'codigo', 'codigoArticulo']) || 'art-' + index,
      article: getValue_(row, ['articulo', 'artículo', 'numeroArticulo', 'numero', 'article']) || '',
      title: getValue_(row, ['titulo', 'título', 'tema', 'nombre', 'title']) || '',
      summary: getValue_(row, ['resumen', 'descripcion', 'descripción', 'detalle', 'texto', 'summary']) || '',
      details: getValue_(row, ['detalle', 'detalles', 'masInformacion', 'más información', 'informacion', 'información', 'moreInfo']) || '',
      recommendations: splitList_(getValue_(row, ['recomendaciones', 'consejos', 'tips', 'acciones', 'recommendations'])),
      keywords: splitList_(getValue_(row, ['palabrasClave', 'palabras clave', 'keywords', 'tags', 'categoria', 'categoría'])),
    }))
    .filter((item) => item.article || item.title || item.summary);

  return { ok: true, items };
}

function getPhotoFines_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.fotomultas.name);
  const items = getRowsAsObjects_(sheet)
    .filter((row) => isActive_(row.activo))
    .map((row, index) => ({
      id: row.id || 'cam-' + index,
      municipality: row.municipio || '',
      address: row.direccion || '',
      speedLimit: row.velocidadMaxima || '',
      type: row.tipoCamara || '',
      imageUrl: row.imagenUrl || '',
      coordinates: row.coordenadas || '',
    }))
    .filter((item) => item.address);

  return { ok: true, items };
}

function getPicoPlacaRules_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.picoPlacaReglas.name);
  const rows = getRowsAsObjects_(sheet);
  const items = rows
    .map((row) => {
      const ciudad = getValue_(row, ['ciudad', 'municipio', 'city']) || '';
      const tipoRegla = getValue_(row, ['tipoRegla', 'ruleType']) || 'lista';

      return {
        ciudad,
        label: getValue_(row, ['label', 'nombre', 'zona']) || ciudad,
        tipoVehiculo: getValue_(row, ['tipoVehiculo', 'tipo', 'vehicleType']) || 'particular',
        diaSemana: getValue_(row, ['diaSemana', 'dia', 'weekday']) || 'todos',
        tipoRegla,
        digitosRestriccion: getValue_(row, ['digitosRestriccion', 'digitos', 'restriccion', 'placas']) || '',
        criterioPlaca: getValue_(row, ['criterioPlaca', 'plateCriteria']) || 'ultimo',
        horarioInicio: formatSheetTime_(getValue_(row, ['horarioInicio', 'startTime'])),
        horarioFin: formatSheetTime_(getValue_(row, ['horarioFin', 'endTime'])),
        activo: getValue_(row, ['activo', 'active', 'estado']),
        fechaInicio: formatSheetDate_(getValue_(row, ['fechaInicio', 'startDate'])),
        fechaFin: formatSheetDate_(getValue_(row, ['fechaFin', 'endDate'])),
        nota: getValue_(row, ['nota', 'observacion']) || 'Reglas cargadas desde Google Sheets.',
        fuenteOficial: getValue_(row, ['fuenteOficial', 'fuente', 'officialSource']) || '',
        urlFuente: getValue_(row, ['urlFuente', 'url', 'sourceUrl']) || '',
      };
    })
    .filter((rule) => rule.ciudad && isActive_(rule.activo));

  return { ok: true, items };
}

function installDailyReminderTrigger() {
  setupCopilotSheets();

  const handlerName = 'sendDailyReminderEmails';
  const removed = removeTriggersByHandlerNames_([
    handlerName,
    'sendDocumentExpiryReminders',
    'sendPicoPlacaReminders',
  ]);

  ScriptApp.newTrigger(handlerName)
    .timeBased()
    .atHour(DAILY_REMINDER_TRIGGER_HOUR)
    .nearMinute(DAILY_REMINDER_TRIGGER_MINUTE)
    .everyDays(1)
    .inTimezone(Session.getScriptTimeZone())
    .create();

  return {
    ok: true,
    message: 'Daily reminder trigger installed',
    handler: handlerName,
    hour: DAILY_REMINDER_TRIGGER_HOUR,
    minute: DAILY_REMINDER_TRIGGER_MINUTE,
    timezone: Session.getScriptTimeZone(),
    removed,
  };
}

function installDocumentExpiryReminderTrigger() {
  return installDailyReminderTrigger();
}

function removeDailyReminderTriggers() {
  const removed = removeTriggersByHandlerNames_([
    'sendDailyReminderEmails',
    'sendDocumentExpiryReminders',
    'sendPicoPlacaReminders',
  ]);

  return { ok: true, removed };
}

function removeDocumentExpiryReminderTriggers() {
  return removeDailyReminderTriggers();
}

function removeTriggersByHandlerNames_(handlerNames) {
  const handlerLookup = {};
  let removed = 0;

  handlerNames.forEach((handlerName) => {
    handlerLookup[handlerName] = true;
  });

  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (handlerLookup[trigger.getHandlerFunction()]) {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });

  return removed;
}

function sendDailyReminderEmails() {
  setupCopilotSheets();

  const documentSummary = runReminderJob_('sendDocumentExpiryReminders', () => sendDocumentExpiryReminders({ skipSetup: true }));
  const picoPlacaSummary = runReminderJob_('sendPicoPlacaReminders', () => sendPicoPlacaReminders({ skipSetup: true }));

  return {
    ok: Boolean(documentSummary.ok && picoPlacaSummary.ok),
    documentSummary,
    picoPlacaSummary,
  };
}

function runReminderJob_(action, callback) {
  try {
    return callback();
  } catch (error) {
    appendApiLog_(action, 'error', error.message, {});
    return { ok: false, error: error.message };
  }
}

function sendDocumentExpiryReminders(options) {
  if (!options || !options.skipSetup) setupCopilotSheets();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const vehicleSheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const logSheet = ensureSheet_(ss, SHEETS.correosVencimientos.name, SHEETS.correosVencimientos.headers);
  const vehicles = getRowsAsObjects_(vehicleSheet);
  const usersByEmail = buildUsersByEmail_(ss);
  const sentKeys = getSentDocumentReminderKeys_(logSheet);
  const today = getTodayDateOnly_();
  const summary = {
    ok: true,
    checkedVehicles: vehicles.length,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  vehicles.forEach((vehicle) => {
    const email = String(vehicle.userEmail || '').trim().toLowerCase();
    const plate = String(vehicle.placa || '').trim().toUpperCase();
    const vehicleId = String(vehicle.vehicleId || '').trim();

    if (!isLikelyEmail_(email)) {
      summary.skipped += 1;
      return;
    }

    DOCUMENT_REMINDER_DEFINITIONS.forEach((definition) => {
      const expiryDate = parseSheetDateOnly_(vehicle[definition.expiryField]);
      if (!expiryDate) return;

      const noticeDays = normalizeNoticeDays_(vehicle[definition.noticeField]);
      const daysRemaining = daysBetweenDateOnly_(today, expiryDate);
      const reminderType = getDocumentReminderType_(daysRemaining, noticeDays);
      if (!reminderType) return;

      const expiryDateKey = formatDateOnlyForKey_(expiryDate);
      const notificationKey = buildDocumentReminderKey_(email, vehicleId, plate, definition.key, expiryDateKey, reminderType);

      if (sentKeys[notificationKey]) {
        summary.skipped += 1;
        return;
      }

      const user = usersByEmail[email] || {};
      const userName = user.nombre || user.name || email;
      const reminder = buildDocumentReminderEmail_({
        definition,
        email,
        userName,
        plate,
        expiryDate,
        daysRemaining,
        reminderType,
      });

      try {
        MailApp.sendEmail({
          to: email,
          subject: reminder.subject,
          body: reminder.plainBody,
          htmlBody: reminder.htmlBody,
          name: 'Copiloto',
        });

        appendDocumentReminderLog_(logSheet, {
          notificationKey,
          email,
          userName,
          vehicleId,
          plate,
          documentLabel: definition.label,
          expiryDate: expiryDateKey,
          daysRemaining,
          reminderType,
          status: 'sent',
          message: reminder.subject,
        });

        sentKeys[notificationKey] = true;
        summary.sent += 1;
        summary.details.push({
          email,
          plate,
          document: definition.label,
          daysRemaining,
          status: 'sent',
        });
      } catch (error) {
        appendDocumentReminderLog_(logSheet, {
          notificationKey,
          email,
          userName,
          vehicleId,
          plate,
          documentLabel: definition.label,
          expiryDate: expiryDateKey,
          daysRemaining,
          reminderType,
          status: 'error',
          message: error.message,
        });

        summary.errors += 1;
        summary.details.push({
          email,
          plate,
          document: definition.label,
          daysRemaining,
          status: 'error',
          message: error.message,
        });
      }
    });
  });

  return summary;
}

function sendPicoPlacaReminders(options) {
  if (!options || !options.skipSetup) setupCopilotSheets();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const vehicleSheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const logSheet = ensureSheet_(ss, SHEETS.correosPicoPlaca.name, SHEETS.correosPicoPlaca.headers);
  const vehicles = getRowsAsObjects_(vehicleSheet);
  const usersByEmail = buildUsersByEmail_(ss);
  const sentKeys = getSentReminderKeys_(logSheet);
  const picoRules = normalizePicoRules_(getPicoPlacaRules_().items || []);
  const today = getTodayDateOnly_();
  const dateKey = formatDateOnlyForKey_(today);
  const summary = {
    ok: true,
    checkedVehicles: vehicles.length,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  vehicles.forEach((vehicle) => {
    const email = String(vehicle.userEmail || '').trim().toLowerCase();
    const plate = normalizePicoPlate_(vehicle.placa);
    const vehicleId = String(vehicle.vehicleId || '').trim();
    const city = String(vehicle.ciudad || '').trim();
    const vehicleType = normalizePicoVehicleType_(vehicle.tipo || 'particular');

    if (!isLikelyEmail_(email) || !plate || !city) {
      summary.skipped += 1;
      return;
    }

    const result = evaluatePicoPlacaForVehicle_({
      city,
      plate,
      vehicleType,
      rules: picoRules,
      date: today,
    });

    if (!result.applies) return;

    const notificationKey = buildPicoPlacaReminderKey_(email, vehicleId, plate, city, vehicleType, dateKey);

    if (sentKeys[notificationKey]) {
      summary.skipped += 1;
      return;
    }

    const user = usersByEmail[email] || {};
    const userName = user.nombre || user.name || email;
    const reminder = buildPicoPlacaReminderEmail_({
      email,
      userName,
      plate,
      city,
      vehicleType,
      date: today,
      rule: result.rule,
      digit: result.digit,
      restrictionText: result.restrictionText,
    });

    try {
      MailApp.sendEmail({
        to: email,
        subject: reminder.subject,
        body: reminder.plainBody,
        htmlBody: reminder.htmlBody,
        name: 'Copiloto',
      });

      appendPicoPlacaReminderLog_(logSheet, {
        notificationKey,
        email,
        userName,
        vehicleId,
        plate,
        city,
        vehicleType,
        restrictionDate: dateKey,
        digit: result.digit,
        schedule: formatPicoSchedule_(result.rule),
        status: 'sent',
        message: reminder.subject,
      });

      sentKeys[notificationKey] = true;
      summary.sent += 1;
      summary.details.push({
        email,
        plate,
        city,
        vehicleType,
        status: 'sent',
      });
    } catch (error) {
      appendPicoPlacaReminderLog_(logSheet, {
        notificationKey,
        email,
        userName,
        vehicleId,
        plate,
        city,
        vehicleType,
        restrictionDate: dateKey,
        digit: result.digit,
        schedule: formatPicoSchedule_(result.rule),
        status: 'error',
        message: error.message,
      });

      summary.errors += 1;
      summary.details.push({
        email,
        plate,
        city,
        vehicleType,
        status: 'error',
        message: error.message,
      });
    }
  });

  return summary;
}

function buildUsersByEmail_(ss) {
  const sheet = ensureSheet_(ss, SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const usersByEmail = {};

  getRowsAsObjects_(sheet).forEach((user) => {
    const email = String(user.correo || '').trim().toLowerCase();
    if (email) {
      usersByEmail[email] = user;
    }
  });

  return usersByEmail;
}

function getSentDocumentReminderKeys_(logSheet) {
  return getSentReminderKeys_(logSheet);
}

function getSentReminderKeys_(logSheet) {
  const sentKeys = {};

  getRowsAsObjects_(logSheet)
    .filter((row) => String(row.status || '').trim().toLowerCase() === 'sent')
    .forEach((row) => {
      const key = String(row.notificationKey || '').trim();
      if (key) sentKeys[key] = true;
    });

  return sentKeys;
}

function appendDocumentReminderLog_(sheet, item) {
  sheet.appendRow([
    new Date().toISOString(),
    item.notificationKey || '',
    item.email || '',
    item.userName || '',
    item.vehicleId || '',
    item.plate || '',
    item.documentLabel || '',
    item.expiryDate || '',
    item.daysRemaining,
    item.reminderType || '',
    item.status || '',
    item.message || '',
  ]);
}

function appendPicoPlacaReminderLog_(sheet, item) {
  sheet.appendRow([
    new Date().toISOString(),
    item.notificationKey || '',
    item.email || '',
    item.userName || '',
    item.vehicleId || '',
    item.plate || '',
    item.city || '',
    item.vehicleType || '',
    item.restrictionDate || '',
    item.digit,
    item.schedule || '',
    item.status || '',
    item.message || '',
  ]);
}

function buildDocumentReminderEmail_(context) {
  const copy = getDocumentReminderCopy_(context.definition, context.daysRemaining);
  const expiryDateText = formatDateForEmail_(context.expiryDate);
  const safeName = escapeHtml_(context.userName || context.email);
  const safePlate = escapeHtml_(context.plate || 'Sin placa');
  const safeUrl = escapeHtml_(APP_PUBLIC_URL);
  const htmlBody = buildDocumentReminderHtml_({
    nombreUsuario: safeName,
    placaVehiculo: safePlate,
    articuloDocumento: context.definition.articleHtml,
    documentoHtml: context.definition.htmlLabel,
    nombreDocumentoHtml: context.definition.htmlName,
    diasRestantes: copy.daysValue,
    etiquetaDias: copy.daysUnit,
    textoDias: copy.daysCaption,
    recordatorioTitulo: copy.badgeTitle,
    fechaVencimientoSoat: escapeHtml_(expiryDateText),
    urlApp: safeUrl,
    anio: new Date().getFullYear(),
    bloqueRenovacion: context.definition.key === 'soat' ? buildSoatRenewalBlock_() : buildGenericDocumentHelpBlock_(context.definition),
    badgeBackground: copy.badgeBackground,
    badgeBorder: copy.badgeBorder,
    badgeText: copy.badgeText,
    badgeAccent: copy.badgeAccent,
  });

  return {
    subject: copy.subject,
    htmlBody,
    plainBody: buildDocumentReminderPlainBody_({
      userName: context.userName || context.email,
      plate: context.plate || 'Sin placa',
      documentName: context.definition.plainName,
      documentArticle: context.definition.plainArticle,
      expiredAdjective: context.definition.expiredPlainAdjective,
      expiryDateText,
      daysRemaining: context.daysRemaining,
      urlApp: APP_PUBLIC_URL,
    }),
  };
}

function buildDocumentReminderHtml_(values) {
  const template = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f5f7fb;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10);">
          <tr>
            <td align="center" style="padding:26px 20px 14px;background:#101828;">
              <img src="https://drive.google.com/uc?export=view&id=1_zZKKMRnFKYhQ4Renm1wIon9HV714C3I"
                   alt="Copiloto"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Tu asistente inteligente para conducir tranquilo
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                Te recordamos que {{articuloDocumento}} {{nombreDocumentoHtml}} del veh&iacute;culo con placa
                <strong style="color:#101828;">{{placaVehiculo}}</strong> requiere tu atenci&oacute;n.
              </p>

              <div style="background:{{badgeBackground}};border:2px solid {{badgeBorder}};border-radius:18px;padding:24px;text-align:center;margin:24px 0;">
                <p style="margin:0;color:{{badgeText}};font-size:15px;font-weight:bold;">
                  {{recordatorioTitulo}}
                </p>
                <p style="margin:10px 0 4px;font-size:38px;font-weight:800;color:{{badgeAccent}};">
                  {{diasRestantes}} {{etiquetaDias}}
                </p>
                <p style="margin:0;color:{{badgeText}};font-size:16px;">
                  {{textoDias}}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;margin:0 0 22px;">
                <tr>
                  <td style="padding:16px;font-size:15px;">
                    <strong>Placa:</strong> {{placaVehiculo}}<br>
                    <strong>Fecha de vencimiento:</strong> {{fechaVencimientoSoat}}<br>
                    <strong>Documento:</strong> {{documentoHtml}}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.6;color:#475467;margin:0 0 22px;">
                Renovarlo a tiempo te ayuda a evitar sanciones, contratiempos en carretera y problemas durante controles de tr&aacute;nsito.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="{{urlApp}}"
                   style="background:#101828;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">
                  Revisar en Copiloto
                </a>
              </div>

              {{bloqueRenovacion}}
            </td>
          </tr>

          <tr>
            <td>
              <img src="https://drive.google.com/uc?export=view&id=1_01IYLdW1UCGA2DVsf0Wr6FjXKymIvFC"
                   alt="Copiloto"
                   style="width:100%;display:block;height:auto;">
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              &copy; {{anio}} Copiloto. Mensaje autom&aacute;tico de recordatorio.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return fillTemplate_(template, values);
}

function buildSoatRenewalBlock_() {
  return `<div style="border-top:1px solid #eaecf0;padding-top:22px;margin-top:24px;">
                <p style="font-size:15px;font-weight:bold;margin:0 0 12px;color:#101828;">
                  Comprar o renovar SOAT de forma segura:
                </p>

                <p style="font-size:14px;line-height:1.6;color:#475467;margin:0 0 14px;">
                  Compra &uacute;nicamente en canales oficiales, aseguradoras autorizadas o sitios seguros.
                </p>

                <p style="margin:0;text-align:center;">
                  <a href="https://www.fasecolda.com/ramos/soat/companias-autorizadas/" style="color:#f97316;font-weight:bold;text-decoration:none;">Ver aseguradoras autorizadas</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.sura.co/seguros/personas/movilidad/soat" style="color:#f97316;font-weight:bold;text-decoration:none;">SOAT SURA</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.segurosmundial.com.co/personas/seguros-personales/soat/compra-tu-soat/" style="color:#f97316;font-weight:bold;text-decoration:none;">SOAT Mundial</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.previsora.gov.co/cotizar-soat1" style="color:#f97316;font-weight:bold;text-decoration:none;">Previsora</a>
                </p>
              </div>`;
}

function buildGenericDocumentHelpBlock_(definition) {
  return `<div style="border-top:1px solid #eaecf0;padding-top:22px;margin-top:24px;">
                <p style="font-size:15px;font-weight:bold;margin:0 0 12px;color:#101828;">
                  Mantener tu ${definition.htmlName} al d&iacute;a:
                </p>

                <p style="font-size:14px;line-height:1.6;color:#475467;margin:0;">
                  Agenda la renovaci&oacute;n con anticipaci&oacute;n, conserva el soporte actualizado y valida que la informaci&oacute;n quede registrada en los canales oficiales.
                </p>
              </div>`;
}

function getDocumentReminderCopy_(definition, daysRemaining) {
  if (daysRemaining < 0) {
    const daysValue = String(Math.abs(daysRemaining));
    return {
      subject: 'Documento vencido en Copiloto: ' + definition.label,
      badgeTitle: 'DOCUMENTO VENCIDO',
      daysValue,
      daysUnit: Math.abs(daysRemaining) === 1 ? 'd&iacute;a' : 'd&iacute;as',
      daysCaption: 'han pasado desde que se venci&oacute; tu ' + definition.htmlName,
      badgeBackground: '#fef2f2',
      badgeBorder: '#dc2626',
      badgeText: '#991b1b',
      badgeAccent: '#dc2626',
    };
  }

  if (daysRemaining === 0) {
    return {
      subject: 'Tu ' + definition.label + ' vence hoy',
      badgeTitle: 'VENCE HOY',
      daysValue: '0',
      daysUnit: 'd&iacute;as',
      daysCaption: 'tu ' + definition.htmlName + ' vence hoy',
      badgeBackground: '#fff4e5',
      badgeBorder: '#f97316',
      badgeText: '#9a3412',
      badgeAccent: '#f97316',
    };
  }

  return {
    subject: 'Recordatorio Copiloto: ' + definition.label + ' proximo a vencer',
    badgeTitle: 'RECORDATORIO IMPORTANTE',
    daysValue: String(daysRemaining),
    daysUnit: daysRemaining === 1 ? 'd&iacute;a' : 'd&iacute;as',
    daysCaption: 'faltan para que se venza tu ' + definition.htmlName,
    badgeBackground: '#fff4e5',
    badgeBorder: '#f97316',
    badgeText: '#9a3412',
    badgeAccent: '#f97316',
  };
}

function buildDocumentReminderPlainBody_(values) {
  const statusText = values.daysRemaining < 0
    ? 'esta ' + values.expiredAdjective + ' desde hace ' + Math.abs(values.daysRemaining) + ' dias'
    : values.daysRemaining === 0
      ? 'vence hoy'
      : 'vence en ' + values.daysRemaining + ' dias';

  return [
    'Hola ' + values.userName + ',',
    '',
    'Te recordamos que ' + values.documentArticle + ' ' + values.documentName + ' del vehiculo con placa ' + values.plate + ' ' + statusText + '.',
    'Fecha de vencimiento: ' + values.expiryDateText,
    '',
    'Revisar en Copiloto: ' + values.urlApp,
  ].join('\n');
}

function buildPicoPlacaReminderEmail_(context) {
  const safeUrl = escapeHtml_(APP_PUBLIC_URL);
  const schedule = formatPicoSchedule_(context.rule);
  const vehicleTypeText = formatPicoVehicleType_(context.vehicleType);
  const dateText = formatDateForEmail_(context.date);
  const htmlBody = buildPicoPlacaReminderHtml_({
    nombreUsuario: escapeHtml_(context.userName || context.email),
    placaVehiculo: escapeHtml_(context.plate || 'Sin placa'),
    ciudad: escapeHtml_(context.city || ''),
    tipoVehiculo: escapeHtml_(vehicleTypeText),
    fechaRestriccion: escapeHtml_(dateText),
    horario: escapeHtml_(schedule),
    restriccionTexto: escapeHtml_(context.restrictionText || formatPicoRestriction_(context.rule)),
    digitoEvaluado: escapeHtml_(String(context.digit)),
    urlApp: safeUrl,
    anio: new Date().getFullYear(),
  });

  return {
    subject: 'Pico y placa hoy para ' + context.plate,
    htmlBody,
    plainBody: buildPicoPlacaReminderPlainBody_({
      userName: context.userName || context.email,
      plate: context.plate || 'Sin placa',
      city: context.city || '',
      vehicleType: vehicleTypeText,
      dateText,
      schedule,
      restrictionText: context.restrictionText || formatPicoRestriction_(context.rule),
      digit: context.digit,
      urlApp: APP_PUBLIC_URL,
    }),
  };
}

function buildPicoPlacaReminderHtml_(values) {
  const template = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f5f7fb;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10);">
          <tr>
            <td align="center" style="padding:26px 20px 14px;background:#101828;">
              <img src="https://drive.google.com/uc?export=view&id=1_zZKKMRnFKYhQ4Renm1wIon9HV714C3I"
                   alt="Copiloto"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Tu asistente inteligente para conducir tranquilo
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                Hoy el veh&iacute;culo con placa <strong style="color:#101828;">{{placaVehiculo}}</strong>
                tiene restricci&oacute;n de pico y placa en <strong>{{ciudad}}</strong>.
              </p>

              <div style="background:#fff4e5;border:2px solid #f97316;border-radius:18px;padding:24px;text-align:center;margin:24px 0;">
                <p style="margin:0;color:#9a3412;font-size:15px;font-weight:bold;">
                  PICO Y PLACA DE HOY
                </p>
                <p style="margin:10px 0 4px;font-size:34px;font-weight:800;color:#f97316;">
                  {{placaVehiculo}}
                </p>
                <p style="margin:0;color:#9a3412;font-size:16px;">
                  {{restriccionTexto}}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;margin:0 0 22px;">
                <tr>
                  <td style="padding:16px;font-size:15px;line-height:1.7;">
                    <strong>Fecha:</strong> {{fechaRestriccion}}<br>
                    <strong>Ciudad:</strong> {{ciudad}}<br>
                    <strong>Veh&iacute;culo:</strong> {{tipoVehiculo}}<br>
                    <strong>Horario:</strong> {{horario}}<br>
                    <strong>D&iacute;gito evaluado:</strong> {{digitoEvaluado}}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.6;color:#475467;margin:0 0 22px;">
                Planea tus recorridos con anticipaci&oacute;n para evitar sanciones y contratiempos durante los controles de tr&aacute;nsito.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="{{urlApp}}"
                   style="background:#101828;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">
                  Revisar en Copiloto
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              &copy; {{anio}} Copiloto. Mensaje autom&aacute;tico de recordatorio.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return fillTemplate_(template, values);
}

function buildPicoPlacaReminderPlainBody_(values) {
  return [
    'Hola ' + values.userName + ',',
    '',
    'Hoy tienes pico y placa para el vehiculo con placa ' + values.plate + ' en ' + values.city + '.',
    'Fecha: ' + values.dateText,
    'Vehiculo: ' + values.vehicleType,
    'Horario: ' + values.schedule,
    'Restriccion: ' + values.restrictionText,
    'Digito evaluado: ' + values.digit,
    '',
    'Revisar en Copiloto: ' + values.urlApp,
  ].join('\n');
}

function fillTemplate_(template, values) {
  return Object.keys(values).reduce((html, key) => {
    const replacement = values[key] === null || typeof values[key] === 'undefined' ? '' : String(values[key]);
    return html.replace(new RegExp('{{' + key + '}}', 'g'), replacement);
  }, template);
}

function buildDocumentReminderKey_(email, vehicleId, plate, documentKey, expiryDateKey, reminderType) {
  return [email, vehicleId || plate, documentKey, expiryDateKey, reminderType].join('|').toLowerCase();
}

function buildPicoPlacaReminderKey_(email, vehicleId, plate, city, vehicleType, dateKey) {
  return [email, vehicleId || plate, 'pico_placa', city, vehicleType, dateKey].join('|').toLowerCase();
}

function evaluatePicoPlacaForVehicle_(context) {
  const cityKey = normalizePicoText_(context.city);
  const vehicleType = normalizePicoVehicleType_(context.vehicleType);
  const activeRules = context.rules.filter((rule) => {
    if (normalizePicoText_(rule.ciudad) !== cityKey) return false;
    if (!picoVehicleTypeMatches_(rule.tipoVehiculo, vehicleType)) return false;
    if (!isPicoRuleActiveForDate_(rule, context.date)) return false;
    return picoRuleMatchesWeekday_(rule, context.date);
  });
  const noRestrictionRule = activeRules.find((rule) => rule.tipoRegla === 'ninguno');

  if (noRestrictionRule || !activeRules.length) {
    return { applies: false };
  }

  for (let i = 0; i < activeRules.length; i += 1) {
    const rule = activeRules[i];
    const digit = getPicoPlateDigit_(context.plate, rule.criterioPlaca);

    if (isPicoDigitRestricted_(rule, digit)) {
      return {
        applies: true,
        rule,
        digit,
        restrictionText: formatPicoRestriction_(rule),
      };
    }
  }

  return { applies: false };
}

function normalizePicoRules_(rules) {
  return (rules || [])
    .map((rule) => normalizePicoRule_(rule))
    .filter((rule) => rule.ciudad && rule.activo);
}

function normalizePicoRule_(rule) {
  const tipoRegla = normalizePicoRuleType_(rule.tipoRegla);

  return {
    ciudad: String(rule.ciudad || '').trim(),
    label: String(rule.label || rule.ciudad || '').trim(),
    tipoVehiculo: normalizePicoVehicleType_(rule.tipoVehiculo || 'particular'),
    diaSemana: normalizePicoWeekday_(rule.diaSemana),
    tipoRegla,
    digitosRestriccion: normalizePicoRestrictionValue_(rule.digitosRestriccion, tipoRegla),
    criterioPlaca: normalizePicoPlateCriteria_(rule.criterioPlaca),
    horarioInicio: String(rule.horarioInicio || '').trim(),
    horarioFin: String(rule.horarioFin || '').trim(),
    activo: isActive_(rule.activo),
    fechaInicio: parseSheetDateOnly_(rule.fechaInicio),
    fechaFin: parseSheetDateOnly_(rule.fechaFin),
    nota: String(rule.nota || '').trim(),
    fuenteOficial: String(rule.fuenteOficial || '').trim(),
    urlFuente: String(rule.urlFuente || '').trim(),
  };
}

function normalizePicoRuleType_(value) {
  const text = normalizePicoText_(value);
  if (text.indexOf('ninguno') >= 0 || text.indexOf('sinrestriccion') >= 0) return 'ninguno';
  if (text.indexOf('par') >= 0 || text.indexOf('impar') >= 0) return 'pares_impares';
  return 'lista';
}

function normalizePicoVehicleType_(value) {
  const text = normalizePicoText_(value);
  if (!text || text === 'todos' || text === 'todo' || text === 'all' || text === 'cualquiera') return 'todos';
  if (text.indexOf('moto') >= 0) return 'moto';
  if (text.indexOf('taxi') >= 0) return 'taxi';
  if (text.indexOf('carro') >= 0 || text.indexOf('auto') >= 0 || text.indexOf('particular') >= 0 || text.indexOf('camioneta') >= 0) {
    return 'particular';
  }
  return text;
}

function normalizePicoWeekday_(value) {
  const text = normalizePicoText_(value);
  if (!text || text === 'todos' || text === 'all' || text === 'diario') return 'todos';

  if (/^\d+$/.test(text)) {
    const day = Number(text);
    return day === 7 ? 0 : day;
  }

  const days = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  return Object.prototype.hasOwnProperty.call(days, text) ? days[text] : 'todos';
}

function normalizePicoPlateCriteria_(value) {
  const text = normalizePicoText_(value);
  return text.indexOf('primer') >= 0 || text === 'first' || text === 'primero' ? 'primero' : 'ultimo';
}

function normalizePicoRestrictionValue_(value, tipoRegla) {
  const rawValue = Array.isArray(value) ? value.join(',') : String(value || '');

  if (tipoRegla === 'pares_impares') {
    const tokens = rawValue
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^A-Z]+/)
      .filter(Boolean);
    const values = [];
    if (tokens.some((token) => token === 'PAR' || token === 'PARES')) values.push('PAR');
    if (tokens.some((token) => token === 'IMPAR' || token === 'IMPARES')) values.push('IMPAR');
    return values;
  }

  return extractDigits_(rawValue);
}

function picoVehicleTypeMatches_(ruleVehicleType, vehicleType) {
  const ruleType = normalizePicoVehicleType_(ruleVehicleType);
  const selectedType = normalizePicoVehicleType_(vehicleType);
  return ruleType === 'todos' || ruleType === selectedType;
}

function isPicoRuleActiveForDate_(rule, date) {
  const targetTime = getDateOnlyTime_(date);

  if (rule.fechaInicio && targetTime < getDateOnlyTime_(rule.fechaInicio)) return false;
  if (rule.fechaFin && targetTime > getDateOnlyTime_(rule.fechaFin)) return false;
  return true;
}

function picoRuleMatchesWeekday_(rule, date) {
  if (rule.diaSemana === 'todos') return true;
  return Number(rule.diaSemana) === date.getDay();
}

function getPicoPlateDigit_(plate, criterioPlaca) {
  const digits = String(plate || '').match(/\d/g) || [];
  if (!digits.length) return null;
  return Number(criterioPlaca === 'primero' ? digits[0] : digits[digits.length - 1]);
}

function isPicoDigitRestricted_(rule, digit) {
  if (rule.tipoRegla === 'ninguno' || digit === null) return false;

  if (rule.tipoRegla === 'pares_impares') {
    const parity = digit % 2 === 0 ? 'PAR' : 'IMPAR';
    return rule.digitosRestriccion.indexOf(parity) >= 0;
  }

  return rule.digitosRestriccion.indexOf(Number(digit)) >= 0;
}

function formatPicoRestriction_(rule) {
  const target = rule.criterioPlaca === 'primero' ? 'que empiezan por' : 'terminadas en';

  if (rule.tipoRegla === 'pares_impares') {
    return 'Restriccion para placas ' + rule.digitosRestriccion.join(' o ').toLowerCase();
  }

  if (rule.tipoRegla === 'ninguno') {
    return 'Sin restriccion activa';
  }

  return 'Restriccion para placas ' + target + ' ' + formatPicoList_(rule.digitosRestriccion);
}

function formatPicoSchedule_(rule) {
  if (rule && rule.horarioInicio && rule.horarioFin) {
    return rule.horarioInicio + ' - ' + rule.horarioFin;
  }

  return 'Horario definido por la autoridad local';
}

function formatPicoVehicleType_(value) {
  const type = normalizePicoVehicleType_(value);
  if (type === 'moto') return 'moto';
  if (type === 'taxi') return 'taxi';
  if (type === 'particular') return 'vehiculo particular';
  if (type === 'todos') return 'vehiculo';
  return value || 'vehiculo';
}

function formatPicoList_(values) {
  const items = (values || []).map(String);
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}

function normalizePicoPlate_(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function normalizePicoText_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9*]/g, '')
    .toLowerCase();
}

function getDateOnlyTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getDocumentReminderType_(daysRemaining, noticeDays) {
  if (!Number.isFinite(daysRemaining)) return '';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining === 0) return 'due_today';
  if (daysRemaining <= noticeDays) return 'advance';
  return '';
}

function normalizeNoticeDays_(value) {
  const days = Number(value);
  if (!Number.isFinite(days) || days < 0) return 30;
  return Math.floor(days);
}

function isLikelyEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function getTodayDateOnly_() {
  return parseSheetDateOnly_(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
}

function parseSheetDateOnly_(value) {
  const dateText = formatSheetDate_(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function daysBetweenDateOnly_(fromDate, toDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();
  return Math.round((end - start) / msPerDay);
}

function formatDateOnlyForKey_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatDateForEmail_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map((value) => String(value || '').trim()).filter(Boolean);
  const needsHeaders = currentHeaders.length === 0;

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return sheet;
  }

  const sameHeaders = currentHeaders.length === headers.length && headers.every((header, index) => currentHeaders[index] === header);
  if (!sameHeaders) {
    migrateSheetHeaders_(sheet, currentHeaders, headers);
  }

  return sheet;
}

function appendRow_(sheetName, values) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const definition = Object.values(SHEETS).find((item) => item.name === sheetName);
  const sheet = ensureSheet_(ss, sheetName, definition.headers);
  sheet.appendRow(values);
}

function appendApiLog_(action, status, message, payload) {
  appendRow_(SHEETS.apiLog.name, [
    new Date().toISOString(),
    action,
    status,
    message,
    JSON.stringify(payload || {}),
  ]);
}

function migrateSheetHeaders_(sheet, currentHeaders, targetHeaders) {
  const values = sheet.getDataRange().getValues();
  const dataRows = values.slice(1);
  const migratedRows = dataRows.map((row) => {
    const item = {};
    currentHeaders.forEach((header, index) => {
      item[header] = row[index];
    });
    return targetHeaders.map((header) => item[header] || '');
  });

  sheet.clearContents();
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  if (migratedRows.length) {
    sheet.getRange(2, 1, migratedRows.length, targetHeaders.length).setValues(migratedRows);
  }
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, targetHeaders.length);
}

function setCellByHeader_(sheet, rowNumber, headers, header, value) {
  const index = headers.indexOf(header);
  if (index >= 0) {
    sheet.getRange(rowNumber, index + 1).setValue(value);
  }
}

function findBuyerByEmail_(email) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.compradores.name);
  if (!sheet) return null;
  return getRowsAsObjects_(sheet)
    .slice()
    .reverse()
    .find((row) => String(row.correo || '').trim().toLowerCase() === email);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  const contents = e.postData.contents;
  try {
    return JSON.parse(contents);
  } catch (error) {
    return {
      action: 'rawPost',
      raw: contents,
    };
  }
}

function cleanPhone_(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getRowsAsObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((header) => String(header || '').trim());
  return values.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
}

function parseBoolean_(value) {
  if (value === true) return true;
  const text = String(value || '').trim().toLowerCase();
  return text === 'true' || text === 'si' || text === 'sí' || text === '1';
}

function isActive_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return true;
  if (value === true) return true;
  const text = String(value).trim().toLowerCase();
  return text === 'true' || text === 'si' || text === 'sí' || text === '1' || text === 'activo';
}

function getValue_(row, aliases) {
  const keys = Object.keys(row || {});

  for (let i = 0; i < aliases.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(row, aliases[i]) && row[aliases[i]] !== '') {
      return row[aliases[i]];
    }
  }

  const normalizedAliases = aliases.map((alias) => normalizeHeader_(alias));
  const matchingKey = keys.find((key) => normalizedAliases.indexOf(normalizeHeader_(key)) >= 0);
  return matchingKey ? row[matchingKey] : '';
}

function normalizeHeader_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function extractDigits_(value) {
  const matches = String(value || '').match(/\d/g);
  return matches ? matches.map(Number) : [];
}

function normalizeWeekday_(value) {
  const text = normalizeHeader_(value);
  if (!text) return null;

  if (/^[0-6]$/.test(text)) {
    return Number(text);
  }

  const days = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  return Object.prototype.hasOwnProperty.call(days, text) ? days[text] : null;
}

function splitList_(value) {
  return String(value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSheetDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}

function formatSheetTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }

  const text = String(value).trim();
  if (/T\d{2}:\d{2}/.test(text)) {
    const parsedDate = new Date(text);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'HH:mm');
    }
  }

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return text;

  return String(timeMatch[1]).padStart(2, '0') + ':' + timeMatch[2];
}

function formatSheetDateTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, data) {
  const safeCallback = String(callback || '').replace(/[^\w.$]/g, '');
  return ContentService
    .createTextOutput(safeCallback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
