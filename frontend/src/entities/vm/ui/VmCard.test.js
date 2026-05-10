// VmCard es UI pura: sólo props + slot. No conoce auth ni stores.
// El test verifica el contrato: slot 'actions' se renderiza si y sólo si
// el padre lo provee — el RBAC vive en el padre (VmTable / pages).

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VmCard from './VmCard.vue'

const vm = {
  id: 1,
  name: 'vm-test',
  cores: 4,
  ram: 4096,
  disk: 100,
  os: 'Ubuntu 22.04',
  status: 'Encendida'
}

describe('VmCard', () => {
  it('renderiza nombre, status, cores, RAM (formateada) y disco', () => {
    const wrapper = mount(VmCard, { props: { vm } })
    expect(wrapper.text()).toContain('vm-test')
    expect(wrapper.text()).toContain('Encendida')
    expect(wrapper.text()).toContain('4')           // cores
    expect(wrapper.text()).toContain('4 GB')        // formatRam(4096)
    expect(wrapper.text()).toContain('100 GB')      // formatDisk(100)
    expect(wrapper.text()).toContain('Ubuntu 22.04')
  })

  it('NO renderiza el footer si no hay slot actions', () => {
    const wrapper = mount(VmCard, { props: { vm } })
    expect(wrapper.find('footer').exists()).toBe(false)
  })

  it('renderiza el footer con el contenido del slot actions', () => {
    const wrapper = mount(VmCard, {
      props: { vm },
      slots: { actions: '<button>Eliminar</button>' }
    })
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('footer button').text()).toBe('Eliminar')
  })

  it('aplica ring al estar highlighted', () => {
    const wrapper = mount(VmCard, { props: { vm, highlighted: true } })
    expect(wrapper.find('article').classes()).toContain('ring-2')
  })
})
