const request = require('supertest')
const { app } = require('../index')
const { resetDb, loginAs } = require('./setup/db.setup')

beforeEach(() => resetDb())

describe('POST /login', () => {
  // ⭐ EL TEST MÁS IMPORTANTE DEL PROYECTO
  it('la cookie debe tener el flag HttpOnly y el body NO debe contener el token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'admin@ifx.com', password: 'Admin123!' })

    expect(res.status).toBe(200)

    const setCookieHeader = res.headers['set-cookie']
    expect(setCookieHeader).toBeDefined()
    expect(setCookieHeader[0]).toMatch(/HttpOnly/i)
    expect(setCookieHeader[0]).toMatch(/SameSite=Strict/i)

    expect(res.body).not.toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('retorna el user sin password con credenciales válidas (admin)', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'admin@ifx.com', password: 'Admin123!' })

    expect(res.body.user).toMatchObject({
      email: 'admin@ifx.com',
      role: 'Administrador'
    })
  })

  it('retorna 401 con password incorrecto', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'admin@ifx.com', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Credenciales inválidas' })
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('retorna el MISMO mensaje 401 con email inexistente (anti user-enumeration)', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'nadie@x.com', password: 'cualquiera' })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Credenciales inválidas' })
  })

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/login').send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /logout', () => {
  it('limpia la cookie con Expires en el pasado', async () => {
    const res = await request(app).post('/logout')
    expect(res.status).toBe(204)
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/)
    expect(res.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/)
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i)
  })
})

describe('GET /me', () => {
  it('retorna 401 sin cookie', async () => {
    const res = await request(app).get('/me')
    expect(res.status).toBe(401)
  })

  it('retorna 401 con cookie de token malformado', async () => {
    const res = await request(app).get('/me').set('Cookie', 'token=not-a-valid-jwt')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Token inválido o expirado' })
  })

  it('retorna el user actual con cookie válida (admin)', async () => {
    const cookie = await loginAs(app, 'admin')
    const res = await request(app).get('/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({
      email: 'admin@ifx.com',
      role: 'Administrador'
    })
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('retorna el user actual con cookie válida (cliente)', async () => {
    const cookie = await loginAs(app, 'cliente')
    const res = await request(app).get('/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('Cliente')
  })
})
