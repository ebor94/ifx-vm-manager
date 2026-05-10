// Helpers de tests: reset de DB en memoria y login utility.
// Importar este módulo dispara el seed inicial UNA SOLA VEZ por proceso de test.

const request = require('supertest')
const db = require('../../src/db/connection')
const seed = require('../../src/db/seed')

// Seed inicial — corre migrate() + inserta admin y cliente con bcrypt.
// Tomamos snapshot de la tabla users para poder restaurar sin re-hashear (caro).
seed()
const userSnapshot = db.prepare('SELECT * FROM users').all()

// Restaura el estado limpio: vms vacía, users repobladas desde el snapshot.
const resetDb = () => {
  db.exec('DELETE FROM vms;')
  db.exec('DELETE FROM users;')
  const insert = db.prepare(`
    INSERT INTO users (id, name, email, password, role, created_at)
    VALUES (@id, @name, @email, @password, @role, @created_at)
  `)
  for (const u of userSnapshot) insert.run(u)
}

// Hace login y devuelve el header Cookie listo para enviar en otros requests.
const loginAs = async (app, role) => {
  const credentials =
    role === 'admin'
      ? { email: 'admin@ifx.com', password: 'Admin123!' }
      : { email: 'cliente@ifx.com', password: 'Cliente123!' }
  const res = await request(app).post('/login').send(credentials)
  if (res.status !== 200) {
    throw new Error(`loginAs(${role}) falló: ${res.status} ${JSON.stringify(res.body)}`)
  }
  // 'token=eyJ...; Path=/; HttpOnly; ...' → 'token=eyJ...'
  return res.headers['set-cookie'][0].split(';')[0]
}

module.exports = { resetDb, loginAs }
