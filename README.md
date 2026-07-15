# Sweet Lady — Backend de réservation

Backend Node.js/Express qui gère les réservations du site :
- vérifie les disponibilités dans le **Google Calendar** de la propriétaire
- bloque automatiquement les créneaux déjà pris
- crée le rendez-vous dans le calendrier
- envoie un **texto (Twilio)** à la propriétaire à chaque nouvelle réservation

Testé localement : les 4 tests de logique de créneaux passent (`npm run test:slots`),
le serveur démarre et répond sans planter même sans clés API configurées.

---

## 1. Créer le projet Google Cloud + compte de service

1. Va sur [console.cloud.google.com](https://console.cloud.google.com) → crée un nouveau projet (ex. "sweet-lady-rdv").
2. Dans le menu, active l'**API Google Calendar** (Bibliothèque → chercher "Google Calendar API" → Activer).
3. Va dans **IAM et administration → Comptes de service** → **Créer un compte de service**.
   - Nom : `sweet-lady-calendrier`
   - Rôle : pas nécessaire d'en ajouter un (le partage se fait à l'étape 3 ci-dessous)
4. Une fois créé, clique sur le compte → onglet **Clés** → **Ajouter une clé** → **Créer une clé** → format **JSON**.
   - Un fichier `.json` se télécharge. Il contient `client_email` et `private_key`, dont tu auras besoin.

## 2. Partager le calendrier de la propriétaire

1. La propriétaire ouvre **Google Calendar** (sur le web, avec son compte Gmail habituel).
2. Paramètres de son calendrier → **Partager avec des personnes précises** → **Ajouter des personnes**.
3. Colle l'adresse `client_email` du compte de service (ex. `sweet-lady-calendrier@sweet-lady-rdv.iam.gserviceaccount.com`).
4. Permission : **Apporter des modifications aux événements**.
5. Le "Calendar ID" à utiliser est en général simplement son adresse Gmail (visible aussi dans Paramètres → Intégrer le calendrier → "ID de calendrier").

## 3. Configurer Twilio

1. Crée un compte sur [twilio.com](https://www.twilio.com) (essai gratuit disponible).
2. Dans le tableau de bord, note ton **Account SID** et ton **Auth Token**.
3. Achète/active un numéro de téléphone Twilio (section **Phone Numbers**) → ce sera `TWILIO_FROM_NUMBER`.
4. `OWNER_PHONE_NUMBER` = le cellulaire de la propriétaire, format international (ex. `+15145551111`).

> Note : en essai gratuit, Twilio n'envoie des textos qu'aux numéros "vérifiés" dans ton compte — il faudra vérifier le numéro de la propriétaire ou passer à un compte payant pour un usage réel.

## 4. Remplir les variables d'environnement

```bash
cp .env.example .env
```

Ouvre `.env` et remplis chaque valeur avec ce que tu as récupéré aux étapes 1 à 3.
Pour `GOOGLE_PRIVATE_KEY`, copie la valeur exactement telle qu'elle apparaît dans le
fichier JSON téléchargé (avec les `\n`, entre guillemets).

## 5. Lancer en local

```bash
npm install
npm run test:slots   # valide la logique de créneaux (sans clés API)
npm start             # démarre le serveur sur http://localhost:3000
```

Ouvre `http://localhost:3000` dans ton navigateur — c'est le site complet, connecté au backend.

## 6. Déployer en ligne

N'importe quel hébergeur Node.js fonctionne (Render, Railway, Vercel avec fonctions serverless, etc.).
Étapes générales :

1. Pousse ce dossier sur un dépôt GitHub (le fichier `.env` ne doit **jamais** être poussé — il est déjà exclu via `.gitignore`).
2. Sur l'hébergeur choisi, connecte le dépôt.
3. Ajoute les mêmes variables que dans `.env` dans la section "Environment Variables" de l'hébergeur.
4. Commande de démarrage : `npm start`.

---

## Structure du projet

```
sweet-lady-backend/
├── server.js         → routes Express (/api/creneaux, /api/reservation)
├── config.js          → horaires, services et durées (à modifier ici)
├── utils.js            → calcul des créneaux disponibles
├── calendar.js        → intégration Google Calendar
├── sms.js              → envoi de SMS via Twilio
├── tests/test-slots.js → tests de la logique de créneaux (sans clés API)
├── public/index.html  → le site (design rose pâle / beige / vert forêt)
└── .env.example        → modèle des variables secrètes à remplir
```

## Modifier les services, prix ou horaires

Tout se passe dans `config.js` :
- `BUSINESS_HOURS` : heures d'ouverture
- `SERVICES` : liste des services avec leur durée en minutes (le texte doit
  correspondre exactement à celui du `<select id="service">` dans `public/index.html`)

Si tu ajoutes ou modifies un service dans `config.js`, pense à faire la même
modification dans `public/index.html` (menu déroulant du formulaire et section
"Services" de la page).
