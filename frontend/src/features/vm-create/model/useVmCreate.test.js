import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/vms.api', () => ({
  create: vi.fn()
}))

import { create } from '../api/vms.api'
import { useVmCreate } from './useVmCreate'
import { useVmStore } from '@entities/vm/model/vm.store'

const validData = {
  name: 'vm-new',
  cores: 2,
  ram: 1024,
  disk: 20,
  os: 'Ubuntu 22.04'
}

describe('useVmCreate — Optimistic UI con temp_id y dedup con socket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('agrega fila optimista con id temp_* antes de la response', async () => {
    const store = useVmStore()
    store.setVms([])

    let resolveApi
    create.mockImplementationOnce(() => new Promise((r) => { resolveApi = r }))

    const { createVm } = useVmCreate()
    const promise = createVm(validData)

    expect(store.vms).toHaveLength(1)
    expect(String(store.vms[0].id)).toMatch(/^temp_/)
    expect(store.vms[0]._optimistic).toBe(true)
    expect(store.vms[0].name).toBe('vm-new')

    resolveApi({ ...validData, id: 42, status: 'Apagada' })
    await promise
  })

  it('reemplaza la fila temp por la real cuando la response llega primero', async () => {
    const store = useVmStore()
    store.setVms([])

    create.mockResolvedValueOnce({ ...validData, id: 42, status: 'Apagada' })

    const { createVm } = useVmCreate()
    await createVm(validData)

    expect(store.vms).toHaveLength(1)
    expect(store.vms[0].id).toBe(42)
    expect(String(store.vms[0].id)).not.toMatch(/^temp_/)
  })

  it('NO duplica si el evento vm:created del socket llega ANTES que la response', async () => {
    // Este es el bug que el fix de dedup resuelve. Simulamos el orden:
    //   1. createVm() agrega temp_X y dispara la API
    //   2. el socket "llega" mientras la API aún no respondió → upsertVm(real)
    //   3. la API resuelve → removeVm(temp_X) + upsertVm(real) → debe quedar UNA sola
    const store = useVmStore()
    store.setVms([])

    let resolveApi
    create.mockImplementationOnce(() => new Promise((r) => { resolveApi = r }))

    const { createVm } = useVmCreate()
    const promise = createVm(validData)

    // Estado tras optimistic: una fila temp_*
    expect(store.vms).toHaveLength(1)

    // Simulamos el evento socket que llega antes que la response
    store.upsertVm({ ...validData, id: 99, status: 'Apagada' })
    expect(store.vms).toHaveLength(2) // temp + real coexisten brevemente

    // Ahora resolvemos la API con la misma fila real
    resolveApi({ ...validData, id: 99, status: 'Apagada' })
    await promise

    // Debe quedar UNA sola fila — sin duplicado
    expect(store.vms).toHaveLength(1)
    expect(store.vms[0].id).toBe(99)
  })

  it('hace rollback si la API falla', async () => {
    const store = useVmStore()
    store.setVms([])

    create.mockRejectedValueOnce(new Error('409 conflict'))

    const { createVm } = useVmCreate()
    await expect(createVm(validData)).rejects.toThrow()

    expect(store.vms).toHaveLength(0)
  })
})
