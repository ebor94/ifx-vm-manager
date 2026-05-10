// RBAC del lado del servidor.
// El frontend usa v-if para ocultar UI a Clientes, pero la fuente de verdad
// es esta validación: aunque alguien construya la request a mano, sin rol
// 'Administrador' la respuesta es 403.

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Administrador') {
    return res.status(403).json({ error: 'Permisos insuficientes' })
  }
  next()
}

module.exports = requireAdmin
