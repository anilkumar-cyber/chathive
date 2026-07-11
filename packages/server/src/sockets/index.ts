import { createAdapter } from "@socket.io/redis-adapter";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { env, isTest } from "../config/env";
import { logger } from "../config/logger";
import { registerCallHandlers } from "./call.handlers";
import { registerChatHandlers } from "./chat.handlers";
import { setIO } from "./io";
import { handleConnect } from "./presence.handlers";
import { AuthenticatedSocket, socketAuthMiddleware } from "./socketAuth";

export async function initSocketIO(httpServer: HttpServer): Promise<Server> {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    maxHttpBufferSize: 1e6,
  });

  if (!isTest && env.REDIS_URL) {
    try {
      const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, retryStrategy: (times) => (times > 3 ? null : 500) });
      const subClient = pubClient.duplicate();

      let warned = false;
      const onError = (err: Error) => {
        if (!warned) {
          logger.warn(`Redis adapter connection issue, continuing single-instance until it recovers: ${err.message}`);
          warned = true;
        }
      };
      pubClient.on("error", onError);
      subClient.on("error", onError);
      pubClient.on("connect", () => logger.info("Socket.io Redis adapter attached (multi-instance ready)"));

      io.adapter(createAdapter(pubClient, subClient));
    } catch (err) {
      logger.warn(`Socket.io Redis adapter failed, running single-instance: ${(err as Error).message}`);
    }
  }

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    logger.debug(`Socket connected: ${authSocket.id} (user ${authSocket.userId})`);

    handleConnect(io, authSocket);
    registerChatHandlers(io, authSocket);
    registerCallHandlers(io, authSocket);
  });

  setIO(io);
  return io;
}
