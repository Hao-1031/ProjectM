import type { SkillBranchType, SkillNode, HeroSkillTree } from "./types";
import { uid } from "./math";

// HeroId for the skill tree system (flagship peak heroes)
export type SkillTreeHeroId = "vanguard" | "phantom" | "engineer" | "sentinel" | "storm";

// ============================================================================
// Skill Tree Data — 5 heroes × 3 branches × 5 tiers = 75 nodes total
// ============================================================================

interface SkillNodeDef {
  id: string;
  name: string;
  branch: SkillBranchType;
  tier: number;
  description: string;
  effect: Record<string, number>;
  requiredPoints: number;
}

function buildLineage(
  heroId: string,
  branch: SkillBranchType,
  nodes: SkillNodeDef[],
): SkillNode[] {
  return nodes.map((def, i) => {
    const next = nodes[i + 1];
    return {
      ...def,
      id: `${heroId}_${branch}_${def.tier}`,
      children: next ? [`${heroId}_${branch}_${next.tier}`] : [],
      unlocked: false,
    };
  });
}

function buildHeroTree(
  heroId: string,
  offense: SkillNodeDef[],
  defense: SkillNodeDef[],
  utility: SkillNodeDef[],
): HeroSkillTree {
  return {
    heroId,
    branches: {
      offense: buildLineage(heroId, "offense", offense),
      defense: buildLineage(heroId, "defense", defense),
      utility: buildLineage(heroId, "utility", utility),
    },
    totalPoints: 0,
    maxPoints: 0,
  };
}

// ---------------------------------------------------------------------------
// vanguard (先锋) — 坦克型英雄
// ---------------------------------------------------------------------------
const vanguardTree: HeroSkillTree = buildHeroTree(
  "vanguard",
  [
    { id: "", name: "重击", branch: "offense", tier: 1, description: "基础攻击力提升10%", effect: { damageBonus: 0.10 }, requiredPoints: 1 },
    { id: "", name: "破甲", branch: "offense", tier: 2, description: "攻击无视目标15%护甲", effect: { armorPenetration: 0.15 }, requiredPoints: 2 },
    { id: "", name: "战吼", branch: "offense", tier: 3, description: "释放战吼提升周围友军20%攻击力，持续8秒", effect: { allyDamageBonus: 0.20, auraDuration: 8 }, requiredPoints: 3 },
    { id: "", name: "狂暴", branch: "offense", tier: 4, description: "生命低于30%时攻击速度+40%，伤害+25%", effect: { lowHpAttackSpeed: 0.40, lowHpDamageBonus: 0.25 }, requiredPoints: 4 },
    { id: "", name: "毁灭打击", branch: "offense", tier: 5, description: "每第5次攻击造成300%伤害并眩晕目标1.5秒", effect: { empoweredAttackDamage: 3.0, stunDuration: 1.5 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "铁壁", branch: "defense", tier: 1, description: "最大生命值+15%", effect: { healthBonus: 0.15 }, requiredPoints: 1 },
    { id: "", name: "坚韧", branch: "defense", tier: 2, description: "护甲+20%，受到控制时间-15%", effect: { armorBonus: 0.20, ccReduction: 0.15 }, requiredPoints: 2 },
    { id: "", name: "反伤", branch: "defense", tier: 3, description: "将受到伤害的15%反弹给攻击者", effect: { thornsDamage: 0.15 }, requiredPoints: 3 },
    { id: "", name: "不屈", branch: "defense", tier: 4, description: "受到致命伤害时保留1点生命，获得3秒无敌（冷却120秒）", effect: { deathDefy: 1, invincibleDuration: 3, deathDefyCooldown: 120 }, requiredPoints: 4 },
    { id: "", name: "不死之身", branch: "defense", tier: 5, description: "每秒回复最大生命值2%，被控制时回复翻倍", effect: { healthRegen: 0.02, ccRegenBonus: 2.0 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "冲锋", branch: "utility", tier: 1, description: "移动速度+12%", effect: { speedBonus: 0.12 }, requiredPoints: 1 },
    { id: "", name: "嘲讽", branch: "utility", tier: 2, description: "强制周围敌人攻击自己，持续4秒，冷却20秒", effect: { tauntDuration: 4, tauntCooldown: 20 }, requiredPoints: 2 },
    { id: "", name: "战旗", branch: "utility", tier: 3, description: "插下战旗，范围内友军全属性+15%，持续15秒", effect: { bannerBuff: 0.15, bannerDuration: 15 }, requiredPoints: 3 },
    { id: "", name: "团队护盾", branch: "utility", tier: 4, description: "为全体友军提供最大生命值30%的护盾，持续10秒", effect: { teamShield: 0.30, shieldDuration: 10 }, requiredPoints: 4 },
    { id: "", name: "战场统帅", branch: "utility", tier: 5, description: "所有光环效果翻倍，冷却缩减+25%", effect: { auraDouble: 1, cooldownReduction: 0.25 }, requiredPoints: 5 },
  ],
);

// ---------------------------------------------------------------------------
// phantom (幻影) — 刺客型英雄
// ---------------------------------------------------------------------------
const phantomTree: HeroSkillTree = buildHeroTree(
  "phantom",
  [
    { id: "", name: "暗影突刺", branch: "offense", tier: 1, description: "从背后攻击时伤害+20%", effect: { backstabBonus: 0.20 }, requiredPoints: 1 },
    { id: "", name: "背刺", branch: "offense", tier: 2, description: "背刺暴击率+25%，暴击伤害+50%", effect: { backstabCritChance: 0.25, backstabCritDamage: 0.50 }, requiredPoints: 2 },
    { id: "", name: "毒刃", branch: "offense", tier: 3, description: "攻击附带中毒效果，每秒造成攻击力30%伤害，持续5秒，可叠加3层", effect: { poisonDot: 0.30, poisonDuration: 5, poisonMaxStacks: 3 }, requiredPoints: 3 },
    { id: "", name: "暗杀", branch: "offense", tier: 4, description: "对生命低于50%的敌人造成额外80%伤害", effect: { executeThreshold: 0.50, executeDamage: 0.80 }, requiredPoints: 4 },
    { id: "", name: "死神降临", branch: "offense", tier: 5, description: "击杀敌人后获得3秒隐身和50%移速加成，下一次攻击造成400%伤害", effect: { killInvis: 1, killSpeedBoost: 0.50, killNextAttack: 4.0, killBuffDuration: 3 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "闪避", branch: "defense", tier: 1, description: "闪避率+15%", effect: { dodgeChance: 0.15 }, requiredPoints: 1 },
    { id: "", name: "烟雾弹", branch: "defense", tier: 2, description: "受到攻击时释放烟雾，降低周围敌人命中率30%，持续3秒", effect: { smokeBlind: 0.30, smokeDuration: 3 }, requiredPoints: 2 },
    { id: "", name: "影遁", branch: "defense", tier: 3, description: "闪避后进入隐身状态2秒，冷却10秒", effect: { dodgeInvis: 1, dodgeInvisDuration: 2, dodgeInvisCooldown: 10 }, requiredPoints: 3 },
    { id: "", name: "幻影分身", branch: "defense", tier: 4, description: "生命低于20%时制造一个分身吸引火力，分身持续8秒，冷却60秒", effect: { cloneTrigger: 0.20, cloneDuration: 8, cloneCooldown: 60 }, requiredPoints: 4 },
    { id: "", name: "虚无", branch: "defense", tier: 5, description: "主动进入虚无状态2秒，免疫所有伤害和控制", effect: { voidDuration: 2, voidCooldown: 45 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "疾跑", branch: "utility", tier: 1, description: "移动速度+15%，脱离战斗后翻倍", effect: { speedBonus: 0.15, outOfCombatSpeedBonus: 2.0 }, requiredPoints: 1 },
    { id: "", name: "标记", branch: "utility", tier: 2, description: "标记目标敌人，使其受到伤害+20%，持续8秒", effect: { markDamageTaken: 0.20, markDuration: 8 }, requiredPoints: 2 },
    { id: "", name: "暗影步", branch: "utility", tier: 3, description: "瞬间移动至目标身后，下次攻击必定暴击，冷却15秒", effect: { shadowStepCooldown: 15 }, requiredPoints: 3 },
    { id: "", name: "致命陷阱", branch: "utility", tier: 4, description: "放置陷阱，触发后造成200%伤害并减速60%，持续3秒", effect: { trapDamage: 2.0, trapSlow: 0.60, trapSlowDuration: 3 }, requiredPoints: 4 },
    { id: "", name: "暗影领域", branch: "utility", tier: 5, description: "创造暗影领域，领域内自身全属性+30%，敌人视野缩小50%", effect: { shadowRealmBuff: 0.30, enemyVisionReduction: 0.50 }, requiredPoints: 5 },
  ],
);

// ---------------------------------------------------------------------------
// engineer (工程师) — 建造型英雄
// ---------------------------------------------------------------------------
const engineerTree: HeroSkillTree = buildHeroTree(
  "engineer",
  [
    { id: "", name: "炮台强化", branch: "offense", tier: 1, description: "炮台伤害+15%，攻击速度+10%", effect: { turretDamage: 0.15, turretAttackSpeed: 0.10 }, requiredPoints: 1 },
    { id: "", name: "导弹", branch: "offense", tier: 2, description: "炮台每5秒发射一枚追踪导弹，造成120%范围伤害", effect: { missileInterval: 5, missileDamage: 1.20 }, requiredPoints: 2 },
    { id: "", name: "过热", branch: "offense", tier: 3, description: "炮台连续攻击10秒后进入过热状态，伤害+50%，持续5秒", effect: { overheatChargeTime: 10, overheatDamageBonus: 0.50, overheatDuration: 5 }, requiredPoints: 3 },
    { id: "", name: "轨道炮", branch: "offense", tier: 4, description: "部署轨道炮台，射程+40%，可穿透敌人", effect: { railgunRange: 0.40, railgunPierce: 1 }, requiredPoints: 4 },
    { id: "", name: "末日机甲", branch: "offense", tier: 5, description: "召唤巨型机甲，持续20秒，伤害+200%，范围攻击", effect: { mechDuration: 20, mechDamage: 2.0, mechAoe: 1 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "护盾发生器", branch: "defense", tier: 1, description: "部署物生命值+20%", effect: { deployableHealth: 0.20 }, requiredPoints: 1 },
    { id: "", name: "维修", branch: "defense", tier: 2, description: "部署物每秒回复最大生命值3%", effect: { deployableRegen: 0.03 }, requiredPoints: 2 },
    { id: "", name: "力场", branch: "defense", tier: 3, description: "部署力场，范围内友军护甲+25%，伤害减免+15%", effect: { forceFieldArmor: 0.25, forceFieldDamageReduction: 0.15 }, requiredPoints: 3 },
    { id: "", name: "堡垒", branch: "defense", tier: 4, description: "自身进入堡垒模式，无法移动但伤害减免+60%，每秒回复5%生命", effect: { fortressDamageReduction: 0.60, fortressRegen: 0.05 }, requiredPoints: 4 },
    { id: "", name: "不灭要塞", branch: "defense", tier: 5, description: "所有部署物免疫伤害，持续8秒，冷却90秒", effect: { invincibleDeployables: 1, invincibleDuration: 8, invincibleCooldown: 90 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "资源采集", branch: "utility", tier: 1, description: "资源掉落率+20%，拾取范围+25%", effect: { resourceDropRate: 0.20, pickupRange: 0.25 }, requiredPoints: 1 },
    { id: "", name: "加速", branch: "utility", tier: 2, description: "部署物建造速度+30%，冷却缩减+15%", effect: { buildSpeed: 0.30, cooldownReduction: 0.15 }, requiredPoints: 2 },
    { id: "", name: "无人机", branch: "utility", tier: 3, description: "部署2架战斗无人机，自动攻击附近敌人", effect: { droneCount: 2, droneDamage: 0.60 }, requiredPoints: 3 },
    { id: "", name: "传送门", branch: "utility", tier: 4, description: "部署双向传送门，友军可通过传送门瞬间移动", effect: { portalCount: 2 }, requiredPoints: 4 },
    { id: "", name: "时空枢纽", branch: "utility", tier: 5, description: "所有部署物持续时间+50%，传送门冷却-50%", effect: { deployableDuration: 0.50, portalCooldownReduction: 0.50 }, requiredPoints: 5 },
  ],
);

// ---------------------------------------------------------------------------
// sentinel (哨兵) — 射手型英雄
// ---------------------------------------------------------------------------
const sentinelTree: HeroSkillTree = buildHeroTree(
  "sentinel",
  [
    { id: "", name: "精准射击", branch: "offense", tier: 1, description: "攻击力+12%，暴击率+5%", effect: { damageBonus: 0.12, critChance: 0.05 }, requiredPoints: 1 },
    { id: "", name: "穿透箭", branch: "offense", tier: 2, description: "攻击可穿透2个额外目标，穿透伤害不减", effect: { pierceCount: 2, pierceFullDamage: 1 }, requiredPoints: 2 },
    { id: "", name: "爆头", branch: "offense", tier: 3, description: "暴击伤害+80%，暴击时击退目标", effect: { critDamage: 0.80, critKnockback: 1 }, requiredPoints: 3 },
    { id: "", name: "弹幕", branch: "offense", tier: 4, description: "攻击时额外射出3支箭矢，造成60%伤害", effect: { barrageCount: 3, barrageDamage: 0.60 }, requiredPoints: 4 },
    { id: "", name: "神射手", branch: "offense", tier: 5, description: "攻击距离+50%，远程伤害+40%，对远处敌人伤害+100%", effect: { rangeBonus: 0.50, rangedDamageBonus: 0.40, longRangeBonus: 1.0 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "闪避姿态", branch: "defense", tier: 1, description: "受到攻击时10%概率闪避", effect: { dodgeChance: 0.10 }, requiredPoints: 1 },
    { id: "", name: "陷阱", branch: "defense", tier: 2, description: "后退时留下减速陷阱，减速敌人40%，持续3秒", effect: { trapSlow: 0.40, trapDuration: 3 }, requiredPoints: 2 },
    { id: "", name: "警戒", branch: "defense", tier: 3, description: "小地图显示所有敌人位置，预警范围+30%", effect: { enemyDetection: 1, alertRange: 0.30 }, requiredPoints: 3 },
    { id: "", name: "弹反", branch: "defense", tier: 4, description: "精准时机格挡可反弹远程攻击，造成原伤害150%", effect: { parryReflect: 1, parryDamage: 1.50 }, requiredPoints: 4 },
    { id: "", name: "绝对领域", branch: "defense", tier: 5, description: "创造领域，领域内自身无敌3秒，冷却60秒", effect: { domainDuration: 3, domainCooldown: 60 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "侦察", branch: "utility", tier: 1, description: "视野范围+20%，移速+10%", effect: { visionRange: 0.20, speedBonus: 0.10 }, requiredPoints: 1 },
    { id: "", name: "标记弹", branch: "utility", tier: 2, description: "攻击标记目标，使其受到所有伤害+25%，持续6秒", effect: { markVulnerability: 0.25, markDuration: 6 }, requiredPoints: 2 },
    { id: "", name: "鹰眼", branch: "utility", tier: 3, description: "暴击率+15%，命中率+20%", effect: { critChance: 0.15, accuracyBonus: 0.20 }, requiredPoints: 3 },
    { id: "", name: "追踪", branch: "utility", tier: 4, description: "攻击附带追踪效果，弹道速度+30%，无法被闪避", effect: { homing: 1, projectileSpeed: 0.30, undodgeable: 1 }, requiredPoints: 4 },
    { id: "", name: "全知视野", branch: "utility", tier: 5, description: "获得全图视野，所有友军攻击力+20%，持续15秒", effect: { globalVision: 1, teamDamageBonus: 0.20, visionDuration: 15 }, requiredPoints: 5 },
  ],
);

// ---------------------------------------------------------------------------
// storm (风暴) — 法师型英雄
// ---------------------------------------------------------------------------
const stormTree: HeroSkillTree = buildHeroTree(
  "storm",
  [
    { id: "", name: "闪电链", branch: "offense", tier: 1, description: "技能有20%概率连锁至附近敌人，造成80%伤害", effect: { chainChance: 0.20, chainDamage: 0.80 }, requiredPoints: 1 },
    { id: "", name: "暴风雪", branch: "offense", tier: 2, description: "范围技能伤害+25%，减速敌人30%，持续2秒", effect: { aoeDamage: 0.25, aoeSlow: 0.30, slowDuration: 2 }, requiredPoints: 2 },
    { id: "", name: "陨石", branch: "offense", tier: 3, description: "每15秒召唤陨石，造成250%范围伤害并击晕1秒", effect: { meteorInterval: 15, meteorDamage: 2.50, meteorStun: 1 }, requiredPoints: 3 },
    { id: "", name: "元素爆发", branch: "offense", tier: 4, description: "技能伤害+40%，元素异常状态持续时间+50%", effect: { skillDamage: 0.40, statusDuration: 0.50 }, requiredPoints: 4 },
    { id: "", name: "天灾", branch: "offense", tier: 5, description: "释放全屏元素风暴，对所有敌人造成每秒150%伤害，持续6秒", effect: { cataclysmDamage: 1.50, cataclysmDuration: 6 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "魔法盾", branch: "defense", tier: 1, description: "获得生命值20%的魔法护盾，破碎后30秒恢复", effect: { magicShield: 0.20, shieldRegen: 30 }, requiredPoints: 1 },
    { id: "", name: "冰甲", branch: "defense", tier: 2, description: "护甲+15%，近战攻击者被减速40%", effect: { armorBonus: 0.15, frostArmorSlow: 0.40 }, requiredPoints: 2 },
    { id: "", name: "闪现", branch: "defense", tier: 3, description: "向指定方向瞬移，冷却12秒，可储存2次", effect: { blinkCharges: 2, blinkCooldown: 12 }, requiredPoints: 3 },
    { id: "", name: "时间减速", branch: "defense", tier: 4, description: "释放时间力场，范围内敌人移速和攻速-50%，持续5秒", effect: { timeSlow: 0.50, timeSlowDuration: 5 }, requiredPoints: 4 },
    { id: "", name: "相位转移", branch: "defense", tier: 5, description: "生命低于15%时自动进入相位空间，免疫伤害3秒，冷却90秒", effect: { phaseShiftTrigger: 0.15, phaseShiftDuration: 3, phaseShiftCooldown: 90 }, requiredPoints: 5 },
  ],
  [
    { id: "", name: "魔力回复", branch: "utility", tier: 1, description: "技能冷却缩减+12%，能量回复速度+20%", effect: { cooldownReduction: 0.12, energyRegen: 0.20 }, requiredPoints: 1 },
    { id: "", name: "范围扩大", branch: "utility", tier: 2, description: "技能范围+20%，投射物速度+15%", effect: { skillRange: 0.20, projectileSpeed: 0.15 }, requiredPoints: 2 },
    { id: "", name: "元素亲和", branch: "utility", tier: 3, description: "元素伤害+20%，元素抗性+25%", effect: { elementalDamage: 0.20, elementalResistance: 0.25 }, requiredPoints: 3 },
    { id: "", name: "冷却缩减", branch: "utility", tier: 4, description: "技能冷却缩减+25%，终极技能冷却缩减+30%", effect: { cooldownReduction: 0.25, ultimateCooldownReduction: 0.30 }, requiredPoints: 4 },
    { id: "", name: "奥术大师", branch: "utility", tier: 5, description: "所有技能可储存额外1次充能，技能消耗-30%", effect: { extraCharges: 1, skillCostReduction: 0.30 }, requiredPoints: 5 },
  ],
);

// ============================================================================
// Hero Skill Tree Registry
// ============================================================================

const HERO_SKILL_TREES: Record<string, HeroSkillTree> = {
  vanguard: vanguardTree,
  phantom: phantomTree,
  engineer: engineerTree,
  sentinel: sentinelTree,
  storm: stormTree,
};

// ============================================================================
// Constants
// ============================================================================

export const MAX_SKILL_POINTS = 25;

// ============================================================================
// Core Functions
// ============================================================================

/** 每波奖励的技能点数 */
export function getSkillPointsPerWave(wave: number): number {
  if (wave <= 10) return 1;
  if (wave <= 20) return 2;
  if (wave <= 30) return 2;
  if (wave <= 40) return 3;
  return 4;
}

/** 获取英雄技能树（返回深拷贝以避免引用污染） */
export function getHeroSkillTree(heroId: SkillTreeHeroId): HeroSkillTree {
  const tree = HERO_SKILL_TREES[heroId];
  if (!tree) {
    throw new Error(`Unknown hero skill tree: ${heroId}`);
  }
  const clone: HeroSkillTree = {
    heroId: tree.heroId,
    branches: {
      offense: tree.branches.offense.map((n) => ({ ...n, effect: { ...n.effect }, children: [...n.children] })),
      defense: tree.branches.defense.map((n) => ({ ...n, effect: { ...n.effect }, children: [...n.children] })),
      utility: tree.branches.utility.map((n) => ({ ...n, effect: { ...n.effect }, children: [...n.children] })),
    },
    totalPoints: 0,
    maxPoints: MAX_SKILL_POINTS,
  };
  return clone;
}

/** 检查技能是否可解锁 */
export function canUnlockSkill(
  tree: HeroSkillTree,
  nodeId: string,
  availablePoints: number,
): boolean {
  const node = findNodeById(tree, nodeId);
  if (!node || node.unlocked) return false;
  if (availablePoints < node.requiredPoints) return false;
  const parents = getParentNodes(tree, nodeId);
  return parents.every((p) => p.unlocked);
}

/** 解锁技能 */
export function unlockSkill(tree: HeroSkillTree, nodeId: string): boolean {
  const node = findNodeById(tree, nodeId);
  if (!node || node.unlocked) return false;
  node.unlocked = true;
  tree.totalPoints += node.requiredPoints;
  return true;
}

/** 获取已解锁技能的总效果加成 */
export function getActiveSkillEffects(tree: HeroSkillTree): Record<string, number> {
  const effects: Record<string, number> = {};
  for (const branch of Object.values(tree.branches)) {
    for (const node of branch) {
      if (node.unlocked) {
        for (const [key, value] of Object.entries(node.effect)) {
          effects[key] = (effects[key] || 0) + value;
        }
      }
    }
  }
  return effects;
}

/** 获取创世觉醒技能（Genesis阶段解锁的终极技能） */
export function getGenesisAwakeningSkill(heroId: SkillTreeHeroId): SkillNode {
  const awakenings: Record<SkillTreeHeroId, SkillNode> = {
    vanguard: {
      id: "genesis_vanguard",
      name: "泰坦之怒",
      branch: "offense",
      tier: 6,
      description: "创世觉醒：全属性翻倍，免疫控制",
      effect: { allStats: 2.0 },
      requiredPoints: 5,
      children: [],
      unlocked: false,
    },
    phantom: {
      id: "genesis_phantom",
      name: "暗影主宰",
      branch: "offense",
      tier: 6,
      description: "创世觉醒：永久隐身，暴击率+100%",
      effect: { critChance: 1.0, permanentInvis: 1 },
      requiredPoints: 5,
      children: [],
      unlocked: false,
    },
    engineer: {
      id: "genesis_engineer",
      name: "机械之神",
      branch: "offense",
      tier: 6,
      description: "创世觉醒：部署物数量翻倍，伤害+200%",
      effect: { deployableCount: 2, deployableDamage: 2.0 },
      requiredPoints: 5,
      children: [],
      unlocked: false,
    },
    sentinel: {
      id: "genesis_sentinel",
      name: "鹰眼之神",
      branch: "offense",
      tier: 6,
      description: "创世觉醒：攻击距离翻倍，弹射+5",
      effect: { rangeBonus: 1.0, ricochet: 5 },
      requiredPoints: 5,
      children: [],
      unlocked: false,
    },
    storm: {
      id: "genesis_storm",
      name: "元素之神",
      branch: "offense",
      tier: 6,
      description: "创世觉醒：全元素伤害+300%，冷却-50%",
      effect: { elementalDamage: 3.0, cooldownReduction: 0.5 },
      requiredPoints: 5,
      children: [],
      unlocked: false,
    },
  };
  return awakenings[heroId];
}

/** 获取英雄技能树中所有技能节点的扁平列表 */
export function getAllSkillNodes(tree: HeroSkillTree): SkillNode[] {
  const nodes: SkillNode[] = [];
  for (const branch of Object.values(tree.branches)) {
    nodes.push(...branch);
  }
  return nodes;
}

/** 获取指定分支的技能节点 */
export function getBranchNodes(tree: HeroSkillTree, branch: SkillBranchType): SkillNode[] {
  return tree.branches[branch];
}

/** 重置技能树到初始状态 */
export function resetSkillTree(tree: HeroSkillTree): void {
  for (const branch of Object.values(tree.branches)) {
    for (const node of branch) {
      node.unlocked = false;
    }
  }
  tree.totalPoints = 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

function findNodeById(tree: HeroSkillTree, nodeId: string): SkillNode | undefined {
  for (const branch of Object.values(tree.branches)) {
    const node = branch.find((n) => n.id === nodeId);
    if (node) return node;
  }
  return undefined;
}

function getParentNodes(tree: HeroSkillTree, nodeId: string): SkillNode[] {
  const node = findNodeById(tree, nodeId);
  if (!node) return [];
  const parents: SkillNode[] = [];
  for (const branch of Object.values(tree.branches)) {
    for (const n of branch) {
      if (n.children.includes(nodeId)) {
        parents.push(n);
      }
    }
  }
  return parents;
}