// electron/renderer/src/realtime.ts  (o donde corresponda)
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function connectElectronRealtime({
  apiBase,
  token,
  deviceId, // p.ej. "NOVAJG232701"
}: { apiBase: string; token: string; deviceId: string }) {
  if (socket?.connected) return socket

  socket = io(`${apiBase}/realtime`, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
    auth: { token, deviceId }, // <- importante: mandamos deviceId en el handshake
  })

  socket.on("connect", () => {
    console.log("[electron] connected:", socket?.id)
  })

  socket.on("disconnect", (r) => console.log("[electron] disconnected:", r))

  // Escucha el "hello" que re-emitirá el backend
  socket.on("hello", (payload) => {
    console.log("[electron] hello:", payload)
    // TODO: dispara tu UI/acción
  })

  return socket
}
