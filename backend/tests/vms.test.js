const request = require('supertest')
const { app } = require('../index')
const { resetDb, loginAs } = require('./setup/db.setup')

const validVm = {
  name: 'vm-test',
  cores: 2,
  ram: 2048,
  disk: 50,
  os: 'Ubuntu 22.04'
}

let adminCookie, clienteCookie

beforeEach(async () => {
  resetDb()
  adminCookie = await loginAs(app, 'admin')
  clienteCookie = await loginAs(app, 'cliente')
})

describe('GET /vms', () => {
  it('retorna 401 sin cookie', async () => {
    const res = await request(app).get('/vms')
    expect(res.status).toBe(401)
  })

  it('Cliente puede listar (lectura pública para autenticados)', async () => {
    const res = await request(app).get('/vms').set('Cookie', clienteCookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ vms: [] })
  })

  it('Admin puede listar', async () => {
    const res = await request(app).get('/vms').set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.vms)).toBe(true)
  })
})

describe('POST /vms', () => {
  it('Cliente recibe 403 al intentar crear', async () => {
    const res = await request(app).post('/vms').set('Cookie', clienteCookie).send(validVm)
    expect(res.status).toBe(403)
  })

  it('Admin crea VM con status Apagada por default', async () => {
    const res = await request(app).post('/vms').set('Cookie', adminCookie).send(validVm)
    expect(res.status).toBe(201)
    expect(res.body.vm).toMatchObject({
      name: 'vm-test',
      cores: 2,
      ram: 2048,
      disk: 50,
      os: 'Ubuntu 22.04',
      status: 'Apagada'
    })
    expect(res.body.vm.id).toBeGreaterThan(0)
  })

  it('rechaza cores fuera de rango con 400', async () => {
    const res = await request(app)
      .post('/vms').set('Cookie', adminCookie)
      .send({ ...validVm, cores: 100 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/cores/i)
  })

  it('rechaza OS inválido con 400', async () => {
    const res = await request(app)
      .post('/vms').set('Cookie', adminCookie)
      .send({ ...validVm, os: 'Linux 9000' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/os/i)
  })

  it('rechaza ram < 512 con 400', async () => {
    const res = await request(app)
      .post('/vms').set('Cookie', adminCookie)
      .send({ ...validVm, ram: 256 })
    expect(res.status).toBe(400)
  })

  it('retorna 409 al crear VM con name duplicado', async () => {
    await request(app).post('/vms').set('Cookie', adminCookie).send(validVm)
    const res = await request(app).post('/vms').set('Cookie', adminCookie).send(validVm)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/ya existe/i)
  })
})

describe('PUT /vms/:id', () => {
  let vmId

  beforeEach(async () => {
    const res = await request(app).post('/vms').set('Cookie', adminCookie).send(validVm)
    vmId = res.body.vm.id
  })

  it('Cliente recibe 403', async () => {
    const res = await request(app)
      .put(`/vms/${vmId}`).set('Cookie', clienteCookie)
      .send({ status: 'Encendida' })
    expect(res.status).toBe(403)
  })

  it('Admin puede actualizar parcialmente sólo status', async () => {
    const res = await request(app)
      .put(`/vms/${vmId}`).set('Cookie', adminCookie)
      .send({ status: 'Encendida' })
    expect(res.status).toBe(200)
    expect(res.body.vm.status).toBe('Encendida')
    // El resto de campos NO cambió:
    expect(res.body.vm.name).toBe(validVm.name)
    expect(res.body.vm.cores).toBe(validVm.cores)
  })

  it('retorna 404 si la VM no existe', async () => {
    const res = await request(app)
      .put('/vms/99999').set('Cookie', adminCookie)
      .send({ status: 'Apagada' })
    expect(res.status).toBe(404)
  })

  it('retorna 400 con id no numérico', async () => {
    const res = await request(app)
      .put('/vms/abc').set('Cookie', adminCookie)
      .send({ status: 'Apagada' })
    expect(res.status).toBe(400)
  })

  it('retorna 409 al renombrar a un name ya existente', async () => {
    await request(app).post('/vms').set('Cookie', adminCookie)
      .send({ ...validVm, name: 'vm-other' })
    const res = await request(app)
      .put(`/vms/${vmId}`).set('Cookie', adminCookie)
      .send({ name: 'vm-other' })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /vms/:id', () => {
  let vmId

  beforeEach(async () => {
    const res = await request(app).post('/vms').set('Cookie', adminCookie).send(validVm)
    vmId = res.body.vm.id
  })

  it('Cliente recibe 403', async () => {
    const res = await request(app).delete(`/vms/${vmId}`).set('Cookie', clienteCookie)
    expect(res.status).toBe(403)
  })

  it('Admin elimina la VM y devuelve 204', async () => {
    const res = await request(app).delete(`/vms/${vmId}`).set('Cookie', adminCookie)
    expect(res.status).toBe(204)
    const list = await request(app).get('/vms').set('Cookie', adminCookie)
    expect(list.body.vms).toHaveLength(0)
  })

  it('retorna 404 si la VM no existe', async () => {
    const res = await request(app).delete('/vms/99999').set('Cookie', adminCookie)
    expect(res.status).toBe(404)
  })
})
