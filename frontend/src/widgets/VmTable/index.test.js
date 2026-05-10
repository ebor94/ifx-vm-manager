// Test crítico del proyecto: RBAC server-side ya está validado en backend,
// pero el frontend también respeta la regla con v-if (no v-show). Para
// Clientes los botones de mutación NO existen en el DOM — más estricto
// que estar ocultos. Es el ejemplo que CLAUDE.md detalla.

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

import VmTable from './index.vue'
import { useAuthStore } from '@features/auth/model/auth.store'
import { useVmStore } from '@entities/vm/model/vm.store'

const sampleVm = {
  id: 1,
  name: 'vm-prod',
  cores: 4,
  ram: 4096,
  disk: 100,
  os: 'Ubuntu 22.04',
  status: 'Encendida',
  created_at: '2026-05-10 10:00:00',
  updated_at: '2026-05-10 10:00:00'
}

const setupAuth = (role) => {
  const auth = useAuthStore()
  auth.user =
    role === 'admin'
      ? { id: 1, name: 'Admin',   email: 'admin@x.com',   role: 'Administrador' }
      : { id: 2, name: 'Cliente', email: 'cliente@x.com', role: 'Cliente' }
}

describe('VmTable — RBAC en el DOM (test crítico)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('el botón Eliminar NO existe en el DOM para rol Cliente', () => {
    setupAuth('cliente')
    const vmStore = useVmStore()
    vmStore.setVms([sampleVm])

    const wrapper = mount(VmTable)

    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => /eliminar/i.test(b.text()))

    // Más estricto que "no visible": LITERALMENTE no está en el árbol
    expect(deleteButtons).toHaveLength(0)
  })

  it('el botón Editar NO existe en el DOM para rol Cliente', () => {
    setupAuth('cliente')
    const vmStore = useVmStore()
    vmStore.setVms([sampleVm])

    const wrapper = mount(VmTable)
    const editButtons = wrapper.findAll('button').filter((b) => /editar/i.test(b.text()))
    expect(editButtons).toHaveLength(0)
  })

  it('los botones Editar y Eliminar SÍ existen para rol Administrador', () => {
    setupAuth('admin')
    const vmStore = useVmStore()
    vmStore.setVms([sampleVm])

    const wrapper = mount(VmTable)

    const deleteButtons = wrapper.findAll('button').filter((b) => /eliminar/i.test(b.text()))
    const editButtons   = wrapper.findAll('button').filter((b) => /editar/i.test(b.text()))

    expect(deleteButtons.length).toBeGreaterThan(0)
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('Cliente puede ver las VMs (lectura sí permitida, sólo escritura bloqueada)', () => {
    setupAuth('cliente')
    const vmStore = useVmStore()
    vmStore.setVms([sampleVm])

    const wrapper = mount(VmTable)
    expect(wrapper.text()).toContain('vm-prod')
  })
})
