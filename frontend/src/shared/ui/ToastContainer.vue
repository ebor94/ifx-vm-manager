<script setup>
import { useToast } from '@shared/lib/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
  >
    <transition-group name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="[
          'pointer-events-auto px-4 py-3 rounded shadow-lg text-white text-sm min-w-[260px] max-w-sm flex items-start gap-2',
          { 'bg-green-600': t.kind === 'success', 'bg-red-600': t.kind === 'error', 'bg-blue-600': t.kind === 'info' }
        ]"
        role="alert"
      >
        <span class="flex-1">{{ t.message }}</span>
        <button
          type="button"
          class="opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Cerrar"
          @click="dismiss(t.id)"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease-out;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
