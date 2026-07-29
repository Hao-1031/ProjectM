/**
 * WebSocket 信令服务器 — 支持跨设备 WebRTC 组队
 * 替代 BroadcastChannel/localStorage（仅限同设备）以实现跨设备发现与连接
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface SignalingClient {
  ws: WebSocket;
  peerId: string;
  roomCode: string;
  playerName: string;
}

interface SignalingMessage {
  type: "offer" | "answer" | "discover" | "discover_response" | "register" | "ping" | "pong";
  from: string;
  to?: string;
  roomCode: string;
  playerName?: string;
  payload?: unknown;
  timestamp: number;
}

const HEARTBEAT_INTERVAL = 15000;
const CLIENT_TIMEOUT = 30000;

export function createSignalingServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/api/signaling" });
  const clients = new Map<WebSocket, SignalingClient>();

  function heartbeat(this: WebSocket) {
    (this as WebSocket & { _alive?: boolean })._alive = true;
  }

  const pingInterval = setInterval(() => {
    for (const [ws, client] of clients) {
      const wsAlive = ws as WebSocket & { _alive?: boolean };
      if (wsAlive._alive === false) {
        wsAlive._alive = undefined;
        ws.terminate();
        clients.delete(ws);
        broadcastRoomClients(client.roomCode);
        continue;
      }
      wsAlive._alive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  function broadcastRoomClients(roomCode: string) {
    const roomClients = Array.from(clients.values())
      .filter((c) => c.roomCode === roomCode)
      .map((c) => ({ peerId: c.peerId, playerName: c.playerName }));

    const msg: SignalingMessage = {
      type: "register",
      from: "server",
      roomCode,
      payload: roomClients,
      timestamp: Date.now(),
    };

    for (const [ws, client] of clients) {
      if (client.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    }
  }

  wss.on("connection", (ws: WebSocket) => {
    let client: SignalingClient | null = null;

    (ws as WebSocket & { _alive?: boolean })._alive = true;
    ws.on("pong", heartbeat);

    ws.on("message", (raw) => {
      try {
        const msg: SignalingMessage = JSON.parse(raw.toString());

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
          // 广播发现消息到所有已连接的客户端
          for (const [, c] of clients) {
            if (c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
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

        // 转发 offer/answer/discover_response 到目标客户端
        const target = msg.to;
        if (target) {
          for (const [, c] of clients) {
            if (c.peerId === target && c.ws.readyState === WebSocket.OPEN) {
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