const twilio = require('twilio');

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Variables TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquantes (voir .env.example).');
  }
  return twilio(sid, token);
}

/**
 * Envoie un texto à la propriétaire pour l'aviser d'un nouveau rendez-vous.
 */
async function envoyerSmsNouveauRdv({ nom, telephone, service, dateISO, heure }) {
  const client = getClient();
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.OWNER_PHONE_NUMBER;

  if (!from || !to) {
    throw new Error('Variables TWILIO_FROM_NUMBER / OWNER_PHONE_NUMBER manquantes (voir .env.example).');
  }

  const dateLisible = new Date(`${dateISO}T${heure}:00`).toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const corps = `Sweet Lady — Nouveau RDV: ${nom} (${telephone}) — ${service} le ${dateLisible} à ${heure}.`;

  return client.messages.create({ body: corps, from, to });
}

module.exports = { envoyerSmsNouveauRdv };
