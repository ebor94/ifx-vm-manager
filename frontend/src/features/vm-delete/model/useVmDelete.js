// Optimistic UI para ELIMINAR una VM.
// El snapshot se hace sobre la lista entera (no sólo la fila eliminada),
// porque restaurar la posición original es más simple así. La diferencia
// vs un snapshot fila-única sólo importa si tenemos sort estable, que aquí
// no aplica — pero el patrón es correcto y robusto.

import { ref } from 'vue'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useToast } from '@shared/lib/useToast'
import { remove } from '../api/vms.api'

export function useVmDelete() {
  const store = useVmStore()
  const toast = useToast()
  const isDeleting = ref(false)

  async function deleteVm(id, displayName) {
    const snapshot = [...store.vms]
    store.removeVm(id)            // 1. optimistic — la VM desaparece de la UI
    isDeleting.value = true
    try {
      await remove(id)            // 2. persistir en el servidor
      toast.success(`VM "${displayName ?? id}" eliminada`)
    } catch (err) {
      store.setVms(snapshot)      // 3. rollback total — la VM reaparece
      const msg = err.response?.data?.error || 'No se pudo eliminar la VM'
      toast.error(`${msg}. Cambio revertido.`)
      throw err
    } finally {
      isDeleting.value = false
    }
  }

  return { deleteVm, isDeleting }
}
