<script setup>
// VmCard es UI pura del entity vm: SÓLO props + emits + slot.
// NO importa stores (auth, vm) ni APIs. La RBAC vive en el padre vía v-if.
// Si un Cliente no debe ver botones de Editar/Eliminar, el padre simplemente
// no los pone dentro del slot `actions` (ej: <VmEditButton v-if="authStore.isAdmin" />).

import VmStatusBadge from './VmStatusBadge.vue'
import { formatRam, formatDisk } from '@entities/vm/lib/vm.helpers'

defineProps({
  vm: { type: Object, required: true },
  highlighted: { type: Boolean, default: false }
})
</script>

<template>
  <article
    :class="[
      'rounded-lg p-4 bg-white dark:bg-gray-800 shadow transition-shadow hover:shadow-md',
      highlighted ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
    ]"
  >
    <header class="flex items-start justify-between gap-2 mb-3">
      <h3 class="font-semibold truncate text-gray-900 dark:text-gray-100">{{ vm.name }}</h3>
      <VmStatusBadge :status="vm.status" />
    </header>

    <dl class="grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt class="text-xs uppercase text-gray-500 dark:text-gray-400">Cores</dt>
        <dd class="font-medium text-gray-900 dark:text-gray-100">{{ vm.cores }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-gray-500 dark:text-gray-400">RAM</dt>
        <dd class="font-medium text-gray-900 dark:text-gray-100">{{ formatRam(vm.ram) }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-gray-500 dark:text-gray-400">Disco</dt>
        <dd class="font-medium text-gray-900 dark:text-gray-100">{{ formatDisk(vm.disk) }}</dd>
      </div>
    </dl>

    <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">{{ vm.os }}</p>

    <footer v-if="$slots.actions" class="mt-3 flex gap-2 justify-end">
      <slot name="actions" :vm="vm" />
    </footer>
  </article>
</template>
