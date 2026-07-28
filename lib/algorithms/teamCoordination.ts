/**
 * β-6 Bot 团队协同算法 (Team Coordination)
 *
 * 将单个 Bot 的战术决策扩展为多 Bot 团队协同：
 * - 角色分工：根据团队 composition 动态分配角色
 * - 阵型编排：突击/狙击/控制/游击阵型生成
 * - 目标同步：避免多个 Bot 同时攻击同一目标（过杀）
 * - 掩护撤退：低血量队友自动呼叫掩护
 * - 火力集中：高价值目标标记协攻
 */

export type TeamRole = "point" | "flanker" | "support" | "anchor";

export interface TeamMember {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  role: TeamRole;
  /** 当前目标 ID */
  targetId: string | null;
  /** 0~1 技能评分 */
  skillScore: number;
}

export interface TeamTarget {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  /** 威胁评分 0~1 */
  threatScore: number;
  /** 是否为高价值目标 */
  isHighValue: boolean;
  /** 当前被多少队友锁定 */
  lockedByCount: number;
}

export interface TeamFormation {
  /** 阵型类型 */
  type: "arrow" | "spread" | "diamond" | "line" | "wedge";
  /** 每个成员的目标位置 */
  positions: { memberId: string; x: number; y: number }[];
  /** 阵型朝向角度（弧度） */
  facingAngle: number;
  /** 阵型间距 */
  spacing: number;
}

export interface CoordinationConfig {
  /** 过杀阈值：目标血量低于此比例时不再分配新攻击者 */
  overkillThreshold: number;
  /** 掩护触发血量比例 */
  coverCallThreshold: number;
  /** 火力集中标记血量比例 */
  focusFireThreshold: number;
  /** 最大锁定同一目标数 */
  maxLockOnTarget: number;
  /** 阵型间距 */
  formationSpacing: number;
  /** 目标分配粘性系数 */
  targetStickiness: number;
}

export interface CoordinationResult {
  /** 每个成员更新的目标分配 */
  assignments: { memberId: string; targetId: string | null; priority: number }[];
  /** 推荐的阵型 */
  formation: TeamFormation;
  /** 火力集中目标 */
  focusFireTargets: string[];
  /** 需要掩护的成员 */
  coveringMembers: { memberId: string; priority: number }[];
  /** 战术建议 */
  tacticalAdvice: string[];
}

const DEFAULT_CONFIG: CoordinationConfig = {
  overkillThreshold: 0.3,
  coverCallThreshold: 0.35,
  focusFireThreshold: 0.5,
  maxLockOnTarget: 2,
  formationSpacing: 120,
  targetStickiness: 0.7,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroid(positions: { x: number; y: number }[]): { x: number; y: number } {
  if (positions.length === 0) return { x: 0, y: 0 };
  return {
    x: positions.reduce((s, p) => s + p.x, 0) / positions.length,
    y: positions.reduce((s, p) => s + p.y, 0) / positions.length,
  };
}

/**
 * 根据团队 composition 自动分配角色
 */
export function assignTeamRoles(
  members: { id: string; health: number; maxHealth: number; skillScore: number }[]
): { memberId: string; role: TeamRole }[] {
  const sorted = [...members].sort((a, b) => b.skillScore - a.skillScore);
  const roles: TeamRole[] = [];
  const count = members.length;

  if (count === 1) {
    roles.push("point");
  } else if (count === 2) {
    roles.push("point", "flanker");
  } else if (count === 3) {
    roles.push("point", "flanker", "support");
  } else {
    // 4+ members: assign all roles
    const template: TeamRole[] = ["point", "flanker", "support", "anchor"];
    for (let i = 0; i < count; i++) {
      roles.push(template[i % template.length]);
    }
  }

  return sorted.map((m, i) => ({ memberId: m.id, role: roles[i] }));
}

/**
 * 生成阵型：根据团队朝向和敌人位置计算各成员站位
 */
export function generateFormation(
  members: { id: string; x: number; y: number; role: TeamRole }[],
  facingTarget: { x: number; y: number },
  config: Partial<CoordinationConfig> = {}
): TeamFormation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const center = centroid(members.map((m) => ({ x: m.x, y: m.y })));
  const angle = Math.atan2(facingTarget.y - center.y, facingTarget.x - center.x);

  const type = members.length <= 2 ? "arrow" : members.length === 3 ? "wedge" : "diamond";

  const positions: TeamFormation["positions"] = [];
  const spacing = cfg.formationSpacing;

  const roleOffsets: Record<TeamRole, { dx: number; dy: number }> = {
    point: { dx: spacing, dy: 0 },
    flanker: { dx: -spacing * 0.5, dy: spacing * 0.8 },
    support: { dx: -spacing * 0.8, dy: -spacing * 0.3 },
    anchor: { dx: -spacing, dy: 0 },
  };

  for (const member of members) {
    const offset = roleOffsets[member.role];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = offset.dx * cos - offset.dy * sin;
    const ry = offset.dx * sin + offset.dy * cos;
    positions.push({
      memberId: member.id,
      x: round2(center.x + rx),
      y: round2(center.y + ry),
    });
  }

  return {
    type,
    positions,
    facingAngle: round2(angle),
    spacing,
  };
}

/**
 * 协同目标分配：避免过杀，标记高价值目标集火
 */
export function coordinateTargets(
  members: TeamMember[],
  targets: TeamTarget[],
  config: Partial<CoordinationConfig> = {}
): CoordinationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tacticalAdvice: string[] = [];
  const focusFireTargets: string[] = [];
  const coveringMembers: CoordinationResult["coveringMembers"] = [];

  // 识别需要掩护的成员
  for (const member of members) {
    const healthRatio = member.maxHealth > 0 ? member.health / member.maxHealth : 1;
    if (healthRatio < cfg.coverCallThreshold) {
      coveringMembers.push({
        memberId: member.id,
        priority: round2((cfg.coverCallThreshold - healthRatio) / cfg.coverCallThreshold),
      });
    }
  }

  if (coveringMembers.length > 0) {
    tacticalAdvice.push(`${coveringMembers.length} 名队友需要掩护，优先分配支援角色`);
  }

  // 计算每个目标的有效性
  const scoredTargets = targets.map((t) => {
    const healthRatio = t.maxHealth > 0 ? t.health / t.maxHealth : 1;
    let score = t.threatScore * 100 + (1 - healthRatio) * 50;

    // 高价值目标加分
    if (t.isHighValue && healthRatio > cfg.focusFireThreshold) {
      score += 80;
      focusFireTargets.push(t.id);
    }

    // 过杀惩罚
    if (t.lockedByCount >= cfg.maxLockOnTarget) {
      score -= 200;
    } else if (t.lockedByCount >= cfg.maxLockOnTarget - 1 && healthRatio < cfg.overkillThreshold) {
      score -= 150;
    }

    return { ...t, score };
  });

  if (focusFireTargets.length > 0) {
    tacticalAdvice.push(`标记 ${focusFireTargets.length} 个高价值目标集火，优先歼灭`);
  }

  // 为每个成员分配最优目标
  const assignments: CoordinationResult["assignments"] = [];
  const lockCounts = new Map<string, number>();

  for (const member of members) {
    let bestTarget: TeamTarget | null = null;
    let bestScore = -Infinity;

    for (const target of scoredTargets) {
      const dist = distance(member, target);
      const distPenalty = dist * 0.15;
      const stickiness = member.targetId === target.id ? cfg.targetStickiness * 50 : 0;
      const lockBonus = (lockCounts.get(target.id) ?? 0) < cfg.maxLockOnTarget ? 0 : -100;

      const score = target.score - distPenalty + stickiness + lockBonus;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    assignments.push({
      memberId: member.id,
      targetId: bestTarget?.id ?? null,
      priority: bestTarget ? round2(clamp(bestScore / 200, 0, 1)) : 0,
    });

    if (bestTarget) {
      lockCounts.set(bestTarget.id, (lockCounts.get(bestTarget.id) ?? 0) + 1);
    }
  }

  // 生成阵型
  const formation = generateFormation(
    members.map((m) => ({ id: m.id, x: m.x, y: m.y, role: m.role })),
    targets.length > 0 ? { x: targets[0].x, y: targets[0].y } : { x: 0, y: 0 },
    cfg
  );

  return {
    assignments,
    formation,
    focusFireTargets,
    coveringMembers,
    tacticalAdvice,
  };
}

/**
 * 评估团队协同效率
 */
export function evaluateCoordinationEfficiency(
  result: CoordinationResult,
  members: TeamMember[],
  targets: TeamTarget[]
): { efficiencyScore: number; wastedDamage: number; coverage: number; targetingDiversity: number } {
  const assignedTargets = new Set(result.assignments.filter((a) => a.targetId).map((a) => a.targetId));
  const totalTargets = targets.length;
  const coverage = totalTargets > 0 ? assignedTargets.size / totalTargets : 0;

  // 多目标覆盖就是高效
  const targetingDiversity = totalTargets > 0 ? assignedTargets.size / Math.min(totalTargets, members.length) : 0;

  // 浪费伤害估算：多个成员锁定同一低血量目标
  let wastedDamage = 0;
  const lockCounts = new Map<string, number>();
  for (const a of result.assignments) {
    if (!a.targetId) continue;
    lockCounts.set(a.targetId, (lockCounts.get(a.targetId) ?? 0) + 1);
  }
  for (const [targetId, count] of lockCounts) {
    const target = targets.find((t) => t.id === targetId);
    if (target) {
      const healthRatio = target.maxHealth > 0 ? target.health / target.maxHealth : 0;
      if (healthRatio < 0.3 && count > 1) {
        wastedDamage += (count - 1) * (1 - healthRatio) * 50;
      }
    }
  }

  const efficiencyScore = round2(
    clamp(coverage * 0.4 + targetingDiversity * 0.4 - wastedDamage * 0.01 * 0.2, 0, 1)
  );

  return {
    efficiencyScore,
    wastedDamage: round2(wastedDamage),
    coverage: round2(coverage),
    targetingDiversity: round2(targetingDiversity),
  };
}