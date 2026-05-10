// Constantes compartidas — sin dependencias de negocio.
// Las variables VITE_* las inyecta Vite desde el .env del frontend.

export const API_URL    = import.meta.env.VITE_API_URL    || 'http://localhost:3000'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

// Enums alineados con los CHECK constraints de schema.sql del backend.
// Cualquier cambio aquí debe coordinarse con backend/src/db/schema.sql.
export const VM_OS = Object.freeze([
  'Ubuntu 22.04',
  'Windows Server 2022',
  'CentOS 8',
  'Debian 11'
])

export const VM_STATUS = Object.freeze([
  'Encendida',
  'Apagada',
  'Suspendida'
])
