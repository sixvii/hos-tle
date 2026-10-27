import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import type { BackendConfig } from "./config";
import { AuthService } from "./auth";
import type { BackendStore } from "./store";
import { createId, now } from "./store";

const messageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

type MessageAck = (response: { ok: boolean; error?: string; message?: unknown }) => void;

export function attachRealtime(httpServer: HttpServer, store: BackendStore, auth: AuthService, config: BackendConfig) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.NODE_ENV === "production" ? new URL(config.PUBLIC_APP_URL).origin : true,
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = auth.getUserByToken(typeof token === "string" ? token : undefined);
    if (!user) return next(new Error("UNAUTHENTICATED"));
    socket.data.userId = user.id;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("message:send", (payload: unknown, acknowledge?: MessageAck) => {
      const input = messageSchema.safeParse(payload);
      if (!input.success) {
        acknowledge?.({ ok: false, error: "Provide a recipient and message body." });
        return;
      }
      if (!store.users.has(input.data.recipientId)) {
        acknowledge?.({ ok: false, error: "Recipient not found." });
        return;
      }

      const message = {
        id: createId(),
        senderId: userId,
        ...input.data,
        createdAt: now(),
      };
      store.messages.set(message.id, message);
      io.to(`user:${message.recipientId}`).emit("message:new", message);
      socket.emit("message:new", message);
      acknowledge?.({ ok: true, message });
    });
  });

  return io;
}
