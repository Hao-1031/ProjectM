import type { EnemyVariant, BossId, HeroId } from "../types";

/**
 * α 动态节律算法类型定义
 */

export interface AlphaCurveParams {
  /** Sigmoid 陡峭程度，越大中后期转折越明显 */
  steepness: number;
  /** Sigmoid 中点位置（0~1，相对波次进度） */
  midpoint: number;
  /** 基础难度上限 */
  maxDifficulty: number;
  /** 波次间呼吸感强度 */
  breathingStrength: number;
}

export interface AlphaEfficiencyParams {
  /** 击杀效率响应灵敏度（0~1） */
  responsiveness: number;
  /** 修正因子下限 */
  minFactor: number;
  /** 修正因子上限 */
  maxFactor: number;
  /** 统计窗口时长（秒） */
  windowSeconds: number;
}

export interface AlphaCounterParams {
  /** 英雄-敌人相克权重强度 */
  weightStrength: number;
}

export interface AlphaParams {
  curve: AlphaCurveParams;
  efficiency: AlphaEfficiencyParams;
  counter: AlphaCounterParams;
  /** 是否启用 α 算法（用于 A/B 测试） */
  enabled: boolean;
  /** 算法版本 */
  version: string;
}

export interface HeroBuildSnapshot {
  heroId: HeroId | null;
  /** 武器 DPS 总和 */
  totalDps: number;
  /** 平均射程 */
  averageRange: number;
  /** 是否有控制/减速能力 */
  hasCrowdControl: boolean;
  /** 是否有范围伤害 */
  hasAreaDamage: boolean;
  /** 是否有高爆发 */
  hasBurstDamage: boolean;
  /** 生存评分（血量+护甲） */
  survivability: number;
}

export interface AlphaDifficultySnapshot {
  /** 当前波次（0-based） */
  waveIndex: number;
  /** 总波次 */
  totalWaves: number;
  /** Sigmoid 基础难度 0~1 */
  baseDifficulty: number;
  /** 玩家击杀效率修正因子 */
  efficiencyFactor: number;
  /** 英雄相克修正因子 */
  counterFactor: number;
  /** 综合难度 0~1 */
  finalDifficulty: number;
}

export interface AlphaEnemyStats {
  maxHp: number;
  damage: number;
  speed: number;
  spawnIntervalMs: number;
  eliteChance: number;
  /** 建议同时存在上限 */
  maxActiveCount: number;
  /** 当前波次敌人数 */
  waveEnemyCount: number;
  /** 精英敌人数 */
  eliteCount: number;
  /** 推荐敌人类型权重 */
  variantWeights: Record<EnemyVariant, number>;
}

export interface AlphaBossStats {
  bossId: BossId;
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  /** Boss 前缓冲波次强度系数 */
  preBossRelief: number;
  /** Boss 后释放波次强度系数 */
  postBossRelief: number;
}

export interface AlphaTelemetryEvent {
  timestamp: number;
  waveIndex: number;
  enemyVariant: EnemyVariant | BossId;
  event: "spawn" | "kill" | "damage_dealt" | "damage_taken" | "node_captured" | "boss_phase";
  value: number;
}

export interface AlphaKillWindow {
  spawned: number;
  killed: number;
  /** 窗口内实际击杀率 */
  killRate: number;
  /** 窗口内预期击杀率（基于当前难度） */
  expectedKillRate: number;
}

export interface AlphaRhythmMetrics {
  /** 波次紧张度 0~1 */
  intensity: number;
  /** 玩家压力值 0~1（基于血量/核心血量） */
  pressure: number;
  /** 击杀效率 0~1 */
  killEfficiency: number;
  /** 当前是否处于释放阶段 */
  isRelief: boolean;
}
