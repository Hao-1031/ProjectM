/**
 * WebSocket 信令服务器 — 支持跨设备 WebRTC 组队
 * 替代 BroadcastChannel/localStorage（仅限同设备）以实现跨设备发现与连接
 * 纯 JS 版本，用于 Node.js 自定义服务器入口
 */

import { WebSocketServer } from "ws";

const HEARTBEAT_INTERVAL = 15000;

export function createSignalingServer(server) {
  const wss = new WebSocketServer({ server, path: "/api/signaling" });
  const clients = new Map();

  function heartbeat() {
    this._alive = true;
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

  return wss;
}