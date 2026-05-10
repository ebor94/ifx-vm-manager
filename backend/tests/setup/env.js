// Variables de entorno para el entorno de tests.
// Jest las setea ANTES de cargar cualquier módulo (vía setupFiles en jest.config.js).
// `config/env.js` valida estas variables al ser requerido.

process.env.NODE_ENV = 'test'
process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test_secret_minimo_32_caracteres_xxx_yyyyyy'
process.env.JWT_EXPIRES_IN = '1h'
process.env.CORS_ORIGIN = 'http://localhost:5173'
// Cualquier puerto válido — los tests usan supertest contra `app` directamente,
// no levantan listener real, así que este valor no se usa.
process.env.PORT = '3001'
