require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { DateTime } = require('luxon');

const config = require('./config');
const { genererCreneauxDisponibles } = require('./utils');
const { obtenirCreneauxOccupes, creerEvenement } = require('./calendar');
const { envoyerSmsNouveauRdv } = require('./sms');

const app = express();
app.use(cors());
app.use(express.json());

// Sert le site (index.html) directement depuis le dossier /public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Vérifie qu'une date au format YYYY-MM-DD est valide et n'est pas
 * dans le passé.
 */
function validerDate(dateISO) {
  const d = DateTime.fromISO(dateISO, { zone: config.TIMEZONE });
  if (!d.isValid) return false;
  const aujourdHui = DateTime.now().setZone(config.TIMEZONE).startOf('day');
  return d.startOf('day') >= aujourdHui;
}

/**
 * GET /api/creneaux?date=YYYY-MM-DD&service=Massage%20suédois...
 * Retourne les heures de début disponibles pour ce jour et ce service.
 */
app.get('/api/creneaux', async (req, res) => {
  try {
    const { date, service } = req.query;

    if (!date || !validerDate(date)) {
      return res.status(400).json({ erreur: 'Date manquante ou invalide.' });
    }
    const dureeMinutes = config.SERVICES[service];
    if (!dureeMinutes) {
      return res.status(400).json({ erreur: 'Service inconnu.' });
    }

    const busyIntervals = await obtenirCreneauxOccupes(date);
    const creneaux = genererCreneauxDisponibles({ dateISO: date, dureeMinutes, busyIntervals });

    res.json({ date, service, dureeMinutes, creneaux });
  } catch (err) {
    console.error('Erreur /api/creneaux:', err.message);
    res.status(500).json({ erreur: 'Impossible de récupérer les disponibilités pour le moment.' });
  }
});

/**
 * POST /api/reservation
 * body: { nom, telephone, courriel, service, date, heure, message }
 * 1) Revérifie que le créneau est toujours libre (évite les conflits
 *    si deux clientes réservent en même temps)
 * 2) Crée l'événement dans Google Calendar
 * 3) Envoie le texto de confirmation à la propriétaire
 */
app.post('/api/reservation', async (req, res) => {
  try {
    const { nom, telephone, courriel, service, date, heure, message } = req.body;

    if (!nom || !telephone || !courriel || !service || !date || !heure) {
      return res.status(400).json({ erreur: 'Champs manquants.' });
    }
    if (!validerDate(date)) {
      return res.status(400).json({ erreur: 'Date invalide.' });
    }
    const dureeMinutes = config.SERVICES[service];
    if (!dureeMinutes) {
      return res.status(400).json({ erreur: 'Service inconnu.' });
    }

    // Étape 1 : re-vérification du créneau (anti double-réservation)
    const busyIntervals = await obtenirCreneauxOccupes(date);
    const creneauxLibres = genererCreneauxDisponibles({ dateISO: date, dureeMinutes, busyIntervals });
    if (!creneauxLibres.includes(heure)) {
      return res.status(409).json({
        erreur: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.",
        creneauxDisponibles: creneauxLibres,
      });
    }

    // Étape 2 : création de l'événement dans le calendrier
    await creerEvenement({ nom, telephone, courriel, service, dateISO: date, heure, dureeMinutes, message });

    // Étape 3 : notification SMS à la propriétaire
    await envoyerSmsNouveauRdv({ nom, telephone, service, dateISO: date, heure });

    res.status(201).json({ succes: true, message: 'Rendez-vous confirmé et texto envoyé.' });
  } catch (err) {
    console.error('Erreur /api/reservation:', err.message);
    res.status(500).json({ erreur: "La réservation n'a pas pu être complétée. Réessaie dans un instant." });
  }
});

app.get('/api/sante', (req, res) => res.json({ ok: true }));

app.listen(config.PORT, () => {
  console.log(`Serveur Sweet Lady démarré sur http://localhost:${config.PORT}`);
});
