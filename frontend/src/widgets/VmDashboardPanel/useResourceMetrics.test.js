import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useResourceMetrics } from './useResourceMetrics'

const sample = [
  { id: 1, status: 'Encendida',  os: 'Ubuntu 22.04', cores: 4, ram: 4096, disk: 100 },
  { id: 2, status: 'Encendida',  os: 'Debian 11',    cores: 2, ram: 2048, disk: 50  },
  { id: 3, status: 'Apagada',    os: 'Ubuntu 22.04', cores: 8, ram: 8192, disk: 200 },
  { id: 4, status: 'Suspendida', os: 'CentOS 8',     cores: 1, ram: 1024, disk: 20  }
]

describe('useResourceMetrics', () => {
  it('total cuenta todas las VMs', () => {
    const { total } = useResourceMetrics(ref(sample))
    expect(total.value).toBe(4)
  })

  it('byStatus mantiene siempre las 3 keys (incluye 0 para faltantes)', () => {
    const { byStatus } = useResourceMetrics(ref([
      { status: 'Encendida' },
      { status: 'Encendida' }
    ]))
    expect(byStatus.value).toEqual({ Encendida: 2, Apagada: 0, Suspendida: 0 })
  })

  it('byStatus suma correctamente', () => {
    const { byStatus } = useResourceMetrics(ref(sample))
    expect(byStatus.value).toEqual({ Encendida: 2, Apagada: 1, Suspendida: 1 })
  })

  it('byOs agrupa dinámicamente por OS presentes', () => {
    const { byOs } = useResourceMetrics(ref(sample))
    expect(byOs.value).toEqual({
      'Ubuntu 22.04': 2,
      'Debian 11': 1,
      'CentOS 8': 1
    })
  })

  it('totals suma cores, ramMb y diskGb', () => {
    const { totals } = useResourceMetrics(ref(sample))
    expect(totals.value.cores).toBe(15)
    expect(totals.value.ramMb).toBe(15360)
    expect(totals.value.diskGb).toBe(370)
  })

  it('todo en cero para lista vacía', () => {
    const { total, totals, byOs, byStatus } = useResourceMetrics(ref([]))
    expect(total.value).toBe(0)
    expect(totals.value).toEqual({ cores: 0, ramMb: 0, diskGb: 0 })
    expect(byOs.value).toEqual({})
    expect(byStatus.value).toEqual({ Encendida: 0, Apagada: 0, Suspendida: 0 })
  })

  it('reactivo al cambio del ref', () => {
    const source = ref(sample)
    const { total } = useResourceMetrics(source)
    expect(total.value).toBe(4)
    source.value = [sample[0]]
    expect(total.value).toBe(1)
  })
})
