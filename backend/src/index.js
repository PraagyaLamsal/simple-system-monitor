const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { getSnapshot } = require("./metrics/collect");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("System Monitor backend running. Try /health, /snapshot, or WS /stream");
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/snapshot", async (req, res) => {
  try {
    res.json(await getSnapshot());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const server = http.createServer(app);

// WebSocket server on a clear path
const wss = new WebSocket.Server({ server, path: "/stream" });

const UPDATE_MS = 1000;

wss.on("connection", (ws, req) => {
  console.log("WS client connected:", req.socket.remoteAddress);

  // Heartbeat (kills dead connections)
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  // Send one immediately
  (async () => {
    try {
      ws.send(JSON.stringify({ type: "snapshot", data: await getSnapshot() }));
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: e.message }));
    }
  })();

  const interval = setInterval(async () => {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "snapshot", data: await getSnapshot() }));
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: e.message }));
    }
  }, UPDATE_MS);

  ws.on("close", () => clearInterval(interval));
});

// Ping everyone every 10s to detect dead clients
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend running: http://localhost:${PORT}`));
