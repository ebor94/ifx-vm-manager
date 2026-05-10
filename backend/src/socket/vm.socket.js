// Capa thin sobre Socket.io.
// Centraliza el nombre del room y abstrae el emit, así el controller
// no importa la instancia de io directamente (mejor para testear).

const ROOM = 'vm-updates'

// Cada conexión se une al room — todas las VMs se broadcastean a todos los conectados.
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.join(ROOM)
  })
}

// io puede ser undefined en contextos de test sin servidor levantado.
// Silencioso en ese caso: la lógica HTTP no debe romperse por falta de socket.
const emitVmEvent = (io, event, payload) => {
  if (!io) return
  io.to(ROOM).emit(event, payload)
}

module.exports = { ROOM, registerSocketHandlers, emitVmEvent }
