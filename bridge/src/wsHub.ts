import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "node:http";
import type { Logger } from "./logger.js";
import type { ViewerEvent } from "./protocol.js";
import type { SessionStore } from "./session.js";

type ClientRecord = {
  sessionId: string;
  socket: WebSocket;
};

export class WsHub {
  private server: WebSocketServer;
  private clients = new Set<ClientRecord>();

  constructor(httpServer: Server, private sessions: SessionStore, private logger: Logger) {
    this.server = new WebSocketServer({ noServer: true });

    httpServer.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/ws") {
        socket.destroy();
        return;
      }

      try {
        const sessionId = url.searchParams.get("session");
        const token = url.searchParams.get("token");
        if (!sessionId || !token) {
          throw new Error("Missing session credentials");
        }

        const session = this.sessions.validate(sessionId, token);

        this.server.handleUpgrade(request, socket, head, (ws) => {
          this.clients.add({ sessionId, socket: ws });
          this.logger.info("Viewer connected", { sessionId });
          ws.send(
            JSON.stringify({
              type: "connected",
              sessionId,
              version: session.lastVersion,
              modelUrl: session.lastModelUrl,
              environmentUrl: session.environmentUrl,
              toneMapping: session.toneMapping,
              camera: session.camera,
            } satisfies ViewerEvent),
          );
          ws.on("close", () => {
            for (const client of this.clients) {
              if (client.socket === ws) {
                this.clients.delete(client);
                break;
              }
            }
            this.logger.info("Viewer disconnected", { sessionId });
          });
        });
      } catch (error) {
        this.logger.warn("Rejected websocket upgrade", {
          error: error instanceof Error ? error.message : String(error),
        });
        socket.destroy();
      }
    });
  }

  broadcast(sessionId: string, event: ViewerEvent) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.sessionId === sessionId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(payload);
      }
    }
  }
}
