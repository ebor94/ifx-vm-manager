<script setup>
import { useId } from 'vue'

const props = defineProps({
  modelValue:  { type: [String, Number], default: '' },
  type:        { type: String, default: 'text' },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: '' },
  error:       { type: String, default: '' },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  autocomplete:{ type: String, default: 'off' }
})

defineEmits(['update:modelValue'])

const id = useId()
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      :class="[
        'w-full px-3 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 dark:border-gray-600'
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
