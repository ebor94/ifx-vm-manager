// Controller de autenticación — sólo orquesta:
//   1. Extrae datos de req
//   2. Llama al service
//   3. Setea cookie / envía respuesta
// Sin lógica de negocio, sin SQL.

const authService = require('../services/auth.service')
const config = require('../config/env')

const COOKIE_NAME = 'token'

// IMPORTANTE: el JWT viaja SOLO en esta cookie HttpOnly.
// httpOnly:  inaccesible desde JS del navegador → mitiga XSS
// secure:    sólo HTTPS en producción
// sameSite:  bloquea envío cross-site → mitiga CSRF
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000 // 8h, alineado con JWT_EXPIRES_IN por defecto
}

const login = (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    const user = authService.validateCredentials(email, password)
    const token = authService.generateToken(user)

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
    // El body NUNCA contiene el token — sólo el usuario.
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined })
  res.status(204).end()
}

const me = (req, res, next) => {
  try {
    const user = authService.getCurrentUser(req.user.id)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

module.exports = { login, logout, me }
