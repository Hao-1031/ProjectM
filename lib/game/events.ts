import type { GameEvent, GameEventType, GameState, Enemy, Deployable } from "./types";
import { uid, randomPointInBounds, distance } from "./math";
import { DEFAULT_BALANCE } from "./balance";

// =======================================================================
// 事件定义
// =======================================================================

export interface EventDefinition {
  type: GameEventType;
  title: string;
  description: string;
  duration: number;
  weight: number;
  allowInDefense: boolean;
  allowInCampaign: boolean;
  allowInEndless: boolean;
}

export const EVENT_DEFINITIONS: Record<GameEventType, EventDefinition> = {
  airdrop: {
    type: "airdrop",
    title: "物资空投",
    description: "空投补给已抵达战场，拾取可获得武器升级或资源",
    duration: 15,
    weight: 18,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  horde: {
    type: "horde",
    title: "感染者潮",
    description: "大量感染者正在接近，击退它们可获得额外经验",
    duration: 20,
    weight: 22,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  eliteHunt: {
    type: "eliteHunt",
    title: "精英猎杀",
    description: "一只精英感染者出现，击败它可获得稀有补给",
    duration: 30,
    weight: 14,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  supply: {
    type: "supply",
    title: "战场补给",
    description: "临时磁力增强，拾取范围大幅提升",
    duration: DEFAULT_BALANCE.pickups.magnetBoostDuration,
    weight: 16,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  empPulse: {
    type: "empPulse",
    title: "电磁脉冲",
    description: "释放 EMP 脉冲，机械单位移动速度与攻击速度大幅降低",
    duration: 10,
    weight: 12,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  mechReinforcement: {
    type: "mechReinforcement",
    title: "机械援军",
    description: "友方战斗无人机抵达，将在一段时间内自动攻击敌人",
    duration: 18,
    weight: 10,
    allowInDefense: true,
    allowInCampaign: true,
    allowInEndless: true,
  },
  coreOverload: {
    type: "coreOverload",
    title: "核心超载",
    description: "据点核心释放过载能量，对附近敌人造成伤害并强化玩家输出",
    duration: 12,
    weight: 8,
    allowInDefense: true,
    allowInCampaign: false,
    allowInEndless: false,
  },
};

const MECHANICAL_VARIANTS = new Set<string>([
  "drone",
  "sentinel",
  "crusher",
  "sniper",
  "stalker",
  "shielder",
  "harvester",
  "artillery",
  "disruptor",
]);

// =======================================================================
// 事件创建
// =======================================================================

export function createGameEvent(type: GameEventType, state: GameState): GameEvent {
  const def = EVENT_DEFINITIONS[type];
  const pos = randomPointInBounds(state.map.width, state.map.height, 200);
  return {
    id: uid("event"),
    type,
    title: def.title,
    description: def.description,
    active: true,
    timer: def.duration,
    duration: def.duration,
    x: needsPosition(type) ? pos.x : undefined,
    y: needsPosition(type) ? pos.y : undefined,
    metadata: {},
  };
}

function needsPosition(type: GameEventType): boolean {
  return type === "airdrop" || type === "mechReinforcement";
}

export function getEligibleEventTypes(state: GameState): GameEventType[] {
  const mode = state.mode;
  return (Object.keys(EVENT_DEFINITIONS) as GameEventType[]).filter((type) => {
    const def = EVENT_DEFINITIONS[type];
    if (mode === "defense") return def.allowInDefense;
    if (mode === "campaign" || mode === "roguelike") return def.allowInCampaign;
    if (mode === "endless" || mode === "daily") return def.allowInEndless;
    return true;
  });
}

export function pickRandomEventType(state: GameState, rng: () => number): GameEventType {
  const eligible = getEligibleEventTypes(state);
  const totalWeight = eligible.reduce((sum, type) => sum + EVENT_DEFINITIONS[type].weight, 0);
  let roll = rng() * totalWeight;
  for (const type of eligible) {
    roll -= EVENT_DEFINITIONS[type].weight;
    if (roll <= 0) return type;
  }
  return eligible[eligible.length - 1] ?? "horde";
}

// =======================================================================
// 事件效果应用
// =======================================================================

export function applyEventStart(event: GameEvent, state: GameState): void {
  switch (event.type) {
    case "airdrop":
      spawnAirdrop(event, state);
      break;
    case "eliteHunt":
      spawnEliteHuntTarget(event, state);
      break;
    case "supply":
      applySupplyBoost(event, state);
      break;
    case "mechReinforcement":
      spawnCombatDrone(event, state);
      break;
    case "empPulse":
      applyEmpPulse(event, state);
      break;
    case "coreOverload":
      applyCoreOverload(event, state);
      break;
    case "horde":
      // Horde is handled by the engine spawn loop checking active event type.
      break;
  }
}

export function applyEventCleanup(event: GameEvent, state: GameState): void {
  switch (event.type) {
    case "supply":
      removeSupplyBoost(event, state);
      break;
    case "empPulse":
      removeEmpPulse(event, state);
      break;
    case "coreOverload":
      removeCoreOverload(event, state);
      break;
    default:
      break;
  }
}

export function updateEventTick(event: GameEvent, state: GameState, dt: number): void {
  switch (event.type) {
    case "empPulse":
      maintainEmpPulse(event, state, dt);
      break;
    case "coreOverload":
      maintainCoreOverload(event, state, dt);
      break;
    case "mechReinforcement":
      maintainCombatDrone(event, state, dt);
      break;
    default:
      break;
  }
}

// -----------------------------------------------------------------------
// 空投
// -----------------------------------------------------------------------

function spawnAirdrop(event: GameEvent, state: GameState): void {
  if (event.x === undefined || event.y === undefined) return;
  state.pickups.push({
    id: uid("pickup"),
    x: event.x,
    y: event.y,
    radius: 14,
    type: "chest",
    value: 0,
    color: "#e879f9",
    magnetized: false,
  });
}

// -----------------------------------------------------------------------
// 精英猎杀
// -----------------------------------------------------------------------

function spawnEliteHuntTarget(event: GameEvent, state: GameState): void {
  // The engine will spawn an elite enemy when this event starts.
  // Mark the event position as a target marker if needed.
  if (event.x === undefined || event.y === undefined) {
    const pos = randomPointInBounds(state.map.width, state.map.height, 200);
    event.x = pos.x;
    event.y = pos.y;
  }
}

// -----------------------------------------------------------------------
// 战场补给
// -----------------------------------------------------------------------

function applySupplyBoost(event: GameEvent, state: GameState): void {
  const players = [state.player, ...state.players];
  event.metadata ??= {};
  event.metadata.baseMagnetRanges = players.map((p) => p.magnetRange);
  for (const player of players) {
    player.magnetRange *= DEFAULT_BALANCE.pickups.magnetBoostMul;
  }
}

function removeSupplyBoost(event: GameEvent, state: GameState): void {
  const players = [state.player, ...state.players];
  const baseRanges = event.metadata?.baseMagnetRanges as number[] | undefined;
  for (let i = 0; i < players.length; i++) {
    if (baseRanges && baseRanges[i] !== undefined) {
      players[i].magnetRange = baseRanges[i];
    } else {
      players[i].magnetRange /= DEFAULT_BALANCE.pickups.magnetBoostMul;
    }
  }
}

// -----------------------------------------------------------------------
// EMP 脉冲
// -----------------------------------------------------------------------

const EMP_SLOW_FACTOR = 0.55;

function applyEmpPulse(event: GameEvent, state: GameState): void {
  event.metadata ??= {};
  const affected: string[] = [];
  const originalSpeeds = new Map<string, number>();
  for (const enemy of state.enemies) {
    if (MECHANICAL_VARIANTS.has(enemy.variant)) {
      affected.push(enemy.id);
      originalSpeeds.set(enemy.id, enemy.speed);
      enemy.speed *= 1 - EMP_SLOW_FACTOR;
      enemy.attackCooldown *= 1.35;
    }
  }
  event.metadata.empAffectedIds = affected;
  event.metadata.empOriginalSpeeds = Object.fromEntries(originalSpeeds);
}

function maintainEmpPulse(event: GameEvent, state: GameState, _dt: number): void {
  const affectedIds = new Set((event.metadata?.empAffectedIds as string[]) ?? []);
  for (const enemy of state.enemies) {
    if (MECHANICAL_VARIANTS.has(enemy.variant) && !affectedIds.has(enemy.id)) {
      affectedIds.add(enemy.id);
      if (event.metadata) {
        (event.metadata.empAffectedIds as string[]).push(enemy.id);
        (event.metadata.empOriginalSpeeds as Record<string, number>)[enemy.id] = enemy.speed;
      }
      enemy.speed *= 1 - EMP_SLOW_FACTOR;
      enemy.attackCooldown *= 1.35;
    }
  }
}

function removeEmpPulse(event: GameEvent, state: GameState): void {
  const originalSpeeds = (event.metadata?.empOriginalSpeeds as Record<string, number>) ?? {};
  for (const enemy of state.enemies) {
    if (originalSpeeds[enemy.id] !== undefined) {
      enemy.speed = originalSpeeds[enemy.id];
      enemy.attackCooldown /= 1.35;
    }
  }
}

// -----------------------------------------------------------------------
// 机械援军 - 战斗无人机
// -----------------------------------------------------------------------

function spawnCombatDrone(event: GameEvent, state: GameState): void {
  const ds = state.defenseState;
  if (!ds) return;
  if (event.x === undefined || event.y === undefined) {
    const pos = randomPointInBounds(state.map.width, state.map.height, 200);
    event.x = pos.x;
    event.y = pos.y;
  }
  const drone: Deployable = {
    id: uid("deploy"),
    x: event.x,
    y: event.y,
    radius: 26,
    type: "drone",
    ownerId: state.player.id,
    health: 220,
    maxHealth: 220,
    timer: event.duration,
    maxTimer: event.duration,
    fireTimer: 0,
    fireCooldown: 0.55,
    color: "#22d3ee",
  };
  ds.deployables.push(drone);
  event.metadata ??= {};
  event.metadata.droneId = drone.id;
}

function maintainCombatDrone(event: GameEvent, state: GameState, dt: number): void {
  const ds = state.defenseState;
  if (!ds || !event.metadata?.droneId) return;
  const droneId = event.metadata.droneId as string;
  const drone = ds.deployables.find((d) => d.id === droneId && d.type === "drone");
  if (!drone) return;

  drone.fireTimer = (drone.fireTimer ?? 0) - dt;
  if (drone.fireTimer <= 0) {
    const target = findNearestEnemy(state, drone.x, drone.y, 380);
    if (target) {
      fireDroneProjectile(state, drone, target);
      drone.fireTimer = drone.fireCooldown ?? 0.55;
    }
  }
}

function fireDroneProjectile(state: GameState, drone: Deployable, target: Enemy): void {
  const angle = Math.atan2(target.y - drone.y, target.x - drone.x);
  const speed = 720;
  state.projectiles.push({
    id: uid("proj"),
    x: drone.x + Math.cos(angle) * 20,
    y: drone.y + Math.sin(angle) * 20,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 4,
    damage: 34,
    speed,
    color: drone.color,
    pierce: 1,
    weaponId: "drone",
    life: 520 / speed,
  });
}

function findNearestEnemy(state: GameState, x: number, y: number, range: number): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = range;
  for (const enemy of state.enemies) {
    const dist = distance({ x, y }, enemy);
    if (dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }
  return best;
}

// -----------------------------------------------------------------------
// 核心超载
// -----------------------------------------------------------------------

const CORE_OVERLOAD_RADIUS = 420;
const CORE_OVERLOAD_DAMAGE_PER_SECOND = 95;

function applyCoreOverload(event: GameEvent, state: GameState): void {
  const ds = state.defenseState;
  if (!ds) return;
  event.metadata ??= {};
  event.metadata.overloadCoreX = ds.core.x;
  event.metadata.overloadCoreY = ds.core.y;

  const players = [state.player, ...state.players];
  event.metadata.baseDamageValues = players.map((p) =>
    p.weapons.map((w) => ({ id: w.id, damage: w.damage }))
  );
  for (const player of players) {
    for (const weapon of player.weapons) {
      weapon.damage = Math.round(weapon.damage * 1.25);
    }
  }
}

function maintainCoreOverload(event: GameEvent, state: GameState, dt: number): void {
  const ds = state.defenseState;
  if (!ds) return;
  const cx = (event.metadata?.overloadCoreX as number) ?? ds.core.x;
  const cy = (event.metadata?.overloadCoreY as number) ?? ds.core.y;
  const damage = CORE_OVERLOAD_DAMAGE_PER_SECOND * dt;
  for (const enemy of state.enemies) {
    if (distance(enemy, { x: cx, y: cy }) <= CORE_OVERLOAD_RADIUS + enemy.radius) {
      enemy.health -= damage;
    }
  }
}

function removeCoreOverload(event: GameEvent, state: GameState): void {
  const players = [state.player, ...state.players];
  const baseDamageValues =
    (event.metadata?.baseDamageValues as { id: string; damage: number }[][]) ?? [];
  for (let i = 0; i < players.length; i++) {
    const snapshots = baseDamageValues[i];
    if (!snapshots) {
      for (const weapon of players[i].weapons) {
        weapon.damage = Math.round(weapon.damage / 1.25);
      }
      continue;
    }
    const snapshotMap = new Map(snapshots.map((s) => [s.id, s.damage]));
    for (const weapon of players[i].weapons) {
      if (snapshotMap.has(weapon.id)) {
        weapon.damage = snapshotMap.get(weapon.id)!;
      }
    }
  }
}

// =======================================================================
// 事件序列辅助
// =======================================================================

export function startGameEvent(type: GameEventType, state: GameState): GameEvent {
  const event = createGameEvent(type, state);
  applyEventStart(event, state);
  state.activeEvent = event;
  return event;
}

export function tickGameEvent(state: GameState, dt: number): GameEvent | null {
  const event = state.activeEvent;
  if (!event) return null;

  event.timer -= dt;
  updateEventTick(event, state, dt);

  if (event.timer <= 0) {
    applyEventCleanup(event, state);
    state.activeEvent = null;
    return null;
  }
  return event;
}

export function endActiveEvent(state: GameState): void {
  if (state.activeEvent) {
    applyEventCleanup(state.activeEvent, state);
    state.activeEvent = null;
  }
}

// =======================================================================
// 事件奖励
// =======================================================================

export interface EventReward {
  xp: number;
  resources: number;
  energy: number;
}

export function calculateEventCompletionReward(event: GameEventType): EventReward {
  switch (event) {
    case "eliteHunt":
      return { xp: 120, resources: 8, energy: 0 };
    case "horde":
      return { xp: 80, resources: 5, energy: 0 };
    case "airdrop":
      return { xp: 40, resources: 3, energy: 0 };
    case "supply":
      return { xp: 25, resources: 2, energy: 0 };
    case "empPulse":
      return { xp: 60, resources: 4, energy: 0 };
    case "mechReinforcement":
      return { xp: 50, resources: 3, energy: 0 };
    case "coreOverload":
      return { xp: 90, resources: 6, energy: 150 };
    default:
      return { xp: 30, resources: 2, energy: 0 };
  }
}

export function grantEventReward(state: GameState, reward: EventReward): void {
  state.player.xp += reward.xp;
  state.stats.xpCollected += reward.xp;
  state.stats.resourcesCollected += reward.resources;
  if (state.defenseState && reward.energy > 0) {
    state.defenseState.energy += reward.energy;
  }
}

// =======================================================================
// 序列化辅助
// =======================================================================

export function sanitizeEventForSerialization(event: GameEvent | null): GameEvent | null {
  if (!event) return null;
  return { ...event };
}
