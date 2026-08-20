import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../services/auth/token.service";
import { env } from "../config/env";
import { registerChatHandlers } from "./chat.socket";

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authenticate every connection once, up front, using the same access
  // token the REST API uses — avoids a parallel auth system.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("UNAUTHENTICATED"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      // Per-socket listeners are cleaned up automatically by Socket.IO
      // when the socket disconnects — no manual teardown required since
      // handlers are registered fresh per connection, never on `io` itself.
    });
  });

  return io;
}
