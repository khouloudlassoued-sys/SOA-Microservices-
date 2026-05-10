require('dotenv').config();
const { kafka, TOPIC } = require('../config/kafka');

const producer = kafka.producer();

const run = async () => {
    await producer.connect();
    console.log(`[Producer] Connecté — envoi vers le topic "${TOPIC}" toutes les secondes.`);

    setInterval(async () => {
        const event = {
            deviceId:    'sensor-01',
            temperature: Number((20 + Math.random() * 10).toFixed(2)),
            createdAt:   new Date().toISOString(),
        };

        try {
            await producer.send({
                topic: TOPIC,
                messages: [{ key: event.deviceId, value: JSON.stringify(event) }],
            });
            console.log('[Producer] Message produit :', event);
        } catch (err) {
            console.error('[Producer] Erreur d\'envoi :', err.message);
        }
    }, 1000);
};

// ── Arrêt propre
const shutdown = async (signal) => {
    console.log(`\n[Producer] Signal ${signal} reçu — arrêt propre…`);
    await producer.disconnect();
    console.log('[Producer] Déconnecté.');
    process.exit(0);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

run().catch((err) => {
    console.error('[Producer] Erreur fatale :', err.message);
    process.exit(1);
});
