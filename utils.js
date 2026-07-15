const { DateTime } = require('luxon');
const config = require('./config');

/**
 * Convertit "HH:mm" en nombre de minutes depuis minuit.
 */
function versMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convertit un nombre de minutes depuis minuit en "HH:mm".
 */
function versHHMM(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Transforme les intervalles "busy" retournés par Google Calendar
 * (en UTC) en minutes-depuis-minuit dans le fuseau horaire du salon,
 * pour une date donnée.
 */
function busyEnMinutesLocales(busyIntervals, dateISO) {
  return busyIntervals
    .map(({ start, end }) => {
      const debutLocal = DateTime.fromISO(start, { zone: 'utc' }).setZone(config.TIMEZONE);
      const finLocal = DateTime.fromISO(end, { zone: 'utc' }).setZone(config.TIMEZONE);
      return { debutLocal, finLocal };
    })
    // On ne garde que les intervalles qui touchent la journée demandée
    .filter(({ debutLocal, finLocal }) => {
      const jourDemande = DateTime.fromISO(dateISO, { zone: config.TIMEZONE }).startOf('day');
      return debutLocal < jourDemande.plus({ days: 1 }) && finLocal > jourDemande;
    })
    .map(({ debutLocal, finLocal }) => ({
      debut: debutLocal.hour * 60 + debutLocal.minute,
      fin: finLocal.hour * 60 + finLocal.minute,
    }));
}

/**
 * Retourne la liste des heures de début disponibles (ex: ["10:00","10:30",...])
 * pour une date et une durée de service données, en tenant compte des
 * réservations déjà présentes dans le calendrier (busyIntervals).
 */
function genererCreneauxDisponibles({ dateISO, dureeMinutes, busyIntervals }) {
  const jourSemaine = DateTime.fromISO(dateISO, { zone: config.TIMEZONE }).weekday; // 1=lundi ... 7=dimanche
  const estFermeLeWeekend = jourSemaine === 6 || jourSemaine === 7;
  if (estFermeLeWeekend) return [];

  const debutJournee = versMinutes(config.BUSINESS_HOURS.start);
  const finJournee = versMinutes(config.BUSINESS_HOURS.end);
  const occupe = busyEnMinutesLocales(busyIntervals, dateISO);

  const creneaux = [];
  for (
    let t = debutJournee;
    t + dureeMinutes <= finJournee;
    t += config.SLOT_INTERVAL_MINUTES
  ) {
    const finCreneau = t + dureeMinutes;
    const conflit = occupe.some((b) => t < b.fin && finCreneau > b.debut);
    if (!conflit) creneaux.push(versHHMM(t));
  }
  return creneaux;
}

module.exports = { genererCreneauxDisponibles, versMinutes, versHHMM, busyEnMinutesLocales };
