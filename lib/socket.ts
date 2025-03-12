import { io } from "socket.io-client"

// Create a singleton socket instance
let socket: any

export const initSocket = () => {
  if (!socket) {
    socket = io("http://localhost:4000")
    console.log("Socket initialized")
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

