// server.js
// Point d'entrée — expose REST et GraphQL sur le même serveur

const fs = require('fs');
const path = require('path');
const express = require('express');
const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');
const dbPromise = require('./db');
const userResolver = require('./userResolver');

const app = express();
const port = 5000;

// Charge le schéma GraphQL depuis le fichier .gql
const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
);

// Middleware JSON — doit être avant les routes POST/PUT
app.use(express.json());

// ============================================
// ROUTE RACINE — documentation de l'API
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'TP6 REST/GraphQL avec RxDB',
    rest: {
      list:   'GET /users',
      one:    'GET /users/:id',
      create: 'POST /users',
      update: 'PUT /users/:id',
      delete: 'DELETE /users/:id'
    },
    graphql: 'POST /graphql'
  });
});

// ============================================
// ROUTE GRAPHQL — expose le endpoint GraphQL
// ============================================
app.all('/graphql', createHandler({
  schema,
  rootValue: userResolver
}));

// ============================================
// ROUTES REST
// ============================================

// GET /users — récupérer tous les utilisateurs
app.get('/users', async (req, res) => {
  const { users } = await dbPromise;
  const docs = await users.find().exec();
  res.json(docs.map((doc) => doc.toJSON()));
});

// GET /users/:id — récupérer un utilisateur par ID
app.get('/users/:id', async (req, res) => {
  const { users } = await dbPromise;
  const doc = await users.findOne(req.params.id).exec();
  if (!doc) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(doc.toJSON());
});

// POST /users — créer un utilisateur
app.post('/users', async (req, res) => {
  try {
    const created = await userResolver.addUser(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /users/:id — modifier un utilisateur
app.put('/users/:id', async (req, res) => {
  try {
    const updated = await userResolver.updateUser({
      id: req.params.id,
      ...req.body
    });
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /users/:id — supprimer un utilisateur
app.delete('/users/:id', async (req, res) => {
  const deleted = await userResolver.deleteUser({ id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ message: 'success' });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
  console.log('GraphQL disponible sur http://localhost:5000/graphql');
});


// GET /devices — tous les devices
app.get('/devices', async (req, res) => {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  res.json(docs.map(doc => doc.toJSON()));
});

// GET /users/:id/devices — devices d'un utilisateur
app.get('/users/:id/devices', async (req, res) => {
  const { devices } = await dbPromise;
  const docs = await devices.find({ selector: { userId: req.params.id } }).exec();
  res.json(docs.map(doc => doc.toJSON()));
});

// POST /devices — créer un device
app.post('/devices', async (req, res) => {
  try {
    const created = await userResolver.addDevice(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /devices/:id — modifier un device
app.put('/devices/:id', async (req, res) => {
  try {
    const updated = await userResolver.updateDevice({ id: req.params.id, ...req.body });
    if (!updated) return res.status(404).json({ error: 'Device non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /devices/:id — supprimer un device
app.delete('/devices/:id', async (req, res) => {
  const deleted = await userResolver.deleteDevice({ id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Device non trouvé' });
  res.json({ message: 'success' });
});







