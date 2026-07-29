/**
 * 独立 WebSocket 信令服务器 — 支持跨设备 WebRTC 组队
 * 运行方式: node signaling-server.mjs
 * 默认端口: 3001 (通过 PORT 环境变量自定义)
 * 客户端通过 wss://host:3001 连接
 */

import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.SIGNALING_PORT || "3001", 10);
const HEARTBEAT_INTERVAL = 15000;

const wss = new WebSocketServer({ port: PORT });
const clients = new Map();

function heartbeat() {
  this._alive = true;
}

function broadcastRoomClients(roomCode) {
  const roomClients = Array.from(clients.values())
    .filter((c) => c.roomCode === roomCode)
    .map((c) => ({ peerId: c.peerId, playerName: c.playerName }));

  const msg = {
    type: "register",
    from: "server",
    roomCode,
    payload: roomClients,
    timestamp: Date.now(),
  };

  for (const [ws, client] of clients) {
    if (client.roomCode === roomCode && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    }
  }
}

const pingInterval = setInterval(() => {
  for (const [ws, client] of clients) {
    if (ws._alive === false) {
      ws._alive = undefined;
      ws.terminate();
      clients.delete(ws);
      broadcastRoomClients(client.roomCode);
      continue;
    }
    ws._alive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(pingInterval);
});

wss.on("connection", (ws) => {
  let client = null;

  ws._alive = true;
  ws.on("pong", heartbeat);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "register") {
        client = {
          ws,
          peerId: msg.from,
          roomCode: msg.roomCode,
          playerName: msg.playerName || "Unknown",
        };
        clients.set(ws, client);
        broadcastRoomClients(msg.roomCode);
        return;
      }

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", from: "server", roomCode: "", timestamp: Date.now() }));
        return;
      }

      if (msg.type === "discover") {
        for (const [, c] of clients) {
          if (c.ws !== ws && c.ws.readyState === 1) {
            c.ws.send(JSON.stringify({
              type: "discover_response",
              from: c.peerId,
              roomCode: c.roomCode,
              playerName: c.playerName,
              timestamp: Date.now(),
            }));
          }
        }
        return;
      }

      const target = msg.to;
      if (target) {
        for (const [, c] of clients) {
          if (c.peerId === target && c.ws.readyState === 1) {
            c.ws.send(JSON.stringify(msg));
            break;
          }
        }
      }
    } catch {
      // 忽略无效消息
    }
  });

  ws.on("close", () => {
    if (client) {
      clients.delete(ws);
      broadcastRoomClients(client.roomCode);
    }
  });

  ws.on("error", () => {
    if (client) {
      clients.delete(ws);
    }
  });
});

console.log(`> Signaling server ready on ws://0.0.0.0:${PORT}`);