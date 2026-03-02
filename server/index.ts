import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./room.js";

const PORT = 3000;

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Pong server running");
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  handleConnection(ws);
});

server.listen(PORT, () => {
  console.log(`Game server listening on port ${PORT}`);
});
