import type { NextApiRequest, NextApiResponse } from "next";
import type { AlgorithmId } from "@/lib/algorithms/types";
import {
  adjustDefenseWave,
  combineRisk,
  buildBalancedSquad,
  analyzeMapBalance,
  rankContent,
  adjustDropRates,
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
      default:
        return res.status(400).json({ error: "未知算法 ID" });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "算法执行失败";
    return res.status(400).json({ error: message });
  }
}
