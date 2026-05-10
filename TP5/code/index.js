// Point d'entrée — configure Express + Apollo Server

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { addResolversToSchema } = require('@graphql-tools/schema');
const taskSchemaPromise = require('./taskSchema');
const taskResolver = require('./taskResolver');

const app = express();

async function setupServer() {
  try {
    // 1. Charge le schéma GraphQL
    const taskSchema = await taskSchemaPromise;

    // 2. Combine schéma + résolveurs
    const schemaWithResolvers = addResolversToSchema({
      schema: taskSchema,
      resolvers: taskResolver,
    });

    // 3. Crée le serveur Apollo
    const server = new ApolloServer({
      schema: schemaWithResolvers,
    });

    // 4. Démarre Apollo
    await server.start();

    // 5. Monte Apollo sur Express à la route /graphql
    app.use(
      '/graphql',
      express.json(),
      expressMiddleware(server)
    );

    // 6. Démarre le serveur Express
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start the Apollo server:', error);
  }
}

setupServer();