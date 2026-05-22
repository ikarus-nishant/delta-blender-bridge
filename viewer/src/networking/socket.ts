import type { ViewerEvent } from "../protocol";

export interface SocketHandlers {
  onOpen?(): void;
  onClose?(): void;
  onError?(message: string): void;
  onMessage(event: ViewerEvent): void;
}

export function connectPreviewSocket(sessionId: string, token: string, handlers: SocketHandlers) {
  const url = new URL(`${window.location.origin.replace(/^http/, "ws")}/ws`);
  url.searchParams.set("session", sessionId);
  url.searchParams.set("token", token);

  const socket = new WebSocket(url);
  socket.addEventListener("open", () => handlers.onOpen?.());
  socket.addEventListener("close", () => handlers.onClose?.());
  socket.addEventListener("error", () => handlers.onError?.("WebSocket error"));
  socket.addEventListener("message", (raw) => {
    try {
      handlers.onMessage(JSON.parse(raw.data) as ViewerEvent);
    } catch {
      handlers.onError?.("Invalid WebSocket payload");
    }
  });
  return socket;
}
