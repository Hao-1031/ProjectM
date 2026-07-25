export interface PlayerProfile {
  historicalWinRate: number;
  averageDps: number;
  accuracy: number;
  averageDeathsPerRun: number;
  totalRuns: number;
  heroId?: string;
}

export interface TeamProfile {
  players: PlayerProfile[];
  averageLatencyMs?: number;
}

export interface WaveParameters {
  enemyCountMultiplier: number;
  eliteRatio: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  spawnIntervalMultiplier: number;
  specialEventChance: number;
}

export interface DefenseWaveBase {
  index: number;
  enemyCount: number;
  eliteCount: number;
  enemyHealthMultiplier?: number;
  enemyDamageMultiplier?: number;
}

const TARGET_WIN_RATE = 0.55;
const MAX_DEATH_PENALTY = 0.35;

// 英雄间协同系数：某些组合会显著降低/提升难度
const HERO_SYNERGY: Record<string, Record<string, number>> = {
  nitrogen: { twilight: 0.05, bastion: 0.03 },
  twilight: { nitrogen: 0.05, leopard: 0.04 },
  leopard: { viper: 0.03, twilight: 0.04 },
  recon: { falcon: 0.04, viper: 0.03 },
  viper: { recon: 0.04, leopard: 0.03 },
  falcon: { recon: 0.04, bastion: 0.03 },
  bastion: { nitrogen: 0.03, falcon: 0.03 },
};

export function calculateSkillScore(player: PlayerProfile): number {
  const winComponent = clamp(player.historicalWinRate, 0, 1) * 0.35;
  const accuracyComponent = clamp(player.accuracy, 0, 1) * 0.25;

  const dpsBaseline = 120;
  const dpsRatio = player.averageDps / dpsBaseline;
  const dpsComponent = clamp(dpsRatio, 0, 2.5) * 0.2;

  const deathComponent =
    Math.max(0, 1 - clamp(player.averageDeathsPerRun / 5, 0, 1)) * 0.2;

  // 经验修正：场次过少时向均值回归，避免新人偶然数据失真
  const experienceWeight = clamp(Math.log1p(player.totalRuns) / Math.log1p(50), 0, 1);
  const rawScore = winComponent + accuracyComponent + dpsComponent + deathComponent;
  const regressedScore = rawScore * experienceWeight + 0.5 * (1 - experienceWeight);

  return clamp(regressedScore, 0, 1);
}

export function calculateHeroSynergyBonus(team: TeamProfile): number {
  if (team.players.length < 2) return 0;

  let bonus = 0;
  const heroIds = team.players.map((p) => p.heroId).filter(Boolean) as string[];
  const checked = new Set<string>();

  for (let i = 0; i < heroIds.length; i++) {
    for (let j = i + 1; j < heroIds.length; j++) {
      const a = heroIds[i];
      const b = heroIds[j];
      const pairKey = [a, b].sort().join("-");
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      const direct = HERO_SYNERGY[a]?.[b] ?? 0;
      const reverse = HERO_SYNERGY[b]?.[a] ?? 0;
      bonus += Math.max(direct, reverse);
    }
  }

  return clamp(bonus, -0.1, 0.2);
}

export function calculateTeamSkillScore(team: TeamProfile): number {
  if (!team.players.length) return 0.5;
  const rawScores = team.players.map(calculateSkillScore);
  const avg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
  const spread = Math.max(...rawScores) - Math.min(...rawScores);

  // 队伍方差过大时略微降低整体评估，避免高带低产生碾压体感
  const cohesion = clamp(1 - spread * 0.4, 0.7, 1);
  const synergy = calculateHeroSynergyBonus(team);

  return clamp(avg * cohesion + synergy, 0, 1);
}

export function calculateDifficultyAdjustment(
  team: TeamProfile,
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number },
  waveIndex = 0
): number {
  const skill = calculateTeamSkillScore(team);

  // 基础偏移：目标胜率 55% 意味着高手需要更难，新手需要更简单
  let adjustment = (skill - TARGET_WIN_RATE) * 1.6;

  // 上一轮结果反馈：如果核心血量很低或失败，降低难度
  if (previousWaveResult) {
    const healthFactor = (previousWaveResult.coreHealthPercent - 0.5) * 0.8;
    const clearBonus = previousWaveResult.cleared ? 0.1 : -0.25;
    adjustment += healthFactor + clearBonus;
  }

  // 延迟惩罚：高延迟队伍给予轻微减负
  if (team.averageLatencyMs && team.averageLatencyMs > 150) {
    adjustment -= clamp((team.averageLatencyMs - 150) / 500, 0, 0.15);
  }

  // 波次递进：后期波次在高手局中更难，新手局中仍保持可控
  const waveScale = clamp(waveIndex / 10, 0, 1);
  adjustment = adjustment * (1 + waveScale * 0.25);

  return clamp(adjustment, -0.6, 0.75);
}

export function adjustDefenseWave(
  base: DefenseWaveBase,
  team: TeamProfile,
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number }
): WaveParameters {
  const adjustment = calculateDifficultyAdjustment(team, previousWaveResult, base.index);

  const enemyCountMultiplier = clamp(1 + adjustment * 0.5, 0.65, 1.55);
  const eliteRatio = clamp(base.eliteCount / Math.max(1, base.enemyCount) + adjustment * 0.2, 0, 0.55);
  const enemyHealthMultiplier = clamp(1 + adjustment * 0.35, 0.75, 1.45);
  const enemyDamageMultiplier = clamp(1 + adjustment * 0.3, 0.8, 1.35);
  const spawnIntervalMultiplier = clamp(1 - adjustment * 0.25, 0.7, 1.3);
  const specialEventChance = clamp(0.15 + adjustment * 0.3, 0, 0.6);

  return {
    enemyCountMultiplier,
    eliteRatio,
    enemyHealthMultiplier,
    enemyDamageMultiplier,
    spawnIntervalMultiplier,
    specialEventChance,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
