// Optimistic UI para EDITAR una VM.
// Patrón: snapshot de la fila actual → mutación local → request → si falla,
// restauramos el snapshot. Si la request es exitosa, reemplazamos con la
// versión del backend (que tiene updated_at fresco vía trigger SQL).

import { ref } from 'vue'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useToast } from '@shared/lib/useToast'
import { update } from '../api/vms.api'

export function useVmEdit() {
  const store = useVmStore()
  const toast = useToast()
  const isUpdating = ref(false)

  async function editVm(id, fields) {
    const current = store.byId(id)
    if (!current) {
      throw new Error(`VM ${id} no existe en el store`)
    }
    // Snapshot DEEP — Object.assign crea referencias compartidas para nested,
    // pero los campos de la VM son escalares así que un spread basta.
    const snapshot = { ...current }

    // 1. Aplicar el cambio local INMEDIATAMENTE.
    store.replaceVm(id, { ...current, ...fields })
    isUpdating.value = true

    try {
      // 2. Persistir en el servidor.
      const real = await update(id, fields)
      // 3. Reemplazar con la versión canónica (incluye updated_at del trigger).
      store.replaceVm(id, real)
      toast.success(`VM "${real.name}" actualizada`)
      return real
    } catch (err) {
      // 4. Rollback al snapshot exacto.
      store.replaceVm(id, snapshot)
      const msg = err.response?.data?.error || 'No se pudo actualizar la VM'
      toast.error(`${msg}. Cambio revertido.`)
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  return { editVm, isUpdating }
}
