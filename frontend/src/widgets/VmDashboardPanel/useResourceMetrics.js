// Métricas computadas a partir del store de VMs.
// Composable puro: recibe la fuente como ref/computed y devuelve agregaciones.

import { computed } from 'vue'

export function useResourceMetrics(vmsRef) {
  const total = computed(() => vmsRef.value.length)

  const byStatus = computed(() => {
    const counts = { Encendida: 0, Apagada: 0, Suspendida: 0 }
    for (const vm of vmsRef.value) {
      if (counts[vm.status] !== undefined) counts[vm.status] += 1
    }
    return counts
  })

  const byOs = computed(() => {
    const counts = {}
    for (const vm of vmsRef.value) {
      counts[vm.os] = (counts[vm.os] ?? 0) + 1
    }
    return counts
  })

  const totals = computed(() => {
    const sum = (key) => vmsRef.value.reduce((acc, vm) => acc + (vm[key] ?? 0), 0)
    return {
      cores: sum('cores'),
      ramMb: sum('ram'),
      diskGb: sum('disk')
    }
  })

  return { total, byStatus, byOs, totals }
}
