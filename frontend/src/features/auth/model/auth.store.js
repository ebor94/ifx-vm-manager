// Store de la feature auth.
// A diferencia de entities/vm/model/vm.store.js (que es 100% síncrono),
// este store SÍ tiene acciones async porque auth no es una entidad de
// dominio sino un flujo: login → cookie del backend → /me. La regla de
// CLAUDE.md sobre "no HTTP en stores" aplica a entity stores; los
// feature stores orquestan el flujo de su feature.

import { defineStore } from 'pinia'
import * as authApi from '../api/auth.api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isInitializing: true
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin:         (state) => state.user?.role === 'Administrador',
    isCliente:       (state) => state.user?.role === 'Cliente'
  },

  actions: {
    async login(email, password) {
      const { data } = await authApi.login(email, password)
      this.user = data.user
      return data.user
    },

    async logout() {
      // Aún si el server falla limpiamos el estado local — la cookie se
      // limpia del lado del navegador la próxima vez de cualquier modo.
      try { await authApi.logout() } catch (_err) { /* noop */ }
      this.user = null
    },

    // Llamar al arrancar la app: si la cookie HttpOnly sigue válida,
    // restaura el user sin necesidad de re-loggear.
    async initialize() {
      try {
        const { data } = await authApi.fetchMe()
        this.user = data.user
      } catch (_err) {
        this.user = null
      } finally {
        this.isInitializing = false
      }
    }
  }
})
