import http from "node:http";
import path from "node:path";
import express from "express";
import cors from "cors";
import { createLogger } from "./logger.js";
import { registerRoutes } from "./routes.js";
import { SessionStore } from "./session.js";
import { isLocalhostOrigin } from "./security.js";
import { WsHub } from "./wsHub.js";
import { DEFAULT_HTTP_PORT } from "./protocol.js";

export interface BridgeServerOptions {
  httpPort?: number;
  viewerDistDir?: string;
  logFilePath?: string;
  version?: string;
}

export async function startBridgeServer(options: BridgeServerOptions = {}) {
  const httpPort = options.httpPort ?? DEFAULT_HTTP_PORT;
  const viewerDistDir = options.viewerDistDir ?? path.resolve(process.cwd(), "../viewer/dist");
  const version = options.version ?? "1.0.0";
  const logger = createLogger(options.logFilePath);
  const sessions = new SessionStore();

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin(origin, callback) {
        callback(isLocalhostOrigin(origin) ? null : new Error("Origin not allowed"), true);
      },
    }),
  );

  const httpServer = http.createServer(app);
  const wsHub = new WsHub(httpServer, sessions, logger);

  registerRoutes({
    app,
    sessions,
    wsHub,
    logger,
    version,
    viewerDistDir,
    httpPort,
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Request failed", { message });
    response.status(400).json({ ok: false, message });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(httpPort, "127.0.0.1", () => {
      httpServer.off("error", reject);
      logger.info("Bridge server listening", { httpPort, viewerDistDir });
      resolve();
    });
  });

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
