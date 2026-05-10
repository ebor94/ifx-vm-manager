// Optimistic UI para CREAR una VM.
// Patrón clave del Paso 9: temp_id local → request al servidor → reemplazo
// con la fila real (que ya tiene id, created_at, updated_at del backend).
// Si la request falla, removemos la fila optimista y avisamos al usuario.

import { ref } from 'vue'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useToast } from '@shared/lib/useToast'
import { create } from '../api/vms.api'

let tempCounter = 1

export function useVmCreate() {
  const store = useVmStore()
  const toast = useToast()
  const isCreating = ref(false)

  async function createVm(data) {
    const tempId = `temp_${tempCounter++}`
    const now = new Date().toISOString()
    const optimistic = {
      id: tempId,
      status: 'Apagada',
      created_at: now,
      updated_at: now,
      ...data,
      _optimistic: true
    }

    // 1. Mostrar inmediatamente — el usuario ve la VM antes de que el servidor responda.
    store.addVm(optimistic)
    isCreating.value = true

    try {
      // 2. Persistir en el servidor.
      const real = await create(data)
      // 3. Reemplazar la fila temp por la real (ya con id numérico, timestamps reales).
      store.replaceVm(tempId, real)
      toast.success(`VM "${real.name}" creada`)
      return real
    } catch (err) {
      // 4. Rollback: removemos la fila optimista y notificamos.
      store.removeVm(tempId)
      const msg = err.response?.data?.error || 'No se pudo crear la VM'
      toast.error(`${msg}. Cambio revertido.`)
      throw err
    } finally {
      isCreating.value = false
    }
  }

  return { createVm, isCreating }
}
