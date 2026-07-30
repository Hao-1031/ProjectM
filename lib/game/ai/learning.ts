import type { Player, HeroId } from "../types";
import type { LearningMemory, Vec2, AbilityGate } from "./types";
import { distance } from "../math";

/**
 * β 学习与适应系统
 *
 * 实现三个维度的学习能力：
 * 1. 防守习惯识别：追踪玩家高频驻留区域，后续波次优先避开
 * 2. 英雄对策：通过观察玩家行为特征识别英雄类型
 * 3. 波次递增难度：每5波自动提升AI参数
 */

const HEATMAP_CELL_SIZE = 80;
const HEATMAP_DECAY = 0.95;
const MAX_EVASIVE_PATTERNS = 20;
const HERO_DETECTION_THRESHOLD = 0.7;

/** 英雄行为特征签名 */
interface HeroSignature {
  heroId: HeroId;
  /** 平均移动速度（归一化） */
  avgSpeed: number;
  /** 部署物使用频率 */
  deployableUsage: number;
  /** 近战武器使用比例 */
  meleeRatio: number;
  /** 技能使用频率 */
  skillFrequency: number;
  /** 偏好攻击距离 */
  preferredRange: number;
}

const HERO_SIGNATURES: HeroSignature[] = [
  { heroId: "bastion", avgSpeed: 0.3, deployableUsage: 0.9, meleeRatio: 0.1, skillFrequency: 0.5, preferredRange: 300 },
  { heroId: "leopard", avgSpeed: 0.9, deployableUsage: 0.1, meleeRatio: 0.85, skillFrequency: 0.6, preferredRange: 80 },
  { heroId: "nitrogen", avgSpeed: 0.5, deployableUsage: 0.2, meleeRatio: 0.2, skillFrequency: 0.7, preferredRange: 350 },
  { heroId: "twilight", avgSpeed: 0.4, deployableUsage: 0.3, meleeRatio: 0.15, skillFrequency: 0.8, preferredRange: 280 },
  { heroId: "recon", avgSpeed: 0.7, deployableUsage: 0.4, meleeRatio: 0.3, skillFrequency: 0.4, preferredRange: 220 },
  { heroId: "falcon", avgSpeed: 0.6, deployableUsage: 0.15, meleeRatio: 0.2, skillFrequency: 0.55, preferredRange: 400 },
  { heroId: "viper", avgSpeed: 0.8, deployableUsage: 0.05, meleeRatio: 0.7, skillFrequency: 0.5, preferredRange: 120 },
];

/** 创建空的学习记忆 */
export function createLearningMemory(): LearningMemory {
  return {
    heatmap: new Map(),
    evasivePatterns: [],
    detectedHero: null,
    heroConfidence: 0,
    totalWaves: 0,
    weaponUsage: new Map(),
    waveDifficultyBonus: 0,
    lastWaveUpdate: 0,
  };
}

/** 更新学习记忆（每帧调用） */
export function updateLearningMemory(
  memory: LearningMemory,
  player: Player,
  mapWidth: number,
  mapHeight: number,
  wave: number,
  dt: number,
  gate: AbilityGate
): void {
  if (!gate.habitRecognition && !gate.heroCounter) return;

  // 更新热力图
  updateHeatmap(memory, player, mapWidth, mapHeight);

  // 更新波次难度
  if (wave !== memory.lastWaveUpdate) {
    memory.totalWaves = wave;
    memory.waveDifficultyBonus = Math.min((wave - 1) * 0.012, 0.5);
    memory.lastWaveUpdate = wave;
  }

  // 更新英雄检测
  if (gate.heroCounter) {
    updateHeroDetection(memory, player, dt);
  }

  // 热力图衰减
  decayHeatmap(memory, dt);
}

/** 更新玩家位置热力图 */
function updateHeatmap(
  memory: LearningMemory,
  player: Player,
  mapWidth: number,
  mapHeight: number
): void {
  const cellX = Math.floor(player.x / HEATMAP_CELL_SIZE);
  const cellY = Math.floor(player.y / HEATMAP_CELL_SIZE);
  const key = `${cellX},${cellY}`;

  const current = memory.heatmap.get(key) ?? 0;
  memory.heatmap.set(key, Math.min(current + 0.02, 1.0));
}

/** 热力图衰减 */
function decayHeatmap(memory: LearningMemory, dt: number): void {
  const decay = Math.pow(HEATMAP_DECAY, dt * 60);
  for (const [key, value] of memory.heatmap) {
    const newValue = value * decay;
    if (newValue < 0.01) {
      memory.heatmap.delete(key);
    } else {
      memory.heatmap.set(key, newValue);
    }
  }
}

/** 获取玩家最常驻留的区域 */
export function getPlayerHotZone(
  memory: LearningMemory,
  mapWidth: number,
  mapHeight: number
): Vec2 | null {
  if (memory.heatmap.size === 0) return null;

  let bestKey = "";
  let bestValue = 0;

  for (const [key, value] of memory.heatmap) {
    if (value > bestValue) {
      bestValue = value;
      bestKey = key;
    }
  }

  if (bestValue < 0.15) return null;

  const [cx, cy] = bestKey.split(",").map(Number);
  return {
    x: cx * HEATMAP_CELL_SIZE + HEATMAP_CELL_SIZE / 2,
    y: cy * HEATMAP_CELL_SIZE + HEATMAP_CELL_SIZE / 2,
  };
}

/** 获取远离玩家热区的进攻方向（防守习惯识别的核心应用） */
export function getAvoidHotZoneDirection(
  memory: LearningMemory,
  currentX: number,
  currentY: number,
  playerX: number,
  playerY: number,
  mapWidth: number,
  mapHeight: number
): Vec2 | null {
  const hotZone = getPlayerHotZone(memory, mapWidth, mapHeight);
  if (!hotZone) return null;

  // 如果玩家当前就在热区附近，敌人从反方向进攻
  const distToHotZone = distance({ x: playerX, y: playerY }, hotZone);
  if (distToHotZone < 200) {
    // 玩家在热区 → 敌人从热区反方向进攻
    const dx = playerX - hotZone.x;
    const dy = playerY - hotZone.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  return null;
}

/** 更新英雄检测 */
function updateHeroDetection(
  memory: LearningMemory,
  player: Player,
  dt: number
): void {
  // 收集玩家行为特征
  const observed: HeroSignature = {
    heroId: "nitrogen" as HeroId,
    avgSpeed: clamp(player.speed / 400, 0, 1),
    deployableUsage: player.deployableUpgrades ? Object.keys(player.deployableUpgrades).length / 10 : 0,
    meleeRatio: player.weapons.some((w) => w.isMelee) ? 0.8 : 0.1,
    skillFrequency: (player.skillTimer > 0 ? 0.7 : 0.3),
    preferredRange: player.weapons[0]?.range ?? 200,
  };

  // 匹配英雄签名
  let bestMatch: HeroId | null = null;
  let bestScore = 0;

  for (const sig of HERO_SIGNATURES) {
    const score = calculateSignatureMatch(observed, sig);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sig.heroId;
    }
  }

  if (bestScore > HERO_DETECTION_THRESHOLD && bestMatch) {
    memory.detectedHero = bestMatch;
    memory.heroConfidence = lerp(memory.heroConfidence, bestScore, dt * 2);
  }
}

/** 计算行为特征匹配度 */
function calculateSignatureMatch(observed: HeroSignature, signature: HeroSignature): number {
  const speedMatch = 1 - Math.abs(observed.avgSpeed - signature.avgSpeed);
  const deployMatch = 1 - Math.abs(observed.deployableUsage - signature.deployableUsage);
  const meleeMatch = 1 - Math.abs(observed.meleeRatio - signature.meleeRatio);
  const skillMatch = 1 - Math.abs(observed.skillFrequency - signature.skillFrequency);

  return (speedMatch * 0.25 + deployMatch * 0.25 + meleeMatch * 0.3 + skillMatch * 0.2);
}

/** 获取波次难度加成 */
export function getWaveDifficultyBonus(memory: LearningMemory): number {
  return memory.waveDifficultyBonus;
}

/** 获取检测到的英雄ID */
export function getDetectedHero(memory: LearningMemory): HeroId | null {
  if (memory.heroConfidence < HERO_DETECTION_THRESHOLD) return null;
  return memory.detectedHero;
}

/** 记录玩家闪避方向（用于预判瞄准） */
export function recordEvasivePattern(
  memory: LearningMemory,
  direction: Vec2
): void {
  memory.evasivePatterns.push(direction);
  if (memory.evasivePatterns.length > MAX_EVASIVE_PATTERNS) {
    memory.evasivePatterns.shift();
  }
}

/** 获取玩家平均闪避方向 */
export function getAverageEvasiveDirection(memory: LearningMemory): Vec2 | null {
  if (memory.evasivePatterns.length === 0) return null;

  let sumX = 0;
  let sumY = 0;
  for (const dir of memory.evasivePatterns) {
    sumX += dir.x;
    sumY += dir.y;
  }

  const len = Math.hypot(sumX, sumY);
  if (len < 0.001) return null;

  return { x: sumX / len, y: sumY / len };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1);
}