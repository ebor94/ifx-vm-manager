<script setup>
import { computed } from 'vue'
import { getStatusColor } from '@entities/vm/lib/vm.helpers'

const props = defineProps({
  status: { type: String, required: true }
})

const color = computed(() => getStatusColor(props.status))
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      {
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': color === 'green',
        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200':     color === 'gray',
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': color === 'yellow'
      }
    ]"
  >
    {{ status }}
  </span>
</template>
