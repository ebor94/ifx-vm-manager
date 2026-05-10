const request = require('supertest')
const jwt = require('jsonwebtoken')
const { app } = require('../index')
const config = require('../src/config/env')
const requireAdmin = require('../src/middleware/requireAdmin')
const { resetDb } = require('./setup/db.setup')

beforeEach(() => resetDb())

describe('authenticate middleware', () => {
  it('ignora Authorization header — sólo lee req.cookies.token', async () => {
    // Construimos un JWT VÁLIDO firmado con el secret correcto, pero lo
    // enviamos en el header Authorization (NO en cookie). Debe rechazar.
    const validToken = jwt.sign(
      { id: 1, email: 'admin@ifx.com', role: 'Administrador' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${validToken}`)

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'No autenticado' })
  })

  it('rechaza un token firmado con otro secret', async () => {
    const fakeToken = jwt.sign({ id: 1 }, 'otro-secreto-distinto-cualquiera-32xxx', {
      expiresIn: '1h'
    })
    const res = await request(app).get('/me').set('Cookie', `token=${fakeToken}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/inválido|expirado/i)
  })

  it('rechaza un token expirado', async () => {
    const expiredToken = jwt.sign({ id: 1 }, config.JWT_SECRET, { expiresIn: '-1s' })
    const res = await request(app).get('/me').set('Cookie', `token=${expiredToken}`)
    expect(res.status).toBe(401)
  })
})

describe('requireAdmin middleware (unit)', () => {
  // Probamos el middleware aislado sin levantar Express, así garantizamos
  // que la lógica de RBAC no dependa del wiring HTTP.
  const buildRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  })

  it('llama next() si req.user.role es Administrador', () => {
    const next = jest.fn()
    const res = buildRes()
    requireAdmin({ user: { role: 'Administrador' } }, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('retorna 403 si req.user.role es Cliente', () => {
    const next = jest.fn()
    const res = buildRes()
    requireAdmin({ user: { role: 'Cliente' } }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Permisos insuficientes' })
  })

  it('retorna 403 si req.user no existe', () => {
    const next = jest.fn()
    const res = buildRes()
    requireAdmin({}, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
