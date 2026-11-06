'use strict';
/**
 * Inicializa la base de datos SQLite aplicando el schema.
 * Ejecutar una sola vez: npm run db:init
 */

const path = require('path');
const fs   = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Database = require('better-sqlite3');

const dbPath = path.resolve(process.env.DB_PATH || './data/halloween.db');
const dataDir = path.dirname(dbPath);

// Crear carpeta /data si no existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Carpeta creada: ${dataDir}`);
}

const schemaPath = path.join(__dirname, 'schema.sql');
const schema     = fs.readFileSync(schemaPath, 'utf8');

const db = new Database(dbPath, { verbose: console.log });
db.exec(schema);
db.close();

console.log(`\n✅ Base de datos inicializada en: ${dbPath}`);
