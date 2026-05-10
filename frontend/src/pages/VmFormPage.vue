<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useVmCreate } from '@features/vm-create/model/useVmCreate'
import { useVmEdit } from '@features/vm-edit/model/useVmEdit'
import { VM_OS, VM_STATUS } from '@shared/config/constants'
import BaseInput from '@shared/ui/BaseInput.vue'
import BaseButton from '@shared/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const vmStore = useVmStore()
const { createVm, isCreating } = useVmCreate()
const { editVm, isUpdating } = useVmEdit()

const editId = computed(() => {
  const v = Number(route.params.id)
  return Number.isInteger(v) && v > 0 ? v : null
})
const isEdit = computed(() => editId.value !== null)

const form = ref({
  name: '',
  cores: 2,
  ram: 1024,
  disk: 20,
  os: VM_OS[0],
  status: 'Apagada'
})

const errorMsg = ref('')

onMounted(() => {
  if (!isEdit.value) return
  const existing = vmStore.byId(editId.value)
  if (!existing) {
    // El usuario llegó por URL directa y la VM no está en el store —
    // el initial load ya corrió, así que probablemente no existe.
    router.replace({ name: 'vms' })
    return
  }
  form.value = {
    name: existing.name,
    cores: existing.cores,
    ram: existing.ram,
    disk: existing.disk,
    os: existing.os,
    status: existing.status
  }
})

async function submit() {
  errorMsg.value = ''
  const payload = {
    name: form.value.name.trim(),
    cores: Number(form.value.cores),
    ram: Number(form.value.ram),
    disk: Number(form.value.disk),
    os: form.value.os,
    ...(isEdit.value ? { status: form.value.status } : {})
  }
  try {
    if (isEdit.value) await editVm(editId.value, payload)
    else                await createVm(payload)
    router.push({ name: 'vms' })
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Error al guardar'
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-md">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
      {{ isEdit ? 'Editar VM' : 'Crear VM' }}
    </h1>

    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Nombre" required placeholder="vm-prod-01" />

      <div class="grid grid-cols-3 gap-3">
        <BaseInput v-model="form.cores" label="Cores" type="number" required />
        <BaseInput v-model="form.ram"   label="RAM (MB)" type="number" required />
        <BaseInput v-model="form.disk"  label="Disco (GB)" type="number" required />
      </div>

      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Sistema operativo <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.os"
          class="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="os in VM_OS" :key="os" :value="os">{{ os }}</option>
        </select>
      </div>

      <div v-if="isEdit">
        <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
        <select
          v-model="form.status"
          class="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="s in VM_STATUS" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400" role="alert">
        {{ errorMsg }}
      </p>

      <div class="flex gap-2 justify-end pt-2">
        <BaseButton variant="ghost" type="button" @click="router.push({ name: 'vms' })">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="isCreating || isUpdating">
          {{ isEdit ? 'Guardar' : 'Crear' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
