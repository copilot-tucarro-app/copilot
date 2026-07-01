const SPREADSHEET_ID = '1fsDw-bFuLcX_uzIOCyLZ7ZeiiY9KdNDPSXRuT99IxS8';
const APP_PUBLIC_URL = 'https://copilot360.co/';
const APP_NAME = 'copilot360';
const APP_LOGO_URL = APP_PUBLIC_URL + 'copilot360-logo.png';
const EMAIL_DEFAULT_FROM_NAME = APP_NAME;
const ALLY_LOGOS_DRIVE_FOLDER_NAME = APP_NAME + ' - Logos Aliados';
const DEFAULT_AGENT_PASSWORD = 'Copiloto123';
const FREE_TRIAL_DAYS = 15;
const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
const DATA_TREATMENT_VERSION = 'CO-LEY-1581-2012-v1';
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
  {
    key: 'seguro',
    label: 'Seguro vehicular',
    htmlLabel: 'Seguro vehicular',
    htmlName: 'seguro vehicular',
    plainName: 'seguro vehicular',
    articleHtml: 'el',
    plainArticle: 'el',
    expiredPlainAdjective: 'vencido',
    expiryField: 'seguroVence',
    noticeField: 'seguroAvisoDias',
  },
  {
    key: 'credito',
    label: 'Credito de vehiculo',
    htmlLabel: 'Cr&eacute;dito de veh&iacute;culo',
    htmlName: 'cr&eacute;dito de veh&iacute;culo',
    plainName: 'credito de vehiculo',
    articleHtml: 'el',
    plainArticle: 'el',
    expiredPlainAdjective: 'vencido',
    expiryField: 'creditoVence',
    noticeField: 'creditoAvisoDias',
  },
  {
    key: 'garantia',
    label: 'Garantia de fabrica',
    htmlLabel: 'Garant&iacute;a de f&aacute;brica',
    htmlName: 'garant&iacute;a de f&aacute;brica',
    plainName: 'garantia de fabrica',
    articleHtml: 'la',
    plainArticle: 'la',
    expiredPlainAdjective: 'vencida',
    expiryField: 'garantiaVence',
    noticeField: 'garantiaAvisoDias',
  },
];

const DEFAULT_ALLY_EMAIL_TEMPLATES = {
  welcome: 'Tu aliado {nombreCDA} en alianza con ' + APP_NAME + ' te da la bienvenida. Tu servicio ' + APP_NAME + ' Conductores quedo activado por 1 ano.',
  documentReminder: 'Tu aliado {nombreCDA} en alianza con ' + APP_NAME + ' te recuerda que tu {documento} se vence en {diasRestantes} dias.',
  picoPlaca: 'Tu aliado {nombreCDA} en alianza con ' + APP_NAME + ' te recuerda que hoy tienes pico y placa para la placa {placa}.',
  importantAlert: 'Tu aliado {nombreCDA} en alianza con ' + APP_NAME + ' tiene una alerta importante para tu vehiculo {placa}.',
};

const SHEETS = {
  compradores: {
    name: 'Compradores',
    headers: ['createdAt', 'buyerId', 'nombre', 'correo', 'telefono', 'ciudad', 'placa', 'password', 'source', 'status', 'appPublicUrl'],
  },
  usuarios: {
    name: 'Usuarios',
    headers: [
      'createdAt',
      'userId',
      'nombre',
      'correo',
      'telefono',
      'ciudad',
      'password',
      'role',
      'source',
      'canUseSalesAgent',
      'subscriptionStatus',
      'subscriptionEndsAt',
      'trialStartedAt',
      'trialEndsAt',
      'dataTreatmentAcceptedAt',
      'dataTreatmentVersion',
      'passwordResetCode',
      'passwordResetExpiresAt',
      'passwordResetUsedAt',
      'mustChangePassword',
      'passwordUpdatedAt',
      'idCDA',
      'codigoAliado',
      'nombreCDA',
      'logoCdaUrl',
      'plantillaBienvenida',
      'plantillaVencimiento',
      'plantillaPicoPlaca',
      'plantillaAlerta',
    ],
  },
  cdaAliados: {
    name: 'CDAAliados',
    headers: ['idCDA', 'nombreCDA', 'codigoAliado', 'correo', 'logoCdaUrl', 'plantillaBienvenida', 'plantillaVencimiento', 'plantillaPicoPlaca', 'plantillaAlerta', 'activo'],
  },
  preRegistrosAliados: {
    name: 'PreRegistrosAliados',
    headers: ['createdAt', 'idPreRegistro', 'idCDA', 'codigoAliado', 'nombreCDA', 'nombreCliente', 'whatsapp', 'placa', 'ciudad', 'codigoActivacion', 'estado', 'fuente', 'fechaActivacion', 'correo', 'metodoPago'],
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
      'seguroVence',
      'seguroAvisoDias',
      'creditoVence',
      'creditoAvisoDias',
      'garantiaInicio',
      'garantiaVigenciaAnios',
      'garantiaVence',
      'garantiaVenceKm',
      'garantiaAvisoDias',
      'proximoAceiteMotorKm',
      'proximoAceiteCajaKm',
      'contactoNotificacion1Nombre',
      'contactoNotificacion1Correo',
      'contactoNotificacion1Tipos',
      'contactoNotificacion2Nombre',
      'contactoNotificacion2Correo',
      'contactoNotificacion2Tipos',
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
  correosNovedades: {
    name: 'CorreosNovedades',
    headers: ['timestamp', 'notificationKey', 'userEmail', 'nombre', 'newsId', 'seccion', 'titulo', 'fechaPublicacion', 'status', 'message'],
  },
  pushSubscriptions: {
    name: 'PushSubscriptions',
    headers: ['updatedAt', 'userEmail', 'token', 'permission', 'platform', 'userAgent', 'appVersion', 'status', 'lastError'],
  },
  pushMantenimientos: {
    name: 'PushMantenimientos',
    headers: ['timestamp', 'notificationKey', 'userEmail', 'nombre', 'vehicleId', 'placa', 'mantenimiento', 'kilometrajeActual', 'kilometrajeObjetivo', 'kilometrosRestantes', 'tipoRecordatorio', 'status', 'message'],
  },
  novedades: {
    name: 'Novedades',
    headers: ['id', 'seccion', 'titulo', 'descripcion', 'categoria', 'fecha', 'fechaPublicacion', 'imageUrl', 'videoUrl', 'activo'],
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

function setupCopilotConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.values(SHEETS).forEach((definition) => ensureSheet_(ss, definition.name, definition.headers));
  return { ok: true, message: APP_NAME + ' config ready' };
}

function authorizeCopilotDriveAccess() {
  const folder = getOrCreateDriveFolder_(ALLY_LOGOS_DRIVE_FOLDER_NAME);
  return { ok: true, message: 'Drive autorizado para logos de aliados', folderId: folder.getId() };
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'health';
  const callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : '';

  if (action === 'setup') {
    return json_(setupCopilotConfig());
  }

  if (action === 'validateLogin') {
    const result = validateLogin_(e.parameter.identifier || e.parameter.email || '', e.parameter.password || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'requestPasswordReset') {
    const result = requestPasswordReset_(e.parameter.email || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'resetPassword') {
    const result = resetPassword_(e.parameter.email || '', e.parameter.code || '', e.parameter.password || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getHomeNews') {
    const result = getHomeNews_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendNewsPublicationNotifications') {
    const result = sendNewsPublicationNotifications();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendMaintenanceReminders') {
    const result = sendMaintenanceReminders();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendDocumentExpiryReminders') {
    const result = sendDocumentExpiryReminders();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendPicoPlacaReminders') {
    const result = sendPicoPlacaReminders();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendDailyReminderEmails') {
    const result = sendDailyReminderEmails();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'installNewsPublicationTrigger') {
    const result = installNewsPublicationTrigger();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'removeNewsPublicationTriggers') {
    const result = removeNewsPublicationTriggers();
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

  if (action === 'getClientConfig') {
    const result = getClientConfig_();
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getVehicleByUser') {
    const result = getVehicleByUser_(e.parameter.email || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'getAllyPreRegistrations') {
    const result = getAllyPreRegistrations_(e.parameter.codigoAliado || '', e.parameter.idCDA || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  if (action === 'sendTestPushNotification') {
    const result = sendTestPushNotification_(e.parameter.email || '', e.parameter.token || '');
    return callback ? jsonp_(callback, result) : json_(result);
  }

  const result = {
    ok: true,
    app: APP_NAME,
    action,
    timestamp: new Date().toISOString(),
  };

  return callback ? jsonp_(callback, result) : json_(result);
}

function doPost(e) {
  const payload = parsePayload_(e);

  try {
    setupCopilotConfig();
    const result = handleAction_(payload);
    appendApiLog_(payload.action || 'unknown', 'ok', result.message || 'OK', payload);
    if (payload.responseTransport === 'postMessage') {
      return postMessageHtml_(payload.requestId || '', result);
    }
    return json_(result);
  } catch (error) {
    appendApiLog_(payload.action || 'unknown', 'error', error.message, payload);
    const result = {
      ok: false,
      error: error.message,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    if (payload.responseTransport === 'postMessage') {
      return postMessageHtml_(payload.requestId || '', result);
    }
    return json_(result);
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

  if (action === 'updateUserPassword') {
    return updateUserPassword_(payload.passwordUpdate || {});
  }

  if (action === 'saveVehicle') {
    return saveVehicle_(payload.vehicle || {}, payload.user || {});
  }

  if (action === 'sendNotificationContactsTestEmail') {
    return sendNotificationContactsTestEmail_(payload.vehicle || {}, payload.user || {});
  }

  if (action === 'savePushSubscription') {
    return savePushSubscription_(payload.subscription || {});
  }

  if (action === 'registerAllyPreRegistration') {
    return registerAllyPreRegistration_(payload.preRegistration || {});
  }

  if (action === 'uploadAllyLogo') {
    return uploadAllyLogo_(payload.logo || {});
  }

  if (action === 'sendNewsPublicationNotifications') {
    return sendNewsPublicationNotifications();
  }

  if (action === 'sendMaintenanceReminders') {
    return sendMaintenanceReminders();
  }

  if (action === 'sendDocumentExpiryReminders') {
    return sendDocumentExpiryReminders();
  }

  if (action === 'sendPicoPlacaReminders') {
    return sendPicoPlacaReminders();
  }

  if (action === 'sendDailyReminderEmails') {
    return sendDailyReminderEmails();
  }

  if (action === 'sendTestPushNotification') {
    return sendTestPushNotification_(payload.email || '', payload.token || '');
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
  const trial = buildFreeTrialAccess_(createdAt);

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
    trial.subscriptionStatus,
    '',
    trial.trialStartedAt,
    trial.trialEndsAt,
    buyer.dataTreatmentAcceptedAt || '',
    buyer.dataTreatmentVersion || DATA_TREATMENT_VERSION,
    '',
    '',
    '',
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

function getClientConfig_() {
  const properties = PropertiesService.getScriptProperties();

  return {
    ok: true,
    mapboxAccessToken: properties.getProperty('MAPBOX_ACCESS_TOKEN') || '',
  };
}

function getEmailDeliveryStatus() {
  const config = getEmailDeliveryConfig_();
  const remainingMailAppQuota = (() => {
    try {
      return MailApp.getRemainingDailyQuota();
    } catch (error) {
      return null;
    }
  })();

  return {
    ok: true,
    provider: config.provider,
    sesConfigured: config.ses.enabled,
    sesRegion: config.ses.region,
    sesFromEmail: config.ses.fromEmail,
    brevoConfigured: config.brevo.enabled,
    brevoFromEmail: config.brevo.fromEmail,
    newsNotificationAudience: getNewsNotificationAudience_(),
    fallbackToMailApp: config.fallbackToMailApp,
    remainingMailAppQuota,
  };
}

function sendTestTransactionalEmail() {
  const properties = PropertiesService.getScriptProperties();
  const to = String(properties.getProperty('EMAIL_TEST_TO') || Session.getActiveUser().getEmail() || '').trim();

  if (!isLikelyEmail_(to)) {
    throw new Error('Configura EMAIL_TEST_TO en Script Properties con un correo valido para probar.');
  }

  const delivery = sendTransactionalEmail_({
    to,
    subject: 'Prueba de correo ' + APP_NAME,
    body: 'Este es un correo de prueba enviado por ' + APP_NAME + '.',
    htmlBody: '<p>Este es un correo de prueba enviado por <strong>' + APP_NAME + '</strong>.</p>',
    name: EMAIL_DEFAULT_FROM_NAME,
  });

  appendApiLog_('sendTestTransactionalEmail', 'ok', 'Test email sent via ' + delivery.provider, {
    to,
    provider: delivery.provider,
    messageId: delivery.messageId || '',
  });

  return {
    ok: true,
    to,
    delivery,
  };
}

function sendNotificationContactsTestEmail_(vehicle, user) {
  const recipients = getVehicleNotificationTestRecipients_(vehicle, user);
  const plate = String(vehicle.plate || vehicle.placa || '').trim().toUpperCase();
  const vehicleName = [vehicle.brand || vehicle.marca || '', vehicle.model || vehicle.modelo || ''].join(' ').trim();
  const sent = [];
  const errors = [];

  if (!recipients.length) {
    throw new Error('No hay destinatarios validos para probar.');
  }

  recipients.forEach(function(recipient) {
    const notificationTypes = recipient.isOwner ? 'Todas las notificaciones del usuario' : formatNotificationTypesForEmail_(recipient.notificationTypes);
    const subject = 'Prueba de correos ' + APP_NAME;
    const plainBody = [
      'Hola ' + (recipient.name || recipient.email) + ',',
      '',
      'Este es un correo de prueba de los contactos de notificacion de ' + APP_NAME + '.',
      plate ? 'Vehiculo de referencia: ' + (vehicleName ? vehicleName + ' - ' : '') + plate : '',
      'Notificaciones aplicables: ' + notificationTypes,
      '',
      'Si recibiste este mensaje, la configuracion de correo esta funcionando.',
    ].filter(Boolean).join('\n');
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.6">',
      '<h2 style="margin:0 0 12px;">Prueba de correos ' + escapeHtml_(APP_NAME) + '</h2>',
      '<p>Hola <strong>' + escapeHtml_(recipient.name || recipient.email) + '</strong>,</p>',
      '<p>Este es un correo de prueba de los contactos de notificacion de <strong>' + escapeHtml_(APP_NAME) + '</strong>.</p>',
      plate ? '<p><strong>Vehiculo de referencia:</strong> ' + escapeHtml_((vehicleName ? vehicleName + ' - ' : '') + plate) + '</p>' : '',
      '<p><strong>Notificaciones aplicables:</strong> ' + escapeHtml_(notificationTypes) + '</p>',
      '<p>Si recibiste este mensaje, la configuracion de correo esta funcionando.</p>',
      '</div>',
    ].join('');

    try {
      const delivery = sendTransactionalEmail_({
        to: recipient.email,
        subject,
        body: plainBody,
        htmlBody,
        name: EMAIL_DEFAULT_FROM_NAME,
      });
      sent.push({
        email: recipient.email,
        provider: delivery.provider || '',
        messageId: delivery.messageId || '',
      });
    } catch (error) {
      errors.push({
        email: recipient.email,
        message: error.message,
      });
    }
  });

  appendApiLog_('sendNotificationContactsTestEmail', errors.length ? 'partial' : 'ok', 'Notification contacts test email', {
    sent,
    errors,
    vehicleId: vehicle.id || vehicle.vehicleId || '',
    plate,
  });

  if (!sent.length && errors.length) {
    throw new Error(errors[0].message || 'No se pudo enviar la prueba.');
  }

  return {
    ok: true,
    message: 'Correo de prueba enviado',
    sent: sent.length,
    errors: errors.length,
    recipients: sent,
  };
}

function sendTransactionalEmail_(options) {
  const message = normalizeTransactionalEmail_(options);
  const config = getEmailDeliveryConfig_();

  if (config.provider === 'ses') {
    if (!config.ses.enabled) {
      if (config.fallbackToMailApp) return sendMailAppEmail_(message);
      throw new Error('Amazon SES no esta configurado. Revisa AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SES_REGION y SES_FROM_EMAIL.');
    }

    try {
      return sendSesEmail_(message, config.ses);
    } catch (error) {
      if (config.fallbackToMailApp) {
        const fallbackDelivery = sendMailAppEmail_(message);
        fallbackDelivery.fallbackReason = error.message;
        return fallbackDelivery;
      }
      throw error;
    }
  }

  if (config.provider === 'brevo') {
    if (!config.brevo.enabled) {
      if (config.fallbackToMailApp) return sendMailAppEmail_(message);
      throw new Error('Brevo no esta configurado. Revisa BREVO_API_KEY y BREVO_FROM_EMAIL.');
    }

    try {
      return sendBrevoEmail_(message, config.brevo);
    } catch (error) {
      if (config.fallbackToMailApp) {
        const fallbackDelivery = sendMailAppEmail_(message);
        fallbackDelivery.fallbackReason = error.message;
        return fallbackDelivery;
      }
      throw error;
    }
  }

  if (config.provider === 'mailapp') {
    return sendMailAppEmail_(message);
  }

  throw new Error('Proveedor de correo no soportado: ' + config.provider);
}

function getEmailDeliveryConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const providerValue = String(properties.getProperty('EMAIL_PROVIDER') || '').trim().toLowerCase();
  const ses = {
    accessKeyId: String(properties.getProperty('AWS_ACCESS_KEY_ID') || '').trim(),
    secretAccessKey: String(properties.getProperty('AWS_SECRET_ACCESS_KEY') || '').trim(),
    sessionToken: String(properties.getProperty('AWS_SESSION_TOKEN') || '').trim(),
    region: String(properties.getProperty('SES_REGION') || 'us-east-1').trim(),
    fromEmail: String(properties.getProperty('SES_FROM_EMAIL') || '').trim(),
    fromName: String(properties.getProperty('SES_FROM_NAME') || EMAIL_DEFAULT_FROM_NAME).trim(),
    replyToEmail: String(properties.getProperty('SES_REPLY_TO_EMAIL') || '').trim(),
    configurationSet: String(properties.getProperty('SES_CONFIGURATION_SET') || '').trim(),
  };
  ses.enabled = Boolean(ses.accessKeyId && ses.secretAccessKey && ses.region && ses.fromEmail);
  const brevo = {
    apiKey: String(properties.getProperty('BREVO_API_KEY') || '').trim(),
    fromEmail: String(properties.getProperty('BREVO_FROM_EMAIL') || properties.getProperty('SES_FROM_EMAIL') || '').trim(),
    fromName: String(properties.getProperty('BREVO_FROM_NAME') || properties.getProperty('SES_FROM_NAME') || EMAIL_DEFAULT_FROM_NAME).trim(),
    replyToEmail: String(properties.getProperty('BREVO_REPLY_TO_EMAIL') || properties.getProperty('SES_REPLY_TO_EMAIL') || '').trim(),
  };
  brevo.enabled = Boolean(brevo.apiKey && brevo.fromEmail);

  return {
    provider: providerValue || (ses.enabled ? 'ses' : brevo.enabled ? 'brevo' : 'mailapp'),
    fallbackToMailApp: parseBooleanProperty_(properties.getProperty('EMAIL_FALLBACK_TO_MAILAPP'), false),
    ses,
    brevo,
  };
}

function normalizeTransactionalEmail_(options) {
  const message = options || {};
  const to = splitEmailAddresses_(message.to);

  if (!to.length) throw new Error('El correo no tiene destinatario.');
  if (!message.subject) throw new Error('El correo no tiene asunto.');
  if (!message.body && !message.htmlBody) throw new Error('El correo no tiene contenido.');

  return {
    to,
    subject: String(message.subject || ''),
    body: String(message.body || stripHtml_(message.htmlBody || '')),
    htmlBody: message.htmlBody ? String(message.htmlBody) : '',
    name: String(message.name || EMAIL_DEFAULT_FROM_NAME).trim(),
    replyTo: String(message.replyTo || '').trim(),
  };
}

function sendMailAppEmail_(message) {
  const mailOptions = {
    to: message.to.join(','),
    subject: message.subject,
    body: message.body,
    name: message.name || EMAIL_DEFAULT_FROM_NAME,
  };

  if (message.htmlBody) mailOptions.htmlBody = message.htmlBody;
  if (message.replyTo) mailOptions.replyTo = message.replyTo;

  MailApp.sendEmail(mailOptions);
  return { provider: 'mailapp' };
}

function sendSesEmail_(message, config) {
  const region = config.region;
  const service = 'ses';
  const host = 'email.' + region + '.amazonaws.com';
  const endpoint = 'https://' + host + '/v2/email/outbound-emails';
  const now = new Date();
  const amzDate = Utilities.formatDate(now, 'GMT', "yyyyMMdd'T'HHmmss'Z'");
  const dateStamp = Utilities.formatDate(now, 'GMT', 'yyyyMMdd');
  const body = JSON.stringify(buildSesPayload_(message, config));
  const signedHeadersList = ['content-type', 'host', 'x-amz-date'].concat(config.sessionToken ? ['x-amz-security-token'] : []);
  const canonicalHeaders = [
    'content-type:application/json',
    'host:' + host,
    'x-amz-date:' + amzDate,
  ].concat(config.sessionToken ? ['x-amz-security-token:' + config.sessionToken] : []).join('\n') + '\n';
  const signedHeaders = signedHeadersList.join(';');
  const canonicalRequest = [
    'POST',
    '/v2/email/outbound-emails',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex_(body),
  ].join('\n');
  const credentialScope = [dateStamp, region, service, 'aws4_request'].join('/');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex_(canonicalRequest),
  ].join('\n');
  const signingKey = getAwsSignatureKey_(config.secretAccessKey, dateStamp, region, service);
  const signature = bytesToHex_(Utilities.computeHmacSha256Signature(Utilities.newBlob(stringToSign).getBytes(), signingKey));
  const headers = {
    Authorization: 'AWS4-HMAC-SHA256 Credential=' + config.accessKeyId + '/' + credentialScope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature,
    'X-Amz-Date': amzDate,
  };

  if (config.sessionToken) headers['X-Amz-Security-Token'] = config.sessionToken;

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers,
    payload: body,
    muteHttpExceptions: true,
  });
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('Amazon SES error ' + responseCode + ': ' + responseText.slice(0, 500));
  }

  const payload = responseText ? JSON.parse(responseText) : {};
  return {
    provider: 'ses',
    messageId: payload.MessageId || '',
    responseCode,
  };
}

function sendBrevoEmail_(message, config) {
  const response = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Accept: 'application/json',
      'api-key': config.apiKey,
    },
    payload: JSON.stringify(buildBrevoPayload_(message, config)),
    muteHttpExceptions: true,
  });
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('Brevo error ' + responseCode + ': ' + responseText.slice(0, 500));
  }

  const payload = responseText ? JSON.parse(responseText) : {};
  return {
    provider: 'brevo',
    messageId: payload.messageId || '',
    responseCode,
  };
}

function buildBrevoPayload_(message, config) {
  const payload = {
    sender: {
      name: message.name || config.fromName || EMAIL_DEFAULT_FROM_NAME,
      email: config.fromEmail,
    },
    to: message.to.map((email) => ({ email })),
    subject: message.subject,
    textContent: message.body,
  };
  const replyToAddresses = splitEmailAddresses_(message.replyTo || config.replyToEmail);

  if (message.htmlBody) payload.htmlContent = message.htmlBody;
  if (replyToAddresses.length) payload.replyTo = { email: replyToAddresses[0] };

  return payload;
}

function buildSesPayload_(message, config) {
  const payload = {
    FromEmailAddress: formatSesAddress_(config.fromEmail, message.name || config.fromName),
    Destination: {
      ToAddresses: message.to,
    },
    Content: {
      Simple: {
        Subject: {
          Data: message.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: message.body,
            Charset: 'UTF-8',
          },
        },
      },
    },
  };
  const replyToAddresses = splitEmailAddresses_(message.replyTo || config.replyToEmail);

  if (message.htmlBody) {
    payload.Content.Simple.Body.Html = {
      Data: message.htmlBody,
      Charset: 'UTF-8',
    };
  }

  if (replyToAddresses.length) payload.ReplyToAddresses = replyToAddresses;
  if (config.configurationSet) payload.ConfigurationSetName = config.configurationSet;

  return payload;
}

function getAwsSignatureKey_(secretKey, dateStamp, regionName, serviceName) {
  const kDate = Utilities.computeHmacSha256Signature(dateStamp, 'AWS4' + secretKey);
  const kRegion = Utilities.computeHmacSha256Signature(Utilities.newBlob(regionName).getBytes(), kDate);
  const kService = Utilities.computeHmacSha256Signature(Utilities.newBlob(serviceName).getBytes(), kRegion);
  return Utilities.computeHmacSha256Signature(Utilities.newBlob('aws4_request').getBytes(), kService);
}

function sha256Hex_(value) {
  return bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8));
}

function bytesToHex_(bytes) {
  return bytes.map((byte) => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');
}

function formatSesAddress_(email, name) {
  const cleanEmail = String(email || '').trim();
  const cleanName = String(name || '').trim();

  if (!cleanName) return cleanEmail;
  return '"' + cleanName.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '" <' + cleanEmail + '>';
}

function splitEmailAddresses_(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(isLikelyEmail_);
  }

  return String(value || '')
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(isLikelyEmail_);
}

function stripHtml_(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBooleanProperty_(value, fallback) {
  if (value === '' || value === null || typeof value === 'undefined') return fallback;
  const text = String(value).trim().toLowerCase();
  return text === 'true' || text === 'si' || text === 'sí' || text === '1' || text === 'yes' || text === 'activo';
}

function registerUser_(user) {
  const email = String(user.email || '').trim().toLowerCase();
  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const existingRecord = email ? findUserRecordByEmail_(sheet, email) : null;
  const existingUser = existingRecord ? existingRecord.user : {};
  const createdAt = user.createdAt || existingUser.createdAt || new Date().toISOString();
  const userId = user.id || existingUser.userId || Utilities.getUuid();
  const trial = buildFreeTrialAccess_(createdAt);
  const subscriptionStatus = String(user.subscriptionStatus || '').trim().toLowerCase() === 'active' ? 'active' : trial.subscriptionStatus;
  const subscriptionEndsAt = subscriptionStatus === 'active' ? user.subscriptionEndsAt || '' : '';
  const mustChangePassword = shouldRequirePasswordChange_(user);
  const values = [
    createdAt,
    userId,
    user.name || '',
    email,
    cleanPhone_(user.phone || ''),
    user.city || '',
    user.password || '',
    user.role || 'driver',
    user.source || 'self-register',
    parseBoolean_(user.canUseSalesAgent),
    subscriptionStatus,
    subscriptionEndsAt,
    user.trialStartedAt || trial.trialStartedAt,
    user.trialEndsAt || trial.trialEndsAt,
    user.dataTreatmentAcceptedAt || createdAt,
    user.dataTreatmentVersion || DATA_TREATMENT_VERSION,
    '',
    '',
    '',
    mustChangePassword,
    user.passwordUpdatedAt || '',
    user.idCDA || '',
    user.codigoAliado || '',
    user.nombreCDA || '',
    user.logoCdaUrl || '',
    user.plantillaBienvenida || '',
    user.plantillaVencimiento || '',
    user.plantillaPicoPlaca || '',
    user.plantillaAlerta || '',
  ];

  if (existingRecord) {
    SHEETS.usuarios.headers.forEach(function(header, index) {
      setCellByHeader_(sheet, existingRecord.rowNumber, existingRecord.headers, header, values[index]);
    });
  } else {
    sheet.appendRow(values);
  }

  if (isCdaAllyAccessUser_(user)) {
    upsertCdaAllyConfig_(user);
  }

  const welcomeEmail = sendCdaActivationWelcomeEmailIfNeeded_(user, {
    email,
    userId,
    subscriptionEndsAt,
  });

  return { ok: true, message: existingRecord ? 'User updated' : 'User registered', userId, welcomeEmailSent: welcomeEmail.sent, welcomeEmailMessage: welcomeEmail.message };
}

function savePushSubscription_(subscription) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const headers = SHEETS.pushSubscriptions.headers;
  const sheet = ensureSheet_(ss, SHEETS.pushSubscriptions.name, headers);
  const token = String(subscription.token || '').trim();
  const email = String(subscription.userEmail || subscription.email || '').trim().toLowerCase();

  if (!token) {
    throw new Error('Push token required');
  }

  const row = [
    subscription.updatedAt || new Date().toISOString(),
    email,
    token,
    subscription.permission || '',
    subscription.platform || '',
    subscription.userAgent || '',
    subscription.appVersion || '',
    'active',
    '',
  ];
  const existingRowNumber = findPushSubscriptionRowNumber_(sheet, token);

  if (existingRowNumber) {
    sheet.getRange(existingRowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRow_(SHEETS.pushSubscriptions.name, row);
  }

  return {
    ok: true,
    message: 'Push subscription saved',
    userEmail: email,
  };
}

function findPushSubscriptionRowNumber_(sheet, token) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;

  const headers = values[0].map(function(header) {
    return String(header || '').trim();
  });
  const tokenIndex = headers.indexOf('token');
  if (tokenIndex < 0) return 0;

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][tokenIndex] || '').trim() === token) {
      return index + 1;
    }
  }

  return 0;
}

function sendTestPushNotification_(email, token) {
  const target = token ? { token: String(token).trim(), userEmail: String(email || '').trim().toLowerCase() } : getLatestPushSubscription_(email);

  if (!target || !target.token) {
    throw new Error('No hay token push activo para probar.');
  }

  const result = sendFcmPush_({
    token: target.token,
    title: 'Prueba push copilot360',
    body: 'Tu dispositivo ya puede recibir notificaciones push.',
    tag: 'copilot-test-push',
    url: APP_PUBLIC_URL,
    type: 'test',
  });

  appendApiLog_('sendTestPushNotification', 'ok', 'Push sent', {
    userEmail: target.userEmail || '',
    messageName: result.name || '',
  });

  return {
    ok: true,
    message: 'Push de prueba enviado',
    userEmail: target.userEmail || '',
    firebaseResponse: result,
  };
}

function getLatestPushSubscription_(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.pushSubscriptions.name, SHEETS.pushSubscriptions.headers);
  const rows = getRowsAsObjects_(sheet);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  return rows
    .filter(function(row) {
      const rowEmail = String(row.userEmail || '').trim().toLowerCase();
      const status = String(row.status || '').trim().toLowerCase();
      return row.token && (!normalizedEmail || rowEmail === normalizedEmail) && (!status || status === 'active');
    })
    .sort(function(left, right) {
      return Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || '');
    })[0] || null;
}

function getActivePushSubscriptionsForEmail_(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return [];

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.pushSubscriptions.name, SHEETS.pushSubscriptions.headers);
  const seenTokens = {};

  return getRowsAsObjects_(sheet)
    .filter(function(row) {
      const rowEmail = String(row.userEmail || '').trim().toLowerCase();
      const token = String(row.token || '').trim();
      const status = String(row.status || '').trim().toLowerCase();
      if (!token || rowEmail !== normalizedEmail || (status && status !== 'active')) return false;
      if (seenTokens[token]) return false;
      seenTokens[token] = true;
      return true;
    })
    .sort(function(left, right) {
      return Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || '');
    });
}

function safeSendPushToUser_(email, message) {
  const subscriptions = getActivePushSubscriptionsForEmail_(email);
  const summary = {
    attempted: subscriptions.length,
    sent: 0,
    errors: 0,
    messages: [],
  };

  subscriptions.forEach(function(subscription) {
    try {
      const result = sendFcmPush_({
        token: subscription.token,
        title: message.title,
        body: message.body,
        tag: message.tag,
        url: message.url,
        type: message.type,
        requireInteraction: message.requireInteraction,
        icon: message.icon,
        badge: message.badge,
      });

      summary.sent += 1;
      summary.messages.push(result.name || 'sent');
    } catch (error) {
      summary.errors += 1;
      summary.messages.push(error.message);
    }
  });

  return summary;
}

function formatPushSummaryForLog_(summary) {
  if (!summary) return '';
  return ' | push: ' + summary.sent + '/' + summary.attempted + (summary.errors ? ' errores: ' + summary.errors : '');
}

function sendFcmPush_(message) {
  const config = getFirebaseServiceAccountConfig_();
  const accessToken = getFirebaseAccessToken_(config);
  const endpoint = 'https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(config.projectId) + '/messages:send';
  const title = message.title || APP_NAME;
  const body = message.body || 'Tienes una alerta pendiente en ' + APP_NAME + '.';
  const icon = message.icon || APP_PUBLIC_URL + 'copilot-icon-192.png';
  const badge = message.badge || APP_PUBLIC_URL + 'copilot-icon-192.png';
  const payload = {
    message: {
      token: message.token,
      webpush: {
        notification: {
          title,
          body,
          icon,
          badge,
          tag: message.tag || 'copilot-push',
          requireInteraction: Boolean(message.requireInteraction),
          data: {
            url: message.url || APP_PUBLIC_URL,
            type: message.type || 'push',
          },
        },
        fcm_options: {
          link: message.url || APP_PUBLIC_URL,
        },
      },
      data: {
        title,
        body,
        icon,
        badge,
        tag: message.tag || 'copilot-push',
        url: message.url || APP_PUBLIC_URL,
        type: message.type || 'push',
        requireInteraction: message.requireInteraction ? 'true' : 'false',
      },
    },
  };
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();
  const responsePayload = responseText ? JSON.parse(responseText) : {};

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('FCM error ' + statusCode + ': ' + responseText);
  }

  return responsePayload;
}

function getFirebaseAccessToken_(config) {
  const cacheKey = 'firebase_access_token_' + config.projectId;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return cached;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const claimSet = {
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };
  const unsignedJwt = base64UrlEncode_(JSON.stringify(header)) + '.' + base64UrlEncode_(JSON.stringify(claimSet));
  const signature = Utilities.computeRsaSha256Signature(unsignedJwt, config.privateKey);
  const jwt = unsignedJwt + '.' + base64UrlEncodeBytes_(signature);
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    },
    muteHttpExceptions: true,
  });
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (statusCode < 200 || statusCode >= 300 || !payload.access_token) {
    throw new Error('No se pudo autenticar con Firebase: ' + responseText);
  }

  CacheService.getScriptCache().put(cacheKey, payload.access_token, 3300);
  return payload.access_token;
}

function getFirebaseServiceAccountConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const projectId = String(properties.getProperty('FIREBASE_PROJECT_ID') || 'copilot360-1577d').trim();
  const clientEmail = String(properties.getProperty('FIREBASE_CLIENT_EMAIL') || '').trim();
  const privateKey = String(properties.getProperty('FIREBASE_PRIVATE_KEY') || '').replace(/\\n/g, '\n').trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en Script Properties.');
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function base64UrlEncode_(value) {
  return base64UrlEncodeBytes_(Utilities.newBlob(value).getBytes());
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function upsertCdaAllyConfig_(user) {
  const codigoAliado = String(user.codigoAliado || '').trim();
  if (!codigoAliado) return;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.cdaAliados.name, SHEETS.cdaAliados.headers);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(function(header) { return String(header || '').trim(); });
  const codeIndex = headers.indexOf('codigoAliado');
  const normalizedCode = normalizeHeader_(codigoAliado);
  let rowNumber = 0;

  for (let rowIndex = rows.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (normalizeHeader_(rows[rowIndex][codeIndex] || '') === normalizedCode) {
      rowNumber = rowIndex + 1;
      break;
    }
  }

  const values = [
    user.idCDA || '',
    user.nombreCDA || user.name || codigoAliado,
    codigoAliado,
    user.correoCDA || user.email || '',
    user.logoCdaUrl || '',
    user.plantillaBienvenida || '',
    user.plantillaVencimiento || '',
    user.plantillaPicoPlaca || '',
    user.plantillaAlerta || '',
    'TRUE',
  ];

  if (rowNumber) {
    SHEETS.cdaAliados.headers.forEach(function(header, index) {
      setCellByHeader_(sheet, rowNumber, headers, header, values[index]);
    });
  } else {
    sheet.appendRow(values);
  }
}

function uploadAllyLogo_(logo) {
  const fileName = String(logo.fileName || 'logo-aliado.png').trim();
  const mimeType = String(logo.mimeType || '').trim();
  const base64Data = String(logo.base64Data || '').replace(/^data:[^,]+,/, '');
  const codigoAliado = String(logo.codigoAliado || '').trim();
  const idCDA = String(logo.idCDA || '').trim();
  const nombreCDA = String(logo.nombreCDA || codigoAliado || 'Aliado').trim();

  if (!base64Data || !mimeType || mimeType.indexOf('image/') !== 0) {
    throw new Error('Debes subir una imagen valida.');
  }

  const bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > 4 * 1024 * 1024) {
    throw new Error('La imagen no debe superar 4 MB.');
  }

  const extension = getImageExtension_(mimeType, fileName);
  const safeCode = sanitizeDriveFileName_(codigoAliado || idCDA || nombreCDA || 'aliado');
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const finalName = safeCode + '-logo-' + timestamp + extension;
  const folder = getOrCreateDriveFolder_(ALLY_LOGOS_DRIVE_FOLDER_NAME);
  const blob = Utilities.newBlob(bytes, mimeType, finalName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const url = buildDriveThumbnailUrl_(file.getId(), 160);
  updateCdaAllyLogoConfig_({
    idCDA: idCDA,
    codigoAliado: codigoAliado,
    nombreCDA: nombreCDA,
    logoCdaUrl: url,
  });

  return {
    ok: true,
    message: 'Logo del aliado guardado en Drive',
    fileId: file.getId(),
    url: url,
    logoCdaUrl: url,
  };
}

function updateCdaAllyLogoConfig_(ally) {
  const codigoAliado = String(ally.codigoAliado || '').trim();
  const idCDA = String(ally.idCDA || '').trim();
  if (!codigoAliado && !idCDA) return;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.cdaAliados.name, SHEETS.cdaAliados.headers);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(function(header) { return String(header || '').trim(); });
  const codeIndex = headers.indexOf('codigoAliado');
  const idIndex = headers.indexOf('idCDA');
  const normalizedCode = normalizeHeader_(codigoAliado);
  const normalizedId = normalizeHeader_(idCDA);
  let rowNumber = 0;

  for (let rowIndex = rows.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const rowCode = codeIndex >= 0 ? normalizeHeader_(rows[rowIndex][codeIndex] || '') : '';
    const rowId = idIndex >= 0 ? normalizeHeader_(rows[rowIndex][idIndex] || '') : '';
    if ((normalizedCode && rowCode === normalizedCode) || (normalizedId && rowId === normalizedId)) {
      rowNumber = rowIndex + 1;
      break;
    }
  }

  if (rowNumber) {
    setCellByHeader_(sheet, rowNumber, headers, 'logoCdaUrl', ally.logoCdaUrl || '');
    if (ally.nombreCDA) setCellByHeader_(sheet, rowNumber, headers, 'nombreCDA', ally.nombreCDA);
    if (codigoAliado) setCellByHeader_(sheet, rowNumber, headers, 'codigoAliado', codigoAliado);
    if (idCDA) setCellByHeader_(sheet, rowNumber, headers, 'idCDA', idCDA);
    setCellByHeader_(sheet, rowNumber, headers, 'activo', 'TRUE');
    return;
  }

  sheet.appendRow([
    idCDA,
    ally.nombreCDA || codigoAliado || idCDA,
    codigoAliado,
    '',
    ally.logoCdaUrl || '',
    '',
    '',
    '',
    '',
    'TRUE',
  ]);
}

function registerAllyPreRegistration_(preRegistration) {
  const createdAt = preRegistration.fechaHoraPreRegistro || preRegistration.createdAt || new Date().toISOString();
  const codigoAliado = normalizeAllyCode_(preRegistration.codigoAliado || preRegistration.ref || '');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cdaConfigsByCode = buildCdaConfigsByCode_(ss);
  const ally = cdaConfigsByCode[normalizeHeader_(codigoAliado)] || {};
  const idPreRegistro = preRegistration.idPreRegistro || Utilities.getUuid();
  const codigoActivacion = preRegistration.codigoActivacion || buildAllyActivationCode_(codigoAliado);
  const sheet = ensureSheet_(ss, SHEETS.preRegistrosAliados.name, SHEETS.preRegistrosAliados.headers);
  const existing = findAllyPreRegistrationRecord_(sheet, idPreRegistro);
  const values = [
    createdAt,
    idPreRegistro,
    preRegistration.idCDA || ally.idCDA || buildReferralAllyId_(codigoAliado),
    codigoAliado,
    preRegistration.nombreCDA || ally.nombreCDA || ('Aliado ' + codigoAliado),
    preRegistration.nombreCliente || '',
    cleanPhone_(preRegistration.whatsapp || ''),
    String(preRegistration.placa || '').trim().toUpperCase(),
    preRegistration.ciudad || '',
    codigoActivacion,
    preRegistration.estado || 'pendiente_pago',
    preRegistration.fuente || 'qr',
    preRegistration.fechaActivacion || '',
    preRegistration.correo || '',
    preRegistration.metodoPago || '',
  ];

  if (existing) {
    SHEETS.preRegistrosAliados.headers.forEach(function(header, index) {
      setCellByHeader_(sheet, existing.rowNumber, existing.headers, header, values[index]);
    });
  } else {
    sheet.appendRow(values);
  }

  return {
    ok: true,
    message: existing ? 'Pre-registro actualizado' : 'Pre-registro creado',
    preRegistration: rowToAllyPreRegistration_(Object.fromEntries(SHEETS.preRegistrosAliados.headers.map(function(header, index) {
      return [header, values[index]];
    }))),
  };
}

function getAllyPreRegistrations_(codigoAliado, idCDA) {
  const cleanCode = normalizeHeader_(codigoAliado || '');
  const cleanId = String(idCDA || '').trim();
  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.preRegistrosAliados.name, SHEETS.preRegistrosAliados.headers);
  const items = getRowsAsObjects_(sheet)
    .filter(function(row) {
      const rowCode = normalizeHeader_(row.codigoAliado || '');
      const rowId = String(row.idCDA || '').trim();
      if (!cleanCode && !cleanId) return true;
      return (cleanCode && rowCode === cleanCode) || (cleanId && rowId === cleanId);
    })
    .map(rowToAllyPreRegistration_);

  return { ok: true, items };
}

function findAllyPreRegistrationRecord_(sheet, idPreRegistro) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0].map(function(header) { return String(header || '').trim(); });
  const idIndex = headers.indexOf('idPreRegistro');
  if (idIndex < 0) return null;

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][idIndex] || '').trim() === String(idPreRegistro || '').trim()) {
      const row = {};
      headers.forEach(function(header, index) {
        row[header] = values[rowIndex][index];
      });
      return { rowNumber: rowIndex + 1, headers, row };
    }
  }

  return null;
}

function rowToAllyPreRegistration_(row) {
  return {
    idPreRegistro: String(row.idPreRegistro || '').trim(),
    idCDA: String(row.idCDA || '').trim(),
    codigoAliado: String(row.codigoAliado || '').trim(),
    nombreCDA: String(row.nombreCDA || '').trim(),
    nombreCliente: String(row.nombreCliente || '').trim(),
    whatsapp: cleanPhone_(row.whatsapp || ''),
    placa: String(row.placa || '').trim().toUpperCase(),
    ciudad: String(row.ciudad || '').trim(),
    fechaHoraPreRegistro: formatSheetDateTime_(row.createdAt || '') || String(row.createdAt || ''),
    codigoActivacion: String(row.codigoActivacion || '').trim(),
    estado: String(row.estado || 'pendiente_pago').trim(),
    fuente: String(row.fuente || 'qr').trim(),
    fechaActivacion: formatSheetDateTime_(row.fechaActivacion || '') || String(row.fechaActivacion || ''),
    correo: String(row.correo || '').trim().toLowerCase(),
    metodoPago: String(row.metodoPago || '').trim(),
  };
}

function normalizeAllyCode_(value) {
  const clean = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
  if (clean.indexOf('ALIADO-') === 0 || clean.indexOf('CDA-') === 0) return clean;
  return 'ALIADO-' + (clean || new Date().getTime().toString().slice(-6));
}

function buildReferralAllyId_(codigoAliado) {
  return 'ally-' + normalizeHeader_(codigoAliado || '').toLowerCase();
}

function buildAllyActivationCode_(codigoAliado) {
  return normalizeAllyCode_(codigoAliado || 'ALIADO') + '-' + Math.floor(1000 + Math.random() * 9000);
}

function sendCdaActivationWelcomeEmailIfNeeded_(user, context) {
  const email = String(context.email || '').trim().toLowerCase();
  if (!shouldSendCdaActivationWelcomeEmail_(user, email)) {
    return { sent: false, message: 'Welcome email skipped' };
  }

  try {
    const emailPayload = buildCdaActivationWelcomeEmail_(user, context);
    const mailOptions = {
      to: email,
      subject: emailPayload.subject,
      body: emailPayload.plainBody,
      htmlBody: emailPayload.htmlBody,
      name: emailPayload.senderName,
    };

    if (emailPayload.replyTo) {
      mailOptions.replyTo = emailPayload.replyTo;
    }

    sendTransactionalEmail_(mailOptions);
    appendApiLog_('sendCdaActivationWelcomeEmail', 'ok', 'Welcome email sent', {
      email,
      userId: context.userId,
      codigoAliado: user.codigoAliado || '',
    });
    return { sent: true, message: 'Welcome email sent' };
  } catch (error) {
    appendApiLog_('sendCdaActivationWelcomeEmail', 'error', error.message, {
      email,
      userId: context.userId,
      codigoAliado: user.codigoAliado || '',
    });
    return { sent: false, message: error.message };
  }
}

function shouldSendCdaActivationWelcomeEmail_(user, email) {
  if (!isLikelyEmail_(email)) return false;
  if (user.sendWelcomeEmail === false) return false;

  const source = String(user.source || '').trim().toLowerCase();
  return Boolean(user.codigoAliado || user.idCDA || source === 'manual-caja' || source === 'pre-registro' || source === 'cda-caja');
}

function isCdaAllyAccessUser_(user) {
  const role = String(user.role || '').trim().toLowerCase();
  const source = String(user.source || '').trim().toLowerCase();
  return role === 'cda_aliado' || role === 'cda_ally' || source === 'cda-ally-admin';
}

function buildCdaActivationWelcomeEmail_(user, context) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cdaConfigsByCode = buildCdaConfigsByCode_(ss);
  const code = String(user.codigoAliado || '').trim();
  const config = cdaConfigsByCode[normalizeHeader_(code)] || {};

  if (isCdaAllyAccessUser_(user)) {
    return buildCdaAllyWelcomeEmail_(user, context, config);
  }

  const ally = normalizeAllyBranding_({
    idCDA: user.idCDA || config.idCDA || '',
    codigoAliado: code || config.codigoAliado || '',
    nombreCDA: user.nombreCDA || config.nombreCDA || '',
    logoCdaUrl: user.logoCdaUrl || config.logoCdaUrl || '',
    templates: {
      welcome: user.plantillaBienvenida || config.plantillaBienvenida || DEFAULT_ALLY_EMAIL_TEMPLATES.welcome,
      documentReminder: user.plantillaVencimiento || config.plantillaVencimiento || DEFAULT_ALLY_EMAIL_TEMPLATES.documentReminder,
      picoPlaca: user.plantillaPicoPlaca || config.plantillaPicoPlaca || DEFAULT_ALLY_EMAIL_TEMPLATES.picoPlaca,
      importantAlert: user.plantillaAlerta || config.plantillaAlerta || DEFAULT_ALLY_EMAIL_TEMPLATES.importantAlert,
    },
  });
  const name = String(user.name || user.nombre || context.email || 'conductor').trim();
  const cdaName = ally ? ally.nombreCDA : APP_NAME;
  const welcomeMessage = ally
    ? renderAllyTemplate_(ally.templates.welcome, {
        nombreCDA: ally.nombreCDA,
        codigoAliado: ally.codigoAliado,
        nombreCliente: name,
        documento: '',
        diasRestantes: '',
        placa: '',
        ciudad: user.city || user.ciudad || '',
        fecha: '',
      })
    : 'Tu servicio ' + APP_NAME + ' Conductores quedo activado exitosamente por 1 ano.';
  const replyTo = getCdaReplyToEmail_(user, config);
  const values = {
    nombreUsuario: escapeHtml_(name),
    allyHeaderHtml: ally ? buildAllyHeaderHtml_(ally) : '',
    mensajeBienvenida: escapeHtml_(welcomeMessage),
    cdaNombre: escapeHtml_(cdaName),
    codigoAliado: escapeHtml_(ally ? ally.codigoAliado : String(user.codigoAliado || '')),
    usuarioAcceso: escapeHtml_(context.email),
    passwordTemporal: escapeHtml_(user.password || ''),
    fechaVencimiento: escapeHtml_(formatSheetDate_(context.subscriptionEndsAt || user.subscriptionEndsAt || '')),
    urlApp: escapeHtml_(APP_PUBLIC_URL),
    footerText: 'Powered By ' + APP_NAME,
  };

  return {
    subject: ally ? ally.nombreCDA + ' + ' + APP_NAME + ': bienvenida a tu servicio' : 'Bienvenido a Servicio ' + APP_NAME + ' Conductores',
    senderName: ally ? ally.nombreCDA + ' en alianza con ' + APP_NAME : APP_NAME,
    replyTo,
    htmlBody: buildCdaActivationWelcomeHtml_(values),
    plainBody: buildCdaActivationWelcomePlainBody_({
      name,
      welcomeMessage,
      cdaName,
      codigoAliado: ally ? ally.codigoAliado : user.codigoAliado || '',
      usuarioAcceso: context.email,
      passwordTemporal: user.password || '',
      fechaVencimiento: formatSheetDate_(context.subscriptionEndsAt || user.subscriptionEndsAt || ''),
      urlApp: APP_PUBLIC_URL,
    }),
  };
}

function buildCdaAllyWelcomeEmail_(user, context, config) {
  const code = String(user.codigoAliado || config.codigoAliado || '').trim();
  const cdaName = String(user.nombreCDA || config.nombreCDA || user.name || APP_NAME).trim();
  const name = String(user.name || user.nombre || cdaName || context.email).trim();
  const ally = normalizeAllyBranding_({
    idCDA: user.idCDA || config.idCDA || '',
    codigoAliado: code,
    nombreCDA: cdaName,
    logoCdaUrl: user.logoCdaUrl || config.logoCdaUrl || '',
    templates: {},
  });
  const values = {
    nombreUsuario: escapeHtml_(name),
    allyHeaderHtml: ally ? buildAllyHeaderHtml_(ally) : '',
    cdaNombre: escapeHtml_(cdaName),
    codigoAliado: escapeHtml_(code),
    usuarioAcceso: escapeHtml_(context.email),
    passwordTemporal: escapeHtml_(user.password || ''),
    urlApp: escapeHtml_(APP_PUBLIC_URL),
    footerText: 'Powered By ' + APP_NAME,
  };

  return {
    subject: APP_NAME + ': bienvenida al panel de aliados',
    senderName: APP_NAME,
    replyTo: getCdaReplyToEmail_(user, config),
    htmlBody: buildCdaAllyWelcomeHtml_(values),
    plainBody: buildCdaAllyWelcomePlainBody_({
      name,
      cdaName,
      codigoAliado: code,
      usuarioAcceso: context.email,
      passwordTemporal: user.password || '',
      urlApp: APP_PUBLIC_URL,
    }),
  };
}

function buildCdaAllyWelcomePlainBody_(values) {
  return [
    'Hola ' + values.name + ',',
    '',
    'Bienvenido al programa de aliados de ' + APP_NAME + '. Tu acceso al panel del aliado quedo activo.',
    '',
    'Aliado: ' + values.cdaName,
    'Codigo aliado: ' + values.codigoAliado,
    'Usuario/correo de acceso: ' + values.usuarioAcceso,
    'Clave/contrasena temporal: ' + values.passwordTemporal,
    '',
    'Ingresa aqui: ' + values.urlApp,
    '',
    'Powered By ' + APP_NAME + '.',
  ].filter(function(line) {
    return line !== '';
  }).join('\n');
}

function buildCdaAllyWelcomeHtml_(values) {
  const template = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f5f7fb;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10);">
          <tr>
            <td align="center" style="padding:26px 20px 14px;background:#101828;">
              <img src="${APP_LOGO_URL}"
                   alt="${APP_NAME}"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Panel de aliados ${APP_NAME}
              </p>
              {{allyHeaderHtml}}
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                Bienvenido al programa de aliados de ${APP_NAME}. Ya puedes ingresar al panel para gestionar tus activaciones, clientes y herramientas comerciales.
              </p>

              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:18px;text-align:center;margin:0 0 22px;">
                <p style="margin:0;color:#1d4ed8;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;">
                  Acceso aliado activo
                </p>
                <p style="margin:8px 0 0;color:#1e3a8a;font-size:22px;font-weight:800;">
                  {{cdaNombre}}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;margin:0 0 22px;">
                <tr>
                  <td style="padding:16px;font-size:15px;line-height:1.8;">
                    <strong>C&oacute;digo aliado:</strong> {{codigoAliado}}<br>
                    <strong>Usuario/correo:</strong> {{usuarioAcceso}}<br>
                    <strong>Clave/contrase&ntilde;a temporal:</strong> {{passwordTemporal}}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.6;color:#475467;margin:0 0 22px;">
                Guarda estas credenciales y comparte el acceso solo con el equipo autorizado del aliado.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="{{urlApp}}"
                   style="background:#101828;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">
                  Entrar al panel
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              {{footerText}}
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

function getCdaReplyToEmail_(user, config) {
  const candidate = String(user.correoCDA || config.correo || '').trim().toLowerCase();
  return isLikelyEmail_(candidate) ? candidate : '';
}

function buildCdaActivationWelcomePlainBody_(values) {
  return [
    'Hola ' + values.name + ',',
    '',
    values.welcomeMessage,
    '',
    'Tu servicio ' + APP_NAME + ' Conductores quedo activado por 1 ano.',
    'Aliado: ' + values.cdaName,
    'Codigo aliado: ' + values.codigoAliado,
    'Usuario: ' + values.usuarioAcceso,
    'Clave temporal: ' + values.passwordTemporal,
    values.fechaVencimiento ? 'Vigente hasta: ' + values.fechaVencimiento : '',
    '',
    'Ingresa aqui: ' + values.urlApp,
    '',
    'Powered By ' + APP_NAME + '.',
  ].filter(function(line) {
    return line !== '';
  }).join('\n');
}

function buildCdaActivationWelcomeHtml_(values) {
  const template = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f5f7fb;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10);">
          <tr>
            <td align="center" style="padding:26px 20px 14px;background:#101828;">
              <img src="${APP_LOGO_URL}"
                   alt="${APP_NAME}"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Servicio ${APP_NAME} Conductores
              </p>
              {{allyHeaderHtml}}
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                {{mensajeBienvenida}}
              </p>

              <div style="background:#ecfdf3;border:1px solid #abefc6;border-radius:16px;padding:18px;text-align:center;margin:0 0 22px;">
                <p style="margin:0;color:#027a48;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;">
                  Servicio activado
                </p>
                <p style="margin:8px 0 0;color:#027a48;font-size:34px;font-weight:800;">
                  1 a&ntilde;o
                </p>
                <p style="margin:0;color:#027a48;font-size:15px;">
                  membres&iacute;a anual activa
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;margin:0 0 22px;">
                <tr>
                  <td style="padding:16px;font-size:15px;line-height:1.8;">
                    <strong>Aliado:</strong> {{cdaNombre}}<br>
                    <strong>C&oacute;digo aliado:</strong> {{codigoAliado}}<br>
                    <strong>Usuario:</strong> {{usuarioAcceso}}<br>
                    <strong>Clave temporal:</strong> {{passwordTemporal}}<br>
                    <strong>Vigente hasta:</strong> {{fechaVencimiento}}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.6;color:#475467;margin:0 0 22px;">
                Ahora podr&aacute;s recibir recordatorios autom&aacute;ticos, pico y placa, alertas importantes y novedades de tr&aacute;nsito.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="{{urlApp}}"
                   style="background:#101828;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">
                  Entrar a ${APP_NAME}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              {{footerText}}
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

function validateLogin_(identifier, password) {
  const cleanIdentifier = String(identifier || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanIdentifier || !cleanPassword) {
    return { ok: false, message: 'Correo/usuario y contraseña son obligatorios' };
  }

  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const userRecord = findUserRecordByEmail_(sheet, cleanIdentifier);
  const user = userRecord ? userRecord.user : null;

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

  const access = ensureUserAccess_(sheet, userRecord.rowNumber, user);
  if (!access.active) {
    return {
      ok: false,
      message: access.message || 'Tu suscripción o prueba gratis no está activa.',
      access,
    };
  }

  const passwordChangeRequired = isPasswordChangeRequiredForUser_(user);

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
      subscriptionStatus: user.subscriptionStatus || access.status || '',
      subscriptionEndsAt: formatSheetDateTime_(user.subscriptionEndsAt || access.subscriptionEndsAt || ''),
      trialStartedAt: formatSheetDateTime_(user.trialStartedAt || access.trialStartedAt || ''),
      trialEndsAt: formatSheetDateTime_(user.trialEndsAt || access.trialEndsAt || ''),
      accessActive: access.active,
      accessType: access.type,
      sheetValidated: true,
      idCDA: user.idCDA || '',
      codigoAliado: user.codigoAliado || '',
      nombreCDA: user.nombreCDA || '',
      logoCdaUrl: user.logoCdaUrl || '',
      mustChangePassword: passwordChangeRequired,
      passwordChangeRequired,
      passwordUpdatedAt: formatSheetDateTime_(user.passwordUpdatedAt || ''),
    },
  };
}

function requestPasswordReset_(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isLikelyEmail_(cleanEmail)) {
    return { ok: false, message: 'Ingresa un correo electrónico válido' };
  }

  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const record = findUserRecordByEmail_(sheet, cleanEmail);

  if (!record) {
    return { ok: true, message: 'Si el correo existe, enviaremos un código de verificación' };
  }

  const code = generatePasswordResetCode_();
  const expiresAt = addMinutes_(new Date(), PASSWORD_RESET_CODE_TTL_MINUTES).toISOString();

  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetCode', code);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetExpiresAt', expiresAt);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetUsedAt', '');

  try {
    sendPasswordResetEmail_(record.user, code, expiresAt);
  } catch (error) {
    appendApiLog_('requestPasswordReset', 'error', error.message, { email: cleanEmail });
    return { ok: false, message: 'No se pudo enviar el código. Intenta de nuevo.' };
  }

  appendApiLog_('requestPasswordReset', 'ok', 'Password reset code sent', { email: cleanEmail });
  return { ok: true, message: 'Código de verificación enviado' };
}

function resetPassword_(email, code, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').replace(/\D/g, '');
  const newPassword = String(password || '');

  if (!isLikelyEmail_(cleanEmail) || cleanCode.length !== 6 || newPassword.length < 6) {
    return { ok: false, message: 'Datos de recuperación incompletos' };
  }

  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const record = findUserRecordByEmail_(sheet, cleanEmail);

  if (!record) {
    return { ok: false, message: 'Código inválido o vencido' };
  }

  const storedCode = String(record.user.passwordResetCode || '').trim();
  const expiresAt = parseAccessDate_(record.user.passwordResetExpiresAt);

  if (!storedCode || storedCode !== cleanCode || !expiresAt || expiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'Código inválido o vencido' };
  }

  setCellByHeader_(sheet, record.rowNumber, record.headers, 'password', newPassword);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetCode', '');
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetExpiresAt', '');
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetUsedAt', new Date().toISOString());
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'mustChangePassword', false);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordUpdatedAt', new Date().toISOString());

  appendApiLog_('resetPassword', 'ok', 'Password updated with verification code', { email: cleanEmail });
  return { ok: true, message: 'Contraseña actualizada' };
}

function updateUserPassword_(passwordUpdate) {
  const cleanEmail = String(passwordUpdate.email || passwordUpdate.identifier || '').trim().toLowerCase();
  const cleanUserId = String(passwordUpdate.userId || passwordUpdate.id || '').trim();
  const newPassword = String(passwordUpdate.newPassword || passwordUpdate.password || '');

  if ((!cleanEmail && !cleanUserId) || newPassword.length < 6) {
    return { ok: false, message: 'Datos incompletos para actualizar la contrasena' };
  }

  const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.usuarios.name, SHEETS.usuarios.headers);
  const record = findUserRecordByEmailOrId_(sheet, cleanEmail, cleanUserId);

  if (!record) {
    return { ok: false, message: 'Usuario no encontrado' };
  }

  const updatedAt = new Date().toISOString();
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'password', newPassword);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'mustChangePassword', false);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordUpdatedAt', updatedAt);
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetCode', '');
  setCellByHeader_(sheet, record.rowNumber, record.headers, 'passwordResetExpiresAt', '');

  appendApiLog_('updateUserPassword', 'ok', 'Temporary password replaced', {
    email: cleanEmail,
    userId: cleanUserId,
  });

  return {
    ok: true,
    message: 'Contrasena actualizada',
    passwordUpdatedAt: updatedAt,
  };
}

function findUserRecordByEmail_(sheet, email) {
  return findUserRecordByEmailOrId_(sheet, email, '');
}

function findUserRecordByEmailOrId_(sheet, email, userId) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0].map((header) => String(header || '').trim());
  const emailIndex = headers.indexOf('correo');
  const userIdIndex = headers.indexOf('userId');
  if (emailIndex < 0 && userIdIndex < 0) return null;

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUserId = String(userId || '').trim();
  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const emailMatches = cleanEmail && emailIndex >= 0 && String(values[rowIndex][emailIndex] || '').trim().toLowerCase() === cleanEmail;
    const userIdMatches = cleanUserId && userIdIndex >= 0 && String(values[rowIndex][userIdIndex] || '').trim() === cleanUserId;

    if (emailMatches || userIdMatches) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = values[rowIndex][index];
      });
      return {
        rowNumber: rowIndex + 1,
        headers,
        user,
      };
    }
  }

  return null;
}

function ensureUserAccess_(sheet, rowNumber, user) {
  const currentAccess = getUserAccessState_(user);
  if (currentAccess.active) return currentAccess;

  const hasTrialHistory = Boolean(user.trialStartedAt || user.trialEndsAt);
  if (hasTrialHistory) return currentAccess;

  const trial = buildFreeTrialAccess_(new Date());
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((header) => String(header || '').trim());

  setCellByHeader_(sheet, rowNumber, headers, 'subscriptionStatus', trial.subscriptionStatus);
  setCellByHeader_(sheet, rowNumber, headers, 'trialStartedAt', trial.trialStartedAt);
  setCellByHeader_(sheet, rowNumber, headers, 'trialEndsAt', trial.trialEndsAt);

  user.subscriptionStatus = trial.subscriptionStatus;
  user.trialStartedAt = trial.trialStartedAt;
  user.trialEndsAt = trial.trialEndsAt;

  return getUserAccessState_(user);
}

function getUserAccessState_(user) {
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'owner') {
    return { active: true, type: 'subscription', status: 'active', subscriptionEndsAt: '' };
  }

  if (isSubscriptionAccessActive_(user.subscriptionStatus, user.subscriptionEndsAt)) {
    return {
      active: true,
      type: 'subscription',
      status: String(user.subscriptionStatus || 'active').trim().toLowerCase(),
      subscriptionEndsAt: formatSheetDateTime_(user.subscriptionEndsAt || ''),
    };
  }

  if (user.trialEndsAt && !isAccessDateExpired_(user.trialEndsAt)) {
    return {
      active: true,
      type: 'trial',
      status: 'trial',
      trialStartedAt: formatSheetDateTime_(user.trialStartedAt || ''),
      trialEndsAt: formatSheetDateTime_(user.trialEndsAt || ''),
    };
  }

  return {
    active: false,
    type: 'expired',
    status: 'expired',
    trialStartedAt: formatSheetDateTime_(user.trialStartedAt || ''),
    trialEndsAt: formatSheetDateTime_(user.trialEndsAt || ''),
    subscriptionEndsAt: formatSheetDateTime_(user.subscriptionEndsAt || ''),
    message: 'Tu suscripción o prueba gratis no está activa.',
  };
}

function isSubscriptionAccessActive_(status, endsAt) {
  const text = String(status || '').trim().toLowerCase();
  const activeStatuses = ['active', 'activa', 'paid', 'pagada', 'subscribed', 'suscripcion_activa'];
  return activeStatuses.indexOf(text) >= 0 && !isAccessDateExpired_(endsAt);
}

function buildFreeTrialAccess_(startValue) {
  const startedAt = parseAccessDate_(startValue) || new Date();
  return {
    subscriptionStatus: 'trial',
    trialStartedAt: startedAt.toISOString(),
    trialEndsAt: addDays_(startedAt, FREE_TRIAL_DAYS).toISOString(),
  };
}

function sendPasswordResetEmail_(user, code, expiresAt) {
  const email = String(user.correo || '').trim().toLowerCase();
  const name = String(user.nombre || 'conductor').trim();
  const expiresText = Utilities.formatDate(parseAccessDate_(expiresAt), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const subject = 'Código para actualizar tu contraseña en ' + APP_NAME;
  const plainBody = [
    'Hola ' + name + ',',
    '',
    'Tu código para actualizar la contraseña de ' + APP_NAME + ' es: ' + code,
    'Este código vence el ' + expiresText + '.',
    '',
    'Si no solicitaste este cambio, puedes ignorar este mensaje.',
    'Abrir ' + APP_NAME + ': ' + APP_PUBLIC_URL,
  ].join('\n');
  const htmlBody = [
    '<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.6;max-width:560px;margin:auto;">',
    '<h2 style="margin:0 0 12px;">Actualiza tu contraseña</h2>',
    '<p>Hola <strong>' + escapeHtml_(name) + '</strong>,</p>',
    '<p>Usa este código para actualizar la contraseña de ' + APP_NAME + ':</p>',
    '<div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;background:#eff6ff;color:#1d4ed8;border-radius:16px;padding:18px;margin:20px 0;">' + code + '</div>',
    '<p>El código vence el <strong>' + escapeHtml_(expiresText) + '</strong>.</p>',
    '<p style="color:#667085;font-size:13px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>',
    '<p><a href="' + APP_PUBLIC_URL + '" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:bold;">Abrir ' + APP_NAME + '</a></p>',
    '</div>',
  ].join('');

  sendTransactionalEmail_({
    to: email,
    subject,
    body: plainBody,
    htmlBody,
  });
}

function generatePasswordResetCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function addDays_(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function addMinutes_(date, minutes) {
  const result = new Date(date.getTime());
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function parseAccessDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]') return value;

  const text = String(value || '').trim();
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsedDate = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]), 23, 59, 59, 999)
    : new Date(text);

  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isAccessDateExpired_(value) {
  const date = parseAccessDate_(value);
  if (!date) return false;
  return date.getTime() < Date.now();
}

function saveVehicle_(vehicle, user) {
  const updatedAt = vehicle.updatedAt || new Date().toISOString();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const cleanEmail = String(user.email || vehicle.userEmail || '').trim().toLowerCase();
  const cleanPlate = String(vehicle.plate || '').trim().toUpperCase();
  const notificationContacts = normalizeNotificationContacts_(vehicle.notificationContacts || vehicle.contactosNotificacion);
  const warrantyExpiryDate = getWarrantyExpiryDate_(vehicle.warrantyStartDate || vehicle.garantiaInicio, vehicle.warrantyYears || vehicle.garantiaVigenciaAnios);
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
    vehicle.insuranceExpiry || '',
    vehicle.insuranceNoticeDays || 30,
    vehicle.creditExpiry || '',
    vehicle.creditNoticeDays || 30,
    vehicle.warrantyStartDate || '',
    vehicle.warrantyYears || '',
    warrantyExpiryDate,
    vehicle.warrantyExpiryKm || '',
    vehicle.warrantyNoticeDays || 30,
    vehicle.nextEngineOilKm || '',
    vehicle.nextGearboxOilKm || '',
    notificationContacts[0] ? notificationContacts[0].name : '',
    notificationContacts[0] ? notificationContacts[0].email : '',
    notificationContacts[0] ? notificationContacts[0].notificationTypes.join(',') : '',
    notificationContacts[1] ? notificationContacts[1].name : '',
    notificationContacts[1] ? notificationContacts[1].email : '',
    notificationContacts[1] ? notificationContacts[1].notificationTypes.join(',') : '',
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

  if (cleanVehicleId && vehicleIdIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      if (String(values[rowIndex][vehicleIdIndex] || '').trim() === cleanVehicleId) {
        return rowIndex + 1;
      }
    }
  }

  if (cleanPlate && plateIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      const rowPlate = String(values[rowIndex][plateIndex] || '').trim().toUpperCase();
      const rowEmail = emailIndex >= 0 ? String(values[rowIndex][emailIndex] || '').trim().toLowerCase() : '';
      if (rowPlate === cleanPlate && (!cleanEmail || rowEmail === cleanEmail)) {
        return rowIndex + 1;
      }
    }
  }

  if (cleanEmail && !cleanVehicleId && !cleanPlate && emailIndex >= 0) {
    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
      if (String(values[rowIndex][emailIndex] || '').trim().toLowerCase() === cleanEmail) {
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
      insuranceExpiry: formatSheetDate_(row.seguroVence),
      insuranceNoticeDays: row.seguroAvisoDias || 30,
      creditExpiry: formatSheetDate_(row.creditoVence),
      creditNoticeDays: row.creditoAvisoDias || 30,
      warrantyStartDate: formatSheetDate_(row.garantiaInicio),
      warrantyYears: row.garantiaVigenciaAnios || '',
      warrantyExpiryKm: row.garantiaVenceKm || '',
      warrantyNoticeDays: row.garantiaAvisoDias || 30,
      nextEngineOilKm: row.proximoAceiteMotorKm || '',
      nextGearboxOilKm: row.proximoAceiteCajaKm || '',
      notificationContacts: buildNotificationContactsFromVehicleRow_(row),
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
    .map((row, index) => {
      const publishedAt = getNewsPublishedAt_(row);
      return {
        id: row.id || 'news-' + index,
        section: row.seccion || 'Novedades de transito',
        title: row.titulo || '',
        description: row.descripcion || '',
        category: row.categoria || 'General',
        date: formatSheetDate_(row.fecha) || formatSheetDate_(publishedAt) || '',
        publishedAt,
        imageUrl: row.imageUrl || '',
        videoUrl: row.videoUrl || '',
      };
    })
    .filter((item) => item.title);

  return { ok: true, items };
}

function getNewsPublishedAt_(row) {
  const explicitPublishedAt = getValue_(row, ['fechaPublicacion', 'publishedAt', 'createdAt', 'publicadoEn']);
  if (explicitPublishedAt) return formatSheetDateTime_(explicitPublishedAt);
  return formatSheetDate_(row.fecha) || '';
}

function isNewsEligibleForUser_(news, user) {
  const userCreatedAt = parseSheetDateTime_(user.createdAt);
  const userCreatedDate = parseSheetDateOnly_(user.createdAt);
  if (!userCreatedAt && !userCreatedDate) return false;

  const newsPublishedAt = parseSheetDateTime_(news.publishedAt);
  if (newsPublishedAt) {
    const baseline = userCreatedAt || userCreatedDate;
    return newsPublishedAt.getTime() >= baseline.getTime();
  }

  const newsDate = parseSheetDateOnly_(news.date || news.publishedAt);
  if (!newsDate || !userCreatedDate) return false;

  return daysBetweenDateOnly_(userCreatedDate, newsDate) >= 0;
}

function installNewsPublicationTrigger() {
  setupCopilotConfig();

  const handlerName = 'sendNewsPublicationNotifications';
  const removed = removeTriggersByHandlerNames_([handlerName]);

  ScriptApp.newTrigger(handlerName)
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();

  ScriptApp.newTrigger(handlerName)
    .timeBased()
    .everyHours(1)
    .inTimezone(Session.getScriptTimeZone())
    .create();

  return {
    ok: true,
    message: 'News publication trigger installed',
    handler: handlerName,
    triggers: ['onEdit', 'everyHours(1)'],
    timezone: Session.getScriptTimeZone(),
    removed,
  };
}

function removeNewsPublicationTriggers() {
  const removed = removeTriggersByHandlerNames_(['sendNewsPublicationNotifications']);
  return { ok: true, removed };
}

function sendNewsPublicationNotifications(options) {
  if (!options || !options.skipSetup) setupCopilotConfig();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logSheet = ensureSheet_(ss, SHEETS.correosNovedades.name, SHEETS.correosNovedades.headers);
  const sentKeys = getSentReminderKeys_(logSheet);
  const audience = getNewsNotificationAudience_();
  const vehiclesByEmail = buildLatestVehiclesByEmail_(ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers));
  const users = getRowsAsObjects_(ensureSheet_(ss, SHEETS.usuarios.name, SHEETS.usuarios.headers))
    .filter((user) => {
      const email = String(user.correo || '').trim().toLowerCase();
      return isLikelyEmail_(email) && getUserAccessState_(user).active && isUserInNewsAudience_(user, audience);
    });
  const newsItems = getHomeNews_().items || [];
  const summary = {
    ok: true,
    audience,
    checkedUsers: users.length,
    checkedNews: newsItems.length,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  newsItems.forEach((news) => {
    users.forEach((user) => {
      const email = String(user.correo || '').trim().toLowerCase();
      const recipients = getVehicleNotificationRecipients_(vehiclesByEmail[email] || { userEmail: email }, user, 'news');

      if (!isNewsEligibleForUser_(news, user)) {
        summary.skipped += 1;
        return;
      }

      recipients.forEach((recipient) => {
        const userName = recipient.name || recipient.email;
        const notificationKey = buildNewsPublicationKey_(recipient.email, news);

        if (sentKeys[notificationKey]) {
          summary.skipped += 1;
          return;
        }

        const emailPayload = buildNewsPublicationEmail_({
          news,
          userName,
          email: recipient.email,
        });

        try {
          sendTransactionalEmail_({
            to: recipient.email,
            subject: emailPayload.subject,
            body: emailPayload.plainBody,
            htmlBody: emailPayload.htmlBody,
            name: EMAIL_DEFAULT_FROM_NAME,
          });
          const pushSummary = recipient.isOwner ? safeSendPushToUser_(email, {
            title: news.title || 'Nueva novedad en ' + APP_NAME,
            body: news.description || 'Hay una nueva publicacion disponible en ' + APP_NAME + '.',
            tag: notificationKey,
            url: APP_PUBLIC_URL,
            type: 'news',
          }) : { attempted: 0, sent: 0, errors: 0, messages: [] };

          appendNewsPublicationLog_(logSheet, {
            notificationKey,
            email: recipient.email,
            userName,
            news,
            status: 'sent',
            message: emailPayload.subject + formatPushSummaryForLog_(pushSummary),
          });

          sentKeys[notificationKey] = true;
          summary.sent += 1;
          summary.details.push({
            email: recipient.email,
            newsId: news.id,
            title: news.title,
            status: 'sent',
            push: pushSummary,
          });
        } catch (error) {
          appendNewsPublicationLog_(logSheet, {
            notificationKey,
            email: recipient.email,
            userName,
            news,
            status: 'error',
            message: error.message,
          });

          summary.errors += 1;
          summary.details.push({
            email: recipient.email,
            newsId: news.id,
            title: news.title,
            status: 'error',
            message: error.message,
          });
        }
      });
    });
  });

  return summary;
}

function getNewsNotificationAudience_() {
  const properties = PropertiesService.getScriptProperties();
  const audience = String(properties.getProperty('NEWS_NOTIFICATION_AUDIENCE') || 'owners').trim().toLowerCase();

  if (audience === 'all' || audience === 'todos') return 'all';
  if (audience === 'owner' || audience === 'owners') return 'owners';
  return 'owners';
}

function isUserInNewsAudience_(user, audience) {
  if (audience === 'all') return true;
  return String(user.role || '').trim().toLowerCase() === 'owner';
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
        nota: getValue_(row, ['nota', 'observacion']) || 'Reglas actualizadas.',
        fuenteOficial: getValue_(row, ['fuenteOficial', 'fuente', 'officialSource']) || '',
        urlFuente: getValue_(row, ['urlFuente', 'url', 'sourceUrl']) || '',
      };
    })
    .filter((rule) => rule.ciudad && isActive_(rule.activo));

  return { ok: true, items };
}

function installDailyReminderTrigger() {
  setupCopilotConfig();

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
  setupCopilotConfig();

  const documentSummary = runReminderJob_('sendDocumentExpiryReminders', () => sendDocumentExpiryReminders({ skipSetup: true }));
  const maintenanceSummary = runReminderJob_('sendMaintenanceReminders', () => sendMaintenanceReminders({ skipSetup: true }));
  const picoPlacaSummary = runReminderJob_('sendPicoPlacaReminders', () => sendPicoPlacaReminders({ skipSetup: true }));
  const newsSummary = runReminderJob_('sendNewsPublicationNotifications', () => sendNewsPublicationNotifications({ skipSetup: true }));

  return {
    ok: Boolean(documentSummary.ok && maintenanceSummary.ok && picoPlacaSummary.ok && newsSummary.ok),
    documentSummary,
    maintenanceSummary,
    picoPlacaSummary,
    newsSummary,
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
  if (!options || !options.skipSetup) setupCopilotConfig();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const vehicleSheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const logSheet = ensureSheet_(ss, SHEETS.correosVencimientos.name, SHEETS.correosVencimientos.headers);
  const vehicles = getRowsAsObjects_(vehicleSheet);
  const usersByEmail = buildUsersByEmail_(ss);
  const cdaConfigsByCode = buildCdaConfigsByCode_(ss);
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
      const user = usersByEmail[email] || {};
      const allyBranding = buildAllyBrandingForUser_(user, cdaConfigsByCode);
      const recipients = getVehicleNotificationRecipients_(vehicle, user, 'documents');

      recipients.forEach((recipient) => {
        const notificationKey = buildDocumentReminderKey_(recipient.email, vehicleId, plate, definition.key, expiryDateKey, reminderType);

        if (sentKeys[notificationKey]) {
          summary.skipped += 1;
          return;
        }

        const userName = recipient.name || recipient.email;
        const reminder = buildDocumentReminderEmail_({
          definition,
          email: recipient.email,
          userName,
          plate,
          expiryDate,
          daysRemaining,
          reminderType,
          allyBranding,
        });

        try {
          sendTransactionalEmail_({
            to: recipient.email,
            subject: reminder.subject,
            body: reminder.plainBody,
            htmlBody: reminder.htmlBody,
            name: EMAIL_DEFAULT_FROM_NAME,
          });
          const pushSummary = recipient.isOwner ? safeSendPushToUser_(email, {
            title: reminder.subject,
            body: buildDocumentPushBody_(definition, plate, daysRemaining),
            tag: notificationKey,
            url: APP_PUBLIC_URL,
            type: 'document',
            requireInteraction: daysRemaining <= 0,
          }) : { attempted: 0, sent: 0, errors: 0, messages: [] };

          appendDocumentReminderLog_(logSheet, {
            notificationKey,
            email: recipient.email,
            userName,
            vehicleId,
            plate,
            documentLabel: definition.label,
            expiryDate: expiryDateKey,
            daysRemaining,
            reminderType,
            status: 'sent',
            message: reminder.subject + formatPushSummaryForLog_(pushSummary),
          });

          sentKeys[notificationKey] = true;
          summary.sent += 1;
          summary.details.push({
            email: recipient.email,
            plate,
            document: definition.label,
            daysRemaining,
            status: 'sent',
            push: pushSummary,
          });
        } catch (error) {
          appendDocumentReminderLog_(logSheet, {
            notificationKey,
            email: recipient.email,
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
            email: recipient.email,
            plate,
            document: definition.label,
            daysRemaining,
            status: 'error',
            message: error.message,
          });
        }
      });
    });
  });

  return summary;
}

function sendMaintenanceReminders(options) {
  if (!options || !options.skipSetup) setupCopilotConfig();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const vehicleSheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const logSheet = ensureSheet_(ss, SHEETS.pushMantenimientos.name, SHEETS.pushMantenimientos.headers);
  const vehicles = getRowsAsObjects_(vehicleSheet);
  const usersByEmail = buildUsersByEmail_(ss);
  const sentKeys = getSentReminderKeys_(logSheet);
  const definitions = [
    { key: 'aceite_motor', field: 'proximoAceiteMotorKm', label: 'Cambio de aceite motor' },
    { key: 'aceite_caja', field: 'proximoAceiteCajaKm', label: 'Cambio de aceite de caja' },
    { key: 'garantia_km', field: 'garantiaVenceKm', label: 'Garantia de fabrica por kilometraje' },
  ];
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
    const currentMileage = normalizeMileage_(vehicle.kilometrajeActual);

    if (!isLikelyEmail_(email) || !Number.isFinite(currentMileage)) {
      summary.skipped += 1;
      return;
    }

    definitions.forEach((definition) => {
      const targetMileage = normalizeMileage_(vehicle[definition.field]);
      if (!Number.isFinite(targetMileage) || targetMileage <= 0) return;

      const remainingKm = targetMileage - currentMileage;
      const reminderType = getMaintenanceReminderType_(remainingKm);
      if (!reminderType) return;

      const user = usersByEmail[email] || {};
      const title = reminderType === 'overdue' ? definition.label + ' vencido' : definition.label + ' proximo';
      const body = buildMaintenancePushBody_(definition.label, plate, remainingKm);
      const recipients = getVehicleNotificationRecipients_(vehicle, user, 'maintenance');

      recipients.forEach((recipient) => {
        const notificationKey = buildMaintenanceReminderKey_(recipient.email, vehicleId, plate, definition.key, targetMileage, reminderType);
        if (sentKeys[notificationKey]) {
          summary.skipped += 1;
          return;
        }

        const userName = recipient.name || recipient.email;
        const emailPayload = buildMaintenanceReminderEmail_({
          userName,
          email: recipient.email,
          plate,
          label: definition.label,
          currentMileage,
          targetMileage,
          remainingKm,
          reminderType,
        });

        try {
          sendTransactionalEmail_({
            to: recipient.email,
            subject: emailPayload.subject,
            body: emailPayload.plainBody,
            htmlBody: emailPayload.htmlBody,
            name: EMAIL_DEFAULT_FROM_NAME,
          });
          const pushSummary = recipient.isOwner ? safeSendPushToUser_(email, {
            title,
            body,
            tag: notificationKey,
            url: APP_PUBLIC_URL,
            type: 'maintenance',
            requireInteraction: reminderType === 'overdue',
          }) : { attempted: 0, sent: 0, errors: 0, messages: [] };

          appendMaintenanceReminderLog_(logSheet, {
            notificationKey,
            email: recipient.email,
            userName,
            vehicleId,
            plate,
            label: definition.label,
            currentMileage,
            targetMileage,
            remainingKm,
            reminderType,
            status: 'sent',
            message: emailPayload.subject + formatPushSummaryForLog_(pushSummary),
          });

          sentKeys[notificationKey] = true;
          summary.sent += 1;
          summary.details.push({
            email: recipient.email,
            plate,
            maintenance: definition.label,
            remainingKm,
            status: 'sent',
            push: pushSummary,
          });
        } catch (error) {
          appendMaintenanceReminderLog_(logSheet, {
            notificationKey,
            email: recipient.email,
            userName,
            vehicleId,
            plate,
            label: definition.label,
            currentMileage,
            targetMileage,
            remainingKm,
            reminderType,
            status: 'error',
            message: error.message,
          });

          summary.errors += 1;
          summary.details.push({
            email: recipient.email,
            plate,
            maintenance: definition.label,
            remainingKm,
            status: 'error',
            message: error.message,
          });
        }
      });
    });
  });

  return summary;
}

function sendPicoPlacaReminders(options) {
  if (!options || !options.skipSetup) setupCopilotConfig();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const vehicleSheet = ensureSheet_(ss, SHEETS.vehiculos.name, SHEETS.vehiculos.headers);
  const logSheet = ensureSheet_(ss, SHEETS.correosPicoPlaca.name, SHEETS.correosPicoPlaca.headers);
  const vehicles = getRowsAsObjects_(vehicleSheet);
  const usersByEmail = buildUsersByEmail_(ss);
  const cdaConfigsByCode = buildCdaConfigsByCode_(ss);
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

    const user = usersByEmail[email] || {};
    const allyBranding = buildAllyBrandingForUser_(user, cdaConfigsByCode);
    const recipients = getVehicleNotificationRecipients_(vehicle, user, 'picoPlaca');

    recipients.forEach((recipient) => {
      const notificationKey = buildPicoPlacaReminderKey_(recipient.email, vehicleId, plate, city, vehicleType, dateKey);

      if (sentKeys[notificationKey]) {
        summary.skipped += 1;
        return;
      }

      const userName = recipient.name || recipient.email;
      const reminder = buildPicoPlacaReminderEmail_({
        email: recipient.email,
        userName,
        plate,
        city,
        vehicleType,
        date: today,
        rule: result.rule,
        digit: result.digit,
        restrictionText: result.restrictionText,
        allyBranding,
      });

      try {
        sendTransactionalEmail_({
          to: recipient.email,
          subject: reminder.subject,
          body: reminder.plainBody,
          htmlBody: reminder.htmlBody,
          name: EMAIL_DEFAULT_FROM_NAME,
        });
        const pushSummary = recipient.isOwner ? safeSendPushToUser_(email, {
          title: reminder.subject,
          body: buildPicoPlacaPushBody_(plate, city, result),
          tag: notificationKey,
          url: APP_PUBLIC_URL,
          type: 'pico-placa',
          requireInteraction: true,
        }) : { attempted: 0, sent: 0, errors: 0, messages: [] };

        appendPicoPlacaReminderLog_(logSheet, {
          notificationKey,
          email: recipient.email,
          userName,
          vehicleId,
          plate,
          city,
          vehicleType,
          restrictionDate: dateKey,
          digit: result.digit,
          schedule: formatPicoSchedule_(result.rule),
          status: 'sent',
          message: reminder.subject + formatPushSummaryForLog_(pushSummary),
        });

        sentKeys[notificationKey] = true;
        summary.sent += 1;
        summary.details.push({
          email: recipient.email,
          plate,
          city,
          vehicleType,
          status: 'sent',
          push: pushSummary,
        });
      } catch (error) {
        appendPicoPlacaReminderLog_(logSheet, {
          notificationKey,
          email: recipient.email,
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
          email: recipient.email,
          plate,
          city,
          vehicleType,
          status: 'error',
          message: error.message,
        });
      }
    });
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

function buildCdaConfigsByCode_(ss) {
  const sheet = ensureSheet_(ss, SHEETS.cdaAliados.name, SHEETS.cdaAliados.headers);
  const configs = {};

  getRowsAsObjects_(sheet).forEach((row) => {
    const code = normalizeHeader_(row.codigoAliado || '');
    if (!code || !isActive_(row.activo)) return;
    configs[code] = row;
  });

  return configs;
}

function buildAllyBrandingForUser_(user, cdaConfigsByCode) {
  const code = String(user.codigoAliado || '').trim();
  const config = cdaConfigsByCode[normalizeHeader_(code)] || {};
  const cdaName = String(user.nombreCDA || config.nombreCDA || '').trim();

  if (!cdaName) return null;

  return {
    idCDA: String(user.idCDA || config.idCDA || '').trim(),
    codigoAliado: code || String(config.codigoAliado || '').trim(),
    nombreCDA: cdaName,
    logoCdaUrl: String(user.logoCdaUrl || config.logoCdaUrl || '').trim(),
    templates: {
      welcome: String(user.plantillaBienvenida || config.plantillaBienvenida || DEFAULT_ALLY_EMAIL_TEMPLATES.welcome),
      documentReminder: String(user.plantillaVencimiento || config.plantillaVencimiento || DEFAULT_ALLY_EMAIL_TEMPLATES.documentReminder),
      picoPlaca: String(user.plantillaPicoPlaca || config.plantillaPicoPlaca || DEFAULT_ALLY_EMAIL_TEMPLATES.picoPlaca),
      importantAlert: String(user.plantillaAlerta || config.plantillaAlerta || DEFAULT_ALLY_EMAIL_TEMPLATES.importantAlert),
    },
  };
}

function getVehicleNotificationRecipients_(vehicle, user, notificationType) {
  const ownerEmail = String((user && user.correo) || vehicle.userEmail || '').trim().toLowerCase();
  const ownerName = String((user && user.nombre) || (user && user.name) || ownerEmail).trim();
  const recipients = [];
  const seen = {};

  if (isLikelyEmail_(ownerEmail)) {
    recipients.push({
      email: ownerEmail,
      name: ownerName || ownerEmail,
      isOwner: true,
    });
    seen[ownerEmail] = true;
  }

  normalizeNotificationContacts_(vehicle.notificationContacts || buildNotificationContactsFromVehicleRow_(vehicle)).forEach(function(contact) {
    if (!contact.email || seen[contact.email]) return;
    if (contact.notificationTypes.indexOf(notificationType) < 0) return;
    recipients.push({
      email: contact.email,
      name: contact.name || contact.email,
      isOwner: false,
    });
    seen[contact.email] = true;
  });

  return recipients;
}

function getVehicleNotificationTestRecipients_(vehicle, user) {
  const ownerEmail = String((user && (user.email || user.correo)) || vehicle.userEmail || '').trim().toLowerCase();
  const ownerName = String((user && (user.name || user.nombre)) || ownerEmail).trim();
  const recipients = [];
  const seen = {};

  if (isLikelyEmail_(ownerEmail)) {
    recipients.push({
      email: ownerEmail,
      name: ownerName || ownerEmail,
      notificationTypes: ['documents', 'maintenance', 'picoPlaca', 'news'],
      isOwner: true,
    });
    seen[ownerEmail] = true;
  }

  normalizeNotificationContacts_(vehicle.notificationContacts || vehicle.contactosNotificacion).forEach(function(contact) {
    if (!contact.email || seen[contact.email] || !contact.notificationTypes.length) return;
    recipients.push({
      email: contact.email,
      name: contact.name || contact.email,
      notificationTypes: contact.notificationTypes,
      isOwner: false,
    });
    seen[contact.email] = true;
  });

  return recipients;
}

function formatNotificationTypesForEmail_(types) {
  const labels = {
    documents: 'Vencimientos',
    maintenance: 'Mantenimiento',
    picoPlaca: 'Pico y placa',
    news: 'Novedades y alertas importantes',
  };
  const items = (types || []).map(function(type) {
    return labels[type] || type;
  }).filter(Boolean);

  return items.length ? items.join(', ') : 'Sin notificaciones seleccionadas';
}

function normalizeNotificationContacts_(value) {
  let contacts = value;

  if (typeof value === 'string') {
    try {
      contacts = JSON.parse(value);
    } catch (error) {
      contacts = [];
    }
  }

  return (Array.isArray(contacts) ? contacts : [])
    .slice(0, 2)
    .map(function(contact) {
      return {
        name: String(contact && contact.name || '').trim(),
        email: String(contact && contact.email || '').trim().toLowerCase(),
        notificationTypes: normalizeNotificationTypes_(contact && contact.notificationTypes),
      };
    })
    .filter(function(contact) {
      return isLikelyEmail_(contact.email);
    });
}

function normalizeNotificationTypes_(value) {
  const allowedTypes = {
    documents: true,
    maintenance: true,
    picoPlaca: true,
    news: true,
  };
  const aliases = {
    document: 'documents',
    documentos: 'documents',
    vencimientos: 'documents',
    mantenimiento: 'maintenance',
    pico: 'picoPlaca',
    pico_placa: 'picoPlaca',
    picoplaca: 'picoPlaca',
    novedades: 'news',
    alertas: 'news',
  };
  const rawTypes = Array.isArray(value) ? value : String(value || '').split(/[;,|]/);

  return rawTypes
    .map(function(type) {
      const cleanType = String(type || '').trim();
      return allowedTypes[cleanType] ? cleanType : aliases[normalizeHeader_(cleanType)] || '';
    })
    .filter(function(type, index, items) {
      return Boolean(type && allowedTypes[type] && items.indexOf(type) === index);
    });
}

function buildNotificationContactsFromVehicleRow_(row) {
  return [1, 2].map(function(index) {
    return {
      name: row['contactoNotificacion' + index + 'Nombre'] || '',
      email: row['contactoNotificacion' + index + 'Correo'] || '',
      notificationTypes: normalizeNotificationTypes_(row['contactoNotificacion' + index + 'Tipos'] || ''),
    };
  }).filter(function(contact) {
    return isLikelyEmail_(contact.email);
  });
}

function buildLatestVehiclesByEmail_(vehicleSheet) {
  const vehiclesByEmail = {};

  getRowsAsObjects_(vehicleSheet).forEach(function(vehicle) {
    const email = String(vehicle.userEmail || '').trim().toLowerCase();
    if (!isLikelyEmail_(email)) return;

    const current = vehiclesByEmail[email];
    const currentTime = current ? Date.parse(current.updatedAt || '') || 0 : 0;
    const nextTime = Date.parse(vehicle.updatedAt || '') || 0;

    if (!current || nextTime >= currentTime) {
      vehiclesByEmail[email] = vehicle;
    }
  });

  return vehiclesByEmail;
}

function getWarrantyExpiryDate_(startDate, years) {
  const date = parseSheetDateOnly_(startDate);
  const parsedYears = Number(years);
  if (!date || !Number.isFinite(parsedYears) || parsedYears <= 0) return '';
  date.setFullYear(date.getFullYear() + Math.floor(parsedYears));
  return formatDateOnlyForKey_(date);
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

function appendMaintenanceReminderLog_(sheet, item) {
  sheet.appendRow([
    new Date().toISOString(),
    item.notificationKey || '',
    item.email || '',
    item.userName || '',
    item.vehicleId || '',
    item.plate || '',
    item.label || '',
    item.currentMileage,
    item.targetMileage,
    item.remainingKm,
    item.reminderType || '',
    item.status || '',
    item.message || '',
  ]);
}

function appendNewsPublicationLog_(sheet, item) {
  const news = item.news || {};
  sheet.appendRow([
    new Date().toISOString(),
    item.notificationKey || '',
    item.email || '',
    item.userName || '',
    news.id || '',
    news.section || '',
    news.title || '',
    news.date || '',
    item.status || '',
    item.message || '',
  ]);
}

function buildDocumentPushBody_(definition, plate, daysRemaining) {
  const plateText = plate ? ' de la placa ' + plate : '';
  if (daysRemaining < 0) {
    return definition.label + plateText + ' esta vencido desde hace ' + Math.abs(daysRemaining) + ' dias.';
  }
  if (daysRemaining === 0) {
    return definition.label + plateText + ' vence hoy. Revisalo cuanto antes.';
  }
  return definition.label + plateText + ' vence en ' + daysRemaining + ' dias.';
}

function buildPicoPlacaPushBody_(plate, city, result) {
  const schedule = result && result.rule ? formatPicoSchedule_(result.rule) : '';
  return 'La placa ' + (plate || 'registrada') + ' tiene restriccion hoy en ' + (city || 'tu ciudad') + (schedule ? '. Horario: ' + schedule : '.') ;
}

function buildMaintenancePushBody_(label, plate, remainingKm) {
  const plateText = plate ? ' para la placa ' + plate : '';
  if (remainingKm <= 0) {
    return label + plateText + ' ya se paso por ' + Math.abs(remainingKm).toLocaleString('es-CO') + ' km.';
  }
  return label + plateText + ': faltan ' + remainingKm.toLocaleString('es-CO') + ' km para el servicio.';
}

function buildMaintenanceReminderEmail_(context) {
  const overdue = context.remainingKm <= 0;
  const subject = overdue
    ? 'Mantenimiento vencido en ' + APP_NAME + ': ' + context.label
    : 'Recordatorio de mantenimiento ' + APP_NAME + ': ' + context.label;
  const remainingText = overdue
    ? 'ya se paso por ' + Math.abs(context.remainingKm).toLocaleString('es-CO') + ' km'
    : 'faltan ' + context.remainingKm.toLocaleString('es-CO') + ' km';
  const plainBody = [
    'Hola ' + (context.userName || context.email) + ',',
    '',
    'Te recordamos que ' + context.label + ' para la placa ' + (context.plate || 'registrada') + ' ' + remainingText + '.',
    'Kilometraje actual: ' + context.currentMileage.toLocaleString('es-CO') + ' km',
    'Kilometraje objetivo: ' + context.targetMileage.toLocaleString('es-CO') + ' km',
    '',
    'Revisar en ' + APP_NAME + ': ' + APP_PUBLIC_URL,
  ].join('\n');
  const htmlBody = [
    '<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.6">',
    '<h2 style="margin:0 0 12px;">' + escapeHtml_(subject) + '</h2>',
    '<p>Hola <strong>' + escapeHtml_(context.userName || context.email) + '</strong>,</p>',
    '<p>Te recordamos que <strong>' + escapeHtml_(context.label) + '</strong> para la placa <strong>' + escapeHtml_(context.plate || 'registrada') + '</strong> ' + escapeHtml_(remainingText) + '.</p>',
    '<ul>',
    '<li>Kilometraje actual: ' + escapeHtml_(context.currentMileage.toLocaleString('es-CO')) + ' km</li>',
    '<li>Kilometraje objetivo: ' + escapeHtml_(context.targetMileage.toLocaleString('es-CO')) + ' km</li>',
    '</ul>',
    '<p><a href="' + escapeHtml_(APP_PUBLIC_URL) + '" style="background:#101828;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;">Revisar en ' + escapeHtml_(APP_NAME) + '</a></p>',
    '</div>',
  ].join('');

  return {
    subject,
    plainBody,
    htmlBody,
  };
}

function buildNewsPublicationEmail_(context) {
  const news = context.news || {};
  const safeName = escapeHtml_(context.userName || context.email);
  const safeTitle = escapeHtml_(news.title || 'Nueva publicacion');
  const safeDescription = escapeHtml_(news.description || 'Hay una nueva publicacion disponible en ' + APP_NAME + '.');
  const safeSection = escapeHtml_(news.section || 'Novedades');
  const safeCategory = escapeHtml_(news.category || 'General');
  const newsDate = parseSheetDateOnly_(news.date) || new Date();
  const safeDate = escapeHtml_(formatDateForEmail_(newsDate));
  const safeUrl = escapeHtml_(APP_PUBLIC_URL);
  const imageHtml = isPublicHttpsUrl_(news.imageUrl)
    ? '<img src="' + escapeHtml_(news.imageUrl) + '" alt="' + safeTitle + '" style="width:100%;max-height:260px;object-fit:cover;display:block;border-radius:18px;margin:0 0 22px;">'
    : '';
  const videoHtml = isPublicHttpsUrl_(news.videoUrl)
    ? '<p style="margin:0 0 18px;font-size:14px;color:#2563eb;font-weight:bold;"><a href="' + escapeHtml_(news.videoUrl) + '" style="color:#2563eb;text-decoration:none;">Ver video relacionado</a></p>'
    : '';
  const subject = 'Nueva publicacion en ' + APP_NAME + ': ' + (news.title || 'Novedades para conductores');
  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f5f7fb;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10);">
          <tr>
            <td align="center" style="padding:26px 20px 18px;background:#101828;">
              <img src="${APP_LOGO_URL}"
                   alt="${APP_NAME}"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Novedades para moverte con confianza
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>${safeName}</strong>,
              </p>

              <p style="margin:0 0 14px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">
                ${safeSection} · ${safeCategory} · ${safeDate}
              </p>

              ${imageHtml}

              <h1 style="font-size:26px;line-height:1.2;margin:0 0 14px;color:#101828;">
                ${safeTitle}
              </h1>

              <p style="font-size:16px;line-height:1.7;color:#475467;margin:0 0 22px;">
                ${safeDescription}
              </p>

              ${videoHtml}

              <div style="text-align:center;margin:28px 0;">
                <a href="${safeUrl}"
                   style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">
                  Abrir en ${APP_NAME}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              &copy; ${new Date().getFullYear()} ${APP_NAME}. Mensaje autom&aacute;tico de novedades.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    htmlBody,
    plainBody: [
      'Hola ' + (context.userName || context.email) + ',',
      '',
      'Nueva publicacion en ' + APP_NAME + ':',
      news.title || 'Novedades para conductores',
      '',
      news.description || '',
      '',
      'Seccion: ' + (news.section || 'Novedades'),
      'Categoria: ' + (news.category || 'General'),
      'Fecha: ' + (news.date || ''),
      news.videoUrl ? 'Video: ' + news.videoUrl : '',
      '',
      'Abrir ' + APP_NAME + ': ' + APP_PUBLIC_URL,
    ].filter(Boolean).join('\n'),
  };
}

function buildDocumentReminderEmail_(context) {
  const copy = getDocumentReminderCopy_(context.definition, context.daysRemaining);
  const expiryDateText = formatDateForEmail_(context.expiryDate);
  const safeName = escapeHtml_(context.userName || context.email);
  const safePlate = escapeHtml_(context.plate || 'Sin placa');
  const safeUrl = escapeHtml_(APP_PUBLIC_URL);
  const ally = normalizeAllyBranding_(context.allyBranding);
  const allyMessage = ally
    ? renderAllyTemplate_(ally.templates.documentReminder, {
        nombreCDA: ally.nombreCDA,
        codigoAliado: ally.codigoAliado,
        nombreCliente: context.userName || context.email,
        documento: context.definition.plainName,
        diasRestantes: context.daysRemaining,
        placa: context.plate || 'Sin placa',
        fecha: expiryDateText,
      })
    : '';
  const htmlBody = buildDocumentReminderHtml_({
    nombreUsuario: safeName,
    placaVehiculo: safePlate,
    mensajeAliadoHtml: ally
      ? escapeHtml_(allyMessage)
      : 'Te recordamos que ' + context.definition.articleHtml + ' ' + context.definition.htmlName + ' del veh&iacute;culo con placa <strong style="color:#101828;">' + safePlate + '</strong> requiere tu atenci&oacute;n.',
    allyHeaderHtml: ally ? buildAllyHeaderHtml_(ally) : '',
    footerText: ally ? 'Powered By ' + APP_NAME : '&copy; ' + new Date().getFullYear() + ' ' + APP_NAME + '. Mensaje autom&aacute;tico de recordatorio.',
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
    subject: ally ? ally.nombreCDA + ' + ' + APP_NAME + ': ' + copy.subject : copy.subject,
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
      allyMessage,
      poweredBy: ally ? 'Powered By ' + APP_NAME : '',
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
              <img src="${APP_LOGO_URL}"
                   alt="${APP_NAME}"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Tu asistente inteligente para conducir tranquilo
              </p>
              {{allyHeaderHtml}}
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                {{mensajeAliadoHtml}}
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
                  Revisar en ${APP_NAME}
                </a>
              </div>

              {{bloqueRenovacion}}
            </td>
          </tr>

          <tr>
            <td>
              <img src="https://drive.google.com/uc?export=view&id=1_01IYLdW1UCGA2DVsf0Wr6FjXKymIvFC"
                   alt="${APP_NAME}"
                   style="width:100%;display:block;height:auto;">
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              {{footerText}}
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
      subject: 'Documento vencido en ' + APP_NAME + ': ' + definition.label,
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
    subject: 'Recordatorio ' + APP_NAME + ': ' + definition.label + ' proximo a vencer',
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
    values.allyMessage || ('Te recordamos que ' + values.documentArticle + ' ' + values.documentName + ' del vehiculo con placa ' + values.plate + ' ' + statusText + '.'),
    'Fecha de vencimiento: ' + values.expiryDateText,
    '',
    'Revisar en ' + APP_NAME + ': ' + values.urlApp,
    values.poweredBy || '',
  ].join('\n');
}

function buildPicoPlacaReminderEmail_(context) {
  const safeUrl = escapeHtml_(APP_PUBLIC_URL);
  const schedule = formatPicoSchedule_(context.rule);
  const vehicleTypeText = formatPicoVehicleType_(context.vehicleType);
  const dateText = formatDateForEmail_(context.date);
  const ally = normalizeAllyBranding_(context.allyBranding);
  const allyMessage = ally
    ? renderAllyTemplate_(ally.templates.picoPlaca, {
        nombreCDA: ally.nombreCDA,
        codigoAliado: ally.codigoAliado,
        nombreCliente: context.userName || context.email,
        placa: context.plate || 'Sin placa',
        ciudad: context.city || '',
        fecha: dateText,
        diasRestantes: '',
        documento: 'pico y placa',
      })
    : '';
  const htmlBody = buildPicoPlacaReminderHtml_({
    nombreUsuario: escapeHtml_(context.userName || context.email),
    placaVehiculo: escapeHtml_(context.plate || 'Sin placa'),
    mensajeAliadoHtml: ally
      ? escapeHtml_(allyMessage)
      : 'Hoy el veh&iacute;culo con placa <strong style="color:#101828;">' + escapeHtml_(context.plate || 'Sin placa') + '</strong> tiene restricci&oacute;n de pico y placa en <strong>' + escapeHtml_(context.city || '') + '</strong>.',
    allyHeaderHtml: ally ? buildAllyHeaderHtml_(ally) : '',
    footerText: ally ? 'Powered By ' + APP_NAME : '&copy; ' + new Date().getFullYear() + ' ' + APP_NAME + '. Mensaje autom&aacute;tico de recordatorio.',
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
    subject: ally ? ally.nombreCDA + ' + ' + APP_NAME + ': Pico y placa hoy para ' + context.plate : 'Pico y placa hoy para ' + context.plate,
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
      allyMessage,
      poweredBy: ally ? 'Powered By ' + APP_NAME : '',
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
              <img src="${APP_LOGO_URL}"
                   alt="${APP_NAME}"
                   style="max-width:160px;height:auto;display:block;margin:auto;">
              <p style="color:#d0d5dd;margin:14px 0 0;font-size:14px;">
                Tu asistente inteligente para conducir tranquilo
              </p>
              {{allyHeaderHtml}}
            </td>
          </tr>

          <tr>
            <td style="padding:30px 26px;">
              <p style="font-size:17px;margin:0 0 16px;">
                Hola <strong>{{nombreUsuario}}</strong>,
              </p>

              <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">
                {{mensajeAliadoHtml}}
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
                  Revisar en ${APP_NAME}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#101828;padding:18px 24px;text-align:center;font-size:12px;color:#d0d5dd;">
              {{footerText}}
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
    values.allyMessage || ('Hoy tienes pico y placa para el vehiculo con placa ' + values.plate + ' en ' + values.city + '.'),
    'Fecha: ' + values.dateText,
    'Vehiculo: ' + values.vehicleType,
    'Horario: ' + values.schedule,
    'Restriccion: ' + values.restrictionText,
    'Digito evaluado: ' + values.digit,
    '',
    'Revisar en ' + APP_NAME + ': ' + values.urlApp,
    values.poweredBy || '',
  ].join('\n');
}

function normalizeAllyBranding_(branding) {
  if (!branding || !branding.nombreCDA) return null;

  return {
    idCDA: String(branding.idCDA || '').trim(),
    codigoAliado: String(branding.codigoAliado || '').trim(),
    nombreCDA: String(branding.nombreCDA || '').trim(),
    logoCdaUrl: isPublicHttpsUrl_(branding.logoCdaUrl) ? String(branding.logoCdaUrl).trim() : '',
    templates: {
      welcome: String((branding.templates && branding.templates.welcome) || DEFAULT_ALLY_EMAIL_TEMPLATES.welcome),
      documentReminder: String((branding.templates && branding.templates.documentReminder) || DEFAULT_ALLY_EMAIL_TEMPLATES.documentReminder),
      picoPlaca: String((branding.templates && branding.templates.picoPlaca) || DEFAULT_ALLY_EMAIL_TEMPLATES.picoPlaca),
      importantAlert: String((branding.templates && branding.templates.importantAlert) || DEFAULT_ALLY_EMAIL_TEMPLATES.importantAlert),
    },
  };
}

function buildAllyHeaderHtml_(ally) {
  const logoUrl = getEmbeddableImageUrl_(ally.logoCdaUrl, 160);
  const logoHtml = ally.logoCdaUrl
    ? '<img src="' + escapeHtml_(logoUrl) + '" alt="' + escapeHtml_(ally.nombreCDA) + '" style="max-width:80px;max-height:40px;height:auto;display:block;margin:12px auto 0;">'
    : '';

  return logoHtml + '<p style="color:#d0d5dd;margin:12px 0 0;font-size:13px;font-weight:bold;">' + escapeHtml_(ally.nombreCDA) + ' en alianza con ' + APP_NAME + '</p>';
}

function renderAllyTemplate_(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, function(match, key) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) return '';
    return values[key] === null || typeof values[key] === 'undefined' ? '' : String(values[key]);
  });
}

function isPublicHttpsUrl_(value) {
  return /^https:\/\/[^\s]+$/i.test(String(value || '').trim());
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

function buildMaintenanceReminderKey_(email, vehicleId, plate, maintenanceKey, targetMileage, reminderType) {
  return [email, vehicleId || plate, maintenanceKey, targetMileage, reminderType].join('|').toLowerCase();
}

function buildNewsPublicationKey_(email, news) {
  const newsId = news && news.id ? news.id : [news && news.title, news && news.date].join('|');
  return [email, 'news', newsId].join('|').toLowerCase();
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

function getMaintenanceReminderType_(remainingKm) {
  if (!Number.isFinite(remainingKm)) return '';
  if (remainingKm <= 0) return 'overdue';
  if (remainingKm <= 500) return 'advance';
  return '';
}

function normalizeMileage_(value) {
  const number = Number(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) ? number : NaN;
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

function parseSheetDateTime_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  if (!/[tT\s]\d{1,2}:\d{2}/.test(text)) return null;

  const normalizedText = text.indexOf(' ') >= 0 && text.indexOf('T') < 0 ? text.replace(' ', 'T') : text;
  const parsedDate = new Date(normalizedText);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
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

function getOrCreateDriveFolder_(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function sanitizeDriveFileName_(value) {
  return String(value || 'archivo')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'archivo';
}

function getImageExtension_(mimeType, fileName) {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const cleanFileName = String(fileName || '').toLowerCase();
  const fileMatch = cleanFileName.match(/\.(png|jpe?g|webp|gif)$/);
  if (fileMatch) return fileMatch[0].replace('.jpeg', '.jpg');
  if (normalizedMime === 'image/png') return '.png';
  if (normalizedMime === 'image/webp') return '.webp';
  if (normalizedMime === 'image/gif') return '.gif';
  return '.jpg';
}

function buildDriveThumbnailUrl_(fileId, size) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w' + String(size || 160);
}

function getEmbeddableImageUrl_(value, size) {
  const text = String(value || '').trim();
  if (!text || text.indexOf('drive.google.com') < 0) return text;

  const queryMatch = text.match(/[?&]id=([^&]+)/);
  const pathMatch = text.match(/\/file\/d\/([^/]+)/);
  const fileId = queryMatch ? queryMatch[1] : pathMatch ? pathMatch[1] : '';
  if (!fileId) return text;

  return buildDriveThumbnailUrl_(decodeURIComponent(fileId), size || 160);
}

function ensureSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    try {
      sheet = ss.insertSheet(sheetName);
    } catch (error) {
      sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw error;
    }
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
  if (e && e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (error) {
      return {
        action: 'rawPost',
        raw: e.parameter.payload,
      };
    }
  }

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

function parseFalseFlag_(value) {
  if (value === false) return true;
  const text = String(value || '').trim().toLowerCase();
  return text === 'false' || text === 'no' || text === '0';
}

function shouldRequirePasswordChange_(user) {
  if (parseFalseFlag_(user.mustChangePassword) || parseFalseFlag_(user.passwordChangeRequired)) return false;
  if (parseBoolean_(user.mustChangePassword) || parseBoolean_(user.passwordChangeRequired)) return true;
  if (user.passwordUpdatedAt) return false;

  const source = String(user.source || '').trim().toLowerCase();
  const code = String(user.codigoAliado || '').trim().toUpperCase();
  const hasAlly = Boolean(user.idCDA || (code && code !== 'SIN-ALIADO'));
  const temporarySource = ['manual-caja', 'pre-registro', 'caja', 'cda-caja', 'ally-driver-login'].indexOf(source) >= 0;

  return hasAlly || temporarySource;
}

function isPasswordChangeRequiredForUser_(user) {
  return !user.passwordUpdatedAt && shouldRequirePasswordChange_(user);
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

function postMessageHtml_(requestId, data) {
  const payload = JSON.stringify({
    source: 'copilot360-apps-script',
    requestId: requestId || '',
    data: data || {},
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body><script>' +
      'var payload=' + payload + ';' +
      'window.parent.postMessage(payload, "*");' +
      'if (window.parent && window.parent.parent) window.parent.parent.postMessage(payload, "*");' +
      'if (window.top && window.top !== window.parent) window.top.postMessage(payload, "*");' +
    '</script></body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
