// server.js
// Serveur gRPC — reçoit les requêtes et retourne des réponses

'use strict';

const path = require('node:path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Chemin vers le fichier .proto
const PROTO_PATH = path.join(__dirname, 'hello.proto');

// Charge et parse le fichier .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,  // convertit les noms en camelCase
  longs: String,    // représente les grands nombres en String
  enums: String,    // représente les enums en String
  defaults: true,   // inclut les valeurs par défaut
  oneofs: true      // inclut les champs oneof
});

// Charge la définition du package "hello"
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;

// Implémentation de la méthode SayHello
function sayHello(call, callback) {
  // call.request contient les données envoyées par le client
  const rawName = call.request?.name ?? '';
  const name = String(rawName).trim() || 'inconnu';

  // callback(erreur, réponse)
  callback(null, { message: `Bonjour, ${name} !` });
}

function main() {
  // Crée le serveur gRPC
  const server = new grpc.Server();

  // Enregistre le service Greeter avec son implémentation
  server.addService(helloProto.Greeter.service, {
    sayHello
  });

  // Démarre le serveur sur le port 50051
  server.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(), // sans SSL (dev uniquement)
    (err, port) => {
      if (err) {
        console.error('Erreur de démarrage du serveur gRPC :', err);
        return;
      }
      console.log(`Serveur gRPC démarré sur 0.0.0.0:${port}`);
    }
  );
}

main();
