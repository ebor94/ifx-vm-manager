// Controller de VMs — orquesta service + socket emit. Sin SQL, sin reglas de negocio.

const vmsService = require('../services/vms.service')
const { emitVmEvent } = require('../socket/vm.socket')

const parseId = (raw) => {
  const id = Number.parseInt(raw, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

const list = (_req, res, next) => {
  try {
    res.json({ vms: vmsService.list() })
  } catch (err) {
    next(err)
  }
}

const create = (req, res, next) => {
  try {
    const vm = vmsService.create(req.body)
    emitVmEvent(req.app.get('io'), 'vm:created', vm)
    res.status(201).json({ vm })
  } catch (err) {
    next(err)
  }
}

const update = (req, res, next) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ error: 'id inválido' })
    const vm = vmsService.update(id, req.body)
    emitVmEvent(req.app.get('io'), 'vm:updated', vm)
    res.json({ vm })
  } catch (err) {
    next(err)
  }
}

const remove = (req, res, next) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ error: 'id inválido' })
    vmsService.remove(id)
    emitVmEvent(req.app.get('io'), 'vm:deleted', { id })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }
