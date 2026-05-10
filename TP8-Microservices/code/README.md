# TP8 — Microservices avec REST, GraphQL et gRPC

> **Matière :** SoA et Architecture Microservices
> **Classe :** 4Info — A.U. 2025/2026

---

## Table des matières

1. [Objectifs](#objectifs)
2. [Architecture](#architecture)
3. [Outils et dépendances](#outils-et-dépendances)
4. [Structure du projet](#structure-du-projet)
5. [Installation](#installation)
6. [Lancement](#lancement)
7. [Collections Postman](#collections-postman)
8. [API REST — Référence](#api-rest--référence)
9. [API GraphQL — Référence](#api-graphql--référence)
10. [Base de données MongoDB](#base-de-données-mongodb)
11. [Explication du code](#explication-du-code)

---

## Objectifs

- Créer deux microservices gRPC indépendants : **Films** (port 50051) et **Séries TV** (port 50052).
- Mettre en place un **API Gateway** (Express + Apollo) exposant les données via **REST** et **GraphQL**.
- Implémenter les opérations **CRUD** complètes (Create, Read, Update, Delete) sur les deux ressources.
- Connecter les microservices à une base de données **MongoDB** pour la persistance des données.

---

## Architecture

```
                        ┌──────────────────────────────────┐
                        │           API Gateway            │
                        │     Express + Apollo Server      │
                        │          (port 3000)             │
                        └──────────────┬───────────────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │ gRPC                                    gRPC     │
              ▼                                                  ▼
┌─────────────────────────┐                  ┌─────────────────────────────┐
│  Movies Microservice    │                  │  TVShows Microservice       │
│  gRPC Server            │                  │  gRPC Server                │
│  (port 50051)           │                  │  (port 50052)               │
└───────────┬─────────────┘                  └──────────────┬──────────────┘
            │                                               │
            ▼                                               ▼
┌─────────────────────────┐                  ┌─────────────────────────────┐
│  MongoDB                │                  │  MongoDB                    │
│  Collection: movies     │                  │  Collection: tvshows        │
└─────────────────────────┘                  └─────────────────────────────┘

Client ──── REST (GET/POST/PUT/DELETE) ────► API Gateway
Client ──── GraphQL (Queries/Mutations) ───► API Gateway
```

---

## Outils et dépendances

| Package                      | Version   | Rôle                                        |
|------------------------------|-----------|---------------------------------------------|
| `express`                    | ^5.2.1    | Serveur HTTP / endpoints REST               |
| `@apollo/server`             | ^4.x      | Serveur GraphQL                             |
| `@as-integrations/express4`  | ^1.x      | Intégration Apollo dans Express             |
| `graphql`                    | ^16.x     | Moteur GraphQL                              |
| `@grpc/grpc-js`              | ^1.10.x   | Client/Serveur gRPC                         |
| `@grpc/proto-loader`         | ^0.7.x    | Chargement dynamique des fichiers `.proto`  |
| `cors`                       | ^2.8.x    | Gestion des requêtes cross-origin           |
| `mongoose`                   | ^8.x      | ODM MongoDB pour Node.js                    |

---

## Structure du projet

```
tp-microservices/
├── movie.proto             # Contrat Protobuf du service Films (CRUD)
├── tvShow.proto            # Contrat Protobuf du service Séries TV (CRUD)
├── movieMicroservice.js    # Serveur gRPC Films — connecté à MongoDB (port 50051)
├── tvShowMicroservice.js   # Serveur gRPC Séries TV — connecté à MongoDB (port 50052)
├── schema.gql              # Schéma GraphQL (types + Query + Mutation)
├── resolvers.js            # Resolvers GraphQL → appels gRPC
├── apiGateway.js           # API Gateway Express + Apollo (port 3000)
├── package.json
├── .gitignore
└── README.md
```

---

## Installation

### Prérequis

- **Node.js** v18+
- **MongoDB** installé et démarré localement

### 1. Cloner le dépôt

```bash
git clone https://gitlab.com/mohamedkhalil.khelifi/tp-microservices.git
cd tp-microservices
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Démarrer MongoDB (Windows)

```bash
net start MongoDB
```

---

## Lancement

Ouvrir **3 terminaux séparés** et exécuter dans l'ordre :

```bash
# Terminal 1 — Microservice Films (port 50051)
node movieMicroservice.js

# Terminal 2 — Microservice Séries TV (port 50052)
node tvShowMicroservice.js

# Terminal 3 — API Gateway (port 3000)
node apiGateway.js
```

### Sorties attendues

**Terminal 1 :**
```
Microservice de films en cours d'exécution sur le port 50051
Le serveur s'exécute sur le port 50051
Connecté à MongoDB (movies)
```

**Terminal 2 :**
```
Microservice de séries TV en cours d'exécution sur le port 50052
Le serveur s'exécute sur le port 50052
Connecté à MongoDB (tvshows)
```

**Terminal 3 :**
```
API Gateway en cours d'exécution sur le port 3000
```

---

## Collections Postman

Les collections Postman sont disponibles aux liens suivants pour tester l'API directement :

### 🔵 Collection GraphQL

> Contient toutes les Queries et Mutations GraphQL (films et séries TV)

**Lien :** [Collection GraphQL — Postman](https://blue-comet-423439.postman.co/workspace/tp_soap~190c26f8-507d-4c5f-b9cb-f95768bcaff4/collection/69fcee58c6877dfb6fb63364?action=share&source=copy-link&creator=32603591)

### 🟢 Collection REST

> Contient tous les endpoints REST (GET, POST, PUT, DELETE) pour films et séries TV

**Lien :** [Collection REST — Postman](https://blue-comet-423439.postman.co/workspace/tp_soap~190c26f8-507d-4c5f-b9cb-f95768bcaff4/folder/32603591-3b752773-60d7-4163-b21d-614ad8938158?action=share&source=copy-link&creator=32603591)

### Importer dans Postman

1. Ouvrir Postman
2. Cliquer sur **Import**
3. Coller le lien de la collection
4. Cliquer **Import**

---

## API REST — Référence

**Base URL :** `http://localhost:3000`

### 🎬 Films (`/movies`)

| Méthode  | Endpoint        | Description             | Body JSON requis                          |
|----------|-----------------|-------------------------|-------------------------------------------|
| `GET`    | `/movies`       | Lister tous les films   | —                                         |
| `GET`    | `/movies/:id`   | Récupérer un film       | —                                         |
| `POST`   | `/movies`       | Créer un film           | `{ "title": "...", "description": "..." }` |
| `PUT`    | `/movies/:id`   | Modifier un film        | `{ "title": "...", "description": "..." }` |
| `DELETE` | `/movies/:id`   | Supprimer un film       | —                                         |

### 📺 Séries TV (`/tvshows`)

| Méthode  | Endpoint         | Description              | Body JSON requis                          |
|----------|------------------|--------------------------|-------------------------------------------|
| `GET`    | `/tvshows`       | Lister toutes les séries | —                                         |
| `GET`    | `/tvshows/:id`   | Récupérer une série      | —                                         |
| `POST`   | `/tvshows`       | Créer une série          | `{ "title": "...", "description": "..." }` |
| `PUT`    | `/tvshows/:id`   | Modifier une série       | `{ "title": "...", "description": "..." }` |
| `DELETE` | `/tvshows/:id`   | Supprimer une série      | —                                         |

### Exemples

```bash
# Lister tous les films
curl http://localhost:3000/movies

# Créer un film
curl -X POST http://localhost:3000/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Inception","description":"Un voleur qui s infiltre dans les reves"}'

# Modifier un film (remplacer {id} par l'ObjectId MongoDB reçu)
curl -X PUT http://localhost:3000/movies/{id} \
  -H "Content-Type: application/json" \
  -d '{"title":"Inception Remastered","description":"Version améliorée"}'

# Supprimer un film
curl -X DELETE http://localhost:3000/movies/{id}
```

---

## API GraphQL — Référence

**URL :** `http://localhost:3000/graphql`

### Queries (Lecture)

```graphql
# Lister tous les films
query {
  movies {
    id
    title
    description
  }
}

# Récupérer un film par id
query {
  movie(id: "OBJECT_ID_ICI") {
    id
    title
    description
  }
}

# Lister toutes les séries TV
query {
  tvShows {
    id
    title
    description
  }
}

# Récupérer une série par id
query {
  tvShow(id: "OBJECT_ID_ICI") {
    id
    title
    description
  }
}
```

### Mutations (Écriture)

```graphql
# Créer un film
mutation {
  createMovie(title: "Dune", description: "Une épopée dans un désert intergalactique") {
    id
    title
    description
  }
}

# Modifier un film
mutation {
  updateMovie(id: "OBJECT_ID_ICI", title: "Dune Part 2", description: "La suite") {
    id
    title
    description
  }
}

# Supprimer un film
mutation {
  deleteMovie(id: "OBJECT_ID_ICI") {
    success
  }
}

# Créer une série TV
mutation {
  createTVShow(title: "Breaking Bad", description: "Un professeur de chimie devient fabricant de drogue") {
    id
    title
    description
  }
}

# Modifier une série TV
mutation {
  updateTVShow(id: "OBJECT_ID_ICI", title: "Breaking Bad S2") {
    id
    title
  }
}

# Supprimer une série TV
mutation {
  deleteTVShow(id: "OBJECT_ID_ICI") {
    success
  }
}
```

---

## Base de données MongoDB

### Configuration

- **Host :** `localhost`
- **Port :** `27017`
- **Base :** `tp-microservices`
- **Collections :** `movies` et `tvshows`

### Schéma des documents

**Collection `movies` :**
```json
{
  "_id": "ObjectId (généré automatiquement)",
  "title": "String (requis)",
  "description": "String (requis)",
  "__v": 0
}
```

**Collection `tvshows` :**
```json
{
  "_id": "ObjectId (généré automatiquement)",
  "title": "String (requis)",
  "description": "String (requis)",
  "__v": 0
}
```

### Vérifier avec MongoDB Compass

1. Télécharger [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Se connecter à `mongodb://localhost:27017`
3. Ouvrir la base `tp-microservices`
4. Vérifier les collections `movies` et `tvshows` après les requêtes

---

## Explication du code

### `movie.proto` / `tvShow.proto`
Définissent le **contrat d'interface gRPC**. Chaque service expose 5 méthodes RPC : `Get`, `Search`, `Create`, `Update`, `Delete`.

### `movieMicroservice.js` / `tvShowMicroservice.js`
Serveurs gRPC connectés à **MongoDB via Mongoose**. Chaque opération CRUD appelle la base de données réelle. Les `_id` MongoDB sont convertis en `String` pour être compatibles avec le schéma Protobuf.

### `schema.gql`
Définit les **types GraphQL** (`Movie`, `TVShow`, `DeleteResponse`), les **Queries** (lecture) et les **Mutations** (écriture).

### `resolvers.js`
Fait le lien entre GraphQL et gRPC : chaque resolver crée un client gRPC et appelle la méthode appropriée du microservice.

### `apiGateway.js`
Point d'entrée unique qui expose deux interfaces : **REST** via Express et **GraphQL** via Apollo Server. `express.json()` est ajouté globalement pour parser le body des requêtes POST/PUT.

---

## Auteur

Réalisé dans le cadre du **TP8 — Microservices avec REST, GraphQL et gRPC**
Matière : SoA et Architecture Microservices — 4Info — 2025/2026

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 6330c8fa8961defa10470d3faf761adefd9283a3
