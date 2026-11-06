'use strict';
/**
 * Carga datos de ejemplo en la BD.
 * Ejecutar: npm run db:seed
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { v4: uuidv4 } = require('uuid');
const Database       = require('better-sqlite3');
const dbPath         = path.resolve(process.env.DB_PATH || './data/halloween.db');
const db             = new Database(dbPath);

const costumes = [
  {
    id: uuidv4(), custom_id: 'DSF-001', name: 'Vampiro Élite',
    category: 'clasico', price_per_hour: 18000, price_per_day: 65000,
    sale_price: 200000, status: 'disponible', stock: 2,
    notes: 'Incluye capa, colmillos y maquillaje base.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Vampiro',
  },
  {
    id: uuidv4(), custom_id: 'DSF-002', name: 'Bruja Oscura',
    category: 'clasico', price_per_hour: 15000, price_per_day: 55000,
    sale_price: 180000, status: 'disponible', stock: 3,
    notes: 'Sombrero, vestido y escoba incluidos.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Bruja',
  },
  {
    id: uuidv4(), custom_id: 'DSF-003', name: 'Zombie Guerrero',
    category: 'complejo', price_per_hour: 30000, price_per_day: 100000,
    sale_price: 320000, status: 'disponible', stock: 1,
    notes: 'Armadura deteriorada, efectos de maquillaje profesional.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Zombie',
  },
  {
    id: uuidv4(), custom_id: 'DSF-004', name: 'Calabaza Gigante',
    category: 'infantil', price_per_hour: 10000, price_per_day: 35000,
    sale_price: 90000, status: 'disponible', stock: 4,
    notes: 'Tallas S, M para niños de 4-10 años.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Calabaza',
  },
  {
    id: uuidv4(), custom_id: 'DSF-005', name: 'Pareja Catrinas',
    category: 'pareja', price_per_hour: 45000, price_per_day: 150000,
    sale_price: 500000, status: 'disponible', stock: 1,
    notes: 'Set completo para dos personas. Estilo Día de Muertos.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Catrinas',
  },
  {
    id: uuidv4(), custom_id: 'DSF-006', name: 'Hechicero de Lujo',
    category: 'lujo', price_per_hour: 60000, price_per_day: 200000,
    sale_price: 750000, status: 'disponible', stock: 1,
    notes: 'Tela de alta calidad, accesorios premium bordados.',
    image_url: 'https://placehold.co/400x500/1a0030/ff7518?text=Hechicero',
  },
];

const clients = [
  { id: uuidv4(), name: 'Carlos Restrepo', phone: '310-555-0101', email: 'carlos@mail.com' },
  { id: uuidv4(), name: 'Laura Gómez',     phone: '320-555-0202', email: 'laura@mail.com'  },
];

// Insertar disfraces
const insertCostume = db.prepare(`
  INSERT OR IGNORE INTO costumes
    (id, custom_id, name, category, price_per_hour, price_per_day, sale_price, status, stock, notes, image_url)
  VALUES
    (@id, @custom_id, @name, @category, @price_per_hour, @price_per_day, @sale_price, @status, @stock, @notes, @image_url)
`);

// Insertar clientes
const insertClient = db.prepare(`
  INSERT OR IGNORE INTO clients (id, name, phone, email)
  VALUES (@id, @name, @phone, @email)
`);

// Insertar transacción de ejemplo
const insertTx = db.prepare(`
  INSERT OR IGNORE INTO transactions
    (id, costume_id, client_id, type, rental_days, total_cop, start_date, end_date, notes)
  VALUES
    (@id, @costume_id, @client_id, @type, @rental_days, @total_cop, @start_date, @end_date, @notes)
`);

db.transaction(() => {
  costumes.forEach(c => insertCostume.run(c));
  clients.forEach(c => insertClient.run(c));

  // Transacción de muestra
  const costumeRef = db.prepare('SELECT id FROM costumes WHERE custom_id = ?').get('DSF-002');
  const clientRef  = db.prepare('SELECT id FROM clients LIMIT 1').get();
  if (costumeRef && clientRef) {
    insertTx.run({
      id: uuidv4(),
      costume_id: costumeRef.id,
      client_id:  clientRef.id,
      type:       'alquiler',
      rental_days: 2,
      total_cop:  110000,
      start_date: '2026-10-28',
      end_date:   '2026-10-30',
      notes:      'Alquiler Halloween 2026',
    });
  }
})();

db.close();
console.log(`\n🌱 Seed completado: ${costumes.length} disfraces, ${clients.length} clientes, 1 transacción.`);
