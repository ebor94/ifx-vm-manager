// Cliente Socket.io compartido — base que usarán los widgets/features en Paso 9.
// Una sola conexión socket por sesión: refCount cuenta los componentes que
// la mantienen viva; cuando llega a 0 cerramos la conexión.

import { onUnmounted } from 'vue'
import { io as socketIO } from 'socket.io-client'
import { SOCKET_URL } from '@shared/config/constants'

let sharedSocket = null
let refCount = 0

const ensureSocket = () => {
  if (sharedSocket) return sharedSocket
  sharedSocket = socketIO(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket']
  })
  return sharedSocket
}

// Hook idiomático: registra handlers, los limpia al desmontar y libera
// la conexión cuando ya no quedan suscriptores.
export const useVmSocket = (handlers = {}) => {
  const socket = ensureSocket()
  refCount++

  for (const [event, handler] of Object.entries(handlers)) {
    socket.on(event, handler)
  }

  onUnmounted(() => {
    for (const [event, handler] of Object.entries(handlers)) {
      socket.off(event, handler)
    }
    refCount--
    if (refCount === 0) {
      socket.close()
      sharedSocket = null
    }
  })

  return { socket }
}
