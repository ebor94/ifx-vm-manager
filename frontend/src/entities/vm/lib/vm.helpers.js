// Helpers puros del dominio VM. Sin imports de stores ni APIs.

export const getStatusColor = (status) => {
  switch (status) {
    case 'Encendida':  return 'green'
    case 'Apagada':    return 'gray'
    case 'Suspendida': return 'yellow'
    default:           return 'gray'
  }
}

export const formatRam = (mb) => {
  if (mb === null || mb === undefined) return '—'
  if (mb >= 1024) {
    const gb = mb / 1024
    return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`
  }
  return `${mb} MB`
}

export const formatDisk = (gb) => {
  if (gb === null || gb === undefined) return '—'
  return `${gb} GB`
}
