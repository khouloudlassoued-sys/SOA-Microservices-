// index.js
const express = require('express');
const db = require('./database');
const app = express();

const session = require('express-session');
const Keycloak = require('keycloak-connect');
const memoryStore = new session.MemoryStore();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(session({
  secret: 'api-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

const keycloak = new Keycloak({ store: memoryStore }, './keycloak-config.json');
app.use(keycloak.middleware());

// Route sécurisée test
app.get('/secure', keycloak.protect(), (req, res) => {
  res.json({ message: 'Vous êtes authentifié !' });
});

app.use(express.json());  // Permet de lire le corps JSON des requêtes

const PORT = 3000;

// Route racine
app.get('/', (req, res) => {
  res.json("Registre de personnes! Choisissez le bon routage!")
});

// GET /personnes → Récupérer toutes les personnes
app.get('/personnes', keycloak.protect(), (req, res) => {
  db.all("SELECT * FROM personnes", [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "success", "data": rows });
  });
});

// GET /personnes/:id → Récupérer une personne par ID
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

// POST — avec adresse
app.post('/personnes', (req, res) => {
  const { nom, adresse } = req.body;  // destructuring
  db.run(`INSERT INTO personnes (nom, adresse) VALUES (?, ?)`, [nom, adresse], function(err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID } });
  });
});

// PUT — avec adresse
app.put('/personnes/:id', (req, res) => {
  const id = req.params.id;
  const { nom, adresse } = req.body;
  db.run(`UPDATE personnes SET nom = ?, adresse = ? WHERE id = ?`, [nom, adresse, id], function(err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success" });
  });
});

// DELETE /personnes/:id → Supprimer une personne
app.delete('/personnes/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM personnes WHERE id = ?`, id, function(err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "success" });
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});