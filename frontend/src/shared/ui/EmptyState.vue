<script setup>
defineProps({
  title:   { type: String, required: true },
  message: { type: String, default: '' }
})
</script>

<template>
  <div class="text-center py-12 px-4">
    <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <h3 class="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
    <p v-if="message" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
