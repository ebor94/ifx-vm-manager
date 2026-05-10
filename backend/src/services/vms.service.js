// Service de VMs — reglas de negocio y validación.
// Las validaciones aquí duplican intencionalmente los CHECK de schema.sql:
// es defensa en profundidad. Si alguien bypaseara el service, la DB sigue
// rechazando, pero el service da mejores mensajes de error 400.

const vmsRepo = require('../repositories/vms.repository')

const VALID_OS = ['Ubuntu 22.04', 'Windows Server 2022', 'CentOS 8', 'Debian 11']
const VALID_STATUS = ['Encendida', 'Apagada', 'Suspendida']

const httpError = (status, message) =>
  Object.assign(new Error(message), { status })

// Valida y normaliza el payload.
// `partial: true` (UPDATE) sólo valida los campos presentes; `partial: false` (CREATE)
// exige todos los obligatorios.
function validateVmData(data, { partial = false } = {}) {
  if (!data || typeof data !== 'object') {
    throw httpError(400, 'Body inválido')
  }
  const fields = {}

  if (!partial || data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw httpError(400, 'name es requerido y no puede estar vacío')
    }
    fields.name = data.name.trim()
  }
  if (!partial || data.cores !== undefined) {
    if (!Number.isInteger(data.cores) || data.cores < 1 || data.cores > 64) {
      throw httpError(400, 'cores debe ser un entero entre 1 y 64')
    }
    fields.cores = data.cores
  }
  if (!partial || data.ram !== undefined) {
    if (!Number.isInteger(data.ram) || data.ram < 512) {
      throw httpError(400, 'ram debe ser un entero >= 512 (MB)')
    }
    fields.ram = data.ram
  }
  if (!partial || data.disk !== undefined) {
    if (!Number.isInteger(data.disk) || data.disk < 10) {
      throw httpError(400, 'disk debe ser un entero >= 10 (GB)')
    }
    fields.disk = data.disk
  }
  if (!partial || data.os !== undefined) {
    if (!VALID_OS.includes(data.os)) {
      throw httpError(400, `os debe ser uno de: ${VALID_OS.join(', ')}`)
    }
    fields.os = data.os
  }
  // status es opcional en CREATE (default 'Apagada' en DB).
  if (data.status !== undefined) {
    if (!VALID_STATUS.includes(data.status)) {
      throw httpError(400, `status debe ser uno de: ${VALID_STATUS.join(', ')}`)
    }
    fields.status = data.status
  }
  return fields
}

const isUniqueViolation = (err) =>
  err && err.code === 'SQLITE_CONSTRAINT_UNIQUE'

const list = () => vmsRepo.findAll()

const create = (data) => {
  const validated = validateVmData(data, { partial: false })
  try {
    return vmsRepo.create(validated)
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, `Ya existe una VM con nombre '${validated.name}'`)
    }
    throw err
  }
}

const update = (id, data) => {
  const validated = validateVmData(data, { partial: true })
  if (Object.keys(validated).length === 0) {
    throw httpError(400, 'No hay campos a actualizar')
  }
  let updated
  try {
    updated = vmsRepo.update(id, validated)
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, `Ya existe una VM con nombre '${validated.name}'`)
    }
    throw err
  }
  if (!updated) throw httpError(404, 'VM no encontrada')
  return updated
}

const remove = (id) => {
  const ok = vmsRepo.remove(id)
  if (!ok) throw httpError(404, 'VM no encontrada')
}

module.exports = {
  VALID_OS,
  VALID_STATUS,
  list,
  create,
  update,
  remove
}
