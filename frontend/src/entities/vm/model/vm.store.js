// Store de la entidad VM (Pinia). REGLA NO-NEGOCIABLE de CLAUDE.md:
// SÓLO métodos síncronos de manipulación de estado. NUNCA llamadas HTTP
// (axios, fetch, etc.). Las operaciones async viven en composables de
// features/* (useVmCreate, useVmEdit, useVmDelete) que aplican Optimistic
// UI (snapshot → mutación local → request → rollback).

import { defineStore } from 'pinia'

export const useVmStore = defineStore('vms', {
  state: () => ({
    vms: [],
    isLoading: false
  }),

  getters: {
    count:    (state) => state.vms.length,
    byId:     (state) => (id) => state.vms.find((vm) => vm.id === id),
    sortedByCreated: (state) =>
      [...state.vms].sort((a, b) => b.created_at?.localeCompare(a.created_at ?? '') ?? 0)
  },

  actions: {
    setVms(vms) {
      this.vms = vms ?? []
    },
    addVm(vm) {
      this.vms.push(vm)
    },
    replaceVm(id, vm) {
      const idx = this.vms.findIndex((v) => v.id === id)
      if (idx !== -1) this.vms[idx] = vm
    },
    // Útil para eventos socket: si la VM ya existe la reemplaza, si no, la agrega.
    upsertVm(vm) {
      const idx = this.vms.findIndex((v) => v.id === vm.id)
      if (idx === -1) this.vms.push(vm)
      else this.vms[idx] = vm
    },
    removeVm(id) {
      this.vms = this.vms.filter((v) => v.id !== id)
    },
    setLoading(value) {
      this.isLoading = !!value
    }
  }
})
