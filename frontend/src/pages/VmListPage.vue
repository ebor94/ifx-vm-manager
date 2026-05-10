<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth/model/auth.store'
import VmTable from '@widgets/VmTable/index.vue'
import VmCreateButton from '@features/vm-create/ui/VmCreateButton.vue'

const router = useRouter()
const authStore = useAuthStore()

function onEdit(vm) {
  router.push({ name: 'vm-edit', params: { id: vm.id } })
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <header class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Máquinas Virtuales</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Listado completo con búsqueda y filtros</p>
      </div>
      <!-- RBAC: el botón NO existe en el DOM para Clientes (v-if, no v-show) -->
      <VmCreateButton v-if="authStore.isAdmin" @click="router.push({ name: 'vm-new' })" />
    </header>
    <VmTable @edit="onEdit" />
  </div>
</template>
