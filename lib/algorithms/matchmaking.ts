export type PlayerRole = "tank" | "dps" | "support" | "flex";

export interface QueuedPlayer {
  id: string;
  skillScore: number;
  preferredRole?: PlayerRole;
  latencyMs: number;
}

export interface Squad {
  members: QueuedPlayer[];
  averageSkill: number;
  skillSpread: number;
  averageLatencyMs: number;
  roleCoverage: PlayerRole[];
  estimatedDifficulty: number;
}

const ROLE_WEIGHTS: Record<PlayerRole, number> = {
  tank: 0.9,
  dps: 1.0,
  support: 0.85,
  flex: 0.95,
};

export function buildBalancedSquad(
  queue: QueuedPlayer[],
  options: { maxSize?: number; maxLatencyMs?: number; mapDifficulty?: number } = {}
): Squad {
  const { maxSize = 4, maxLatencyMs = 300, mapDifficulty = 0.5 } = options;

  if (!queue.length) {
    return {
      members: [],
      averageSkill: 0,
      skillSpread: 0,
      averageLatencyMs: 0,
      roleCoverage: [],
      estimatedDifficulty: mapDifficulty,
    };
  }

  // 按综合分排序：延迟惩罚后的实力
  const scored = queue.map((p) => ({
    player: p,
    effectiveSkill: effectiveSkill(p),
  }));
  scored.sort((a, b) => b.effectiveSkill - a.effectiveSkill);

  // 贪心选择：优先保证角色覆盖，再尽量压缩实力方差
  const selected: QueuedPlayer[] = [];
  const coveredRoles = new Set<PlayerRole>();

  const priorityOrder = scored.map((s) => s.player);

  // 第一步：选各角色第一人
  for (const role of ["tank", "support", "dps"] as PlayerRole[]) {
    const candidate = priorityOrder.find(
      (p) => !selected.includes(p) && (p.preferredRole === role || p.preferredRole === "flex")
    );
    if (candidate) {
      selected.push(candidate);
      coveredRoles.add(role);
    }
  }

  // 第二步：补齐到 maxSize，优先低延迟
  const remaining = priorityOrder.filter((p) => !selected.includes(p));
  remaining.sort((a, b) => a.latencyMs - b.latencyMs);
  while (selected.length < maxSize && remaining.length > 0) {
    const candidate = remaining.shift();
    if (candidate && candidate.latencyMs <= maxLatencyMs) {
      selected.push(candidate);
      if (candidate.preferredRole && candidate.preferredRole !== "flex") {
        coveredRoles.add(candidate.preferredRole);
      }
    }
  }

  const skills = selected.map((p) => p.skillScore);
  const averageSkill = selected.length ? skills.reduce((a, b) => a + b, 0) / selected.length : 0;
  const skillSpread = selected.length ? Math.max(...skills) - Math.min(...skills) : 0;
  const averageLatencyMs = selected.length
    ? selected.reduce((a, b) => a + b.latencyMs, 0) / selected.length
    : 0;

  // 预期难度：实力越高、配合越好则越难
  const coordinationBonus = selected.length ? 1 - Math.min(skillSpread, 0.5) : 0;
  const estimatedDifficulty = clamp(
    mapDifficulty + averageSkill * 0.3 + coordinationBonus * 0.15,
    0,
    1
  );

  return {
    members: selected,
    averageSkill: round2(averageSkill),
    skillSpread: round2(skillSpread),
    averageLatencyMs: round2(averageLatencyMs),
    roleCoverage: Array.from(coveredRoles),
    estimatedDifficulty: round2(estimatedDifficulty),
  };
}

function effectiveSkill(player: QueuedPlayer): number {
  const latencyPenalty = clamp((player.latencyMs - 100) / 400, 0, 0.25);
  const roleMultiplier = player.preferredRole ? ROLE_WEIGHTS[player.preferredRole] : 0.95;
  return clamp(player.skillScore * roleMultiplier - latencyPenalty, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
