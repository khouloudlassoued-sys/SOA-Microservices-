// client.js
// Client gRPC — envoie une requête au serveur et affiche la réponse

'use strict';

const path = require('node:path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Chemin vers le fichier .proto
const PROTO_PATH = path.join(__dirname, 'hello.proto');

// Charge et parse le fichier .proto (même config que server.js)
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Charge la définition du package "hello"
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;

// Crée un client gRPC connecté au serveur sur localhost:50051
const client = new helloProto.Greeter(
  'localhost:50051',
  grpc.credentials.createInsecure() // sans SSL (dev uniquement)
);

// Appelle la méthode SayHello avec le message { name: 'TestUser' }
client.sayHello({ name: 'TestUser' }, (err, response) => {
  if (err) {
    console.error('Erreur côté client :', err);
    return;
  }
  console.log('Réponse du serveur :', response.message);
});