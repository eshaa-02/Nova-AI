import { io, type Socket } from "socket.io-client";
import { NovaApiClient } from "@/lib/api/client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Returns a single shared Socket.IO connection, authenticated with the
 * current access token. Callers must add/remove their own listeners and
 * MUST clean them up (e.g. in a useEffect return) — this module never
 * disconnects the socket itself, since it's shared across the app.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: NovaApiClient.getAccessToken() }),
    withCredentials: true,
  });

  // Re-authenticate transparently whenever the access token changes
  // (e.g. after a silent refresh) so a stale token never causes a
  // silent auth failure on reconnect.
  NovaApiClient.onTokenChange((token) => {
    if (!socket) return;
    if (token && !socket.connected) {
      socket.connect();
    }
    if (!token && socket.connected) {
      socket.disconnect();
    }
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
}
