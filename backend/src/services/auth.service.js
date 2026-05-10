// Service de autenticación — reglas de negocio.
// No conoce req/res ni cookies. Devuelve datos o lanza errores con .status.

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config/env')
const usersRepo = require('../repositories/users.repository')

const httpError = (status, message) =>
  Object.assign(new Error(message), { status })

// Valida email + password contra la DB. Retorna el user SIN password.
const validateCredentials = (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw httpError(400, 'email y password son requeridos')
  }
  const user = usersRepo.findByEmail(email)
  // Misma respuesta para usuario inexistente o password incorrecto:
  // evita user-enumeration por timing/respuesta.
  const passwordOk = user && bcrypt.compareSync(password, user.password)
  if (!user || !passwordOk) {
    throw httpError(401, 'Credenciales inválidas')
  }
  const { password: _omit, ...safe } = user
  return safe
}

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )

const hashPassword = (plain) => bcrypt.hashSync(plain, 10)

const getCurrentUser = (id) => {
  const user = usersRepo.findById(id)
  if (!user) throw httpError(401, 'Usuario no encontrado')
  return user
}

module.exports = { validateCredentials, generateToken, hashPassword, getCurrentUser }
