import type { WeaponMod, WeaponModType, WeaponModSlot, ForgeMaterials } from "./types";
import { uid } from "./math";

// ============================================================================
// 元素类改装模块 (Element) — 10个
// ============================================================================

const ELEMENT_MOD_FLAME: WeaponMod = {
  id: "mod_element_flame",
  name: "火焰弹",
  type: "element",
  description: "注入烈焰能量，弹丸附带灼烧效果",
  rarity: "common",
  statBonus: { damage: 5 },
  specialEffect: "燃烧效果：持续造成火焰伤害",
  requiredMaterials: { iron: 5, crystal: 1 },
};

const ELEMENT_MOD_FROST: WeaponMod = {
  id: "mod_element_frost",
  name: "冰霜弹",
  type: "element",
  description: "注入极寒能量，弹丸附带减速效果",
  rarity: "common",
  statBonus: { speed: -10 },
  specialEffect: "减速效果：降低敌人移动速度",
  requiredMaterials: { iron: 5, crystal: 1 },
};

const ELEMENT_MOD_THUNDER: WeaponMod = {
  id: "mod_element_thunder",
  name: "雷电弹",
  type: "element",
  description: "注入雷霆能量，弹丸附带连锁闪电",
  rarity: "common",
  statBonus: { damage: 3 },
  specialEffect: "连锁闪电：弹射至附近敌人",
  requiredMaterials: { iron: 8, crystal: 2 },
};

const ELEMENT_MOD_POISON: WeaponMod = {
  id: "mod_element_poison",
  name: "毒素弹",
  type: "element",
  description: "注入剧毒能量，弹丸附带持续毒伤",
  rarity: "rare",
  statBonus: { damage: 8 },
  specialEffect: "持续毒伤：每秒造成毒素伤害",
  requiredMaterials: { iron: 12, crystal: 6 },
};

const ELEMENT_MOD_VOID: WeaponMod = {
  id: "mod_element_void",
  name: "虚空弹",
  type: "element",
  description: "注入虚空能量，弹丸附带穿透效果",
  rarity: "rare",
  statBonus: { pierce: 1 },
  specialEffect: "穿透效果：无视敌人部分防御",
  requiredMaterials: { iron: 15, crystal: 8 },
};

const ELEMENT_MOD_HOLY: WeaponMod = {
  id: "mod_element_holy",
  name: "圣光弹",
  type: "element",
  description: "注入圣光能量，弹丸附带范围伤害",
  rarity: "rare",
  statBonus: { radius: 10 },
  specialEffect: "范围伤害：扩大攻击范围",
  requiredMaterials: { iron: 12, crystal: 10 },
};

const ELEMENT_MOD_SHADOW: WeaponMod = {
  id: "mod_element_shadow",
  name: "暗影弹",
  type: "element",
  description: "注入暗影能量，弹丸附带吸血效果",
  rarity: "epic",
  statBonus: { damage: 15 },
  specialEffect: "吸血效果：造成伤害回复生命",
  requiredMaterials: { iron: 25, crystal: 12, voidEssence: 8 },
};

const ELEMENT_MOD_PLASMA: WeaponMod = {
  id: "mod_element_plasma",
  name: "等离子弹",
  type: "element",
  description: "注入等离子能量，弹丸附带护盾穿透",
  rarity: "epic",
  statBonus: { damage: 12 },
  specialEffect: "护盾穿透：无视护盾直接伤害",
  requiredMaterials: { iron: 20, crystal: 15, voidEssence: 5 },
};

const ELEMENT_MOD_CHRONO: WeaponMod = {
  id: "mod_element_chrono",
  name: "时空弹",
  type: "element",
  description: "注入时空能量，弹丸附带时间减速",
  rarity: "legendary",
  statBonus: { cooldown: -20 },
  specialEffect: "时间减速：减缓周围敌人",
  requiredMaterials: { iron: 40, crystal: 20, voidEssence: 15, genesisCore: 8 },
};

const ELEMENT_MOD_GENESIS: WeaponMod = {
  id: "mod_element_genesis",
  name: "创世弹",
  type: "element",
  description: "注入创世能量，弹丸附带全属性增幅",
  rarity: "legendary",
  statBonus: { damage: 25 },
  specialEffect: "全属性增幅：提升所有属性",
  requiredMaterials: { iron: 50, crystal: 25, voidEssence: 20, genesisCore: 10 },
};

// ============================================================================
// 弹道类改装模块 (Ballistic) — 10个
// ============================================================================

const BALLISTIC_MOD_SCATTER: WeaponMod = {
  id: "mod_ballistic_scatter",
  name: "散射器",
  type: "ballistic",
  description: "加装散射装置，增加弹丸数量",
  rarity: "common",
  statBonus: {},
  specialEffect: "弹丸+2：增加弹丸数量",
  requiredMaterials: { iron: 6, crystal: 1 },
};

const BALLISTIC_MOD_ACCEL: WeaponMod = {
  id: "mod_ballistic_accel",
  name: "加速器",
  type: "ballistic",
  description: "加装加速装置，提升弹丸飞行速度",
  rarity: "common",
  statBonus: { speed: 15 },
  specialEffect: "弹速+15%：提升弹丸飞行速度",
  requiredMaterials: { iron: 5, crystal: 2 },
};

const BALLISTIC_MOD_TRACKER: WeaponMod = {
  id: "mod_ballistic_tracker",
  name: "追踪器",
  type: "ballistic",
  description: "加装追踪装置，弹丸自动追踪敌人",
  rarity: "rare",
  statBonus: { homing: 1 },
  specialEffect: "自动追踪：弹丸自动追踪敌人",
  requiredMaterials: { iron: 10, crystal: 8 },
};

const BALLISTIC_MOD_BOUNCER: WeaponMod = {
  id: "mod_ballistic_bouncer",
  name: "反弹器",
  type: "ballistic",
  description: "加装反弹装置，弹丸击中后弹射",
  rarity: "rare",
  statBonus: { pierce: 1 },
  specialEffect: "弹射+1：弹丸击中后弹射",
  requiredMaterials: { iron: 12, crystal: 5 },
};

const BALLISTIC_MOD_SPLITTER: WeaponMod = {
  id: "mod_ballistic_splitter",
  name: "分裂器",
  type: "ballistic",
  description: "加装分裂装置，弹丸击中后分裂",
  rarity: "epic",
  statBonus: {},
  specialEffect: "击中分裂：弹丸击中后分裂为多个",
  requiredMaterials: { iron: 25, crystal: 12, voidEssence: 6 },
};

const BALLISTIC_MOD_SPIRAL: WeaponMod = {
  id: "mod_ballistic_spiral",
  name: "螺旋器",
  type: "ballistic",
  description: "加装螺旋装置，弹丸以螺旋轨迹飞行",
  rarity: "epic",
  statBonus: {},
  specialEffect: "螺旋弹道：弹丸以螺旋轨迹飞行",
  requiredMaterials: { iron: 20, crystal: 10, voidEssence: 8 },
};

const BALLISTIC_MOD_PIERCER: WeaponMod = {
  id: "mod_ballistic_piercer",
  name: "穿透器",
  type: "ballistic",
  description: "加装穿透装置，弹丸穿透更多敌人",
  rarity: "epic",
  statBonus: { pierce: 2 },
  specialEffect: "穿透+2：弹丸穿透更多敌人",
  requiredMaterials: { iron: 30, crystal: 15, voidEssence: 10 },
};

const BALLISTIC_MOD_GUIDANCE: WeaponMod = {
  id: "mod_ballistic_guidance",
  name: "制导器",
  type: "ballistic",
  description: "加装制导装置，弹丸必定命中目标",
  rarity: "legendary",
  statBonus: { homing: 1 },
  specialEffect: "必中追踪：弹丸必定命中目标",
  requiredMaterials: { iron: 35, crystal: 20, voidEssence: 12, genesisCore: 8 },
};

const BALLISTIC_MOD_WAVE: WeaponMod = {
  id: "mod_ballistic_wave",
  name: "波动器",
  type: "ballistic",
  description: "加装波动装置，弹丸以波形轨迹扩散",
  rarity: "legendary",
  statBonus: {},
  specialEffect: "波状弹道：弹丸以波形轨迹扩散",
  requiredMaterials: { iron: 40, crystal: 18, voidEssence: 15, genesisCore: 10 },
};

const BALLISTIC_MOD_ULTIMATE: WeaponMod = {
  id: "mod_ballistic_ultimate",
  name: "终极弹道",
  type: "ballistic",
  description: "加装终极弹道装置，覆盖全屏弹幕",
  rarity: "legendary",
  statBonus: {},
  specialEffect: "全屏弹幕：覆盖全屏的弹幕攻击",
  requiredMaterials: { iron: 50, crystal: 25, voidEssence: 20, genesisCore: 10 },
};

// ============================================================================
// 效果类改装模块 (Effect) — 10个
// ============================================================================

const EFFECT_MOD_CRIT: WeaponMod = {
  id: "mod_effect_crit",
  name: "暴击模块",
  type: "effect",
  description: "加装暴击模块，提升暴击概率",
  rarity: "common",
  statBonus: {},
  specialEffect: "暴击率+5%：增加暴击概率",
  requiredMaterials: { iron: 5, crystal: 2 },
};

const EFFECT_MOD_LIFESTEAL: WeaponMod = {
  id: "mod_effect_lifesteal",
  name: "吸血模块",
  type: "effect",
  description: "加装吸血模块，造成伤害回复生命",
  rarity: "rare",
  statBonus: {},
  specialEffect: "生命偷取+3%：造成伤害回复生命",
  requiredMaterials: { iron: 10, crystal: 8 },
};

const EFFECT_MOD_SHIELD: WeaponMod = {
  id: "mod_effect_shield",
  name: "护盾模块",
  type: "effect",
  description: "加装护盾模块，击杀后获得临时护盾",
  rarity: "rare",
  statBonus: {},
  specialEffect: "击杀护盾：击杀敌人后获得临时护盾",
  requiredMaterials: { iron: 15, crystal: 5 },
};

const EFFECT_MOD_COMBO: WeaponMod = {
  id: "mod_effect_combo",
  name: "连击模块",
  type: "effect",
  description: "加装连击模块，连续击杀伤害递增",
  rarity: "rare",
  statBonus: {},
  specialEffect: "连击加成：连续击杀伤害递增",
  requiredMaterials: { iron: 12, crystal: 10 },
};

const EFFECT_MOD_EXPLOSION: WeaponMod = {
  id: "mod_effect_explosion",
  name: "爆炸模块",
  type: "effect",
  description: "加装爆炸模块，击杀后产生爆炸",
  rarity: "epic",
  statBonus: {},
  specialEffect: "击杀爆炸：击杀敌人后产生爆炸",
  requiredMaterials: { iron: 25, crystal: 12, voidEssence: 8 },
};

const EFFECT_MOD_FREEZE: WeaponMod = {
  id: "mod_effect_freeze",
  name: "冰冻模块",
  type: "effect",
  description: "加装冰冻模块，攻击概率冻结敌人",
  rarity: "epic",
  statBonus: {},
  specialEffect: "概率冻结：攻击有概率冻结敌人",
  requiredMaterials: { iron: 20, crystal: 15, voidEssence: 5 },
};

const EFFECT_MOD_THUNDER_CHAIN: WeaponMod = {
  id: "mod_effect_thunder_chain",
  name: "雷电模块",
  type: "effect",
  description: "加装雷电模块，攻击概率触发连锁闪电",
  rarity: "epic",
  statBonus: {},
  specialEffect: "概率连锁：攻击有概率触发连锁闪电",
  requiredMaterials: { iron: 30, crystal: 10, voidEssence: 10 },
};

const EFFECT_MOD_BLACKHOLE: WeaponMod = {
  id: "mod_effect_blackhole",
  name: "黑洞模块",
  type: "effect",
  description: "加装黑洞模块，周期性牵引周围敌人",
  rarity: "legendary",
  statBonus: {},
  specialEffect: "牵引敌人：周期性牵引周围敌人",
  requiredMaterials: { iron: 40, crystal: 20, voidEssence: 15, genesisCore: 8 },
};

const EFFECT_MOD_TIME: WeaponMod = {
  id: "mod_effect_time",
  name: "时间模块",
  type: "effect",
  description: "加装时间模块，周期性减缓全局时间",
  rarity: "legendary",
  statBonus: {},
  specialEffect: "时间减速：周期性减缓全局时间",
  requiredMaterials: { iron: 35, crystal: 25, voidEssence: 18, genesisCore: 10 },
};

const EFFECT_MOD_GENESIS: WeaponMod = {
  id: "mod_effect_genesis",
  name: "创世模块",
  type: "effect",
  description: "加装创世模块，同时触发所有效果",
  rarity: "legendary",
  statBonus: {},
  specialEffect: "全效果融合：同时触发所有效果",
  requiredMaterials: { iron: 50, crystal: 25, voidEssence: 20, genesisCore: 10 },
};

// ============================================================================
// 所有可用改装模块 (30个)
// ============================================================================

export const ALL_WEAPON_MODS: WeaponMod[] = [
  // 元素类 (10)
  ELEMENT_MOD_FLAME,
  ELEMENT_MOD_FROST,
  ELEMENT_MOD_THUNDER,
  ELEMENT_MOD_POISON,
  ELEMENT_MOD_VOID,
  ELEMENT_MOD_HOLY,
  ELEMENT_MOD_SHADOW,
  ELEMENT_MOD_PLASMA,
  ELEMENT_MOD_CHRONO,
  ELEMENT_MOD_GENESIS,
  // 弹道类 (10)
  BALLISTIC_MOD_SCATTER,
  BALLISTIC_MOD_ACCEL,
  BALLISTIC_MOD_TRACKER,
  BALLISTIC_MOD_BOUNCER,
  BALLISTIC_MOD_SPLITTER,
  BALLISTIC_MOD_SPIRAL,
  BALLISTIC_MOD_PIERCER,
  BALLISTIC_MOD_GUIDANCE,
  BALLISTIC_MOD_WAVE,
  BALLISTIC_MOD_ULTIMATE,
  // 效果类 (10)
  EFFECT_MOD_CRIT,
  EFFECT_MOD_LIFESTEAL,
  EFFECT_MOD_SHIELD,
  EFFECT_MOD_COMBO,
  EFFECT_MOD_EXPLOSION,
  EFFECT_MOD_FREEZE,
  EFFECT_MOD_THUNDER_CHAIN,
  EFFECT_MOD_BLACKHOLE,
  EFFECT_MOD_TIME,
  EFFECT_MOD_GENESIS,
];

// ============================================================================
// 筛选函数
// ============================================================================

export function getModsByType(type: WeaponModType): WeaponMod[] {
  return ALL_WEAPON_MODS.filter((m) => m.type === type);
}

export function getModsByRarity(rarity: "common" | "rare" | "epic" | "legendary"): WeaponMod[] {
  return ALL_WEAPON_MODS.filter((m) => m.rarity === rarity);
}

// ============================================================================
// 锻造材料与槽位创建
// ============================================================================

export function createForgeMaterials(): ForgeMaterials {
  return { iron: 0, crystal: 0, voidEssence: 0, genesisCore: 0 };
}

export function createWeaponModSlots(): WeaponModSlot[] {
  return [
    { slotType: "element", installedModId: null, locked: false },
    { slotType: "ballistic", installedModId: null, locked: true },
    { slotType: "effect", installedModId: null, locked: true },
  ];
}

// ============================================================================
// 槽位解锁
// ============================================================================

export function unlockSlotByPhase(slots: WeaponModSlot[], wave: number): void {
  if (wave >= 26) {
    const ballisticSlot = slots.find((s) => s.slotType === "ballistic");
    if (ballisticSlot) ballisticSlot.locked = false;
  }
  if (wave >= 36) {
    const effectSlot = slots.find((s) => s.slotType === "effect");
    if (effectSlot) effectSlot.locked = false;
  }
}

// ============================================================================
// 改装模块安装/卸载
// ============================================================================

export function installMod(slots: WeaponModSlot[], modId: string): boolean {
  const mod = ALL_WEAPON_MODS.find((m) => m.id === modId);
  if (!mod) return false;
  const slot = slots.find((s) => s.slotType === mod.type);
  if (!slot || slot.locked) return false;
  slot.installedModId = modId;
  return true;
}

export function uninstallMod(slots: WeaponModSlot[], slotType: WeaponModType): void {
  const slot = slots.find((s) => s.slotType === slotType);
  if (slot) slot.installedModId = null;
}

// ============================================================================
// 效果汇总
// ============================================================================

export function getInstalledModEffects(slots: WeaponModSlot[]): Partial<WeaponMod["statBonus"]> {
  const effects: Record<string, number> = {};
  for (const slot of slots) {
    if (slot.installedModId) {
      const mod = ALL_WEAPON_MODS.find((m) => m.id === slot.installedModId);
      if (mod) {
        for (const [key, value] of Object.entries(mod.statBonus)) {
          effects[key] = (effects[key] || 0) + (value as number);
        }
      }
    }
  }
  return effects as Partial<WeaponMod["statBonus"]>;
}

// ============================================================================
// 敌人掉落材料
// ============================================================================

export function getEnemyDropMaterials(
  phase: string,
  isElite: boolean,
  isBoss: boolean
): Partial<ForgeMaterials> {
  const drops: Partial<ForgeMaterials> = {};

  if (phase === "standard" || phase === "overclock") {
    drops.iron = isBoss ? 5 : isElite ? 2 : 1;
    drops.crystal = isBoss ? 2 : isElite ? 1 : 0;
  } else if (phase === "hell" || phase === "abyss") {
    drops.iron = isBoss ? 8 : isElite ? 3 : 1;
    drops.crystal = isBoss ? 4 : isElite ? 2 : 1;
    drops.voidEssence = isBoss ? 2 : isElite ? 1 : 0;
  } else if (phase === "void" || phase === "genesis") {
    drops.iron = isBoss ? 10 : isElite ? 4 : 2;
    drops.crystal = isBoss ? 6 : isElite ? 3 : 1;
    drops.voidEssence = isBoss ? 4 : isElite ? 2 : 1;
    drops.genesisCore = isBoss ? 2 : isElite ? 1 : 0;
  }

  return drops;
}

// ============================================================================
// 锻造操作
// ============================================================================

export function canForgeMod(materials: ForgeMaterials, mod: WeaponMod): boolean {
  const req = mod.requiredMaterials;
  return (
    (req.iron ?? 0) <= materials.iron &&
    (req.crystal ?? 0) <= materials.crystal &&
    (req.voidEssence ?? 0) <= materials.voidEssence &&
    (req.genesisCore ?? 0) <= materials.genesisCore
  );
}

export function forgeMod(materials: ForgeMaterials, mod: WeaponMod): ForgeMaterials {
  const req = mod.requiredMaterials;
  return {
    iron: materials.iron - (req.iron ?? 0),
    crystal: materials.crystal - (req.crystal ?? 0),
    voidEssence: materials.voidEssence - (req.voidEssence ?? 0),
    genesisCore: materials.genesisCore - (req.genesisCore ?? 0),
  };
}