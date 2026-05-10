// Test crítico del proyecto: el rollback de Optimistic UI debe restaurar
// EXACTAMENTE el estado previo si la API falla. Esto es lo que CLAUDE.md
// detalla como ejemplo de test obligatorio del frontend.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../api/vms.api', () => ({
  remove: vi.fn()
}))

import { remove } from '../api/vms.api'
import { useVmDelete } from './useVmDelete'
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

describe('useVmDelete — Optimistic UI con rollback (test crítico)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restaura la VM si la API falla al eliminar', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1, name: 'vm-prod' })])

    // Mock de API que falla
    remove.mockRejectedValueOnce(new Error('Server error'))

    const { deleteVm } = useVmDelete()

    // Iniciamos la eliminación (no esperamos el resultado aún)
    const promise = deleteVm(1, 'vm-prod')

    // ANTES de que la API responda, la VM ya está eliminada (optimistic)
    expect(store.vms).toHaveLength(0)

    // Esperamos que la promesa rechace
    await expect(promise).rejects.toThrow()

    // DESPUÉS del fallo, la VM debe estar restaurada
    expect(store.vms).toHaveLength(1)
    expect(store.vms[0].id).toBe(1)
    expect(store.vms[0].name).toBe('vm-prod')
  })

  it('elimina exitosamente cuando la API responde OK', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 }), mockVm({ id: 2, name: 'other' })])

    remove.mockResolvedValueOnce({ status: 204 })

    const { deleteVm } = useVmDelete()
    await deleteVm(1, 'vm-test')

    expect(store.vms).toHaveLength(1)
    expect(store.vms[0].id).toBe(2)
  })

  it('restaura todas las VMs (no sólo la eliminada) en caso de fallo', async () => {
    // Verifica que el snapshot incluye la lista entera, no sólo la fila.
    const store = useVmStore()
    const vms = [
      mockVm({ id: 1, name: 'a' }),
      mockVm({ id: 2, name: 'b' }),
      mockVm({ id: 3, name: 'c' })
    ]
    store.setVms(vms)

    remove.mockRejectedValueOnce(new Error('boom'))

    const { deleteVm } = useVmDelete()
    await expect(deleteVm(2, 'b')).rejects.toThrow()

    expect(store.vms).toHaveLength(3)
    expect(store.vms.map(v => v.id)).toEqual([1, 2, 3])
  })

  it('isDeleting refleja el ciclo de vida de la operación', async () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 })])

    let resolveApi
    remove.mockImplementationOnce(() => new Promise((r) => { resolveApi = r }))

    const { deleteVm, isDeleting } = useVmDelete()

    expect(isDeleting.value).toBe(false)
    const promise = deleteVm(1, 'vm-test')
    expect(isDeleting.value).toBe(true)

    resolveApi({ status: 204 })
    await promise
    expect(isDeleting.value).toBe(false)
  })
})
