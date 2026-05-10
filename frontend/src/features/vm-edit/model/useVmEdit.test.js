import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/vms.api', () => ({
  update: vi.fn()
}))

import { update } from '../api/vms.api'
import { useVmEdit } from './useVmEdit'
import { useVmStore } from '@entities/vm/model/vm.store'

const mockVm = (overrides = {}) => ({
  id: 1,
  name: 'vm-test',
  cores: 2,
  ram: 1024,
  disk: 20,
  os: 'Ubuntu 22.04',
  status: 'Apagada',
  ...overrides
})

describe('useVmEdit — snapshot + rollback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('aplica el cambio optimista antes de la response', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1, status: 'Apagada' })])

    let resolveApi
    update.mockImplementationOnce(() => new Promise((r) => { resolveApi = r }))

    const { editVm } = useVmEdit()
    const promise = editVm(1, { status: 'Encendida' })

    // Antes de la response, el cambio ya se ve en el store
    expect(store.byId(1).status).toBe('Encendida')

    // Resolvemos con la versión canónica del backend
    resolveApi(mockVm({ id: 1, status: 'Encendida', updated_at: '2026-01-01' }))
    await promise

    // Después de la response, el store tiene la versión del backend
    expect(store.byId(1).status).toBe('Encendida')
    expect(store.byId(1).updated_at).toBe('2026-01-01')
  })

  it('restaura el snapshot si la API falla', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1, status: 'Apagada', name: 'original' })])

    update.mockRejectedValueOnce(new Error('400 Bad'))

    const { editVm } = useVmEdit()
    await expect(editVm(1, { status: 'Encendida', name: 'changed' }))
      .rejects.toThrow()

    // Rollback: vuelve al snapshot exacto
    expect(store.byId(1).status).toBe('Apagada')
    expect(store.byId(1).name).toBe('original')
  })

  it('lanza error si la VM no existe en el store', async () => {
    const store = useVmStore()
    store.setVms([])
    const { editVm } = useVmEdit()
    await expect(editVm(99, { status: 'Encendida' })).rejects.toThrow(/no existe/)
  })

  it('isUpdating refleja el ciclo de vida', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 })])

    let resolveApi
    update.mockImplementationOnce(() => new Promise((r) => { resolveApi = r }))

    const { editVm, isUpdating } = useVmEdit()
    const promise = editVm(1, { status: 'Encendida' })
    expect(isUpdating.value).toBe(true)

    resolveApi(mockVm({ id: 1 }))
    await promise
    expect(isUpdating.value).toBe(false)
  })
})
