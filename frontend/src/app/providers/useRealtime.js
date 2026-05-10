// Suscripción global a los eventos socket emitidos por el backend.
// Mantiene el store de VMs sincronizado con cualquier mutación hecha por
// otro cliente (o por nosotros mismos — el upsert deduplica con la
// Optimistic UI ya aplicada por useVm{Create,Edit,Delete}).

import { useVmSocket } from '@shared/lib/useVmSocket'
import { useVmStore } from '@entities/vm/model/vm.store'

export function useRealtime() {
  const store = useVmStore()

  useVmSocket({
    'vm:created': (vm) => {
      // Si el evento corresponde a nuestra propia creación optimista,
      // upsertVm reemplaza la fila existente — no duplica.
      store.upsertVm(vm)
    },
    'vm:updated': (vm) => {
      // upsert (no replaceVm) cubre el edge: cliente conectado tarde que
      // aún no tenía la VM y recibe primero el updated.
      store.upsertVm(vm)
    },
    'vm:deleted': ({ id }) => {
      store.removeVm(id)
    }
  })
}
