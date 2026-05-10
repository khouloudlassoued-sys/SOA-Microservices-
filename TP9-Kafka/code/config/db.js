'use strict';
require('dotenv').config();
const { Pool } = require('pg');

/**
 * Pool de connexions PostgreSQL.
 * Les paramètres sont lus depuis les variables d'environnement (.env).
 */
const pool = new Pool({
    host:     process.env.PGHOST     || 'localhost',
    port:     Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'kafka_db',
    user:     process.env.PGUSER     ,
    password: process.env.PGPASSWORD,
});

pool.on('error', (err) => {
    console.error('[DB] Erreur inattendue sur le pool PostgreSQL :', err.message);
});

module.exports = pool;
