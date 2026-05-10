<script setup>
// Botón de "Crear VM". Sólo dispara la intención — la página padre decide
// si abre un modal, navega a una ruta /vms/new, o renderiza un form inline.
// Esto mantiene la feature desacoplada del router y reusable.

import BaseButton from '@shared/ui/BaseButton.vue'

defineEmits(['click'])
</script>

<template>
  <BaseButton variant="primary" @click="$emit('click', $event)">
    + Crear VM
  </BaseButton>
</template>
