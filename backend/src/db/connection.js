'use strict';
/**
 * Singleton de conexión a SQLite.
 * Importar con: const db = require('./db/connection');
 */
const path     = require('path');
const fs       = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(process.env.DB_PATH || './data/halloween.db');

// Garantizar que la carpeta de datos exista
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

// Mejoras de rendimiento
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

module.exports = db;
