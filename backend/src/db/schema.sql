-- ============================================================
-- Halloween Costumes Manager — SQLite Schema
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── Disfraces ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS costumes (
  id             TEXT PRIMARY KEY,          -- UUID v4
  custom_id      TEXT UNIQUE NOT NULL,      -- Ej: DSF-001
  name           TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'clasico',
  -- Categorías: clasico | casero | complejo | lujo | infantil | pareja
  price_per_hour REAL NOT NULL DEFAULT 0,   -- COP
  price_per_day  REAL NOT NULL DEFAULT 0,   -- COP
  sale_price     REAL NOT NULL DEFAULT 0,   -- COP
  status         TEXT NOT NULL DEFAULT 'disponible',
  -- Status: disponible | alquilado | vendido
  stock          INTEGER NOT NULL DEFAULT 1,
  image_url      TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ─── Clientes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ─── Transacciones ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            TEXT PRIMARY KEY,
  costume_id    TEXT NOT NULL REFERENCES costumes(id) ON DELETE RESTRICT,
  client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,    -- alquiler | venta
  rental_hours  REAL,             -- si type = alquiler
  rental_days   REAL,             -- si type = alquiler
  total_cop     REAL NOT NULL,
  start_date    TEXT,
  end_date      TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ─── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_costumes_status   ON costumes(status);
CREATE INDEX IF NOT EXISTS idx_costumes_category ON costumes(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ─── Trigger: actualizar updated_at automáticamente ──────────
CREATE TRIGGER IF NOT EXISTS costumes_updated_at
AFTER UPDATE ON costumes
BEGIN
  UPDATE costumes SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
END;
