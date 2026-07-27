import type {
  DeathmatchState,
  DeathmatchBot,
  DeathmatchBotTier,
  DeathmatchPowerUpType,
  DeathmatchPowerUp,
  DeathmatchHazard,
  GameState,
  Player,
  MapConfig,
  Obstacle,
  Vec2,
  WeaponId,
} from "./types";
import { DEFAULT_BALANCE } from "./balance";
import { uid, distance, clamp, randomRange, randomPointInBounds } from "./math";
import { WEAPON_CREATORS } from "./weapons";
import { seededRandom } from "./modes";
import { runBotAI } from "./ai";

const POWER_UP_COLORS: Record<DeathmatchPowerUpType, string> = {
  damage_boost: "#f43f5e",
  speed_boost: "#3b82f6",
  shield: "#8b5cf6",
  invisibility: "#a78bfa",
  armor_boost: "#f59e0b",
};

const POWER_UP_RADII: Record<DeathmatchPowerUpType, number> = {
  damage_boost: 10,
  speed_boost: 10,
  shield: 12,
  invisibility: 10,
  armor_boost: 10,
};

const TIER_WEAPONS: Record<DeathmatchBotTier, WeaponId[]> = {
  rookie: ["pulse", "shotgun"],
  veteran: ["laser", "flame", "plasma"],
  elite: ["railgun", "gauss", "seekerRifle"],
  predator: ["vortexCannon", "gravityWell", "arcCaster"],
};

const TIER_NAMES: Record<DeathmatchBotTier, string> = {
  rookie: "新兵",
  veteran: "老兵",
  elite: "精英",
  predator: "猎杀者",
};

const STREAK_NAMES: Record<number, string> = {
  3: "三连杀",
  5: "支配者",
  7: "杀戮机器",
  10: "无人能挡",
  15: "神挡杀神",
};

export function createDeathmatchState(seed: number, botCount = 3): DeathmatchState {
  return {
    scores: {},
    scoreLimit: DEFAULT_BALANCE.modes.deathmatch.scoreLimit,
    timeLimit: DEFAULT_BALANCE.modes.deathmatch.timeLimit,
    matchTimer: 0,
    bots: [],
    botCount,
    matchEnded: false,
    winnerId: null,
    powerUps: [],
    powerUpTimer: DEFAULT_BALANCE.modes.deathmatch.powerUpSpawnInterval,
    hazards: [],
    hazardTimer: DEFAULT_BALANCE.modes.deathmatch.hazardSpawnInterval,
    killStreakTimer: 0,
    streakAnnouncements: [],
    comboMultiplier: 1,
    phase: "early",
    suddenDeathTimer: 0,
  };
}

export function createDeathmatchMap(seed: number): MapConfig {
  const rng = seededRandom(seed + 9973);
  const cfg = DEFAULT_BALANCE.modes.deathmatch;
  const width = cfg.arenaWidth;
  const height = cfg.arenaHeight;
  const obstacles: Obstacle[] = [];

  const centers: { x: number; y: number; w: number; h: number }[] = [
    { x: width * 0.5, y: height * 0.5, w: 120, h: 120 },
    { x: width * 0.25, y: height * 0.25, w: 90, h: 90 },
    { x: width * 0.75, y: height * 0.25, w: 90, h: 90 },
    { x: width * 0.25, y: height * 0.75, w: 90, h: 90 },
    { x: width * 0.75, y: height * 0.75, w: 90, h: 90 },
  ];

  for (const c of centers) {
    obstacles.push({
      id: uid("obs"),
      x: c.x,
      y: c.y,
      width: c.w,
      height: c.h,
      color: "#1c2033",
      health: 9999,
      maxHealth: 9999,
      destructible: false,
    });
  }

  for (let i = 0; i < 6; i++) {
    const w = 60 + Math.floor(rng() * 60);
    const h = 60 + Math.floor(rng() * 60);
    const pos = randomPointInBounds(width, height, 180);
    obstacles.push({
      id: uid("obs"),
      x: pos.x,
      y: pos.y,
      width: w,
      height: h,
      color: "#24283d",
      health: 400,
      maxHealth: 400,
      destructible: true,
    });
  }

  return {
    width,
    height,
    theme: "industrial",
    obstacles,
    hazards: [],
    decors: [],
  };
}

function pickBotTier(rng: () => number): DeathmatchBotTier {
  const weights = DEFAULT_BALANCE.modes.deathmatch.botTierWeights;
  const roll = rng();
  let cumulative = 0;
  const tiers: DeathmatchBotTier[] = ["rookie", "veteran", "elite", "predator"];
  for (const tier of tiers) {
    cumulative += weights[tier];
    if (roll < cumulative) return tier;
  }
  return "veteran";
}

export function createBotPlayer(id: string, x: number, y: number): Player {
  const cfg = DEFAULT_BALANCE.player;
  const dm = DEFAULT_BALANCE.modes.deathmatch;
  const weapons: WeaponId[] = ["pulse", "shotgun", "laser"];
  const weaponId = weapons[Math.floor(Math.random() * weapons.length)];
  return buildBotPlayer(id, x, y, cfg, dm, weaponId, "rookie");
}

export function createBotPlayerRng(rng: () => number, id: string, x: number, y: number): Player {
  const cfg = DEFAULT_BALANCE.player;
  const dm = DEFAULT_BALANCE.modes.deathmatch;
  const tier = pickBotTier(rng);
  const weapons = TIER_WEAPONS[tier];
  const weaponId = weapons[Math.floor(rng() * weapons.length)];
  return buildBotPlayer(id, x, y, cfg, dm, weaponId, tier);
}

function buildBotPlayer(
  id: string,
  x: number,
  y: number,
  cfg: typeof DEFAULT_BALANCE.player,
  dm: typeof DEFAULT_BALANCE.modes.deathmatch,
  weaponId: WeaponId,
  tier: DeathmatchBotTier
): Player {
  const tierHpMul: Record<DeathmatchBotTier, number> = {
    rookie: 0.85,
    veteran: 1,
    elite: 1.2,
    predator: 1.5,
  };
  const tierSpeedMul: Record<DeathmatchBotTier, number> = {
    rookie: 0.9,
    veteran: 1,
    elite: 1.1,
    predator: 1.2,
  };
  const tierArmor: Record<DeathmatchBotTier, number> = {
    rookie: 0.05,
    veteran: 0.1,
    elite: 0.18,
    predator: 0.25,
  };

  return {
    id,
    x,
    y,
    radius: cfg.baseRadius,
    speed: cfg.baseSpeed * tierSpeedMul[tier],
    maxHealth: Math.floor(cfg.baseHealth * dm.playerHealthMul * tierHpMul[tier]),
    health: Math.floor(cfg.baseHealth * dm.playerHealthMul * tierHpMul[tier]),
    level: 1,
    xp: 0,
    xpToNext: cfg.levelXpMultiplier,
    weapons: [WEAPON_CREATORS[weaponId]()],
    passives: [],
    invincible: dm.respawnInvincibility,
    magnetRange: cfg.baseMagnetRange,
    armor: tierArmor[tier],
    critChance: 0.05 + (tier === "predator" ? 0.1 : tier === "elite" ? 0.05 : 0),
    cooldownReduction: tier === "predator" ? 0.15 : tier === "elite" ? 0.08 : 0,
    areaMultiplier: 1,
    regen: tier === "predator" ? 2 : 0,
    heroId: null,
    activeSkill: null,
    skillTimer: 0,
    ultimateSkill: null,
    ultimateTimer: 0,
    deployableUpgrades: {},
    talentLevels: {},
    leopardFrenzyTimer: 0,
    leopardFrenzyActive: false,
    leopardPounceSpeedTimer: 0,
    leopardBloodlustStacks: 0,
    leopardBloodlustTimer: 0,
    twilightCocoonTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    damage: 10,
    attackSpeed: 1,
    lifesteal: 0,
    skillDamageMul: 1,
    critMultiplier: 1.5,
    dashCooldown: 3,
    explosionOnKill: 0,
    thorns: 0,
    multishotChance: 0,
    periodicShield: 0,
    healingReceivedMul: 1,
    bloodPactDrain: 0,
    rangeMul: 1,
    missChance: 0,
    luckPenalty: 0,
    maxDashes: 2,
    threatRadiusMul: 1,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
    skinColor: tier === "predator" ? "#ef4444" : tier === "elite" ? "#f59e0b" : "#3b82f6",
  };
}

export function createBotAI(id: string, tier: DeathmatchBotTier = "veteran"): DeathmatchBot {
  return {
    id,
    targetId: null,
    state: "idle",
    timer: 0,
    respawnTimer: 0,
    aimX: 0,
    aimY: 0,
    fireTimer: 0,
    tier,
    powerUpTimer: 0,
    powerUpType: null,
  };
}

export function ensureScoreEntry(state: DeathmatchState, id: string): void {
  if (!state.scores[id]) {
    state.scores[id] = { kills: 0, deaths: 0, damageDealt: 0, streak: 0, bestStreak: 0, multiKillCount: 0 };
  }
}

export function recordKill(state: DeathmatchState, killerId: string, victimId: string): void {
  ensureScoreEntry(state, killerId);
  ensureScoreEntry(state, victimId);
  state.scores[killerId].kills += 1;
  state.scores[killerId].streak += 1;
  if (state.scores[killerId].streak > state.scores[killerId].bestStreak) {
    state.scores[killerId].bestStreak = state.scores[killerId].streak;
  }
  state.scores[victimId].deaths += 1;
  state.scores[victimId].streak = 0;

  state.killStreakTimer = 4;
  state.comboMultiplier = 1 + state.scores[killerId].streak * DEFAULT_BALANCE.modes.deathmatch.comboScoreMultiplier;

  const streak = state.scores[killerId].streak;
  for (const [threshold, name] of Object.entries(STREAK_NAMES)) {
    if (streak === Number(threshold)) {
      state.streakAnnouncements.push(`${killerId === "player" ? "你" : "Bot"} 达成 ${name}!`);
      if (state.streakAnnouncements.length > 3) {
        state.streakAnnouncements.shift();
      }
    }
  }
}

export function recordDamage(state: DeathmatchState, attackerId: string, damage: number): void {
  ensureScoreEntry(state, attackerId);
  state.scores[attackerId].damageDealt += damage;
}

export function respawnPlayer(player: Player, state: GameState): void {
  const dm = DEFAULT_BALANCE.modes.deathmatch;
  const pos = findRespawnPosition(state);
  player.x = pos.x;
  player.y = pos.y;
  player.health = player.maxHealth;
  player.invincible = dm.respawnInvincibility;
  player.knockbackX = 0;
  player.knockbackY = 0;
}

function findRespawnPosition(state: GameState): Vec2 {
  const map = state.map;
  const allPlayers = [state.player, ...state.players];
  let best = { x: map.width / 2, y: map.height / 2 };
  let bestDist = 0;

  for (let i = 0; i < 12; i++) {
    const candidate = randomPointInBounds(map.width, map.height, 120);
    let minDist = Infinity;
    for (const p of allPlayers) {
      if (p.health > 0) {
        minDist = Math.min(minDist, distance(candidate, p));
      }
    }
    if (minDist > bestDist) {
      bestDist = minDist;
      best = candidate;
    }
  }
  return best;
}

const POWER_UP_TYPES: DeathmatchPowerUpType[] = [
  "damage_boost",
  "speed_boost",
  "shield",
  "invisibility",
  "armor_boost",
];

export function updateDeathmatch(state: GameState, dt: number, rng: () => number): void {
  const dm = state.deathmatchState;
  if (!dm || state.status !== "running") return;

  dm.matchTimer += dt;

  updateDeathmatchPhase(dm);

  ensureScoreEntry(dm, state.player.id);
  for (const p of state.players) {
    ensureScoreEntry(dm, p.id);
  }

  for (const bot of dm.bots) {
    updateBot(bot, state, dt, rng);
  }

  spawnDeathmatchPickups(state, dt);
  spawnDeathmatchPowerUps(state, dt, rng);
  spawnDeathmatchHazards(state, dt, rng);
  updateDeathmatchHazards(dm, dt);

  if (dm.killStreakTimer > 0) {
    dm.killStreakTimer -= dt;
    if (dm.killStreakTimer <= 0) {
      dm.comboMultiplier = 1;
      for (const score of Object.values(dm.scores)) {
        score.streak = 0;
      }
    }
  }

  if (!dm.matchEnded) {
    checkDeathmatchEnd(state);
  }
}

function updateDeathmatchPhase(dm: DeathmatchState): void {
  const cfg = DEFAULT_BALANCE.modes.deathmatch;
  const elapsed = dm.matchTimer;
  if (elapsed < cfg.timeLimit * 0.25) {
    dm.phase = "early";
  } else if (elapsed < cfg.timeLimit * 0.6) {
    dm.phase = "mid";
  } else if (elapsed < cfg.suddenDeathTriggerTime) {
    dm.phase = "late";
  } else {
    dm.phase = "sudden_death";
    dm.suddenDeathTimer += 1 / 60;
  }
}

function spawnDeathmatchPickups(state: GameState, dt: number): void {
  const dm = state.deathmatchState;
  if (!dm) return;

  if (dm.pickupTimer === undefined) {
    dm.pickupTimer = DEFAULT_BALANCE.modes.deathmatch.pickupSpawnInterval;
  }

  const nextTimer = dm.pickupTimer - dt;
  dm.pickupTimer = nextTimer;

  if (nextTimer <= 0) {
    const intervalMul = dm.phase === "sudden_death" ? 0.6 : dm.phase === "late" ? 0.75 : 1;
    dm.pickupTimer = DEFAULT_BALANCE.modes.deathmatch.pickupSpawnInterval * intervalMul;
    const pos = randomPointInBounds(state.map.width, state.map.height, 140);
    state.pickups.push({
      id: uid("pickup"),
      x: pos.x,
      y: pos.y,
      radius: 10,
      type: "health",
      value: DEFAULT_BALANCE.modes.deathmatch.pickupHealValue,
      color: "#34d399",
      magnetized: false,
    });
  }
}

function spawnDeathmatchPowerUps(state: GameState, dt: number, rng: () => number): void {
  const dm = state.deathmatchState;
  if (!dm) return;

  dm.powerUpTimer -= dt;
  if (dm.powerUpTimer > 0) return;

  const cfg = DEFAULT_BALANCE.modes.deathmatch;
  dm.powerUpTimer = cfg.powerUpSpawnInterval;

  if (dm.powerUps.length >= 3) return;

  const type = POWER_UP_TYPES[Math.floor(rng() * POWER_UP_TYPES.length)];
  const pos = randomPointInBounds(state.map.width, state.map.height, 160);
  dm.powerUps.push({
    id: uid("pwup"),
    x: pos.x,
    y: pos.y,
    radius: POWER_UP_RADII[type],
    type,
    duration: cfg.powerUpDuration,
    color: POWER_UP_COLORS[type],
  });
}

function spawnDeathmatchHazards(state: GameState, dt: number, rng: () => number): void {
  const dm = state.deathmatchState;
  if (!dm) return;

  dm.hazardTimer -= dt;
  if (dm.hazardTimer > 0) return;

  const cfg = DEFAULT_BALANCE.modes.deathmatch;
  dm.hazardTimer = cfg.hazardSpawnInterval;

  if (dm.hazards.length >= 4) return;

  const pos = randomPointInBounds(state.map.width, state.map.height, 200);
  dm.hazards.push({
    id: uid("haz"),
    x: pos.x,
    y: pos.y,
    radius: 60 + Math.floor(rng() * 40),
    damage: cfg.hazardDamage * (dm.phase === "sudden_death" ? 2 : 1),
    duration: cfg.hazardDuration,
    timer: cfg.hazardDuration,
    color: dm.phase === "sudden_death" ? "#ef4444" : "#f97316",
  });
}

function updateDeathmatchHazards(dm: DeathmatchState, dt: number): void {
  for (let i = dm.hazards.length - 1; i >= 0; i--) {
    dm.hazards[i].timer -= dt;
    if (dm.hazards[i].timer <= 0) {
      dm.hazards.splice(i, 1);
    }
  }
}

export function applyDeathmatchHazardDamage(state: GameState, player: Player): void {
  const dm = state.deathmatchState;
  if (!dm) return;

  for (const hazard of dm.hazards) {
    const dist = distance(player, hazard);
    if (dist < hazard.radius + player.radius) {
      const falloff = 1 - dist / (hazard.radius + player.radius);
      player.health -= hazard.damage * falloff * (1 / 60);
    }
  }
}

export function applyDeathmatchPowerUp(player: Player, powerUp: DeathmatchPowerUp): void {
  const dm = DEFAULT_BALANCE.modes.deathmatch;
  switch (powerUp.type) {
    case "damage_boost":
      for (const w of player.weapons) {
        w.damage = Math.round(w.damage * 1.5);
      }
      break;
    case "speed_boost":
      player.speed *= 1.35;
      break;
    case "shield":
      player.periodicShield = Math.max(player.periodicShield, dm.powerUpDuration * 60);
      break;
    case "invisibility":
      player.invincible = Math.max(player.invincible, dm.powerUpDuration);
      break;
    case "armor_boost":
      player.armor = Math.min(0.75, player.armor + 0.25);
      break;
  }
}

export function collectDeathmatchPowerUp(
  dm: DeathmatchState,
  player: Player,
  powerUpId: string
): DeathmatchPowerUp | null {
  const idx = dm.powerUps.findIndex((p) => p.id === powerUpId);
  if (idx === -1) return null;
  const powerUp = dm.powerUps[idx];
  dm.powerUps.splice(idx, 1);
  applyDeathmatchPowerUp(player, powerUp);
  return powerUp;
}

function updateBot(bot: DeathmatchBot, state: GameState, dt: number, rng: () => number): void {
  const player = state.players.find((p) => p.id === bot.id) ?? state.player;
  if (!player || player.id === state.player.id) return;

  if (player.health <= 0) {
    bot.respawnTimer -= dt;
    if (bot.respawnTimer <= 0) {
      respawnPlayer(player, state);
      bot.state = "idle";
      bot.targetId = null;
    }
    return;
  }

  bot.timer -= dt;
  bot.fireTimer -= dt;

  if (bot.powerUpTimer > 0) {
    bot.powerUpTimer -= dt;
  }

  const tierAggressionMul: Record<DeathmatchBotTier, number> = {
    rookie: 0.7,
    veteran: 1,
    elite: 1.3,
    predator: 1.6,
  };

  const output = runBotAI({
    bot,
    player,
    state,
    dt,
    rng,
    alphaSnapshot: undefined,
  });

  player.knockbackX *= Math.max(0, 1 - dt * 6);
  player.knockbackY *= Math.max(0, 1 - dt * 6);

  const speed = player.speed * tierAggressionMul[bot.tier] * (bot.state === "flee" ? 1.1 : 1);
  player.x += (output.move.x * speed + player.knockbackX) * dt;
  player.y += (output.move.y * speed + player.knockbackY) * dt;

  player.x = clamp(player.x, player.radius, state.map.width - player.radius);
  player.y = clamp(player.y, player.radius, state.map.height - player.radius);

  if (output.aim.x !== 0 || output.aim.y !== 0) {
    player.facing = Math.atan2(output.aim.y, output.aim.x);
  }

  if (output.fire && bot.fireTimer <= 0) {
    botFireWeapon(bot, player, state);
    const fireRateMul = bot.tier === "predator" ? 0.7 : bot.tier === "elite" ? 0.85 : 1;
    bot.fireTimer = Math.max(0.2, player.weapons[0].cooldown * (1 - player.cooldownReduction) * fireRateMul);
  }

  bot.aimX = output.aim.x;
  bot.aimY = output.aim.y;
}

function botFireWeapon(bot: DeathmatchBot, player: Player, state: GameState): void {
  const weapon = player.weapons[0];
  const target = bot.targetId
    ? [state.player, ...state.players].find((p) => p.id === bot.targetId && p.health > 0)
    : null;
  if (!target || !weapon) return;

  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const spread = weapon.spread / 2;
  const dm = DEFAULT_BALANCE.modes.deathmatch;

  for (let i = 0; i < weapon.count; i++) {
    const theta = angle + (weapon.count === 1 ? 0 : randomRange(-spread, spread));
    const speed = weapon.projectileSpeed;
    state.projectiles.push({
      id: uid("proj"),
      x: player.x + Math.cos(theta) * 20,
      y: player.y + Math.sin(theta) * 20,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      radius: weapon.id === "rocket" ? 6 : 4,
      damage: weapon.damage * dm.playerDamageMul,
      speed,
      color: weapon.color,
      pierce: weapon.pierce,
      weaponId: weapon.id,
      life: weapon.range / speed,
      ownerId: player.id,
      isExplosive: weapon.id === "rocket",
      areaRadius: weapon.areaRadius,
    });
  }
}

export function checkDeathmatchEnd(state: GameState): void {
  const dm = state.deathmatchState;
  if (!dm) return;

  const cfg = DEFAULT_BALANCE.modes.deathmatch;
  for (const [id, score] of Object.entries(dm.scores)) {
    if (score.kills >= cfg.scoreLimit) {
      dm.matchEnded = true;
      dm.winnerId = id;
      state.status = "victory";
      return;
    }
  }

  if (dm.matchTimer >= cfg.timeLimit) {
    dm.matchEnded = true;
    dm.winnerId = getDeathmatchLeaderId(dm);
    state.status = dm.winnerId === state.player.id ? "victory" : "defeat";
  }
}

export function getDeathmatchLeaderId(dm: DeathmatchState): string | null {
  let bestId: string | null = null;
  let bestKills = -1;
  for (const [id, score] of Object.entries(dm.scores)) {
    if (score.kills > bestKills) {
      bestKills = score.kills;
      bestId = id;
    }
  }
  return bestId;
}

export function getDeathmatchLeaderboard(
  dm: DeathmatchState
): { id: string; score: number; deaths: number; streak: number }[] {
  return Object.entries(dm.scores)
    .map(([id, score]) => ({ id, score: score.kills, deaths: score.deaths, streak: score.bestStreak }))
    .sort((a, b) => b.score - a.score || a.deaths - b.deaths);
}

export function getBotTierName(tier: DeathmatchBotTier): string {
  return TIER_NAMES[tier];
}

export function getStreakName(streak: number): string | null {
  const thresholds = Object.keys(STREAK_NAMES).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (streak >= t) return STREAK_NAMES[t];
  }
  return null;
}