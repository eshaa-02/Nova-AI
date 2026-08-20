import http from "http";
import { createApp } from "./app";
import { createSocketServer } from "./sockets";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";

async function main() {
  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Nova AI API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`   AI provider: ${env.AI_PROVIDER}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start Nova AI API:", err);
  process.exit(1);
});
