import type { NextApiRequest, NextApiResponse } from "next";
import type { AlgorithmId } from "@/lib/algorithms/types";
import {
  adjustDefenseWave,
  combineRisk,
  buildBalancedSquad,
  analyzeMapBalance,
  rankContent,
  adjustDropRates,
  recommendRewards,
  optimizeSpawns,
  evaluateNetwork,
  predictEntityState,
  calculateEnemyMovement,
  calculateBotAI,
} from "@/lib/algorithms";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { applySecurityHeaders } from "@/lib/auth/security";

const VALID_ALGORITHMS = new Set<AlgorithmId>([
  "dda", "ace", "matchmaking", "map-balance", "content-recommendation",
  "economy-balance", "reward-recommendation", "spawn-optimizer",
  "network-prediction", "enemy-movement", "bot-ai",
]);

export interface AlgorithmRunRequest {
  algorithm: AlgorithmId;
  input: unknown;
}

export interface AlgorithmRunResponse {
  result: unknown;
  algorithm: AlgorithmId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AlgorithmRunResponse | { error: string }>
) {
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "仅支持 POST" });
  }

  const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";
  if (rateLimiter(`algo:${ip}`, { maxAttempts: 30, windowMs: 60000 })) {
    return res.status(429).json({ error: "请求过于频繁，请稍后重试" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "请求体格式错误" });
  }

  const { algorithm, input } = body as AlgorithmRunRequest;

  if (typeof algorithm !== "string" || !VALID_ALGORITHMS.has(algorithm as AlgorithmId)) {
    return res.status(400).json({ error: "无效的算法 ID" });
  }

  if (input === undefined || input === null) {
    return res.status(400).json({ error: "缺少 input 参数" });
  }

  try {
    switch (algorithm) {
      case "dda": {
        const { base, team, previousWaveResult } = input as {
          base: { index: number; enemyCount: number; eliteCount: number };
          team: { players: unknown[]; averageLatencyMs?: number };
          previousWaveResult?: { cleared: boolean; coreHealthPercent: number };
        };
        const result = adjustDefenseWave(base, team as never, previousWaveResult);
        return res.status(200).json({ algorithm, result });
      }
      case "ace": {
        const { clientSnapshot, serverEvents } = input as {
          clientSnapshot: unknown;
          serverEvents: unknown[];
        };
        const result = combineRisk(clientSnapshot as never, serverEvents as never[]);
        return res.status(200).json({ algorithm, result });
      }
      case "matchmaking": {
        const { queue, options } = input as { queue: unknown[]; options?: object };
        const result = buildBalancedSquad(queue as never[], options);
        return res.status(200).json({ algorithm, result });
      }
      case "map-balance": {
        const { stats } = input as { stats: unknown[] };
        const result = analyzeMapBalance(stats as never[]);
        return res.status(200).json({ algorithm, result });
      }
      case "content-recommendation": {
        const { items, userInterests, options } = input as {
          items: unknown[];
          userInterests: unknown[];
          options?: object;
        };
        const result = rankContent(items as never[], userInterests as never[], options);
        return res.status(200).json({ algorithm, result });
      }
      case "economy-balance": {
        const { table, state, options } = input as {
          table: unknown[];
          state: unknown;
          options?: object;
        };
        const result = adjustDropRates(table as never[], state as never, options);
        return res.status(200).json({ algorithm, result });
      }
      case "reward-recommendation": {
        const { options, build, enemies, config } = input as {
          options: unknown[];
          build: unknown;
          enemies: unknown;
          config?: object;
        };
        const result = recommendRewards(options as never[], build as never, enemies as never, config);
        return res.status(200).json({ algorithm, result });
      }
      case "spawn-optimizer": {
        const { candidates, pressure, options } = input as {
          candidates: unknown[];
          pressure: unknown;
          options?: object;
        };
        const result = optimizeSpawns(candidates as never[], pressure as never, options);
        return res.status(200).json({ algorithm, result });
      }
      case "network-prediction": {
        const { snapshot, entity, options } = input as {
          snapshot: unknown;
          entity?: unknown;
          options?: object;
        };
        const network = evaluateNetwork(snapshot as never);
        const predicted = entity
          ? predictEntityState(entity as never, snapshot as never, options)
          : null;
        return res.status(200).json({ algorithm, result: { network, predicted } });
      }
      case "enemy-movement": {
        const { request } = input as { request: unknown };
        const result = calculateEnemyMovement(request as never);
        return res.status(200).json({ algorithm, result });
      }
      case "bot-ai": {
        const { request } = input as { request: unknown };
        const result = calculateBotAI(request as never);
        return res.status(200).json({ algorithm, result });
      }
      default:
        return res.status(400).json({ error: "未知算法 ID" });
    }
  } catch (err) {
    console.error("算法执行失败:", err instanceof Error ? err.message : err);
    const message = process.env.NODE_ENV === "development" && err instanceof Error
      ? err.message
      : "算法执行失败，请稍后重试";
    return res.status(500).json({ error: message });
  }
}
