<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth/model/auth.store'
import { useDarkMode } from '@shared/lib/useDarkMode'
import { useToast } from '@shared/lib/useToast'
import { useRealtime } from './providers/useRealtime'
import { useVmsInitialLoad } from './providers/useVmsInitialLoad'
import ToastContainer from '@shared/ui/ToastContainer.vue'
import BaseButton from '@shared/ui/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggle: toggleDark } = useDarkMode()
const toast = useToast()

// Suscripciones globales: socket → store (con dedup) y carga inicial al loggearse.
useRealtime()
useVmsInitialLoad()

async function logout() {
  await authStore.logout()
  toast.info('Sesión cerrada')
  router.replace('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Header sólo cuando hay sesión activa -->
    <header
      v-if="authStore.isAuthenticated"
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <nav class="flex items-center gap-4">
          <RouterLink to="/dashboard" class="font-bold text-lg">IFX VM</RouterLink>
          <RouterLink
            to="/dashboard"
            class="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            active-class="text-blue-600 dark:text-blue-400 font-semibold"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/vms"
            class="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            active-class="text-blue-600 dark:text-blue-400 font-semibold"
          >
            VMs
          </RouterLink>
        </nav>

        <div class="flex items-center gap-3">
          <span class="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
            {{ authStore.user?.email }} · <strong>{{ authStore.user?.role }}</strong>
          </span>
          <button
            type="button"
            class="text-lg focus:outline-none"
            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <BaseButton variant="ghost" @click="logout">Salir</BaseButton>
        </div>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <ToastContainer />
  </div>
</template>
