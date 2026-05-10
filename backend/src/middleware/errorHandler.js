// Manejo centralizado de errores.
// Express identifica este middleware por su firma de 4 argumentos.
// Los services lanzan errores con .status (vía httpError); aquí los traducimos a HTTP.
// Errores sin .status se consideran 500 y se loguean — nunca se filtra el stack al cliente.

const errorHandler = (err, _req, res, _next) => {
  const status = err && err.status ? err.status : 500
  const message = err && err.status ? err.message : 'Error interno del servidor'

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err)
  }

  res.status(status).json({ error: message })
}

module.exports = errorHandler
