// Toggle de dark mode con persistencia en localStorage.
// Tailwind está configurado en modo `class` (tailwind.config.js) — agregamos
// la clase 'dark' al <html> y Tailwind aplica las variantes `dark:`.

import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'ifx-vm-manager:theme'

const initial = (() => {
  if (typeof window === 'undefined') return false
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
})()

const isDark = ref(initial)

if (typeof window !== 'undefined') {
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    window.localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  })
}

export const useDarkMode = () => ({
  isDark,
  toggle: () => {
    isDark.value = !isDark.value
  }
})
