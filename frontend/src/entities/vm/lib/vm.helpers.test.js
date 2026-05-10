import { describe, it, expect } from 'vitest'
import { getStatusColor, formatRam, formatDisk } from './vm.helpers'

describe('getStatusColor', () => {
  it.each([
    ['Encendida',  'green'],
    ['Apagada',    'gray'],
    ['Suspendida', 'yellow'],
    ['Desconocido', 'gray']
  ])('%s → %s', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected)
  })
})

describe('formatRam', () => {
  it('retorna em-dash para null/undefined', () => {
    expect(formatRam(null)).toBe('—')
    expect(formatRam(undefined)).toBe('—')
  })

  it('formatea valores < 1024 como MB', () => {
    expect(formatRam(512)).toBe('512 MB')
    expect(formatRam(1023)).toBe('1023 MB')
  })

  it('formatea exactos múltiplos de 1024 como GB sin decimales', () => {
    expect(formatRam(1024)).toBe('1 GB')
    expect(formatRam(2048)).toBe('2 GB')
    expect(formatRam(8192)).toBe('8 GB')
  })

  it('formatea valores intermedios con un decimal', () => {
    expect(formatRam(1536)).toBe('1.5 GB')
    expect(formatRam(3072)).toBe('3 GB')
    expect(formatRam(2560)).toBe('2.5 GB')
  })
})

describe('formatDisk', () => {
  it('retorna em-dash para null/undefined', () => {
    expect(formatDisk(null)).toBe('—')
    expect(formatDisk(undefined)).toBe('—')
  })

  it('formatea como GB', () => {
    expect(formatDisk(20)).toBe('20 GB')
    expect(formatDisk(500)).toBe('500 GB')
  })
})
