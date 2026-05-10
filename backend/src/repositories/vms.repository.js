// Repositorio de VMs — SQL puro.
// Sin validaciones de dominio (eso vive en services), sin conocimiento de HTTP.

const db = require('../db/connection')

const COLUMNS = 'id, name, cores, ram, disk, os, status, created_at, updated_at'

const findAll = () =>
  db.prepare(`SELECT ${COLUMNS} FROM vms ORDER BY created_at DESC`).all()

const findById = (id) =>
  db.prepare(`SELECT ${COLUMNS} FROM vms WHERE id = ?`).get(id)

const create = ({ name, cores, ram, disk, os, status = 'Apagada' }) => {
  const stmt = db.prepare(`
    INSERT INTO vms (name, cores, ram, disk, os, status)
    VALUES (@name, @cores, @ram, @disk, @os, @status)
  `)
  const info = stmt.run({ name, cores, ram, disk, os, status })
  return findById(info.lastInsertRowid)
}

// `fields` debe estar pre-validado por el service.
// Whitelist explícita evita inyección al construir SET dinámico.
const ALLOWED_UPDATE_FIELDS = ['name', 'cores', 'ram', 'disk', 'os', 'status']

const update = (id, fields) => {
  const sets = []
  const params = { id }
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = @${key}`)
      params[key] = fields[key]
    }
  }
  if (sets.length === 0) return findById(id)

  const info = db
    .prepare(`UPDATE vms SET ${sets.join(', ')} WHERE id = @id`)
    .run(params)

  return info.changes === 0 ? null : findById(id)
}

const remove = (id) => {
  const info = db.prepare('DELETE FROM vms WHERE id = ?').run(id)
  return info.changes > 0
}

module.exports = { findAll, findById, create, update, remove }
