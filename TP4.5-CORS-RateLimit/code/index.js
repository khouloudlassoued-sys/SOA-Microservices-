// ============================================
// index.js — API RESTful complète
// TP4 + TP4.5 : Express, SQLite, CORS, 
// Rate Limiting, Keycloak, Swagger
// ============================================

// ---- IMPORTS ----
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const db = require('./database');

// ---- INITIALISATION APP ----
const app = express();
const PORT = 3000;

// ---- SWAGGER ----
// Charge le fichier openapi.yaml et expose la doc sur /api-docs
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ---- MIDDLEWARE JSON ----
// Permet de lire le corps JSON des requêtes (POST, PUT)
app.use(express.json());

// ---- CORS ----
// Autorise toutes les origines à accéder à l'API
app.use(cors());
// Pour restreindre à certains domaines seulement :
// app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:3000'] }));

// ---- RATE LIMITING ----
// Limite chaque IP à 100 requêtes par 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes en millisecondes
  max: 100,                  // max 100 requêtes par IP
  message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes.'
});
app.use(limiter);

// ---- KEYCLOAK / SESSION ----
// Gestion des sessions pour Keycloak
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'api-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Configuration Keycloak avec le fichier keycloak-config.json
const keycloak = new Keycloak({ store: memoryStore }, './keycloak-config.json');
app.use(keycloak.middleware());

// ============================================
// ROUTES
// ============================================

// ---- Route racine ----
app.get('/', (req, res) => {
  res.json("Registre de personnes! Choisissez le bon routage!");
});

// ---- Route test CORS ----
// Sert le fichier HTML de test CORS depuis le navigateur
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-cors.html'));
});

// ---- Route sécurisée Keycloak ----
// Accessible uniquement avec un token JWT valide
app.get('/secure', keycloak.protect(), (req, res) => {
  res.json({ message: 'Vous êtes authentifié !' });
});

// ---- GET toutes les personnes ----
// Protégée par Keycloak — nécessite un token valide
app.get('/personnes', (req, res) => {
  db.all("SELECT * FROM personnes", [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "success", "data": rows });
  });
});

// ---- GET une personne par ID ----
app.get('/personnes/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM personnes WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "success", "data": row });
  });
});

// ---- POST créer une personne ----
// Body attendu : { "nom": "...", "adresse": "..." }
app.post('/personnes', (req, res) => {
  const { nom, adresse } = req.body;
  db.run(
    `INSERT INTO personnes (nom, adresse) VALUES (?, ?)`,
    [nom, adresse],
    function(err) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.json({ "message": "success", "data": { id: this.lastID } });
    }
  );
});

// ---- PUT modifier une personne ----
// Body attendu : { "nom": "...", "adresse": "..." }
app.put('/personnes/:id', (req, res) => {
  const id = req.params.id;
  const { nom, adresse } = req.body;
  db.run(
    `UPDATE personnes SET nom = ?, adresse = ? WHERE id = ?`,
    [nom, adresse, id],
    function(err) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.json({ "message": "success" });
    }
  );
});

// ---- DELETE supprimer une personne ----
app.delete('/personnes/:id', (req, res) => {
  const id = req.params.id;
  db.run(
    `DELETE FROM personnes WHERE id = ?`,
    id,
    function(err) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.json({ "message": "success" });
    }
  );
});

// ============================================
// DÉMARRAGE DU SERVEUR — toujours en dernier
// ============================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});