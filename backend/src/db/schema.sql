-- Schema IFX VM Manager
-- Este archivo es la única fuente de verdad del DDL.
-- Ejecutado por src/db/migrate.js sobre la conexión de src/db/connection.js.

-- ─── users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  name       TEXT     NOT NULL,
  email      TEXT     NOT NULL UNIQUE,
  password   TEXT     NOT NULL,                                      -- bcrypt hash
  role       TEXT     NOT NULL CHECK(role IN ('Administrador', 'Cliente')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── vms ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vms (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  name       TEXT     NOT NULL UNIQUE,
  cores      INTEGER  NOT NULL CHECK(cores >= 1 AND cores <= 64),
  ram        INTEGER  NOT NULL CHECK(ram >= 512),                    -- MB
  disk       INTEGER  NOT NULL CHECK(disk >= 10),                    -- GB
  os         TEXT     NOT NULL CHECK(os IN (
                'Ubuntu 22.04', 'Windows Server 2022',
                'CentOS 8', 'Debian 11'
              )),
  status     TEXT     NOT NULL DEFAULT 'Apagada' CHECK(status IN (
                'Encendida', 'Apagada', 'Suspendida'
              )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: mantiene updated_at fresco en cada UPDATE de vms.
CREATE TRIGGER IF NOT EXISTS vms_set_updated_at
AFTER UPDATE ON vms
FOR EACH ROW
BEGIN
  UPDATE vms SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
