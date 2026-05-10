import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useVmFilters } from './useVmFilters'

const vms = [
  { id: 1, name: 'vm-prod-web',  os: 'Ubuntu 22.04',          status: 'Encendida' },
  { id: 2, name: 'vm-prod-db',   os: 'Debian 11',             status: 'Encendida' },
  { id: 3, name: 'vm-staging',   os: 'Ubuntu 22.04',          status: 'Apagada' },
  { id: 4, name: 'vm-test-iis',  os: 'Windows Server 2022',   status: 'Suspendida' }
]

describe('useVmFilters', () => {
  it('sin filtros retorna toda la lista', () => {
    const source = ref(vms)
    const { filtered } = useVmFilters(() => source.value)
    expect(filtered.value).toHaveLength(4)
  })

  it('filtra por status exactamente', () => {
    const source = ref(vms)
    const { statusFilter, filtered } = useVmFilters(() => source.value)
    statusFilter.value = 'Encendida'
    expect(filtered.value).toHaveLength(2)
    expect(filtered.value.every(v => v.status === 'Encendida')).toBe(true)
  })

  it('busca case-insensitive sobre name y os', () => {
    const source = ref(vms)
    const { search, filtered } = useVmFilters(() => source.value)
    search.value = 'WINDOWS'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0].id).toBe(4)
  })

  it('combina search + statusFilter (intersección)', () => {
    const source = ref(vms)
    const { search, statusFilter, filtered } = useVmFilters(() => source.value)
    search.value = 'ubuntu'
    statusFilter.value = 'Apagada'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0].id).toBe(3)
  })

  it('lista vacía si nada matchea', () => {
    const source = ref(vms)
    const { search, filtered } = useVmFilters(() => source.value)
    search.value = 'no-existe'
    expect(filtered.value).toEqual([])
  })

  it('reactivo al cambio del getter (updateVms)', () => {
    const source = ref(vms)
    const { filtered } = useVmFilters(() => source.value)
    expect(filtered.value).toHaveLength(4)
    source.value = [vms[0]]
    expect(filtered.value).toHaveLength(1)
  })
})
