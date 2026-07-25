export interface ClientFeatureSnapshot {
  averageReactionTimeMs: number;
  aimConsistencyScore: number;
  microCorrectionCountPerMinute: number;
  memoryChecksumMismatch: boolean;
  debuggedProcessCount: number;
  unknownModuleCount: number;
  framesPerSecond: number;
}

export interface ServerBehaviorEvent {
  type: "damage" | "movement" | "economy" | "aim";
  value: number;
  expectedMax: number;
  timestamp: number;
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface RiskReport {
  score: number;
  level: RiskLevel;
  clientScore: number;
  serverScore: number;
  reasons: string[];
  evidence: string[];
}

const REACTION_TIME_THRESHOLD_MS = 120;
const AIM_CONSISTENCY_THRESHOLD = 0.96;
const MICRO_CORRECTION_THRESHOLD = 80;

export function evaluateClientRisk(snapshot: ClientFeatureSnapshot): { score: number; reasons: string[]; evidence: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const evidence: string[] = [];

  if (snapshot.averageReactionTimeMs > 0 && snapshot.averageReactionTimeMs < REACTION_TIME_THRESHOLD_MS) {
    const severity = 1 - snapshot.averageReactionTimeMs / REACTION_TIME_THRESHOLD_MS;
    score += clamp(severity * 25, 5, 25);
    reasons.push("反应时间低于人类极限");
    evidence.push(`平均反应 ${snapshot.averageReactionTimeMs.toFixed(1)}ms`);
  }

  if (snapshot.aimConsistencyScore > AIM_CONSISTENCY_THRESHOLD) {
    score += clamp((snapshot.aimConsistencyScore - AIM_CONSISTENCY_THRESHOLD) * 300, 5, 25);
    reasons.push("瞄准一致性过高，疑似机械瞄准");
    evidence.push(`瞄准一致性 ${(snapshot.aimConsistencyScore * 100).toFixed(1)}%`);
  }

  if (snapshot.microCorrectionCountPerMinute > MICRO_CORRECTION_THRESHOLD) {
    score += clamp((snapshot.microCorrectionCountPerMinute - MICRO_CORRECTION_THRESHOLD) * 0.4, 5, 20);
    reasons.push("微修正频率异常");
    evidence.push(`微修正 ${snapshot.microCorrectionCountPerMinute.toFixed(0)} 次/分`);
  }

  if (snapshot.memoryChecksumMismatch) {
    score += 30;
    reasons.push("内存校验失败，游戏文件可能被修改");
    evidence.push("内存校验和 mismatch");
  }

  if (snapshot.debuggedProcessCount > 0) {
    score += clamp(snapshot.debuggedProcessCount * 10, 5, 20);
    reasons.push("检测到调试器或注入器进程");
    evidence.push(`调试/注入进程 ${snapshot.debuggedProcessCount} 个`);
  }

  if (snapshot.unknownModuleCount > 2) {
    score += clamp(snapshot.unknownModuleCount * 5, 5, 15);
    reasons.push("加载未知模块过多");
    evidence.push(`未知模块 ${snapshot.unknownModuleCount} 个`);
  }

  if (snapshot.framesPerSecond < 10 && snapshot.framesPerSecond > 0) {
    score += 5;
    reasons.push("帧率异常，可能绕过渲染检测");
    evidence.push(`FPS ${snapshot.framesPerSecond}`);
  }

  return { score: clamp(score, 0, 100), reasons, evidence };
}

export function evaluateServerRisk(events: ServerBehaviorEvent[]): { score: number; reasons: string[]; evidence: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const evidence: string[] = [];

  for (const event of events) {
    if (event.expectedMax <= 0 || event.value <= event.expectedMax) continue;
    const ratio = event.value / event.expectedMax;
    const eventScore = clamp((ratio - 1) * 25, 5, 25);
    score += eventScore;

    switch (event.type) {
      case "damage":
        reasons.push("单次伤害超出理论上限");
        evidence.push(`伤害 ${event.value.toFixed(0)} / 上限 ${event.expectedMax}`);
        break;
      case "movement":
        reasons.push("移动速度超出合理范围");
        evidence.push(`速度 ${event.value.toFixed(0)} / 上限 ${event.expectedMax}`);
        break;
      case "economy":
        reasons.push("经济获取速度异常");
        evidence.push(`经济 ${event.value.toFixed(0)} / 上限 ${event.expectedMax}`);
        break;
      case "aim":
        reasons.push("命中判定异常");
        evidence.push(`命中指标 ${event.value.toFixed(2)} / 上限 ${event.expectedMax}`);
        break;
    }
  }

  return { score: clamp(score, 0, 100), reasons, evidence };
}

export function combineRisk(
  clientSnapshot: ClientFeatureSnapshot,
  serverEvents: ServerBehaviorEvent[]
): RiskReport {
  const client = evaluateClientRisk(clientSnapshot);
  const server = evaluateServerRisk(serverEvents);

  // 双向验证：任何一方高分都会推高总分；双方同时异常时额外加权
  let combined = client.score * 0.45 + server.score * 0.55;
  if (client.score > 50 && server.score > 50) {
    combined = clamp(combined * 1.15, 0, 100);
  }

  const score = Math.round(combined);
  const level = scoreToLevel(score);

  return {
    score,
    level,
    clientScore: Math.round(client.score),
    serverScore: Math.round(server.score),
    reasons: Array.from(new Set([...client.reasons, ...server.reasons])),
    evidence: Array.from(new Set([...client.evidence, ...server.evidence])),
  };
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "none";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
