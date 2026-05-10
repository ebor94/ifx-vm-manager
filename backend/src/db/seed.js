// Datos iniciales: dos usuarios (Administrador y Cliente) con contraseñas hasheadas con bcrypt.
// Idempotente: usa INSERT OR IGNORE sobre users.email (UNIQUE).

const bcrypt = require('bcryptjs')
const db = require('./connection')
const migrate = require('./migrate')

const SEED_USERS = [
  { name: 'Administrador IFX', email: 'admin@ifx.com',   password: 'Admin123!',   role: 'Administrador' },
  { name: 'Cliente Demo',      email: 'cliente@ifx.com', password: 'Cliente123!', role: 'Cliente' }
]

function seed() {
  // Asegura que el schema exista antes de insertar.
  migrate()

  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, role)
    VALUES (@name, @email, @password, @role)
  `)

  const tx = db.transaction((users) => {
    for (const user of users) {
      insert.run({
        name: user.name,
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
        role: user.role
      })
    }
  })

  tx(SEED_USERS)

  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  console.log(`[db/seed] usuarios en la base: ${count}`)
}

if (require.main === module) {
  try {
    seed()
    process.exit(0)
  } catch (err) {
    console.error('[db/seed] error:', err.message)
    process.exit(1)
  }
}

module.exports = seed
