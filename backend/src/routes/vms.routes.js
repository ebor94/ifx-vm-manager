const express = require('express')
const vmsController = require('../controllers/vms.controller')
const authenticate = require('../middleware/authenticate')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

// Todas las rutas de /vms requieren sesión.
// Los Clientes pueden listar (GET) pero NO mutar (POST/PUT/DELETE).
router.use(authenticate)

router.get('/', vmsController.list)
router.post('/', requireAdmin, vmsController.create)
router.put('/:id', requireAdmin, vmsController.update)
router.delete('/:id', requireAdmin, vmsController.remove)

module.exports = router
