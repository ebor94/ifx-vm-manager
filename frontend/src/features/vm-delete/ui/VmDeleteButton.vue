<script setup>
// Botón de "Eliminar VM" CON confirmación inline.
// A diferencia de Create/Edit (que delegan al padre), Delete es destructivo
// y queremos garantizar el doble-click intencional, así que la confirmación
// vive aquí.

import { ref } from 'vue'
import { useVmDelete } from '../model/useVmDelete'
import BaseButton from '@shared/ui/BaseButton.vue'

const props = defineProps({
  vm: { type: Object, required: true }
})

const { deleteVm, isDeleting } = useVmDelete()
const showConfirm = ref(false)

async function confirm() {
  showConfirm.value = false
  try {
    await deleteVm(props.vm.id, props.vm.name)
  } catch (_err) { /* el composable ya hizo rollback + toast */ }
}
</script>

<template>
  <BaseButton variant="danger" :loading="isDeleting" @click="showConfirm = true">
    Eliminar
  </BaseButton>

  <Teleport to="body">
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`Confirmar eliminación de ${vm.name}`"
      @click.self="showConfirm = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          ¿Eliminar VM?
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta acción eliminará <strong>"{{ vm.name }}"</strong>. No se puede deshacer.
        </p>
        <div class="flex gap-2 justify-end">
          <BaseButton variant="ghost" @click="showConfirm = false">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" :loading="isDeleting" @click="confirm">
            Eliminar
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
