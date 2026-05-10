// Filtros del listado de VMs: búsqueda case-insensitive sobre name/os y
// filtro por status. Toma una función getter para evitar acoplar el composable
// a un store específico (testeable con un array plano).

import { ref, computed } from 'vue'

export function useVmFilters(getVms) {
  const search = ref('')
  const statusFilter = ref('')

  const filtered = computed(() => {
    const all = getVms() ?? []
    const q = search.value.trim().toLowerCase()
    return all.filter((vm) => {
      if (statusFilter.value && vm.status !== statusFilter.value) return false
      if (q) {
        const haystack = `${vm.name} ${vm.os}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  })

  return { search, statusFilter, filtered }
}
