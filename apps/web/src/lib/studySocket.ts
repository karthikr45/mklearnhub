'use client'

import { io, type Socket } from 'socket.io-client'

import { useAuthStore } from './store'

/**
 * The study realtime namespace lives at `${host}/study` (the REST base is
 * `${host}/api/v1`). One shared socket per tab, authenticated with the access
 * token.
 */
function socketBase(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  return apiUrl.replace(/\/api\/v1\/?$/, '')
}

let socket: Socket | null = null

export function getStudySocket(): Socket {
  const token = useAuthStore.getState().accessToken
  if (socket && socket.connected) return socket
  if (!socket) {
    socket = io(`${socketBase()}/study`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    })
  }
  return socket
}

export function disconnectStudySocket(): void {
  socket?.disconnect()
  socket = null
}
