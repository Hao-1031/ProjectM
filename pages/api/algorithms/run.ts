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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "仅支持 POST" });
  }

  const { algorithm, input } = req.body as AlgorithmRunRequest;

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
    const message = err instanceof Error ? err.message : "算法执行失败";
    return res.status(400).json({ error: message });
  }
}
