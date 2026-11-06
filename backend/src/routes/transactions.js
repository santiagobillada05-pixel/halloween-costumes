'use strict';
const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

// ─── GET /api/transactions ────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name as costume_name, c.custom_id, cl.name as client_name
      FROM transactions t
      JOIN costumes c ON t.costume_id = c.id
      LEFT JOIN clients cl ON t.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND t.type = ?'; params.push(type); }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as n FROM transactions' + (type ? ' WHERE type = ?' : '')).get(...(type ? [type] : []));

    res.json({ success: true, data: rows, total: total.n });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/transactions ───────────────────────────────────
router.post('/', [
  body('costume_id').notEmpty(),
  body('type').isIn(['alquiler', 'venta']),
  body('total_cop').isFloat({ min: 0 }),
  body('client_name').optional().trim(),
], validateRequest, (req, res, next) => {
  try {
    const {
      costume_id, type, rental_hours, rental_days,
      total_cop, start_date, end_date, notes,
      client_name, client_phone, client_email,
    } = req.body;

    // Verificar existencia del disfraz
    const costume = db.prepare('SELECT * FROM costumes WHERE id = ?').get(costume_id);
    if (!costume) return res.status(404).json({ success: false, error: 'Disfraz no encontrado' });

    // Manejar cliente
    let clientId = null;
    if (client_name) {
      const existingClient = db.prepare('SELECT id FROM clients WHERE name = ? AND phone = ?').get(client_name, client_phone || null);
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        clientId = uuidv4();
        db.prepare('INSERT INTO clients (id, name, phone, email) VALUES (?, ?, ?, ?)')
          .run(clientId, client_name, client_phone || null, client_email || null);
      }
    }

    // Registrar transacción
    const txId = uuidv4();
    db.prepare(`
      INSERT INTO transactions
        (id, costume_id, client_id, type, rental_hours, rental_days, total_cop, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txId, costume_id, clientId, type, rental_hours || null, rental_days || null, total_cop, start_date || null, end_date || null, notes || null);

    // Actualizar estado y stock del disfraz
    let newStatus = costume.status;
    let newStock = costume.stock;
    if (type === 'venta') {
      newStock = Math.max(0, costume.stock - 1);
      newStatus = newStock === 0 ? 'vendido' : 'disponible';
    } else if (type === 'alquiler') {
      newStatus = 'alquilado';
    }
    db.prepare('UPDATE costumes SET status = ?, stock = ? WHERE id = ?').run(newStatus, newStock, costume_id);

    const tx = db.prepare(`
      SELECT t.*, c.name as costume_name, cl.name as client_name
      FROM transactions t
      JOIN costumes c ON t.costume_id = c.id
      LEFT JOIN clients cl ON t.client_id = cl.id
      WHERE t.id = ?
    `).get(txId);

    res.status(201).json({ success: true, data: tx });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/transactions/stats ─────────────────────────────
router.get('/stats/summary', (req, res, next) => {
  try {
    const totalCostumes    = db.prepare('SELECT COUNT(*) as n FROM costumes').get().n;
    const available        = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status='disponible'").get().n;
    const rented           = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status='alquilado'").get().n;
    const sold             = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status='vendido'").get().n;
    const totalRevenue     = db.prepare('SELECT COALESCE(SUM(total_cop),0) as total FROM transactions').get().total;
    const rentalRevenue    = db.prepare("SELECT COALESCE(SUM(total_cop),0) as total FROM transactions WHERE type='alquiler'").get().total;
    const saleRevenue      = db.prepare("SELECT COALESCE(SUM(total_cop),0) as total FROM transactions WHERE type='venta'").get().total;
    const totalTx          = db.prepare('SELECT COUNT(*) as n FROM transactions').get().n;
    const recentTx         = db.prepare(`
      SELECT t.type, t.total_cop, t.created_at, c.name as costume
      FROM transactions t JOIN costumes c ON t.costume_id = c.id
      ORDER BY t.created_at DESC LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        inventory: { total: totalCostumes, available, rented, sold },
        revenue:   { total: totalRevenue, rentals: rentalRevenue, sales: saleRevenue },
        transactions: { total: totalTx, recent: recentTx },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
