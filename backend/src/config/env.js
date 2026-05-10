// Validación de variables de entorno al arrancar.
// Si una variable crítica falta o es inválida, el proceso termina ANTES
// de aceptar requests — evita estados degradados en runtime.

const path = require('node:path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function required(name) {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`[config/env] Variable de entorno requerida: ${name}`)
  }
  return value
}

function withDefault(name, fallback) {
  const value = process.env[name]
  return value === undefined || value === '' ? fallback : value
}

const NODE_ENV = withDefault('NODE_ENV', 'development')
const PORT = Number.parseInt(withDefault('PORT', '3000'), 10)

const JWT_SECRET = required('JWT_SECRET')
if (JWT_SECRET.length < 32) {
  throw new Error('[config/env] JWT_SECRET debe tener al menos 32 caracteres')
}

const JWT_EXPIRES_IN = withDefault('JWT_EXPIRES_IN', '8h')
const CORS_ORIGIN = withDefault('CORS_ORIGIN', 'http://localhost:5173')

// `:memory:` es un literal que better-sqlite3 entiende como DB en RAM
// (lo usamos en tests). No debe pasar por path.resolve.
const RAW_DB_PATH = withDefault('DB_PATH', './data/database.sqlite')
const DB_PATH =
  RAW_DB_PATH === ':memory:'
    ? ':memory:'
    : path.resolve(__dirname, '../../', RAW_DB_PATH)

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`[config/env] PORT inválido: ${process.env.PORT}`)
}

const config = Object.freeze({
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  DB_PATH,
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test'
})

module.exports = config
