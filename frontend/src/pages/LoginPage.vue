<script setup>
import { useRouter, useRoute } from 'vue-router'
import LoginForm from '@features/auth/ui/LoginForm.vue'
import { useDarkMode } from '@shared/lib/useDarkMode'

const router = useRouter()
const route = useRoute()
const { isDark, toggle } = useDarkMode()

function onSuccess() {
  // Si la URL trae ?redirect=/algo (puesto por el guard), volvemos ahí.
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  router.replace(redirect)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-sm">
      <header class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">IFX VM Manager</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Ingresá con tus credenciales</p>
      </header>

      <LoginForm @success="onSuccess" />

      <button
        type="button"
        class="mt-6 mx-auto block text-xs text-gray-500 dark:text-gray-400 hover:underline focus:outline-none"
        @click="toggle"
      >
        {{ isDark ? '☀️ Modo claro' : '🌙 Modo oscuro' }}
      </button>
    </div>
  </div>
</template>
