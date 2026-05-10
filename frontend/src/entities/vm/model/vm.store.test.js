import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVmStore } from './vm.store'

const mockVm = (overrides = {}) => ({
  id: 1,
  name: 'vm-test',
  cores: 2,
  ram: 1024,
  disk: 20,
  os: 'Ubuntu 22.04',
  status: 'Apagada',
  created_at: '2026-05-10 10:00:00',
  updated_at: '2026-05-10 10:00:00',
  ...overrides
})

describe('vm.store — métodos síncronos (regla no-negociable)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('setVms reemplaza el arreglo entero', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 }), mockVm({ id: 2 })])
    expect(store.count).toBe(2)
    store.setVms([mockVm({ id: 99 })])
    expect(store.count).toBe(1)
    expect(store.vms[0].id).toBe(99)
  })

  it('setVms con null/undefined deja la lista vacía', () => {
    const store = useVmStore()
    store.setVms(null)
    expect(store.vms).toEqual([])
    store.setVms(undefined)
    expect(store.vms).toEqual([])
  })

  it('addVm agrega al final', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 })])
    store.addVm(mockVm({ id: 2 }))
    expect(store.count).toBe(2)
    expect(store.vms[1].id).toBe(2)
  })

  it('replaceVm reemplaza por id sin alterar otros', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1, name: 'a' }), mockVm({ id: 2, name: 'b' })])
    store.replaceVm(1, mockVm({ id: 1, name: 'a-new' }))
    expect(store.vms[0].name).toBe('a-new')
    expect(store.vms[1].name).toBe('b')
  })

  it('replaceVm no hace nada si el id no existe', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 })])
    store.replaceVm(999, mockVm({ id: 999, name: 'ghost' }))
    expect(store.count).toBe(1)
    expect(store.vms[0].name).toBe('vm-test')
  })

  it('upsertVm agrega si no existe', () => {
    const store = useVmStore()
    store.upsertVm(mockVm({ id: 7 }))
    expect(store.count).toBe(1)
    expect(store.vms[0].id).toBe(7)
  })

  it('upsertVm reemplaza si ya existe (dedup)', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 7, name: 'old' })])
    store.upsertVm(mockVm({ id: 7, name: 'new' }))
    expect(store.count).toBe(1)
    expect(store.vms[0].name).toBe('new')
  })

  it('removeVm filtra por id', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 1 }), mockVm({ id: 2 })])
    store.removeVm(1)
    expect(store.count).toBe(1)
    expect(store.vms[0].id).toBe(2)
  })

  it('byId getter retorna la VM o undefined', () => {
    const store = useVmStore()
    store.setVms([mockVm({ id: 5 })])
    expect(store.byId(5).id).toBe(5)
    expect(store.byId(999)).toBeUndefined()
  })

  it('setLoading coerciona a booleano', () => {
    const store = useVmStore()
    store.setLoading(1)
    expect(store.isLoading).toBe(true)
    store.setLoading(0)
    expect(store.isLoading).toBe(false)
  })
})
