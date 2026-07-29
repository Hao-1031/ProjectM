import type { BossVariantType, BossVariantConfig, FlagshipPeakPhase } from "./types";

// 每个阶段的Boss变异配置
export const BOSS_VARIANT_CONFIGS: Record<FlagshipPeakPhase, BossVariantConfig[]> = {
  standard: [
    { type: "aggressive", healthMul: 0.8, damageMul: 1.5, speedMul: 1.2, abilityType: "charge", weaknessName: "侧翼", weaknessDescription: "从侧面攻击伤害+50%", visualEffect: "红色脉冲" },
    { type: "defensive", healthMul: 1.5, damageMul: 0.7, speedMul: 0.8, abilityType: "shield", weaknessName: "后方", weaknessDescription: "从后方攻击伤害+50%", visualEffect: "蓝色力场" },
    { type: "controller", healthMul: 1.0, damageMul: 1.0, speedMul: 1.0, abilityType: "summon", weaknessName: "头部", weaknessDescription: "攻击头部伤害+50%", visualEffect: "紫色漩涡" },
  ],
  overclock: [
    { type: "aggressive", healthMul: 0.7, damageMul: 1.8, speedMul: 1.4, abilityType: "frenzy", weaknessName: "冷却期", weaknessDescription: "狂暴后3秒内伤害+100%", visualEffect: "橙红火焰" },
    { type: "defensive", healthMul: 1.8, damageMul: 0.6, speedMul: 0.7, abilityType: "regen", weaknessName: "护盾间隙", weaknessDescription: "护盾消失时伤害+75%", visualEffect: "金色护盾" },
    { type: "controller", healthMul: 1.1, damageMul: 1.1, speedMul: 1.1, abilityType: "trap", weaknessName: "陷阱范围外", weaknessDescription: "保持距离攻击伤害+50%", visualEffect: "绿色电网" },
  ],
  hell: [
    { type: "aggressive", healthMul: 0.6, damageMul: 2.2, speedMul: 1.6, abilityType: "rampage", weaknessName: "冲锋后摇", weaknessDescription: "冲锋后2秒内受到伤害+150%", visualEffect: "暗红裂痕" },
    { type: "defensive", healthMul: 2.2, damageMul: 0.5, speedMul: 0.6, abilityType: "fortify", weaknessName: "防御姿态", weaknessDescription: "防御时受到的伤害反弹50%", visualEffect: "黑铁壁垒" },
    { type: "controller", healthMul: 1.2, damageMul: 1.2, speedMul: 1.2, abilityType: "mindControl", weaknessName: "精神干扰", weaknessDescription: "精神控制期间可被暴击", visualEffect: "紫色触须" },
  ],
  abyss: [
    { type: "aggressive", healthMul: 0.5, damageMul: 2.8, speedMul: 1.8, abilityType: "shadowStrike", weaknessName: "光芒", weaknessDescription: "被光照到时防御-50%", visualEffect: "黑暗吞噬" },
    { type: "defensive", healthMul: 2.8, damageMul: 0.4, speedMul: 0.5, abilityType: "voidArmor", weaknessName: "虚空裂隙", weaknessDescription: "虚空裂隙出现时伤害+200%", visualEffect: "虚空漩涡" },
    { type: "controller", healthMul: 1.3, damageMul: 1.3, speedMul: 1.3, abilityType: "darkness", weaknessName: "视野收缩期", weaknessDescription: "视野恢复瞬间伤害+100%", visualEffect: "墨黑领域" },
  ],
  void: [
    { type: "aggressive", healthMul: 0.4, damageMul: 3.5, speedMul: 2.0, abilityType: "whiteHole", weaknessName: "引力波", weaknessDescription: "引力波击中后3秒内伤害+250%", visualEffect: "纯白湮灭" },
    { type: "defensive", healthMul: 3.5, damageMul: 0.3, speedMul: 0.4, abilityType: "nullZone", weaknessName: "绝对零度", weaknessDescription: "冻结状态伤害+300%", visualEffect: "冰晶领域" },
    { type: "controller", healthMul: 1.4, damageMul: 1.4, speedMul: 1.4, abilityType: "timeloop", weaknessName: "时间锚点", weaknessDescription: "破坏时间锚点后伤害+200%", visualEffect: "时钟矩阵" },
  ],
  genesis: [
    { type: "aggressive", healthMul: 0.3, damageMul: 5.0, speedMul: 2.5, abilityType: "bigBang", weaknessName: "创世余波", weaknessDescription: "每次大爆炸后3秒内伤害+500%", visualEffect: "七彩湮灭" },
    { type: "defensive", healthMul: 5.0, damageMul: 0.2, speedMul: 0.3, abilityType: "cosmicShield", weaknessName: "宇宙弦", weaknessDescription: "击中宇宙弦后伤害+400%", visualEffect: "银河护盾" },
    { type: "controller", healthMul: 1.5, damageMul: 1.5, speedMul: 1.5, abilityType: "realityWarp", weaknessName: "现实裂隙", weaknessDescription: "现实扭曲时伤害+300%", visualEffect: "极光裂变" },
  ],
  victory: [],
  defeat: [],
};

// 随机选择Boss变异形态
export function rollBossVariant(phase: FlagshipPeakPhase, rng: () => number): BossVariantConfig {
  const variants = BOSS_VARIANT_CONFIGS[phase];
  if (variants.length === 0) return BOSS_VARIANT_CONFIGS.standard[0];
  return variants[Math.floor(rng() * variants.length)];
}

// 获取Boss变异形态的名称
export function getBossVariantName(type: BossVariantType): string {
  switch (type) {
    case "aggressive": return "狂暴型";
    case "defensive": return "铁壁型";
    case "controller": return "掌控型";
  }
}

// 获取Boss变异形态的颜色
export function getBossVariantColor(type: BossVariantType): string {
  switch (type) {
    case "aggressive": return "#ef4444";
    case "defensive": return "#3b82f6";
    case "controller": return "#a855f7";
  }
}

// 获取阶段的Boss名称
export function getPhaseBossName(phase: FlagshipPeakPhase): string {
  switch (phase) {
    case "standard": return "巡航守护者";
    case "overclock": return "超频暴君";
    case "hell": return "地狱之主";
    case "abyss": return "深渊吞噬者";
    case "void": return "虚空湮灭者";
    case "genesis": return "创世泰坦";
    default: return "未知首领";
  }
}

// 获取阶段Boss对应的波次
export function getPhaseBossWave(phase: FlagshipPeakPhase): number {
  switch (phase) {
    case "standard": return 10;
    case "overclock": return 23;
    case "hell": return 25;
    case "abyss": return 35;
    case "void": return 45;
    case "genesis": return 50;
    default: return 0;
  }
}