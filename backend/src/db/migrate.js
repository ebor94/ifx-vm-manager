// Ejecuta schema.sql sobre la conexión actual.
// Idempotente: usa CREATE TABLE IF NOT EXISTS, así que correr dos veces es seguro.

const fs = require('node:fs')
const path = require('node:path')
const db = require('./connection')

function migrate() {
  const schemaPath = path.resolve(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  db.exec(schema)
  console.log('[db/migrate] schema aplicado correctamente')
}

if (require.main === module) {
  try {
    migrate()
    process.exit(0)
  } catch (err) {
    console.error('[db/migrate] error:', err.message)
    process.exit(1)
  }
}

module.exports = migrate
