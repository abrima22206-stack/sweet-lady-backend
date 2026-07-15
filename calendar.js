const { google } = require('googleapis');
const { DateTime } = require('luxon');
const config = require('./config');

/**
 * Authentification via compte de service Google.
 * Le calendrier de la propriétaire doit être PARTAGÉ avec l'adresse
 * e-mail du compte de service (voir README.md, étape 3).
 */
function getAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Variables GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY manquantes (voir .env.example).'
    );
  }

  return new google.auth.JWT(clientEmail, null, privateKey, [
    'https://www.googleapis.com/auth/calendar',
  ]);
}

/**
 * Retourne les plages horaires déjà occupées ce jour-là (UTC),
 * telles que renvoyées par l'API freebusy de Google.
 */
async function obtenirCreneauxOccupes(dateISO) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const timeMin = DateTime.fromISO(dateISO, { zone: config.TIMEZONE }).startOf('day').toUTC().toISO();
  const timeMax = DateTime.fromISO(dateISO, { zone: config.TIMEZONE }).endOf('day').toUTC().toISO();

  const reponse = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: config.TIMEZONE,
      items: [{ id: calendarId }],
    },
  });

  const donneesCalendrier = reponse.data.calendars[calendarId];
  if (!donneesCalendrier) {
    throw new Error(
      "Le calendrier n'a pas répondu — vérifie GOOGLE_CALENDAR_ID et que le calendrier est bien partagé avec le compte de service."
    );
  }
  return donneesCalendrier.busy || [];
}

/**
 * Crée l'événement de rendez-vous dans le Google Calendar de la
 * propriétaire.
 */
async function creerEvenement({ nom, telephone, courriel, service, dateISO, heure, dureeMinutes, message }) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const debut = DateTime.fromISO(`${dateISO}T${heure}`, { zone: config.TIMEZONE });
  const fin = debut.plus({ minutes: dureeMinutes });

  const evenement = {
    summary: `${service} — ${nom}`,
    description: [
      `Client: ${nom}`,
      `Téléphone: ${telephone}`,
      `Courriel: ${courriel}`,
      `Notes: ${message || 'aucune'}`,
    ].join('\n'),
    start: { dateTime: debut.toISO(), timeZone: config.TIMEZONE },
    end: { dateTime: fin.toISO(), timeZone: config.TIMEZONE },
  };

  const reponse = await calendar.events.insert({
    calendarId,
    requestBody: evenement,
  });

  return reponse.data;
}

module.exports = { obtenirCreneauxOccupes, creerEvenement };
