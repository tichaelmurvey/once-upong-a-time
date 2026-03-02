import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { handleConnection } from "./room.js";
const PORT = Number(process.env.PORT) || 3000;
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const STATIC_DIR = join(__dirname, "../../../client/dist");
const MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
    const url = req.url ?? "/";
    const filePath = join(STATIC_DIR, url === "/" ? "index.html" : url);
    try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" });
        res.end(data);
    }
    catch {
        // SPA fallback — serve index.html for any unmatched route
        try {
            const index = await readFile(join(STATIC_DIR, "index.html"));
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(index);
        }
        catch {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found");
        }
    }
});
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
    handleConnection(ws);
});
server.listen(PORT, () => {
    console.log(`Game server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map