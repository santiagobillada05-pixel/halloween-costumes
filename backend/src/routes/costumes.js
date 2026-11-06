'use strict';
const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

const router = express.Router();

// ─── Validators ───────────────────────────────────────────────
const costumeValidation = [
  body('custom_id').trim().notEmpty().withMessage('ID personalizado es requerido'),
  body('name').trim().notEmpty().withMessage('Nombre es requerido'),
  body('category').isIn(['clasico', 'casero', 'complejo', 'lujo', 'infantil', 'pareja']),
  body('price_per_hour').isFloat({ min: 0 }).withMessage('Precio por hora inválido'),
  body('price_per_day').isFloat({ min: 0 }).withMessage('Precio por día inválido'),
  body('sale_price').isFloat({ min: 0 }).withMessage('Precio de venta inválido'),
  body('stock').isInt({ min: 0 }).withMessage('Stock debe ser número entero positivo'),
];

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// ─── GET /api/costumes ────────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    const { category, status, search } = req.query;

    let query = 'SELECT * FROM costumes WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR custom_id LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const costumes = stmt.all(...params);

    res.json({ success: true, data: costumes });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/costumes/:id ────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const stmt = db.prepare('SELECT * FROM costumes WHERE id = ?');
    const costume = stmt.get(req.params.id);

    if (!costume) {
      return res.status(404).json({ success: false, error: 'Disfraz no encontrado' });
    }

    res.json({ success: true, data: costume });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/costumes ───────────────────────────────────────
router.post('/', costumeValidation, validateRequest, (req, res, next) => {
  try {
    const {
      custom_id, name, category, price_per_hour, price_per_day,
      sale_price, status, stock, image_url, notes,
    } = req.body;

    // Verificar unicidad de custom_id
    const existing = db.prepare('SELECT id FROM costumes WHERE custom_id = ?').get(custom_id);
    if (existing) {
      return res.status(409).json({ success: false, error: 'El ID personalizado ya existe' });
    }

    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO costumes
        (id, custom_id, name, category, price_per_hour, price_per_day, sale_price, status, stock, image_url, notes)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, custom_id, name, category || 'clasico',
      price_per_hour, price_per_day, sale_price,
      status || 'disponible', stock || 1, image_url || null, notes || null
    );

    const created = db.prepare('SELECT * FROM costumes WHERE id = ?').get(id);

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/costumes/:id ────────────────────────────────────
router.put('/:id', costumeValidation, validateRequest, (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      custom_id, name, category, price_per_hour, price_per_day,
      sale_price, status, stock, image_url, notes,
    } = req.body;

    // Verificar existencia
    const existing = db.prepare('SELECT id FROM costumes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Disfraz no encontrado' });
    }

    // Verificar unicidad de custom_id si cambió
    const duplicate = db.prepare('SELECT id FROM costumes WHERE custom_id = ? AND id != ?').get(custom_id, id);
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'El ID personalizado ya existe en otro disfraz' });
    }

    const stmt = db.prepare(`
      UPDATE costumes SET
        custom_id = ?, name = ?, category = ?, price_per_hour = ?, price_per_day = ?,
        sale_price = ?, status = ?, stock = ?, image_url = ?, notes = ?
      WHERE id = ?
    `);

    stmt.run(
      custom_id, name, category, price_per_hour, price_per_day,
      sale_price, status, stock, image_url, notes, id
    );

    const updated = db.prepare('SELECT * FROM costumes WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/costumes/:id ─────────────────────────────────
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si tiene transacciones
    const hasTxs = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE costume_id = ?').get(id);
    if (hasTxs.count > 0) {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar: existen transacciones asociadas.',
      });
    }

    const result = db.prepare('DELETE FROM costumes WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Disfraz no encontrado' });
    }

    res.json({ success: true, message: 'Disfraz eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
