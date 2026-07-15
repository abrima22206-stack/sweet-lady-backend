// Test simple, sans clés API, pour valider la logique de calcul
// des créneaux disponibles (utils.js). Lance avec : npm run test:slots

const assert = require('assert');
const { genererCreneauxDisponibles } = require('../utils');

function run() {
  // --- Test 1 : journée complètement libre (mardi) ---
  const dateMardi = '2026-07-21'; // un mardi
  const creneauxLibres = genererCreneauxDisponibles({
    dateISO: dateMardi,
    dureeMinutes: 60,
    busyIntervals: [],
  });
  assert.ok(creneauxLibres.includes('10:00'), 'devrait inclure 10:00');
  assert.ok(creneauxLibres.includes('15:00'), 'devrait inclure 15:00 (dernier créneau de 60min avant 16h)');
  assert.ok(!creneauxLibres.includes('15:30'), 'ne devrait PAS inclure 15:30 (dépasserait 16h)');
  console.log('✓ Test 1 réussi : journée libre —', creneauxLibres.length, 'créneaux trouvés');

  // --- Test 2 : un rendez-vous existant bloque le créneau chevauchant ---
  const busy = [
    {
      start: '2026-07-21T14:00:00.000Z', // en UTC — équivaut à 10h locale (EDT, UTC-4)
      end: '2026-07-21T15:00:00.000Z',   // équivaut à 11h locale
    },
  ];
  const creneauxAvecConflit = genererCreneauxDisponibles({
    dateISO: dateMardi,
    dureeMinutes: 60,
    busyIntervals: busy,
  });
  assert.ok(!creneauxAvecConflit.includes('10:00'), '10:00 devrait être bloqué par le rendez-vous existant');
  assert.ok(!creneauxAvecConflit.includes('10:30'), '10:30 devrait être bloqué (chevauchement)');
  assert.ok(creneauxAvecConflit.includes('11:00'), '11:00 devrait être libre (juste après le rendez-vous)');
  console.log('✓ Test 2 réussi : conflit correctement détecté et évité');

  // --- Test 3 : le salon est fermé la fin de semaine ---
  const dimanche = '2026-07-19';
  const creneauxDimanche = genererCreneauxDisponibles({
    dateISO: dimanche,
    dureeMinutes: 60,
    busyIntervals: [],
  });
  assert.strictEqual(creneauxDimanche.length, 0, 'aucun créneau ne devrait être proposé le dimanche');
  console.log('✓ Test 3 réussi : fermeture le week-end respectée');

  // --- Test 4 : un service plus long réduit le nombre de créneaux ---
  const creneauxLongs = genererCreneauxDisponibles({
    dateISO: dateMardi,
    dureeMinutes: 150, // forfait "Journée détente"
    busyIntervals: [],
  });
  assert.ok(creneauxLongs.length > 0, 'devrait quand même offrir au moins un créneau pour 150 min');
  assert.ok(!creneauxLongs.includes('14:00'), '14:00 + 150min dépasserait 16h30, donc invalide');
  console.log('✓ Test 4 réussi : durée de service bien prise en compte —', creneauxLongs.length, 'créneaux');

  console.log('\nTous les tests ont réussi ✅');
}

run();
