'use strict';
require('dotenv').config();
const express = require('express');
const pool    = require('../config/db');

const app  = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// ── Middleware : log des requêtes ─────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Helper : envoyer une erreur JSON normalisée ───────────────────────────────
function sendError(res, status, message, detail = null) {
  const body = { success: false, error: message };
  if (detail) body.detail = detail;
  return res.status(status).json(body);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS db_time');
    res.json({
      success: true,
      status:  'OK',
      db_time: rows[0].db_time,
    });
  } catch (err) {
    sendError(res, 503, 'Base de données indisponible', err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages
// Query params :
//   limit    (default 20, max 100)
//   offset   (default 0)
//   deviceId (filtre optionnel sur payload->>'deviceId')
// ─────────────────────────────────────────────────────────────────────────────
app.get('/messages', async (req, res) => {
  try {
    const limit    = Math.min(Number(req.query.limit)  || 20,  100);
    const offset   = Math.max(Number(req.query.offset) || 0,   0);
    const deviceId = req.query.deviceId ?? null;

    let query;
    let params;

    if (deviceId) {
      query = `
        SELECT id, topic, partition, "offset", key, payload, created_at
        FROM   kafka_messages
        WHERE  payload->>'deviceId' = $1
        ORDER  BY created_at DESC
        LIMIT  $2 OFFSET $3
      `;
      params = [deviceId, limit, offset];
    } else {
      query = `
        SELECT id, topic, partition, "offset", key, payload, created_at
        FROM   kafka_messages
        ORDER  BY created_at DESC
        LIMIT  $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    // Comptage total (pour la pagination)
    const countQuery  = deviceId
      ? `SELECT COUNT(*) FROM kafka_messages WHERE payload->>'deviceId' = $1`
      : `SELECT COUNT(*) FROM kafka_messages`;
    const countParams = deviceId ? [deviceId] : [];

    const [{ rows }, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      success: true,
      total:   Number(countResult.rows[0].count),
      limit,
      offset,
      count:   rows.length,
      data:    rows,
    });
  } catch (err) {
    sendError(res, 500, 'Erreur lors de la récupération des messages', err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages/:id
// ─────────────────────────────────────────────────────────────────────────────
app.get('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return sendError(res, 400, 'L\'identifiant doit être un entier positif');
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, topic, partition, "offset", key, payload, created_at
       FROM   kafka_messages
       WHERE  id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return sendError(res, 404, `Message avec l'id=${id} introuvable`);
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    sendError(res, 500, 'Erreur lors de la récupération du message', err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 catch-all
// ─────────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, 'Route introuvable');
});

// ─────────────────────────────────────────────────────────────────────────────
// Démarrage
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[API] 🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log('[API] Routes disponibles :');
  console.log(`       GET  http://localhost:${PORT}/health`);
  console.log(`       GET  http://localhost:${PORT}/messages`);
  console.log(`       GET  http://localhost:${PORT}/messages/:id`);
});

module.exports = app;   // utile pour les tests unitaires
