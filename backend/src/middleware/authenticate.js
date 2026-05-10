// Lee el JWT EXCLUSIVAMENTE de req.cookies.token (HttpOnly).
// NUNCA de req.headers.authorization — eso anularía la protección anti-XSS.

const jwt = require('jsonwebtoken')
const config = require('../config/env')

const authenticate = (req, res, next) => {
  const token = req.cookies && req.cookies.token
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  try {
    req.user = jwt.verify(token, config.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = authenticate
