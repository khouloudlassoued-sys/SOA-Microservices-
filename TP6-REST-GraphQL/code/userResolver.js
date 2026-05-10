// Résolveurs GraphQL — contient la logique métier de chaque opération

const dbPromise = require('./db');

// Convertit un document RxDB en objet JSON simple
function toJson(doc) {
  return doc ? doc.toJSON() : null;
}

// Cherche un utilisateur par email
async function findByEmail(usersCollection, email) {
  return usersCollection.findOne({
    selector: { email }
  }).exec();
}

// Vérifie que l'email n'est pas déjà utilisé
async function ensureUniqueEmail(usersCollection, email, excludedId = null) {
  const existing = await findByEmail(usersCollection, email);
  if (existing && existing.primary !== excludedId) {
    throw new Error('Adresse e-mail déjà utilisée');
  }
}

module.exports = {

  // Query : récupérer un utilisateur par ID
  user: async ({ id }) => {
    const { users } = await dbPromise;
    const doc = await users.findOne(id).exec();
    return toJson(doc);
  },

  // Query : récupérer tous les utilisateurs
  users: async () => {
    const { users } = await dbPromise;
    const docs = await users.find().exec();
    return docs.map((doc) => doc.toJSON());
  },

  // Mutation : ajouter un utilisateur
  addUser: async ({ name, email, password }) => {
    const { users, persistUsers, createId } = await dbPromise;
    await ensureUniqueEmail(users, email);  // vérifie unicité email
    const inserted = await users.insert({
      id: createId(),   // génère un UUID automatiquement
      name,
      email,
      password
    });
    await persistUsers(users);  // sauvegarde dans le fichier JSON
    return inserted.toJSON();
  },

// Query : récupérer tous les devices
devices: async () => {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  return docs.map(doc => doc.toJSON());
},

// Query : récupérer un device par ID
device: async ({ id }) => {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  return doc ? doc.toJSON() : null;
},

// Query : récupérer les devices d'un utilisateur
devicesByUser: async ({ userId }) => {
  const { devices } = await dbPromise;
  const docs = await devices.find({ selector: { userId } }).exec();
  return docs.map(doc => doc.toJSON());
},


  // Mutation : modifier un utilisateur
  updateUser: async ({ id, name, email, password }) => {
    const { users, persistUsers } = await dbPromise;
    const doc = await users.findOne(id).exec();
    if (!doc) return null;
    await ensureUniqueEmail(users, email, id);
    const updatedDoc = await doc.incrementalPatch({ name, email, password });
    await persistUsers(users);
    return updatedDoc.toJSON();
  },

  // Mutation : supprimer un utilisateur
  deleteUser: async ({ id }) => {
    const { users, persistUsers } = await dbPromise;
    const doc = await users.findOne(id).exec();
    if (!doc) return false;
    await doc.remove();
    await persistUsers(users);
    return true;
  },



  // Mutation : ajouter un device
addDevice: async ({ userId, name, type, serialNumber, status }) => {
  const { users, devices, createId } = await dbPromise;
  // Vérifie que l'utilisateur existe
  const user = await users.findOne(userId).exec();
  if (!user) throw new Error('Utilisateur non trouvé');
  const inserted = await devices.insert({
    id: createId(),
    userId, name, type, serialNumber, status
  });
  return inserted.toJSON();
},

// Mutation : modifier un device
updateDevice: async ({ id, name, type, serialNumber, status }) => {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  if (!doc) return null;
  const patch = {};
  if (name) patch.name = name;
  if (type) patch.type = type;
  if (serialNumber) patch.serialNumber = serialNumber;
  if (status) patch.status = status;
  const updated = await doc.incrementalPatch(patch);
  return updated.toJSON();
},

// Mutation : supprimer un device
deleteDevice: async ({ id }) => {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  if (!doc) return false;
  await doc.remove();
  return true;
},

};


