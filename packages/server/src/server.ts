import http from "http";
import { createApp } from "./app";
import { connectDB, disconnectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { initSocketIO } from "./sockets";

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  await initSocketIO(httpServer);

  httpServer.listen(env.SERVER_PORT, () => {
    logger.info(`NexusChat API listening on port ${env.SERVER_PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs: http://localhost:${env.SERVER_PORT}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDB();
      logger.info("Shutdown complete.");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
  });
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
