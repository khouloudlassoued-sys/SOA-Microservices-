# TP9 — Intégration et Manipulation de Données avec Apache Kafka

> **Matière :** SoA et Microservices  
> **Etudiant :** Mohamed Khalil Khelifi
> **Classe :** 4Info — DS - G2. 2025/2026

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture](#2-architecture)
3. [Prérequis](#3-prérequis)
4. [Structure du projet](#4-structure-du-projet)
5. [Partie 1 — Préparation de Kafka](#5-partie-1--préparation-de-kafka)
6. [Partie 2 — Installation des dépendances Node.js](#6-partie-2--installation-des-dépendances-nodejs)
7. [Partie 3 — Producteur de messages](#7-partie-3--producteur-de-messages)
8. [Partie 4 — Consommateur de messages](#8-partie-4--consommateur-de-messages)
9. [Partie 5 — Exécution du flux complet](#9-partie-5--exécution-du-flux-complet)
10. [Partie 6 — Travail demandé](#10-partie-6--travail-demandé)
    - [6.1 Configuration de PostgreSQL](#61-configuration-de-postgresql)
    - [6.2 Consommateur avec persistance](#62-consommateur-avec-persistance)
    - [6.3 API REST avec Express.js 5](#63-api-rest-avec-expressjs-5)
    - [6.4 Tests avec curl / Postman](#64-tests-avec-curl--postman)
11. [Variables d'environnement](#11-variables-denvironnement)
12. [Scripts disponibles](#12-scripts-disponibles)

---

## 1. Présentation du projet

Ce TP a pour objectif d'acquérir des compétences pratiques dans la gestion des flux de données avec **Apache Kafka 4.2** en mode **KRaft** (sans ZooKeeper), et d'intégrer Kafka avec des applications **Node.js** pour produire, consommer et exploiter des messages.

### Outils utilisés

| Outil | Version | Rôle |
|-------|---------|------|
| Apache Kafka | 4.2 | Broker de messages |
| KRaft | — | Mode de gestion des métadonnées (sans ZooKeeper) |
| Node.js | 18+ | Runtime JavaScript côté serveur |
| KafkaJS | 2.x | Client Kafka pour Node.js |
| Express.js | 5.x | Framework API REST |
| PostgreSQL | 14+ | Base de données relationnelle |
| pg | 8.x | Client PostgreSQL pour Node.js |
| dotenv | 16.x | Gestion des variables d'environnement |

### Qu'est-ce que le mode KRaft ?

Depuis **Kafka 4.x**, ZooKeeper n'est plus utilisé. Kafka fonctionne désormais en mode **KRaft** (_Kafka Raft_) : les métadonnées du cluster sont gérées directement par Kafka lui-même à travers un quorum de contrôleurs internes. Cela simplifie le déploiement et améliore les performances.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Flux de données                             │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│  │  producer.js │────▶│  Apache Kafka    │────▶│  consumer.js   │  │
│  │  (sensor-01) │     │  Topic:          │     │  (groupe:      │  │
│  │  1 msg/sec   │     │  test-topic      │     │  test-group)   │  │
│  └──────────────┘     │  3 partitions    │     └───────┬────────┘  │
│                        └──────────────────┘             │           │
│                                                         │ INSERT     │
│                                               ┌─────────▼────────┐  │
│                                               │   PostgreSQL      │  │
│                                               │   kafka_messages  │  │
│                                               └─────────┬────────┘  │
│                                                         │ SELECT     │
│                                               ┌─────────▼────────┐  │
│                                               │   api.js         │  │
│                                               │   Express.js 5   │  │
│                                               │   :3000          │  │
│                                               └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Java 17+**
- **Node.js 18+** et npm
- **Apache Kafka 4.2**
- **PostgreSQL 14+**

---

## 4. Structure du projet

```
tp9-kafka/
├── config/
│   ├── db.js              # Pool de connexions PostgreSQL
│   └── kafka.js           # Instance Kafka partagée
├── scripts/
│   ├── setup-kafka.sh     # Script d'initialisation Kafka (Linux/macOS)
│   └── setup-kafka.bat    # Script d'initialisation Kafka (Windows)
├── sql/
│   └── init.sql           # Création de la base et de la table
├── src/
│   ├── producer.js        # Producteur Kafka (simulation capteur IoT)
│   ├── consumer.js        # Consommateur Kafka + persistance PostgreSQL
│   └── api.js             # API REST Express.js 5
├── .env                   # Variables d'environnement (non versionné)
├── .env.example           # Modèle de configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Partie 1 — Préparation de Kafka

### Étape 1 : Téléchargement

Téléchargez les binaires **kafka_2.13-4.2.0** depuis le site officiel :

[https://kafka.apache.org/downloads](https://kafka.apache.org/downloads)

Extrayez l'archive dans un répertoire de votre choix (ex : `~/kafka_2.13-4.2.0`).

### Étape 2 : Initialiser le stockage KRaft

Kafka 4.2 ne démarre **plus** avec ZooKeeper. Il faut générer un **Cluster ID** puis formater le stockage KRaft avant le premier démarrage.

Vous pouvez utiliser le script fourni :

```bash

# Windows (PowerShell)
scripts\setup-kafka.bat C:\kafka_2.13-4.2.0
```

Ou exécuter les commandes manuellement :

**Windows (PowerShell) :**
```powershell
cd C:\kafka_2.13-4.2.0

$KAFKA_CLUSTER_ID = (.\bin\windows\kafka-storage.bat random-uuid | Select-Object -Last 1)
.\bin\windows\kafka-storage.bat format --standalone -t $KAFKA_CLUSTER_ID -c .\config\server.properties
```

### Étape 3 : Démarrer le serveur Kafka

Ouvrez un **nouveau terminal** dans le répertoire Kafka et exécutez :


**Windows :**
```cmd
bin\windows\kafka-server-start.bat config\server.properties
```

Kafka est prêt lorsque vous voyez dans la console :

```
INFO Kafka Server started (kafka.server.KafkaServer)
```

> Laissez ce terminal ouvert pendant toute la durée du TP.

### Étape 4 : Créer le topic Kafka

Ouvrez un **autre terminal** et créez le topic `test-topic` avec **3 partitions** :

**Windows :**
```cmd
bin\windows\kafka-topics.bat --create --partitions 3 --replication-factor 1 --topic test-topic --bootstrap-server localhost:9092
```

**Vérification :**
```bash
# Linux
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# Windows
bin\windows\kafka-topics.bat --list --bootstrap-server localhost:9092
```

> **Pourquoi 3 partitions ?** Plusieurs partitions permettent le parallélisme entre consommateurs (chaque instance d'un groupe consommateur traite une partition différente).

---

## 6. Partie 2 — Installation des dépendances Node.js

Clonez ce dépôt, puis installez les dépendances :

```bash
git clone https://gitlab.com/mohamedkhalil.khelifi/tp9-kafka.git
cd tp9-kafka
npm install
```

Copiez le fichier de configuration et adaptez-le :

```bash
cp .env.example .env
```

---

## 7. Partie 3 — Producteur de messages

Le fichier `src/producer.js` simule un **capteur IoT** (`sensor-01`) qui publie toutes les secondes un événement JSON sur le topic `test-topic`.

### Structure d'un événement produit

```json
{
  "deviceId":    "sensor-01",
  "temperature": 24.87,
  "humidity":    58.32,
  "createdAt":   "2025-04-27T10:30:00.000Z"
}
```

### Démarrer le producteur

```bash
npm run producer
```

**Sortie attendue :**
```
[Producer] Connecté — envoi vers le topic "test-topic" toutes les secondes…
[Producer] Appuyez sur Ctrl+C pour arrêter.

[Producer] Message envoyé : [Producer] Message produit : {
  deviceId: 'sensor-01',
  temperature: 23.4,
  createdAt: '2026-04-27T20:32:51.396Z'
}
[Producer] Message envoyé : [Producer] Message produit : {
  deviceId: 'sensor-01',
  temperature: 20.02,
  createdAt: '2026-04-27T20:32:52.409Z'
}
```

---

## 8. Partie 4 — Consommateur de messages

Le fichier `src/consumer.js` :

1. S'abonne au topic `test-topic` avec le groupe `test-group`
2. Parse le JSON reçu
3. Persiste chaque message dans la table `kafka_messages` de PostgreSQL
4. Affiche la confirmation en console

### Démarrer le consommateur

```bash
npm run consumer
```

**Sortie attendue :**
```
[Consumer] Abonné au topic "test-topic" (groupe : test-group)
[Consumer] En attente de messages… Ctrl+C pour arrêter.

[Consumer] ] Message sauvegardé — id=72 | partition=0 | offset=193
            Payload : {"deviceId":"sensor-01","temperature":25.94,"createdAt":"2026-04-27T20:33:58.987Z"}
[Consumer] Message sauvegardé — id=73 | partition=0 | offset=194
            Payload : {"deviceId":"sensor-01","temperature":25.54,"createdAt":"2026-04-27T20:33:59.991Z"}
[Consumer] Message sauvegardé — id=74 | partition=0 | offset=195
            Payload : {"deviceId":"sensor-01","temperature":21.32,"createdAt":"2026-04-27T20:34:01.004Z"}
[Consumer] Message sauvegardé — id=75 | partition=0 | offset=196
            Payload : {"deviceId":"sensor-01","temperature":21.38,"createdAt":"2026-04-27T20:34:02.014Z"}
```

---

## 9. Partie 5 — Exécution du flux complet

Pour observer le flux complet, ouvrez **3 terminaux** simultanément :

| Terminal | Commande | Rôle |
|----------|----------|------|
| Terminal 1 | *(Kafka en cours d'exécution)* | Broker |
| Terminal 2 | `npm run producer` | Produit 1 msg/sec |
| Terminal 3 | `npm run consumer` | Consomme et persiste |

---

## 10. Partie 6 — Travail demandé

### 6.1 Configuration de PostgreSQL

#### Création de la base, de l'utilisateur et de la table

Connectez-vous à PostgreSQL en tant que superutilisateur :

```bash
psql -U postgres
```

Puis exécutez le script d'initialisation fourni :

```bash
psql -U postgres -f sql/init.sql
```

Ou manuellement :

```sql
-- Créer la base et l'utilisateur
CREATE DATABASE kafka_db;
CREATE USER kafka_user WITH ENCRYPTED PASSWORD 'kafka_pass';
GRANT ALL PRIVILEGES ON DATABASE kafka_db TO kafka_user;

-- Se connecter à la base
\c kafka_db kafka_user

-- Créer la table kafka_messages
CREATE TABLE IF NOT EXISTS kafka_messages (
    id          SERIAL PRIMARY KEY,
    topic       VARCHAR(255)  NOT NULL,
    partition   INTEGER       NOT NULL,
    "offset"    BIGINT        NOT NULL,
    key         VARCHAR(255),
    payload     JSONB         NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_km_topic   ON kafka_messages (topic);
CREATE INDEX idx_km_created ON kafka_messages (created_at DESC);
CREATE INDEX idx_km_device  ON kafka_messages ((payload->>'deviceId'));
```

#### Vérification de la table

```sql
\c kafka_db kafka_user
\d kafka_messages
SELECT * FROM kafka_messages LIMIT 5;
```

**Structure de la table :**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | SERIAL (PK) | Identifiant auto-incrémenté |
| `topic` | VARCHAR(255) | Nom du topic Kafka source |
| `partition` | INTEGER | Numéro de partition |
| `offset` | BIGINT | Offset du message |
| `key` | VARCHAR(255) | Clé de routage (nullable) |
| `payload` | JSONB | Corps JSON du message |
| `created_at` | TIMESTAMPTZ | Horodatage d'insertion |

---

### 6.2 Consommateur avec persistance

Le consommateur (`src/consumer.js`) est déjà configuré pour persister les messages. Il utilise une requête paramétrée pour insérer chaque message :

```javascript
const INSERT_SQL = `
  INSERT INTO kafka_messages (topic, partition, "offset", key, payload)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id;
`;
```

Les valeurs insérées correspondent à :

| Paramètre | Valeur |
|-----------|--------|
| `$1` topic | Nom du topic (`test-topic`) |
| `$2` partition | Numéro de partition (0, 1 ou 2) |
| `$3` offset | Position du message dans la partition |
| `$4` key | `message.key.toString()` (ex: `sensor-01`) |
| `$5` payload | `JSON.parse(message.value.toString())` |

---

### 6.3 API REST avec Express.js 5

Le fichier `src/api.js` expose trois routes HTTP :

#### Démarrer l'API

```bash
npm run api
```

L'API est accessible sur `http://localhost:3000`.

---

#### `GET /health` — Statut de l'application

Vérifie que l'API et la base de données sont opérationnelles.

**Exemple :**
```bash
curl http://localhost:3000/health
```

**Réponse 200 :**
```json
{
  "success": true,
  "status": "OK",
  "db_time": "2025-04-27T10:30:00.123Z"
}
```

---

#### `GET /messages` — Liste des messages (paginée)

Récupère tous les messages triés par date décroissante.

**Paramètres de requête :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `limit` | integer | `20` | Nombre max de résultats (max : 100) |
| `offset` | integer | `0` | Décalage pour la pagination |
| `deviceId` | string | — | Filtre par identifiant de capteur |

**Exemples :**
```bash
# 20 derniers messages
curl http://localhost:3000/messages

# Page 2 (messages 21 à 40)
curl "http://localhost:3000/messages?limit=20&offset=20"

# Filtrer par capteur
curl "http://localhost:3000/messages?deviceId=sensor-01"

# 5 derniers messages du capteur sensor-01
curl "http://localhost:3000/messages?limit=5&deviceId=sensor-01"
```

**Réponse 200 :**
```json
{
  "success": true,
  "total": 150,
  "limit": 20,
  "offset": 0,
  "count": 20,
  "data": [
    {
      "id": 150,
      "topic": "test-topic",
      "partition": 2,
      "offset": 49,
      "key": "sensor-01",
      "payload": {
        "deviceId": "sensor-01",
        "temperature": 24.87,
        "humidity": 58.32,
        "createdAt": "2025-04-27T10:30:00.000Z"
      },
      "created_at": "2025-04-27T10:30:00.123Z"
    }
  ]
}
```

---

#### `GET /messages/:id` — Message par identifiant

Récupère un message spécifique par son `id` (clé primaire PostgreSQL).

**Exemple :**
```bash
curl http://localhost:3000/messages/1
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "topic": "test-topic",
    "partition": 0,
    "offset": 0,
    "key": "sensor-01",
    "payload": {
      "deviceId": "sensor-01",
      "temperature": 22.35,
      "humidity": 55.10,
      "createdAt": "2025-04-27T10:00:00.000Z"
    },
    "created_at": "2025-04-27T10:00:00.456Z"
  }
}
```

**Réponse 404 (id inexistant) :**
```json
{
  "success": false,
  "error": "Message avec l'id=999 introuvable"
}
```

---

### 6.4 Tests avec curl / Postman

#### Flux de test complet

Suivez ces étapes dans l'ordre pour valider l'intégration de bout en bout :

**Étape 1 — Démarrer tous les composants**

```bash
# Terminal 1 : Kafka (déjà démarré)

# Terminal 2 : Producteur
npm run producer

# Terminal 3 : Consommateur
npm run consumer

# Terminal 4 : API REST
npm run api
```

**Étape 2 — Vérifier la santé de l'API**

```bash
curl http://localhost:3000/health
```

**Étape 3 — Laisser tourner quelques secondes** pour que des messages soient produits, consommés et persistés.

**Étape 4 — Récupérer les messages via l'API**

```bash
# Compter le total
curl -s http://localhost:3000/messages | python3 -m json.tool | grep total

# Récupérer les 5 derniers
curl "http://localhost:3000/messages?limit=5"

# Récupérer le premier message inséré
curl http://localhost:3000/messages/1
```

**Étape 5 — Vérification directe en base**

```sql
\c kafka_db kafka_user

-- Nombre total de messages
SELECT COUNT(*) FROM kafka_messages;

-- 5 derniers messages
SELECT id, topic, partition, "offset", key,
       payload->>'temperature' AS temperature,
       created_at
FROM kafka_messages
ORDER BY created_at DESC
LIMIT 5;

-- Statistiques par partition
SELECT partition, COUNT(*) AS nb_messages
FROM kafka_messages
GROUP BY partition
ORDER BY partition;
```

#### Collection Postman

Importez la collection suivante dans Postman :

```json
{
  "info": { "name": "TP9 Kafka API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "item": [
    { "name": "Health Check",      "request": { "method": "GET", "url": "http://localhost:3000/health" } },
    { "name": "Get All Messages",  "request": { "method": "GET", "url": "http://localhost:3000/messages?limit=10" } },
    { "name": "Get Message by ID", "request": { "method": "GET", "url": "http://localhost:3000/messages/1" } },
    { "name": "Filter by Device",  "request": { "method": "GET", "url": "http://localhost:3000/messages?deviceId=sensor-01&limit=5" } }
  ]
}
```

---

## 11. Variables d'environnement

Copiez `.env.example` vers `.env` et adaptez les valeurs :

```bash
cp .env.example .env
```

| Variable | Défaut | Description |
|----------|--------|-------------|
| `KAFKA_BROKER` | `localhost:9092` | Adresse du broker Kafka |
| `KAFKA_TOPIC` | `test-topic` | Nom du topic |
| `KAFKA_GROUP_ID` | `test-group` | Identifiant du groupe consommateur |
| `PGHOST` | `localhost` | Hôte PostgreSQL |
| `PGPORT` | `5432` | Port PostgreSQL |
| `PGDATABASE` | `kafka_db` | Nom de la base de données |
| `PGUSER` | `kafka_user` | Utilisateur PostgreSQL |
| `PGPASSWORD` | `kafka_pass` | Mot de passe PostgreSQL |
| `PORT` | `3000` | Port de l'API REST |

---

## 12. Scripts disponibles

```bash
npm run producer   # Lance le producteur Kafka (src/producer.js)
npm run consumer   # Lance le consommateur Kafka (src/consumer.js)
npm run api        # Lance l'API REST Express (src/api.js)
npm start          # Alias de npm run api
```

---

> © 2025/2026 — TP9 SoA et Microservices — Mohamed Khalil Khelifi
