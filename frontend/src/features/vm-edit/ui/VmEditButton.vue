<script setup>
// Botón de "Editar VM". Emite la VM actual al padre, que decide cómo
// presentar el formulario (modal, navegación a /vms/:id/edit, etc.).

import BaseButton from '@shared/ui/BaseButton.vue'

defineProps({
  vm: { type: Object, required: true }
})

defineEmits(['click'])
</script>

<template>
  <BaseButton variant="secondary" @click="$emit('click', vm)">
    Editar
  </BaseButton>
</template>
