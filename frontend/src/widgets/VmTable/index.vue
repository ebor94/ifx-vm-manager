<script setup>
import { useVmStore } from '@entities/vm/model/vm.store'
import { useAuthStore } from '@features/auth/model/auth.store'
import { useVmFilters } from './useVmFilters'
import VmCard from '@entities/vm/ui/VmCard.vue'
import VmEditButton from '@features/vm-edit/ui/VmEditButton.vue'
import VmDeleteButton from '@features/vm-delete/ui/VmDeleteButton.vue'
import SkeletonCard from '@shared/ui/SkeletonCard.vue'
import EmptyState from '@shared/ui/EmptyState.vue'
import BaseInput from '@shared/ui/BaseInput.vue'
import { VM_STATUS } from '@shared/config/constants'

const vmStore = useVmStore()
const authStore = useAuthStore()

const { search, statusFilter, filtered } = useVmFilters(() => vmStore.vms)

defineEmits(['edit'])
</script>

<template>
  <div>
    <!-- Filtros: búsqueda libre + select de status -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex-1">
        <BaseInput v-model="search" placeholder="Buscar por nombre u OS…" />
      </div>
      <select
        v-model="statusFilter"
        class="px-3 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos los estados</option>
        <option v-for="s in VM_STATUS" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- Loading: 6 skeletons mientras vmStore.isLoading es true -->
    <div v-if="vmStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SkeletonCard v-for="i in 6" :key="i" />
    </div>

    <!-- Empty state: distinguimos lista vacía de filtros sin resultados -->
    <EmptyState
      v-else-if="filtered.length === 0"
      :title="vmStore.vms.length === 0 ? 'No hay VMs' : 'Sin resultados'"
      :message="
        vmStore.vms.length === 0
          ? 'Aún no se han creado máquinas virtuales.'
          : 'Ninguna VM coincide con los filtros aplicados.'
      "
    />

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <VmCard v-for="vm in filtered" :key="vm.id" :vm="vm">
        <!-- RBAC: el slot SÓLO se rellena para Administradores. Los Clientes
             ven la card sin botones (no existen en su DOM, no v-show). -->
        <template v-if="authStore.isAdmin" #actions="{ vm: cardVm }">
          <VmEditButton :vm="cardVm" @click="$emit('edit', cardVm)" />
          <VmDeleteButton :vm="cardVm" />
        </template>
      </VmCard>
    </div>
  </div>
</template>
