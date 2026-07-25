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

export function calculateSkillScore(player: PlayerProfile): number {
  const winComponent = clamp(player.historicalWinRate, 0, 1) * 0.35;
  const accuracyComponent = clamp(player.accuracy, 0, 1) * 0.25;

  const dpsBaseline = 120;
  const dpsRatio = player.averageDps / dpsBaseline;
  const dpsComponent = clamp(dpsRatio, 0, 2) * 0.2;

  const deathComponent =
    Math.max(0, 1 - clamp(player.averageDeathsPerRun / 5, 0, 1)) * 0.2;

  return clamp(winComponent + accuracyComponent + dpsComponent + deathComponent, 0, 1);
}

export function calculateTeamSkillScore(team: TeamProfile): number {
  if (!team.players.length) return 0.5;
  const rawScores = team.players.map(calculateSkillScore);
  const avg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
  const spread = Math.max(...rawScores) - Math.min(...rawScores);

  // 队伍方差过大时略微降低整体评估，避免高带低产生碾压体感
  const cohesion = clamp(1 - spread * 0.4, 0.7, 1);
  return clamp(avg * cohesion, 0, 1);
}

export function calculateDifficultyAdjustment(
  team: TeamProfile,
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number }
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

  return clamp(adjustment, -0.6, 0.6);
}

export function adjustDefenseWave(
  base: DefenseWaveBase,
  team: TeamProfile,
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number }
): WaveParameters {
  const adjustment = calculateDifficultyAdjustment(team, previousWaveResult);

  const enemyCountMultiplier = clamp(1 + adjustment * 0.5, 0.65, 1.45);
  const eliteRatio = clamp(base.eliteCount / Math.max(1, base.enemyCount) + adjustment * 0.2, 0, 0.55);
  const enemyHealthMultiplier = clamp(1 + adjustment * 0.35, 0.75, 1.35);
  const enemyDamageMultiplier = clamp(1 + adjustment * 0.3, 0.8, 1.3);
  const spawnIntervalMultiplier = clamp(1 - adjustment * 0.25, 0.75, 1.25);
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
