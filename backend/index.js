// Entry point del backend.
// Wiring: Express + Socket.io comparten el mismo http.Server.

const http = require('node:http')
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { Server: SocketIOServer } = require('socket.io')

const config = require('./src/config/env')
const migrate = require('./src/db/migrate')
const authRoutes = require('./src/routes/auth.routes')
const vmsRoutes = require('./src/routes/vms.routes')
const errorHandler = require('./src/middleware/errorHandler')
const { registerSocketHandlers } = require('./src/socket/vm.socket')

// Garantiza el schema antes de aceptar requests. Idempotente.
migrate()

const app = express()

// CORS con credentials:true es OBLIGATORIO para que el navegador envíe la
// cookie HttpOnly en requests cross-origin (frontend en :5173).
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/', authRoutes)
app.use('/vms', vmsRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use(errorHandler)

// HTTP server compartido por Express y Socket.io (no app.listen).
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: config.CORS_ORIGIN, credentials: true }
})

// Inyectamos `io` en la app para que los controllers la obtengan vía
// req.app.get('io') sin importar el módulo socket directamente.
// Esto deja la capa controller libre de dependencias de Socket.io en tests.
app.set('io', io)
registerSocketHandlers(io)

// Sólo arranca el listener si este archivo es el entry point.
// Tests con supertest importan { app } sin levantar puertos reales.
if (require.main === module) {
  server.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] http+ws en http://localhost:${config.PORT} (${config.NODE_ENV})`)
  })
}

module.exports = { app, server, io }
