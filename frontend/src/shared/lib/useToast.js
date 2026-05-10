// Sistema de toasts global. Estado reactivo compartido por toda la app.
// Cualquier feature llama useToast().success/error/info; el ToastContainer
// (montado una vez en App.vue) los renderiza.

import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

const push = (kind, message, duration = 3000) => {
  const id = nextId++
  toasts.value.push({ id, kind, message })
  if (duration > 0) {
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }
}

const dismiss = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export const useToast = () => ({
  toasts,
  success: (message, duration) => push('success', message, duration),
  error:   (message, duration) => push('error',   message, duration),
  info:    (message, duration) => push('info',    message, duration),
  dismiss
})
