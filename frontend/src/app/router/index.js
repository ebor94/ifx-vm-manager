// Router con guards basados en auth.store.
// Las páginas se cargan con import() (lazy) para mantener pequeño el bundle inicial.

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@features/auth/model/auth.store'

const routes = [
  { path: '/', redirect: '/dashboard' },

  {
    path: '/login',
    name: 'login',
    component: () => import('@pages/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@pages/DashboardPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/vms',
    name: 'vms',
    component: () => import('@pages/VmListPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/vms/new',
    name: 'vm-new',
    component: () => import('@pages/VmFormPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/vms/:id/edit',
    name: 'vm-edit',
    component: () => import('@pages/VmFormPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    // Cliente intenta acceder a /vms/new o /vms/:id/edit → enviar al listado
    return { name: 'vms' }
  }
  return true
})
