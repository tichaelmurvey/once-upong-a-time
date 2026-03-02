import type { ClientMessage, Direction, ServerMessage } from "shared/types.js";

export type MessageHandler = (msg: ServerMessage) => void;

export function connect(onMessage: MessageHandler, onClose: () => void): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;
  const ws = new WebSocket(url);

  ws.addEventListener("message", (event) => {
    try {
      const msg: ServerMessage = JSON.parse(String(event.data));
      onMessage(msg);
    } catch {
      // Ignore malformed messages
    }
  });

  ws.addEventListener("close", onClose);

  return ws;
}

export function sendPaddleMove(ws: WebSocket, direction: Direction): void {
  if (ws.readyState === WebSocket.OPEN) {
    const msg: ClientMessage = { type: "paddleMove", direction };
    ws.send(JSON.stringify(msg));
  }
}
