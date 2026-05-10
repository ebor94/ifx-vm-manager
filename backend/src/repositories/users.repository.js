// Repositorio de usuarios — SQL puro.
// No conoce HTTP, JWT ni reglas de negocio. Sólo lee/escribe filas.

const db = require('../db/connection')

// Devuelve la fila completa (incluye password hash) — uso interno del service de auth.
const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// Devuelve la fila SIN password — seguro para exponer al cliente.
const findById = (id) =>
  db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(id)

module.exports = { findByEmail, findById }
