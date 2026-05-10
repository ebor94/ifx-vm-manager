// Instancia única de SQLite (better-sqlite3).
// Cualquier repository importa `db` desde aquí — nunca crea su propia conexión.

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const config = require('../config/env')

// Garantiza que el directorio del archivo de DB exista (no se versiona).
fs.mkdirSync(path.dirname(config.DB_PATH), { recursive: true })

const db = new Database(config.DB_PATH, {
  // En tests podemos usar ":memory:" sobreescribiendo DB_PATH.
  fileMustExist: false
})

// Pragmas recomendados:
// - foreign_keys: por si añadimos relaciones.
// - journal_mode WAL: mejor concurrencia lectura/escritura.
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

module.exports = db
