<script setup>
// Skeleton de carga con animate-pulse de Tailwind. Mismo footprint que VmCard
// para evitar layout shift al reemplazarlo por la card real.
</script>

<template>
  <div class="rounded-lg p-4 bg-white dark:bg-gray-800 shadow animate-pulse">
    <div class="flex items-start justify-between mb-3">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
    <div class="mt-3 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
  </div>
</template>
