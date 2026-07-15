// ============================================================
// Configuration du salon — modifie ces valeurs selon tes besoins
// ============================================================

module.exports = {
  PORT: process.env.PORT || 3000,

  // Fuseau horaire du salon (important pour Google Calendar)
  TIMEZONE: 'America/Toronto',

  // Heures d'ouverture (lundi à vendredi seulement — voir utils.js
  // si tu veux des heures différentes selon le jour)
  BUSINESS_HOURS: {
    start: '10:00',
    end: '16:00',
  },

  // Intervalle entre deux créneaux proposés (en minutes)
  SLOT_INTERVAL_MINUTES: 30,

  // Liste des services avec leur durée en minutes.
  // La clé DOIT correspondre exactement au texte envoyé par le
  // formulaire du site (voir <select id="service"> dans index.html).
  SERVICES: {
    'Massage suédois (60 min) — 70 $': 60,
    'Massage suédois (90 min) — 95 $': 90,
    'Massage thérapeutique — 85 $': 60,
    'Massage aux pierres chaudes — 100 $': 75,
    'Massage prénatal — 80 $': 60,
    'Soin du visage classique — 65 $': 50,
    'Soin anti-âge — 95 $': 70,
    'Épilation à la cire — jambes — 45 $': 30,
    'Manucure — 35 $': 40,
    'Beauté du regard — 55 $': 45,
    'Journée détente (forfait) — 165 $': 150,
    'Duo maman-fille (forfait) — 130 $': 60,
  },
};
