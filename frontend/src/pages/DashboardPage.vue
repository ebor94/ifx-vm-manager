<script setup>
import VmDashboardPanel from '@widgets/VmDashboardPanel/index.vue'
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">Visión general de tus máquinas virtuales</p>
    </header>
    <VmDashboardPanel />
  </div>
</template>
