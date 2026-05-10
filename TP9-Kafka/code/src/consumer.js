'use strict';
require('dotenv').config();
const { kafka, TOPIC, GROUP_ID } = require('../config/kafka');
const pool = require('../config/db');

const consumer = kafka.consumer({ groupId: GROUP_ID });

//Requête d'insertion
const INSERT_SQL = `
    INSERT INTO kafka_messages (topic, partition, "offset", key, payload)
        VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
`;

async function saveMessage({ topic, partition, message }) {
    const key      = message.key?.toString()   ?? null;
    const rawValue = message.value?.toString() ?? '{}';

    let payload;
    try {
        payload = JSON.parse(rawValue);
    } catch {
        console.warn('[Consumer] ⚠️  Payload non-JSON, stocké comme { raw }');
        payload = { raw: rawValue };
    }

    const { rows } = await pool.query(INSERT_SQL, [
        topic,
        partition,
        Number(message.offset),
        key,
        JSON.stringify(payload), // ✅ Explicit stringify for JSONB column
    ]);

    return rows[0].id;
}

async function run() {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    console.log(`[Consumer] Abonné au topic "${TOPIC}" (groupe : ${GROUP_ID})`);
    console.log('[Consumer] En attente de messages… Ctrl+C pour arrêter.\n');

    await consumer.run({
        eachMessage: async (ctx) => {
            const { partition, message } = ctx;
            try {
                const id = await saveMessage(ctx);
                console.log(
                    `[Consumer] Message sauvegardé — id=${id} | partition=${partition} | offset=${message.offset}`
                );
                console.log('            Payload :', message.value?.toString());
            } catch (err) {
                console.error('[Consumer] Erreur d\'insertion :', err.message);
            }
        },
    });
}

// ── Arrêt propre
const shutdown = async (signal) => {
    console.log(`\n[Consumer] Signal ${signal} reçu — arrêt propre…`);
    await consumer.disconnect();
    await pool.end();
    console.log('[Consumer] Déconnecté.');
    process.exit(0);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

run().catch((err) => {
    console.error('[Consumer] Erreur fatale :', err.message);
    process.exit(1);
});
