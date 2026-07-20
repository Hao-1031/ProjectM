import type {
  DeathmatchState,
  DeathmatchBot,
  GameState,
  Player,
  MapConfig,
  Obstacle,
  Vec2,
  InputState,
  WeaponId,
} from "./types";
import { DEFAULT_BALANCE } from "./balance";
import { uid, distance, normalize, clamp, randomRange, randomPointInBounds } from "./math";
import { WEAPON_CREATORS } from "./weapons";
import { seededRandom } from "./modes";

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
  };
}

export function createBotPlayer(id: string, x: number, y: number): Player {
  const cfg = DEFAULT_BALANCE.player;
  const dm = DEFAULT_BALANCE.modes.deathmatch;
  const weapons: WeaponId[] = ["pulse", "shotgun", "laser"];
  const weaponId = weapons[Math.floor(Math.random() * weapons.length)];

  return {
    id,
    x,
    y,
    radius: cfg.baseRadius,
    speed: cfg.baseSpeed,
    maxHealth: Math.floor(cfg.baseHealth * dm.playerHealthMul),
    health: Math.floor(cfg.baseHealth * dm.playerHealthMul),
    level: 1,
    xp: 0,
    xpToNext: cfg.levelXpMultiplier,
    weapons: [WEAPON_CREATORS[weaponId]()],
    passives: [],
    invincible: dm.respawnInvincibility,
    magnetRange: cfg.baseMagnetRange,
    armor: 0.1,
    critChance: 0.05,
    cooldownReduction: 0,
    areaMultiplier: 1,
    regen: 0,
    heroId: null,
    activeSkill: null,
    skillTimer: 0,
    ultimateSkill: null,
    ultimateTimer: 0,
    deployableUpgrades: {},
    talentLevels: {},
    leopardFrenzyTimer: 0,
    leopardBloodlustStacks: 0,
    leopardBloodlustTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
  };
}

export function createBotAI(id: string): DeathmatchBot {
  return {
    id,
    targetId: null,
    state: "idle",
    timer: 0,
    respawnTimer: 0,
    aimX: 0,
    aimY: 0,
    fireTimer: 0,
  };
}

export function ensureScoreEntry(state: DeathmatchState, id: string): void {
  if (!state.scores[id]) {
    state.scores[id] = { kills: 0, deaths: 0, damageDealt: 0 };
  }
}

export function recordKill(state: DeathmatchState, killerId: string, victimId: string): void {
  ensureScoreEntry(state, killerId);
  ensureScoreEntry(state, victimId);
  state.scores[killerId].kills += 1;
  state.scores[victimId].deaths += 1;
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

export function updateDeathmatch(state: GameState, dt: number, rng: () => number): void {
  const dm = state.deathmatchState;
  if (!dm || state.status !== "running") return;

  dm.matchTimer += dt;

  ensureScoreEntry(dm, state.player.id);
  for (const p of state.players) {
    ensureScoreEntry(dm, p.id);
  }

  for (const bot of dm.bots) {
    updateBot(bot, state, dt, rng);
  }

  spawnDeathmatchPickups(state, dt);

  if (!dm.matchEnded) {
    checkDeathmatchEnd(state);
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
    dm.pickupTimer = DEFAULT_BALANCE.modes.deathmatch.pickupSpawnInterval;
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

  if (bot.timer <= 0) {
    bot.timer = 0.4 + rng() * 0.6;
    chooseBotState(bot, state, rng);
  }

  const target = findBotTarget(bot, state, player);
  if (target) {
    bot.targetId = target.id;
    bot.aimX = target.x - player.x;
    bot.aimY = target.y - player.y;
  } else {
    bot.targetId = null;
  }

  const move = getBotMove(bot, state, player, dt, rng);
  const aim = normalize({ x: bot.aimX, y: bot.aimY });

  player.knockbackX *= Math.max(0, 1 - dt * 6);
  player.knockbackY *= Math.max(0, 1 - dt * 6);

  const speed = player.speed * (bot.state === "flee" ? 1.1 : 1);
  player.x += (move.x * speed + player.knockbackX) * dt;
  player.y += (move.y * speed + player.knockbackY) * dt;

  player.x = clamp(player.x, player.radius, state.map.width - player.radius);
  player.y = clamp(player.y, player.radius, state.map.height - player.radius);

  if (aim.x !== 0 || aim.y !== 0) {
    player.facing = Math.atan2(aim.y, aim.x);
  }

  if (target && bot.fireTimer <= 0) {
    const dist = distance(player, target);
    if (dist < player.weapons[0].range) {
      botFireWeapon(bot, player, state);
      bot.fireTimer = Math.max(0.25, player.weapons[0].cooldown * (1 - player.cooldownReduction));
    }
  }
}

function chooseBotState(bot: DeathmatchBot, state: GameState, rng: () => number): void {
  const player = state.players.find((p) => p.id === bot.id) ?? state.player;
  if (!player) return;

  const healthRatio = player.health / player.maxHealth;
  const target = findBotTarget(bot, state, player);

  if (healthRatio < 0.35) {
    bot.state = rng() < 0.7 ? "flee" : "strafe";
  } else if (target) {
    const dist = distance(player, target);
    if (dist < 220) {
      bot.state = rng() < 0.5 ? "strafe" : "chase";
    } else {
      bot.state = "chase";
    }
  } else {
    bot.state = "idle";
  }
}

function findBotTarget(bot: DeathmatchBot, state: GameState, self: Player): Player | null {
  const all = [state.player, ...state.players].filter((p) => p.id !== self.id && p.health > 0);
  if (all.length === 0) return null;

  let best: Player | null = null;
  let bestScore = -Infinity;

  for (const candidate of all) {
    const dist = distance(self, candidate);
    const healthBias = 1 - candidate.health / candidate.maxHealth;
    const score = -dist + healthBias * 300 + (candidate.id === bot.targetId ? 120 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function getBotMove(
  bot: DeathmatchBot,
  state: GameState,
  player: Player,
  dt: number,
  rng: () => number
): Vec2 {
  const target = bot.targetId
    ? [state.player, ...state.players].find((p) => p.id === bot.targetId && p.health > 0)
    : null;

  if (!target) {
    const angle = state.time * 0.5 + (player.id.charCodeAt(0) % 10);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const len = Math.hypot(dx, dy) || 1;

  if (bot.state === "flee") {
    return normalize({ x: -dx / len, y: -dy / len });
  }

  if (bot.state === "chase") {
    return normalize({ x: dx / len, y: dy / len });
  }

  const strafeAngle = (Math.PI / 2) * (Math.sin(state.time * 2) > 0 ? 1 : -1);
  return normalize({
    x: (dx / len) * Math.cos(strafeAngle) - (dy / len) * Math.sin(strafeAngle),
    y: (dx / len) * Math.sin(strafeAngle) + (dy / len) * Math.cos(strafeAngle),
  });
}

function botFireWeapon(bot: DeathmatchBot, player: Player, state: GameState): void {
  const weapon = player.weapons[0];
  const target = bot.targetId
    ? [state.player, ...state.players].find((p) => p.id === bot.targetId && p.health > 0)
    : null;
  if (!target || !weapon) return;

  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const spread = weapon.spread / 2;

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
      damage: weapon.damage * DEFAULT_BALANCE.modes.deathmatch.playerDamageMul,
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
): { id: string; score: number; deaths: number }[] {
  return Object.entries(dm.scores)
    .map(([id, score]) => ({ id, score: score.kills, deaths: score.deaths }))
    .sort((a, b) => b.score - a.score || a.deaths - b.deaths);
}

export function getBotInput(_bot: DeathmatchBot): InputState {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    fire: false,
    pause: false,
    useSkill: false,
    useUltimate: false,
  };
}
