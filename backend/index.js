// Entry point del backend.
// Wiring de Express: middleware globales → rutas → manejo de errores.
// Socket.io se añade en el Paso 4.

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const config = require('./src/config/env')
const migrate = require('./src/db/migrate')
const authRoutes = require('./src/routes/auth.routes')
const errorHandler = require('./src/middleware/errorHandler')

// Garantiza el schema antes de aceptar requests.
// Idempotente — seguro de correr en cada arranque.
migrate()

const app = express()

// CORS con credentials:true es OBLIGATORIO para que el navegador
// envíe la cookie HttpOnly en requests cross-origin (frontend en :5173).
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Health probe (no requiere auth).
app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/', authRoutes)

// 404 explícito antes del errorHandler.
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use(errorHandler)

// Sólo arranca el servidor si este archivo es el entry point.
// En tests con supertest importamos `app` sin levantar el listener.
if (require.main === module) {
  app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] escuchando en http://localhost:${config.PORT} (${config.NODE_ENV})`)
  })
}

module.exports = app
