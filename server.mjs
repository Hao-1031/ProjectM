/**
 * 破晓版本 - 集成服务器入口
 * 将 Next.js standalone 与 WebSocket 信令服务器合并为单一进程
 * 替代原有的双进程 (Next.js + signaling-server.mjs) 架构
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createSignalingServer } from "./lib/network/ws-signaling-server.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // 集成 WebSocket 信令服务器到同一 HTTP 服务器
  createSignalingServer(server);

  server.listen(port, hostname, () => {
    console.log(`[破晓] 多重宇宙服务已启动 http://${hostname}:${port}`);
    console.log(`[破晓] 模式: ${dev ? "开发" : "生产"}`);
    console.log(`[破晓] 信令: 已集成 (端口 ${port})`);
  });
});