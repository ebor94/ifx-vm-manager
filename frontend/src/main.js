// Entry point real del frontend.
// Orden CRÍTICO del bootstrap:
//   1. Pinia ANTES de tocar cualquier store
//   2. auth.initialize() ANTES de instalar el router (para que los guards
//      vean isAuthenticated correcto desde la primera navegación)
//   3. Router después de auth
//   4. mount al final

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './app/App.vue'
import { router } from './app/router'
import { useAuthStore } from '@features/auth/model/auth.store'

import './app/styles/globals.css'

async function bootstrap() {
  const app = createApp(App)

  app.use(createPinia())

  // Restaura la sesión si la cookie HttpOnly del backend sigue válida.
  // GET /me — si responde 200, auth.user queda poblado y los guards lo ven.
  // Si responde 401, auth.user queda en null y el guard envía a /login.
  const authStore = useAuthStore()
  await authStore.initialize()

  app.use(router)
  // Esperamos a que el router resuelva la ruta inicial antes de montar,
  // así no hay flash de contenido protegido para usuarios no auth.
  await router.isReady()

  app.mount('#app')
}

bootstrap()
