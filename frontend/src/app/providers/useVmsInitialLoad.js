// Carga inicial de VMs cuando el usuario está autenticado.
// Watch sobre auth.isAuthenticated: al loggearse, GET /vms; al desloggearse,
// limpia el store. Después de la carga inicial el realtime mantiene el estado
// fresco — no hace falta re-fetchear al navegar entre páginas.

import { watch } from 'vue'
import { http } from '@shared/api/http.client'
import { useAuthStore } from '@features/auth/model/auth.store'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useToast } from '@shared/lib/useToast'

export function useVmsInitialLoad() {
  const authStore = useAuthStore()
  const vmStore = useVmStore()
  const toast = useToast()

  async function load() {
    vmStore.setLoading(true)
    try {
      const { data } = await http.get('/vms')
      vmStore.setVms(data.vms)
    } catch (err) {
      // 401 → router guard redirige a /login. Cualquier otro error lo
      // mostramos: mejor un toast claro que una pantalla en blanco.
      const status = err.response?.status
      if (status && status !== 401) {
        toast.error('No se pudo cargar el listado de VMs')
      }
    } finally {
      vmStore.setLoading(false)
    }
  }

  watch(
    () => authStore.isAuthenticated,
    (yes) => {
      if (yes) load()
      else vmStore.setVms([])
    },
    { immediate: true }
  )
}
