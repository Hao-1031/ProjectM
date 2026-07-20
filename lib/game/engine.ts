import type {
  GameState,
  Player,
  Enemy,
  EnemyVariant,
  Projectile,
  Pickup,
  Particle,
  DamageNumber,
  UpgradeOption,
  RunResult,
  InputState,
  MapConfig,
  Obstacle,
  Hazard,
  EnemyProjectile,
  GameEvent,
  MapTheme,
  GameModeType,
  GameModeConfig,
  SerializedGameState,
  HeroId,
  WeaponId,
  DefenseState,
  DeathmatchState,
} from "./types";
import {
  uid,
  clamp,
  distance,
  normalize,
  angleBetween,
  randomRange,
  randomPointOnBorder,
  randomPointInBounds,
  randomChoice,
  circleCollision,
  circleRectCollision,
  resolveCircleRectCollision,
  rectOverlap,
  formatTime,
} from "./math";
import {
  getStarterWeapons,
  applyUpgrade,
  generateUpgradeOptions,
  WEAPON_CREATORS,
} from "./weapons";
import {
  generateMissions,
  updateMissions,
  advanceMission,
  addKill,
  addResource,
  addNodeCapture,
  getCurrentMission,
  grantMissionReward,
  grantCurrentMissionReward,
  calculateDefenseCompletionRewards,
} from "./missions";
import {
  startGameEvent,
  tickGameEvent,
  pickRandomEventType,
  calculateEventCompletionReward,
  grantEventReward,
} from "./events";
import { audio } from "./audio";
import {
  applyAffixes,
  getEliteAffixCount,
  getRegenRate,
  shouldExplodeOnDeath,
  shouldSplitOnDeath,
} from "./affixes";
import { BOSSES, checkBossPhaseTransition, getBossAttackPattern, getRandomBossId } from "./bosses";
import {
  createGameModeConfig,
  generateCampaignMissions,
  generateEndlessMissions,
  getDefaultMode,
  seededRandom,
} from "./modes";
import { getEnemySprite, getPlayerSprite } from "./sprites";
import {
  getCurrentFrameIndex,
  setFacing,
  transitionAnimation,
  updateAnimation,
  triggerRecoil,
} from "./animation";
import { FXSystem } from "./fx";
import { ParticlePool } from "./particles";
import type { RoguelikeRunState } from "./roguelike";
import type { RoguelikeRewardBalance } from "./balance";
import {
  createRoguelikeRun,
  getCurrentStage,
  isStageComplete,
  markCurrentStageComplete,
  advanceStage,
  generateRewardOptions,
  applyReward,
  shouldOfferReward,
} from "./roguelike";
import {
  DEFAULT_BALANCE,
  getSpawnInterval,
  getSpawnCount,
  getEliteSpawnChance,
  getDifficultyScaledHealth,
  getXpValue,
  applyDailyModifiers,
} from "./balance";
import {
  createDefenseMap,
  createDefenseState,
  activateNodeForWave,
  getActiveNode,
  updateNodeCapture,
  damageCore,
  isDefenseVictory,
  isDefenseDefeat,
  getCapturedNodeCount,
} from "./defense";
import {
  createDeathmatchState,
  createDeathmatchMap,
  createBotPlayer,
  createBotAI,
  updateDeathmatch,
  respawnPlayer,
  recordKill,
  recordDamage,
  getDeathmatchLeaderId,
} from "./deathmatch";
import {
  applyHeroToPlayer,
  useHeroSkill as triggerHeroSkill,
  useHeroUltimate as triggerHeroUltimate,
  updateHeroSkillsAndDeployables,
  handleDeployableShieldCollisions,
  handleMineProximity,
  createNullHeroState,
} from "./heroes";

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;

const THEMES: Record<MapTheme, { bg: string; grid: string; border: string; accent: string }> = {
  industrial: { bg: "#03040a", grid: "#11152a", border: "#1c2033", accent: "#22d3ee" },
  frozen: { bg: "#050a12", grid: "#0f2438", border: "#1a3a52", accent: "#38bdf8" },
  biohazard: { bg: "#0a0805", grid: "#1a2410", border: "#2a3a18", accent: "#84cc16" },
  wasteland: { bg: "#0a0907", grid: "#1c1812", border: "#2a2318", accent: "#d97706" },
  orbital: { bg: "#05070a", grid: "#0f172a", border: "#1e293b", accent: "#818cf8" },
};

export interface GameCallbacks {
  onLevelUp?: (options: UpgradeOption[]) => void;
  onVictory?: (result: RunResult) => void;
  onDefeat?: (result: RunResult) => void;
  onMissionComplete?: () => void;
  onExtractionReady?: () => void;
  onEventStart?: (event: GameEvent) => void;
  onBossPhaseChange?: (boss: Enemy, phase: number) => void;
  onRoguelikeRewardOffer?: (options: RoguelikeRewardBalance[]) => void;
  onKillStreak?: (count: number) => void;
}

export interface Loadout {
  heroId?: HeroId | null;
  weaponIds?: WeaponId[];
}

export class GameEngine {
  state: GameState;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private callbacks: GameCallbacks;
  private pendingUpgradeOptions: UpgradeOption[] | null = null;
  private seed = 0;
  private rng: () => number;
  private fx = new FXSystem();
  private particlePool = new ParticlePool(768);
  private loadout: Required<Loadout>;
  private pendingSpawns = 0;
  private spawnBatchTimer = 0;

  constructor(
    callbacks: GameCallbacks = {},
    mode: GameModeType = getDefaultMode(),
    seed?: number,
    loadout?: Loadout
  ) {
    this.callbacks = callbacks;
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = seededRandom(this.seed);
    this.loadout = {
      heroId: loadout?.heroId ?? null,
      weaponIds: loadout?.weaponIds?.slice(0, DEFAULT_BALANCE.progression.maxWeapons) ?? [],
    };
    this.state = this.createInitialState(mode);
    this.state.particles = this.particlePool.getParticles();
  }

  private createInitialState(mode: GameModeType): GameState {
    const modeConfig = createGameModeConfig(mode, this.seed);
    const theme = this.randomTheme();
    const roguelikeRunState = mode === "roguelike" ? createRoguelikeRun(this.seed) : undefined;
    const defenseState = mode === "defense" ? createDefenseState(this.seed) : undefined;
    const missions = modeConfig.allowMissions
      ? mode === "roguelike"
        ? roguelikeRunState
          ? [roguelikeRunState.stages[0].mission]
          : generateCampaignMissions()
        : generateCampaignMissions()
      : modeConfig.endless
        ? generateEndlessMissions(1)
        : [];

    let map: MapConfig;
    let deathmatchState: DeathmatchState | undefined;
    if (mode === "defense") {
      map = createDefenseMap(this.seed);
    } else if (mode === "deathmatch") {
      map = createDeathmatchMap(this.seed);
      deathmatchState = createDeathmatchState(this.seed);
    } else {
      map = this.createMap(theme);
    }
    const startX = mode === "defense" || mode === "deathmatch" ? map.width / 2 : MAP_WIDTH / 2;
    const startY = mode === "defense" || mode === "deathmatch" ? map.height / 2 : MAP_HEIGHT / 2;

    const player = this.createPlayer("player", startX, startY);
    const heroId = this.loadout.heroId ?? this.state?.selectedHero;
    if (heroId) {
      applyHeroToPlayer(player, heroId);
    }

    const players: Player[] = [];
    if (mode === "deathmatch" && deathmatchState) {
      const dm = DEFAULT_BALANCE.modes.deathmatch;
      player.maxHealth = Math.floor(player.maxHealth * dm.playerHealthMul);
      player.health = player.maxHealth;
      const spawnPoints = [
        { x: map.width * 0.2, y: map.height * 0.2 },
        { x: map.width * 0.8, y: map.height * 0.2 },
        { x: map.width * 0.2, y: map.height * 0.8 },
        { x: map.width * 0.8, y: map.height * 0.8 },
      ];
      for (let i = 0; i < deathmatchState.botCount; i++) {
        const botId = `bot_${i}`;
        const pos = spawnPoints[i % spawnPoints.length];
        const bot = createBotPlayer(botId, pos.x, pos.y);
        players.push(bot);
        deathmatchState.bots.push(createBotAI(botId));
      }
    }

    return {
      status: "idle",
      mode,
      modeConfig,
      seed: this.seed,
      lastTime: 0,
      time: 0,
      map,
      camera: { x: startX, y: startY, scale: 1 },
      player,
      players,
      enemies: [],
      projectiles: [],
      enemyProjectiles: [],
      pickups: [],
      particles: [],
      damageNumbers: [],
      missions,
      currentMissionIndex: 0,
      extraction: null,
      extractionTimer: 0,
      spawnTimer: 0,
      eventTimer: 25,
      difficulty: 1,
      intensity: 0,
      wave: 1,
      waveTimer: 0,
      stats: {
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        xpCollected: 0,
        resourcesCollected: 0,
        timeSurvived: 0,
        chestsOpened: 0,
        elitesKilled: 0,
        bossesKilled: 0,
        wavesCleared: 0,
        score: 0,
      },
      activeEvent: null,
      eliteKillStreak: 0,
      killCombo: { count: 0, timer: 0, best: 0 },
      roguelikeRunState,
      defenseState,
      deathmatchState,
      selectedHero: heroId ?? this.state?.selectedHero,
    };
  }

  private createPlayer(id: string, x: number, y: number): Player {
    const cfg = DEFAULT_BALANCE.player;
    return {
      id,
      x,
      y,
      radius: cfg.baseRadius,
      speed: cfg.baseSpeed,
      maxHealth: cfg.baseHealth,
      health: cfg.baseHealth,
      level: 1,
      xp: 0,
      xpToNext: cfg.levelXpMultiplier,
      weapons:
        this.loadout.weaponIds.length > 0
          ? this.loadout.weaponIds
              .slice(0, DEFAULT_BALANCE.progression.maxWeapons)
              .map((id) => WEAPON_CREATORS[id]())
          : getStarterWeapons(),
      passives: [],
      invincible: 0,
      magnetRange: cfg.baseMagnetRange,
      armor: 0,
      critChance: 0,
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

  private randomTheme(): MapTheme {
    const themes: MapTheme[] = ["industrial", "frozen", "biohazard", "wasteland", "orbital"];
    return themes[Math.floor(this.rng() * themes.length)];
  }

  private createMap(theme: MapTheme): MapConfig {
    const obstacles: Obstacle[] = [];
    const hazards: Hazard[] = [];

    const obstacleCount =
      theme === "industrial"
        ? 18
        : theme === "frozen"
          ? 14
          : theme === "biohazard"
            ? 20
            : theme === "wasteland"
              ? 16
              : 12;
    const minPlayerPassage = 60;
    const spawnX = MAP_WIDTH / 2;
    const spawnY = MAP_HEIGHT / 2;
    const spawnClearance = 350;

    for (let i = 0; i < obstacleCount; i++) {
      const width = randomRange(60, 180);
      const height = randomRange(60, 180);
      let pos = randomPointInBounds(MAP_WIDTH, MAP_HEIGHT, 250);
      let candidate: Obstacle = {
        id: uid("obs"),
        x: pos.x,
        y: pos.y,
        width,
        height,
        color: theme === "industrial" ? "#1c2033" : theme === "frozen" ? "#1a3a52" : "#2a3a18",
        health: theme === "biohazard" ? 80 : 120,
        maxHealth: theme === "biohazard" ? 80 : 120,
        destructible: true,
      };

      let attempts = 0;
      while (
        attempts < 20 &&
        (distance(pos, { x: spawnX, y: spawnY }) < spawnClearance ||
          obstacles.some((o) => rectOverlap(candidate, o, minPlayerPassage)))
      ) {
        pos = randomPointInBounds(MAP_WIDTH, MAP_HEIGHT, 250);
        candidate = { ...candidate, x: pos.x, y: pos.y };
        attempts++;
      }

      obstacles.push(candidate);
    }

    const hazardCount = theme === "industrial" ? 4 : theme === "frozen" ? 6 : 8;
    for (let i = 0; i < hazardCount; i++) {
      const pos = randomPointInBounds(MAP_WIDTH, MAP_HEIGHT, 300);
      hazards.push({
        id: uid("haz"),
        x: pos.x,
        y: pos.y,
        radius: randomRange(50, 90),
        damage: theme === "biohazard" ? 8 : 5,
        interval: 0.8,
        timer: 0,
        color: theme === "industrial" ? "#f59e0b" : theme === "frozen" ? "#22d3ee" : "#84cc16",
        type: theme === "industrial" ? "electric" : "acid",
      });
    }

    return { width: MAP_WIDTH, height: MAP_HEIGHT, theme, obstacles, hazards };
  }

  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.updateCamera();
  }

  start() {
    this.state.status = "running";
    this.state.lastTime = performance.now();
  }

  setLoadout(loadout: Loadout) {
    if (loadout.heroId !== undefined) {
      this.loadout.heroId = loadout.heroId;
    }
    if (loadout.weaponIds !== undefined) {
      this.loadout.weaponIds = loadout.weaponIds.slice(0, DEFAULT_BALANCE.progression.maxWeapons);
    }

    const heroId = this.loadout.heroId;
    this.state.selectedHero = heroId ?? this.state.selectedHero;

    if (this.state.status === "idle") {
      const player = this.state.player;
      if (heroId) {
        applyHeroToPlayer(player, heroId);
      }
      if (this.loadout.weaponIds.length > 0) {
        player.weapons = this.loadout.weaponIds.map((id) => WEAPON_CREATORS[id]());
      }
    }
  }

  pause() {
    if (this.state.status === "running") {
      this.state.status = "paused";
    } else if (this.state.status === "paused") {
      this.state.status = "running";
      this.state.lastTime = performance.now();
    }
  }

  isPaused() {
    return this.state.status === "paused";
  }

  isRunning() {
    return this.state.status === "running";
  }

  useHeroSkill() {
    if (this.state.status !== "running") return;
    triggerHeroSkill(this.state.player, this.state);
  }

  useHeroUltimate() {
    if (this.state.status !== "running") return;
    triggerHeroUltimate(this.state.player, this.state);
  }

  restart(mode: GameModeType = this.state.mode, seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
      this.rng = seededRandom(seed);
    } else {
      this.seed = Math.floor(Math.random() * 1000000);
      this.rng = seededRandom(this.seed);
    }
    this.fx.reset();
    this.particlePool.clear();
    this.pendingSpawns = 0;
    this.spawnBatchTimer = 0;
    this.state = this.createInitialState(mode);
    this.state.particles = this.particlePool.getParticles();
    this.start();
  }

  update(input: InputState, now: number) {
    if (this.state.status !== "running") return;

    const dt = Math.min((now - this.state.lastTime) / 1000, 0.05);
    this.state.lastTime = now;
    this.state.time += dt;
    this.state.stats.timeSurvived += dt;

    const isDeathmatch = this.state.mode === "deathmatch";

    this.updatePlayer(input, dt);
    this.updateRemotePlayers(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateEnemyProjectiles(dt);

    if (isDeathmatch) {
      updateDeathmatch(this.state, dt, this.rng);
    } else {
      this.spawnEnemies(dt);
      this.updateEnemies(dt);
      this.updateHazards(dt);
    }

    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);

    if (!isDeathmatch) {
      this.updateMissionsAndExtraction(dt);
      this.updateEvents(dt);
      this.updateWave(dt);
      this.updateDefenseState(dt);
      this.updateHeroSkillsAndDeployables(dt);
      this.handleDeployableShieldCollisions();
      this.handleMineProximity();
    }

    this.updateKillCombo(dt);
    this.handleCollisions();
    this.updateCamera();

    this.fx.update(dt);
  }

  private updatePlayer(input: InputState, dt: number) {
    const player = this.state.player;
    const move = normalize(input.move);

    const accel = 1800;
    player.knockbackX *= Math.max(0, 1 - dt * 6);
    player.knockbackY *= Math.max(0, 1 - dt * 6);

    if (move.x !== 0 || move.y !== 0) {
      player.knockbackX +=
        (move.x * player.speed - player.knockbackX) * Math.min(1, (accel * dt) / player.speed);
      player.knockbackY +=
        (move.y * player.speed - player.knockbackY) * Math.min(1, (accel * dt) / player.speed);
      transitionAnimation(player, "move");
    } else {
      transitionAnimation(player, "idle");
    }

    player.x += player.knockbackX * dt;
    player.y += player.knockbackY * dt;

    this.resolveObstacleCollisions(player);

    player.x = clamp(player.x, player.radius, this.state.map.width - player.radius);
    player.y = clamp(player.y, player.radius, this.state.map.height - player.radius);

    if (input.aim.x !== 0 || input.aim.y !== 0) {
      setFacing(player, player.x + input.aim.x, player.y + input.aim.y);
    } else if (move.x !== 0 || move.y !== 0) {
      setFacing(player, player.x + move.x, player.y + move.y);
    }

    updateAnimation(player, dt, getPlayerSprite("#22d3ee", "#0b0d17"));

    if (player.invincible > 0) {
      player.invincible -= dt;
    }

    if (player.regen > 0) {
      player.health = Math.min(player.maxHealth, player.health + player.regen * dt);
    }

    if (input.useSkill) {
      this.useHeroSkill();
      input.useSkill = false;
    }
    if (input.useUltimate) {
      this.useHeroUltimate();
      input.useUltimate = false;
    }

    if (player.burnDuration > 0) {
      player.burnDuration -= dt;
      player.health -= player.burnDamage * dt;
      if (Math.random() < dt * 4) {
        this.particlePool.spawnPreset(
          "spark",
          player.x + randomRange(-10, 10),
          player.y + randomRange(-10, 10),
          "#fb923c",
          { intensity: 0.5 }
        );
      }
      if (player.health <= 0) {
        this.endRun(false);
      }
    }
  }

  private updateRemotePlayers(dt: number) {
    for (const player of this.state.players) {
      if (player.id === this.state.player.id) continue;
      player.knockbackX *= Math.max(0, 1 - dt * 6);
      player.knockbackY *= Math.max(0, 1 - dt * 6);
      player.x += player.knockbackX * dt;
      player.y += player.knockbackY * dt;
      this.resolveObstacleCollisions(player);
      player.x = clamp(player.x, player.radius, this.state.map.width - player.radius);
      player.y = clamp(player.y, player.radius, this.state.map.height - player.radius);
      if (player.invincible > 0) player.invincible -= dt;
      updateAnimation(player, dt, getPlayerSprite("#f59e0b", "#0b0d17"));
    }
  }

  private resolveObstacleCollisions(entity: { x: number; y: number; radius: number }) {
    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      let resolved = true;
      for (const obs of this.state.map.obstacles) {
        if (obs.health <= 0) continue;
        const displacement = resolveCircleRectCollision(entity, obs);
        if (displacement) {
          entity.x += displacement.x;
          entity.y += displacement.y;
          resolved = false;
        }
      }
      if (resolved) break;
    }
  }

  private updateWeapons(dt: number) {
    const player = this.state.player;
    for (const weapon of player.weapons) {
      const effectiveCooldown = weapon.cooldown * (1 - player.cooldownReduction);
      weapon.timer -= dt;
      if (weapon.timer <= 0) {
        this.fireWeapon(weapon);
        weapon.timer = Math.max(0.04, effectiveCooldown);
      }
    }
  }

  private fireWeapon(weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    transitionAnimation(player, "attack");
    triggerRecoil(player);

    if (weapon.id === "drone") {
      this.fireDrone(weapon);
      return;
    }

    if (weapon.id === "flame") {
      this.fireFlame(weapon);
      return;
    }

    const nearest = this.findNearestEnemy(player.x, player.y, weapon.range);
    if (!nearest) return;

    const angle = angleBetween(player, nearest);
    const halfSpread = weapon.spread / 2;

    for (let i = 0; i < weapon.count; i++) {
      const spread = weapon.count === 1 ? 0 : randomRange(-halfSpread, halfSpread);
      const theta = angle + spread;
      const speed = weapon.projectileSpeed;
      const projectile: Projectile = {
        id: uid("proj"),
        x: player.x + Math.cos(theta) * 20,
        y: player.y + Math.sin(theta) * 20,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        radius: weapon.id === "rocket" ? 6 : 4,
        damage: weapon.damage,
        speed,
        color: weapon.color,
        pierce: weapon.pierce,
        weaponId: weapon.id,
        life: weapon.range / speed,
        ownerId: player.id,
      };
      if (weapon.id === "rocket") {
        projectile.isExplosive = true;
        projectile.areaRadius = 60 * player.areaMultiplier;
      }
      this.state.projectiles.push(projectile);
    }
    audio?.play("shoot");
  }

  private fireDrone(weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    for (let i = 0; i < weapon.count; i++) {
      const nearest = this.findNearestEnemy(player.x, player.y, weapon.range);
      if (!nearest) break;
      const angle = angleBetween(player, nearest) + randomRange(-0.2, 0.2);
      const speed = weapon.projectileSpeed;
      this.state.projectiles.push({
        id: uid("proj"),
        x: player.x + Math.cos(angle) * 24,
        y: player.y + Math.sin(angle) * 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        damage: weapon.damage,
        speed,
        color: weapon.color,
        pierce: 1,
        weaponId: weapon.id,
        life: weapon.range / speed,
        ownerId: player.id,
      });
    }
    if (this.state.projectiles.some((p) => p.weaponId === "drone")) {
      audio?.play("shoot");
    }
  }

  private fireFlame(weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    const nearest = this.findNearestEnemy(player.x, player.y, weapon.range);
    const angle = nearest ? angleBetween(player, nearest) : 0;
    for (let i = 0; i < weapon.count; i++) {
      const spread = randomRange(-weapon.spread / 2, weapon.spread / 2);
      const theta = angle + spread;
      const speed = weapon.projectileSpeed * randomRange(0.8, 1.1);
      this.state.projectiles.push({
        id: uid("proj"),
        x: player.x + Math.cos(theta) * 18,
        y: player.y + Math.sin(theta) * 18,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        radius: 5,
        damage: weapon.damage,
        speed,
        color: weapon.color,
        pierce: weapon.pierce,
        weaponId: weapon.id,
        life: weapon.range / speed,
        ownerId: player.id,
        burnDuration: weapon.burnDuration ?? 2,
        burnDamage: weapon.damage * 0.4,
      });
    }
    audio?.play("shoot");
  }

  private findNearestEnemy(x: number, y: number, range: number) {
    let best: Enemy | null = null;
    let bestDist = range;
    for (const enemy of this.state.enemies) {
      const dist = distance({ x, y }, enemy);
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }
    return best;
  }

  private updateProjectiles(dt: number) {
    const projectiles = this.state.projectiles;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (
        p.life <= 0 ||
        p.x < -50 ||
        p.x > this.state.map.width + 50 ||
        p.y < -50 ||
        p.y > this.state.map.height + 50
      ) {
        if (p.isExplosive) {
          this.explodeProjectile(p);
        }
        projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemyProjectiles(dt: number) {
    const projectiles = this.state.enemyProjectiles;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (
        p.life <= 0 ||
        p.x < -50 ||
        p.x > this.state.map.width + 50 ||
        p.y < -50 ||
        p.y > this.state.map.height + 50
      ) {
        projectiles.splice(i, 1);
      }
    }
  }

  private spawnEnemies(dt: number) {
    this.state.spawnTimer -= dt;

    if (this.state.activeEvent?.type === "horde") {
      if (this.state.spawnTimer <= 0) {
        this.state.spawnTimer = DEFAULT_BALANCE.difficulty.hordeSpawnInterval;
        for (let i = 0; i < DEFAULT_BALANCE.difficulty.hordeSpawnCount; i++) this.spawnEnemy();
      }
      return;
    }

    if (this.state.mode === "survival") {
      this.spawnBatchTimer -= dt;
      if (this.spawnBatchTimer <= 0) {
        const cfg = DEFAULT_BALANCE.modes.survival;
        const difficulty = this.state.difficulty;
        const count = Math.floor(cfg.spawnBurstCount + difficulty * 0.4);
        for (let i = 0; i < count; i++) this.spawnEnemy();
        this.spawnBatchTimer = Math.max(0.55, cfg.spawnBurstInterval - difficulty * 0.06);
      }
      return;
    }

    if (this.state.spawnTimer <= 0) {
      const difficulty = this.state.difficulty;
      this.state.spawnTimer = getSpawnInterval(difficulty);
      this.pendingSpawns += getSpawnCount(difficulty);
      this.state.difficulty += DEFAULT_BALANCE.difficulty.difficultyGrowth;
    }

    if (this.pendingSpawns > 0) {
      this.spawnBatchTimer -= dt;
      if (this.spawnBatchTimer <= 0) {
        const batchSize = Math.min(3, this.pendingSpawns);
        for (let i = 0; i < batchSize; i++) {
          this.spawnEnemy();
          this.pendingSpawns--;
        }
        this.spawnBatchTimer = 0.38;
      }
    }
  }

  private spawnEnemy(variantOverride?: EnemyVariant, elite = false) {
    const pos = randomPointOnBorder(this.state.map.width, this.state.map.height);
    const roll = Math.random();
    const difficulty = this.state.difficulty;
    let variant: EnemyVariant = variantOverride ?? "walker";
    if (!variantOverride) {
      if (roll > 0.88) variant = "tank";
      else if (roll > 0.72) variant = "runner";
      else if (roll > 0.58 && difficulty > 3) variant = "spitter";
      else if (roll < getEliteSpawnChance(difficulty) && difficulty > 6) variant = "elite";
    }

    const balance = DEFAULT_BALANCE.enemies[variant] ?? DEFAULT_BALANCE.enemies.base;
    let baseHealth = getDifficultyScaledHealth(difficulty, variant);
    let speed = balance.speed;
    let damage = balance.damage;
    let radius = balance.radius;
    let xpValue = balance.xpValue;
    let color = balance.color;
    let attackCooldown = balance.attackCooldown ?? 0;

    if (variant === "elite" || variant === "boss") {
      elite = true;
    }

    if (elite && variant !== "elite" && variant !== "boss") {
      const e = balance;
      baseHealth = Math.floor(baseHealth * (e.eliteHealthMul ?? 3));
      damage *= e.eliteDamageMul ?? 1.6;
      speed *= e.eliteSpeedMul ?? 1.1;
      xpValue *= e.eliteXpMul ?? 3;
      radius *= 1.15;
    }

    const affixes: Enemy["affixes"] = [];
    if (elite || variant === "elite") {
      const count = getEliteAffixCount(difficulty);
      const pool = [
        "shielded",
        "swift",
        "explosive",
        "regenerating",
        "taunting",
        "freezing",
        "corrosive",
        "splitting",
      ] as Enemy["affixes"];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        affixes.push(pool[idx]);
        pool.splice(idx, 1);
      }
    }

    const enemy: Enemy = {
      id: uid("enemy"),
      x: pos.x,
      y: pos.y,
      radius,
      speed,
      health: baseHealth,
      maxHealth: baseHealth,
      damage,
      xpValue,
      color,
      variant,
      slow: 0,
      slowTimer: 0,
      freezeTimer: 0,
      droneMarkTimer: 0,
      isElite: elite,
      isBoss: variant === "boss",
      affixes,
      attackTimer: randomRange(0, attackCooldown),
      attackCooldown,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      phase: 0,
      phaseThresholds: variant === "boss" ? [0.65, 0.35] : [],
      targetCore: this.state.mode === "defense",
      facing: 0,
      animation: "move",
      animationTimer: 0,
    };

    applyAffixes(enemy);
    this.state.enemies.push(enemy);
  }

  private updateEnemies(dt: number) {
    const player = this.state.player;
    const ds = this.state.defenseState;
    const core = ds?.core;

    for (const enemy of this.state.enemies) {
      if (enemy.burnDuration > 0) {
        enemy.burnDuration -= dt;
        enemy.health -= 5 * dt;
        if (Math.random() < dt * 6) {
          this.particlePool.spawnPreset(
            "spark",
            enemy.x + randomRange(-enemy.radius, enemy.radius),
            enemy.y + randomRange(-enemy.radius, enemy.radius),
            "#fb923c",
            { intensity: 0.8 }
          );
        }
      }

      const regen = getRegenRate(enemy);
      if (regen > 0) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + regen * dt);
      }

      if (enemy.isBoss) {
        const changed = checkBossPhaseTransition(enemy, this);
        if (changed) {
          this.callbacks.onBossPhaseChange?.(enemy, enemy.phase);
          this.particlePool.spawnPreset("energy", enemy.x, enemy.y, enemy.color, {
            intensity: 1.5,
          });
          this.fx.addShake(2, 0);
          this.fx.triggerFlash({ duration: 0.25, color: enemy.color, opacity: 0.25 });
        }
      }

      enemy.knockbackX *= Math.max(0, 1 - dt * 5);
      enemy.knockbackY *= Math.max(0, 1 - dt * 5);

      // Defense mode: enemies with targetCore move toward the core
      const target = ds && enemy.targetCore && core ? core : player;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const len = Math.hypot(dx, dy);

      if (len > 0) {
        setFacing(enemy, target.x, target.y);
      }

      if (
        (enemy.variant === "spitter" || enemy.isElite || enemy.isBoss) &&
        enemy.attackCooldown > 0
      ) {
        enemy.attackTimer -= dt;
        const preferredDistance = enemy.variant === "spitter" ? 300 : enemy.isBoss ? 280 : 220;
        if (len > 0) {
          const dirX = dx / len;
          const dirY = dy / len;
          if (len < preferredDistance - 40) {
            enemy.x -= dirX * enemy.speed * dt * 0.6;
            enemy.y -= dirY * enemy.speed * dt * 0.6;
          } else if (len > preferredDistance + 40) {
            enemy.x += dirX * enemy.speed * dt;
            enemy.y += dirY * enemy.speed * dt;
          }
          if (enemy.attackTimer <= 0) {
            this.fireEnemyProjectile(enemy);
            enemy.attackTimer = enemy.attackCooldown;
          }
        }
      } else if (len > 0) {
        enemy.x += (dx / len) * enemy.speed * dt;
        enemy.y += (dy / len) * enemy.speed * dt;
      }

      enemy.x += enemy.knockbackX * dt;
      enemy.y += enemy.knockbackY * dt;

      this.resolveObstacleCollisions(enemy);

      enemy.x = clamp(enemy.x, enemy.radius, this.state.map.width - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, this.state.map.height - enemy.radius);

      updateAnimation(
        enemy,
        dt,
        getEnemySprite(enemy.variant, enemy.color, enemy.burnDuration > 0 ? "#fb923c" : "#000000")
      );
    }
  }

  private fireEnemyProjectile(enemy: Enemy) {
    const player = this.state.player;
    const pattern = getBossAttackPattern(enemy);
    const baseAngle = angleBetween(enemy, player);
    const speed = enemy.isBoss ? 320 : 240;
    const count = pattern.projectileCount;

    if (pattern.attackPattern === "summon") {
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 * i) / 3;
        const dist = 60;
        this.spawnEnemy("walker", false);
        const minion = this.state.enemies[this.state.enemies.length - 1];
        minion.x = enemy.x + Math.cos(angle) * dist;
        minion.y = enemy.y + Math.sin(angle) * dist;
      }
      return;
    }

    if (pattern.attackPattern === "laser") {
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const angle = baseAngle + (i - steps / 2) * 0.15;
        this.state.enemyProjectiles.push({
          id: uid("eproj"),
          x: enemy.x + Math.cos(angle) * (enemy.radius + 8),
          y: enemy.y + Math.sin(angle) * (enemy.radius + 8),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 6,
          damage: enemy.damage,
          speed,
          color: enemy.color,
          life: 4,
        });
      }
      return;
    }

    for (let i = 0; i < count; i++) {
      let spread = 0;
      if (pattern.attackPattern === "spread") {
        spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.25;
      } else if (pattern.attackPattern === "burst") {
        spread = randomRange(-0.2, 0.2);
      }
      const theta = baseAngle + spread;
      this.state.enemyProjectiles.push({
        id: uid("eproj"),
        x: enemy.x + Math.cos(theta) * (enemy.radius + 8),
        y: enemy.y + Math.sin(theta) * (enemy.radius + 8),
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        radius: enemy.isBoss ? 8 : 5,
        damage: enemy.damage,
        speed,
        color: enemy.color,
        life: 4,
      });
    }
    audio?.play("enemyShoot");
  }

  private updateHazards(dt: number) {
    const player = this.state.player;
    for (const hazard of this.state.map.hazards) {
      hazard.timer += dt;
      if (hazard.timer >= hazard.interval) {
        hazard.timer = 0;
        const dist = distance(player, hazard);
        if (dist <= hazard.radius + player.radius) {
          this.damagePlayer(hazard.damage, false);
          this.fx.addShake(0.5, 0);
        }
        for (const enemy of this.state.enemies) {
          if (distance(enemy, hazard) <= hazard.radius + enemy.radius) {
            enemy.health -= hazard.damage * 2;
          }
        }
      }
    }
  }

  private updatePickups(dt: number) {
    const player = this.state.player;
    for (const pickup of this.state.pickups) {
      const dist = distance(player, pickup);
      if (dist <= player.magnetRange) {
        pickup.magnetized = true;
      }
      if (pickup.magnetized) {
        const t = Math.min(1, dt * 8);
        pickup.x = lerp(pickup.x, player.x, t);
        pickup.y = lerp(pickup.y, player.y, t);
      }
    }
  }

  private updateParticles(dt: number) {
    this.particlePool.update(dt);
    this.state.particles = this.particlePool.getParticles();
  }

  private updateDamageNumbers(dt: number) {
    const numbers = this.state.damageNumbers;
    for (let i = numbers.length - 1; i >= 0; i--) {
      const n = numbers[i];
      n.y -= 20 * dt;
      n.life -= dt;
      if (n.life <= 0) numbers.splice(i, 1);
    }
  }

  private updateMissionsAndExtraction(dt: number) {
    if (this.state.mode === "roguelike" && this.state.roguelikeRunState) {
      this.updateRoguelikeProgress(dt);
      return;
    }

    if (this.state.modeConfig.allowMissions) {
      updateMissions(this.state, dt);

      const current = getCurrentMission(this.state);
      if (current && current.completed) {
        advanceMission(this.state);
        this.callbacks.onMissionComplete?.();
        if (this.state.currentMissionIndex >= this.state.missions.length) {
          this.callbacks.onExtractionReady?.();
          audio?.play("alert");
        }
      }
    }

    if (this.state.extraction && this.state.currentMissionIndex >= this.state.missions.length) {
      this.state.extractionTimer -= dt;
      const player = this.state.player;
      const ex = this.state.extraction;
      const dx = player.x - ex.x;
      const dy = player.y - ex.y;
      if (dx * dx + dy * dy <= ex.radius * ex.radius) {
        this.endRun(true);
      }
      if (this.state.extractionTimer <= 0) {
        this.endRun(false);
      }
    }
  }

  private updateRoguelikeProgress(dt: number) {
    const run = this.state.roguelikeRunState!;
    if (run.completed) return;

    const stage = getCurrentStage(run);
    if (!stage) return;

    updateMissions(this.state, dt);

    if (isStageComplete(stage) && this.state.status === "running") {
      if (stage.type === "reward" && shouldOfferReward(run)) {
        const options = generateRewardOptions(run, this.state.player);
        this.state.status = "reward";
        this.callbacks.onRoguelikeRewardOffer?.(options);
        return;
      }

      this.advanceRoguelikeStage();
    }
  }

  private advanceRoguelikeStage() {
    const run = this.state.roguelikeRunState!;
    markCurrentStageComplete(run);
    const advanced = advanceStage(run);

    if (!advanced) {
      if (run.victory) {
        this.endRun(true);
      }
      return;
    }

    const nextStage = getCurrentStage(run);
    this.state.missions = nextStage ? [nextStage.mission] : [];
    this.state.currentMissionIndex = 0;

    if (nextStage?.type === "boss") {
      this.spawnEnemy("boss", true);
    } else if (nextStage?.type === "elite") {
      this.spawnEnemy("elite", true);
    }
  }

  private updateEvents(dt: number) {
    const previousEvent = this.state.activeEvent;
    tickGameEvent(this.state, dt);

    if (previousEvent && !this.state.activeEvent) {
      // Event completed - grant completion reward
      const reward = calculateEventCompletionReward(previousEvent.type);
      grantEventReward(this.state, reward);
    }

    if (!this.state.activeEvent) {
      this.state.eventTimer -= dt;
      if (this.state.eventTimer <= 0) {
        this.startRandomEvent();
        this.state.eventTimer = randomRange(25, 40);
      }
    }
  }

  private updateWave(dt: number) {
    if (!this.state.modeConfig.endless) return;

    if (this.state.mode === "survival") {
      this.state.time += dt;
      const cfg = DEFAULT_BALANCE.modes.survival;
      if (this.state.time >= cfg.timeLimit) {
        this.endRun(true);
        return;
      }
    }

    this.state.waveTimer += dt;
    const isSurvival = this.state.mode === "survival";
    const waveDuration = isSurvival
      ? DEFAULT_BALANCE.modes.survival.waveDuration
      : DEFAULT_BALANCE.modes.endlessWaveDuration;
    if (this.state.waveTimer >= waveDuration) {
      this.state.waveTimer -= waveDuration;
      this.state.wave += 1;
      this.state.difficulty += isSurvival
        ? DEFAULT_BALANCE.modes.survival.difficultyBump
        : DEFAULT_BALANCE.modes.endlessDifficultyBump;
      this.state.stats.wavesCleared = (this.state.stats.wavesCleared ?? 0) + 1;
      const bossInterval = isSurvival
        ? DEFAULT_BALANCE.modes.survival.bossWaveInterval
        : DEFAULT_BALANCE.modes.endlessBossWaveInterval;
      if (
        (this.state.mode === "endless" || isSurvival) &&
        this.state.wave % bossInterval === 0
      ) {
        this.spawnEnemy("boss", true);
      }
      if (this.state.mode === "daily") {
        this.state.missions = generateEndlessMissions(this.state.wave);
        this.state.currentMissionIndex = 0;
      }
    }
  }

  private updateHeroSkillsAndDeployables(dt: number) {
    updateHeroSkillsAndDeployables(this.state, dt);
  }

  private handleDeployableShieldCollisions() {
    handleDeployableShieldCollisions(this.state);
  }

  private handleMineProximity() {
    handleMineProximity(this.state);
  }

  private updateKillCombo(dt: number) {
    const combo = this.state.killCombo;
    if (combo.count > 0) {
      combo.timer -= dt;
      if (combo.timer <= 0) {
        combo.count = 0;
      }
    }
  }

  private addKillCombo(isBoss: boolean) {
    const combo = this.state.killCombo;
    combo.count += 1;
    combo.timer = 2.5;
    if (combo.count > combo.best) {
      combo.best = combo.count;
    }

    const milestones = [10, 25, 50, 100];
    if (milestones.includes(combo.count)) {
      this.callbacks.onKillStreak?.(combo.count);
    }

    if (combo.count >= 10) {
      this.spawnDamageNumber(
        this.state.player.x,
        this.state.player.y - this.state.player.radius - 24,
        combo.count,
        combo.count >= 50 ? "#f43f5e" : combo.count >= 25 ? "#f59e0b" : "#22d3ee",
        false
      );
    }

    if (isBoss) {
      combo.count = 0;
      combo.timer = 0;
    }
  }

  private updateDefenseState(dt: number) {
    const ds = this.state.defenseState;
    if (!ds || this.state.mode !== "defense") return;

    // Victory / defeat checks
    if (isDefenseVictory(ds)) {
      const reward = calculateDefenseCompletionRewards(this.state);
      grantMissionReward(this.state, reward);
      this.endRun(true);
      return;
    }
    if (isDefenseDefeat(ds)) {
      this.endRun(false);
      return;
    }

    // Node capture by all players
    const players = [this.state.player, ...this.state.players];
    for (const player of players) {
      updateNodeCapture(ds, player, dt);
    }

    const previousCaptured = getCapturedNodeCount(ds);

    // Wave management
    if (!ds.waveInProgress) {
      ds.breakTimer -= dt;
      if (ds.breakTimer <= 0 && ds.currentWave < ds.totalWaves) {
        ds.waveInProgress = true;
        ds.waveTimer = 0;
        activateNodeForWave(ds, ds.currentWave);
      }
    } else {
      const wave = ds.waves[ds.currentWave];
      if (wave) {
        ds.waveTimer += dt;

        // Spawn wave enemies
        if (ds.spawnTimer === undefined) {
          ds.spawnTimer = 0;
        }
        ds.spawnTimer -= dt;
        if (ds.spawnTimer <= 0) {
          ds.spawnTimer = Math.max(0.35, 1.4 - ds.currentWave * 0.1);
          const remainingSlots = wave.enemyCount - this.state.enemies.length;
          const spawnBatch = Math.min(3, Math.max(1, Math.floor(remainingSlots / 4)));
          for (let i = 0; i < spawnBatch && this.state.enemies.length < wave.enemyCount; i++) {
            const variant = this.pickDefenseWaveVariant(wave);
            this.spawnEnemy(variant, false);
          }
        }

        // Spawn elites
        if (wave.eliteCount > 0 && this.rng() < 0.008 * dt * 60) {
          this.spawnEnemy("elite", true);
          wave.eliteCount--;
        }

        // Spawn boss on final wave
        if (
          ds.currentWave === ds.totalWaves - 1 &&
          wave.bossVariant &&
          this.state.enemies.length > 0 &&
          this.state.enemies.every((e) => !e.isBoss)
        ) {
          const bossId = wave.bossVariant as import("./types").BossId;
          this.spawnEnemy(bossId as import("./types").EnemyVariant, true);
        }

        // End wave when duration elapsed and enemies cleared
        if (ds.waveTimer >= wave.duration && this.state.enemies.length === 0) {
          ds.waveInProgress = false;
          ds.currentWave += 1;
          ds.breakTimer = 8;
          this.state.stats.wavesCleared = (this.state.stats.wavesCleared ?? 0) + 1;
        }
      }
    }

    // Core damage from enemies that reach it
    if (ds.core.health > 0) {
      for (const enemy of this.state.enemies) {
        const dist = Math.hypot(enemy.x - ds.core.x, enemy.y - ds.core.y);
        if (dist <= ds.core.radius + enemy.radius) {
          damageCore(ds, enemy.damage * dt * 2);
          enemy.health -= 20 * dt;
        }
      }
    }

    // Track node captures for missions
    const currentCaptured = getCapturedNodeCount(ds);
    if (currentCaptured > previousCaptured) {
      addNodeCapture(this.state, currentCaptured - previousCaptured);
    }
  }

  private pickDefenseWaveVariant(
    wave: import("./types").DefenseWave
  ): import("./types").EnemyVariant {
    const fallback: import("./types").EnemyVariant[] = ["drone", "sentinel"];
    const variants = wave.enemyVariants.length > 0 ? wave.enemyVariants : fallback;
    return variants[Math.floor(this.rng() * variants.length)];
  }

  private startRandomEvent() {
    const type = pickRandomEventType(this.state, this.rng);
    const event = startGameEvent(type, this.state);

    if (type === "eliteHunt") {
      this.spawnEnemy("elite", true);
    }

    this.callbacks.onEventStart?.(event);
    audio?.play("alert");
  }

  private handleCollisions() {
    this.handleProjectileEnemyCollisions();
    this.handleEnemyProjectilePlayerCollisions();
    this.handleEnemyPlayerCollisions();
    if (this.state.mode === "deathmatch") {
      this.handleProjectilePlayerCollisions();
    }
    this.handlePickupCollisions();
    this.handleProjectileObstacleCollisions();
    this.cleanDeadEnemies();
  }

  private handleProjectileEnemyCollisions() {
    const projectiles = this.state.projectiles;
    const enemies = this.state.enemies;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (circleCollision(p, enemy)) {
          hit = true;
          const isCrit = Math.random() < this.state.player.critChance;
          const comboMul = 1 + Math.min(0.35, this.state.killCombo.count * 0.012);
          const critMul = isCrit ? DEFAULT_BALANCE.player.critDamageMultiplier : 1;
          let damage = p.damage * comboMul * critMul;
          damage = this.applyDamage(enemy, damage, p.burnDuration, p.burnDamage);
          p.pierce -= 1;
          this.state.stats.damageDealt += damage;
          this.spawnDamageNumber(enemy.x, enemy.y, damage, p.color, isCrit);
          if (isCrit) {
            this.fx.addTrauma(0.08);
            this.fx.addShake(0.4, 0);
            this.particlePool.spawnPreset("crit", enemy.x, enemy.y, "#facc15", { intensity: 1 });
            audio?.play("crit");
          } else {
            this.particlePool.spawnPreset("hit", enemy.x, enemy.y, p.color, { intensity: 0.7 });
          }

          const knockbackPower =
            p.weaponId === "shotgun" ? 120 : p.weaponId === "rocket" ? 200 : 40;
          const dx = enemy.x - p.x;
          const dy = enemy.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          enemy.knockbackX += (dx / dist) * knockbackPower;
          enemy.knockbackY += (dy / dist) * knockbackPower;

          if (p.isExplosive) {
            this.explodeProjectile(p);
            projectiles.splice(i, 1);
            break;
          }

          if (p.pierce < 0) {
            projectiles.splice(i, 1);
            break;
          }
        }
      }
      if (hit && p.pierce < 0) {
        continue;
      }
    }
  }

  private handleEnemyProjectilePlayerCollisions() {
    const player = this.state.player;
    for (let i = this.state.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.state.enemyProjectiles[i];
      if (circleCollision(p, player)) {
        this.damagePlayer(p.damage, true);
        this.state.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private handleProjectilePlayerCollisions() {
    const allPlayers = [this.state.player, ...this.state.players];
    const projectiles = this.state.projectiles;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (!p.ownerId) continue;
      for (const target of allPlayers) {
        if (target.id === p.ownerId || target.health <= 0) continue;
        if (circleCollision(p, target)) {
          this.damagePlayerInDeathmatch(target, p.damage, p.ownerId);
          p.pierce -= 1;
          if (p.pierce < 0) {
            projectiles.splice(i, 1);
          }
          break;
        }
      }
    }
  }

  private damagePlayerInDeathmatch(victim: Player, rawDamage: number, attackerId: string) {
    if (victim.invincible > 0) return;
    const reduced = rawDamage * (1 - Math.min(0.75, victim.armor));
    victim.health -= reduced;
    this.state.stats.damageTaken += reduced;
    this.spawnDamageNumber(victim.x, victim.y, reduced, "#f43f5e");
    this.fx.addShake(0.6, 0);
    audio?.play("hurt");

    const dm = this.state.deathmatchState;
    if (dm) {
      recordDamage(dm, attackerId, reduced);
    }

    if (victim.health <= 0) {
      if (dm) {
        recordKill(dm, attackerId, victim.id);
        if (attackerId === this.state.player.id) {
          this.state.stats.kills += 1;
          this.state.killCombo.count += 1;
          this.state.killCombo.timer = 2.5;
        }
      }
      respawnPlayer(victim, this.state);
    }
  }

  private handleEnemyPlayerCollisions() {
    const player = this.state.player;
    for (const enemy of this.state.enemies) {
      if (circleCollision(player, enemy)) {
        this.damagePlayer(enemy.damage, true, enemy);
      }
    }
  }

  private damagePlayer(rawDamage: number, withInvincibility: boolean, source?: Enemy) {
    const player = this.state.player;
    if (withInvincibility && player.invincible > 0) return;

    const reduced = rawDamage * (1 - Math.min(0.75, player.armor));
    player.health -= reduced;
    this.state.stats.damageTaken += reduced;
    if (withInvincibility) {
      player.invincible = 0.5;
    }
    this.fx.addShake(1, 0);
    this.fx.addTrauma(0.15);
    audio?.play("hurt");
    this.spawnDamageNumber(player.x, player.y, reduced, "#f43f5e");

    if (source) {
      const dx = player.x - source.x;
      const dy = player.y - source.y;
      const dist = Math.hypot(dx, dy) || 1;
      const power = source.isBoss ? 300 : 120;
      player.knockbackX += (dx / dist) * power;
      player.knockbackY += (dy / dist) * power;
      source.knockbackX -= (dx / dist) * power * 0.5;
      source.knockbackY -= (dy / dist) * power * 0.5;
    }

    if (player.health <= 0) {
      this.endRun(false);
    }
  }

  private applyDamage(
    enemy: Enemy,
    rawDamage: number,
    burnDuration?: number,
    burnDamage?: number
  ): number {
    enemy.health -= rawDamage;
    if (burnDuration && burnDamage) {
      enemy.burnDuration = burnDuration;
    }
    audio?.play("hit");
    return rawDamage;
  }

  private explodeProjectile(p: Projectile) {
    const radius = p.areaRadius ?? 60;
    this.particlePool.spawnPreset("explosion", p.x, p.y, p.color, { intensity: 1.2 });
    this.fx.addShake(1.5, 0);
    this.fx.addTrauma(0.2);
    for (const enemy of this.state.enemies) {
      if (distance(enemy, p) <= radius + enemy.radius) {
        const damage = p.damage * 0.6;
        this.applyDamage(enemy, damage);
        this.spawnDamageNumber(enemy.x, enemy.y, damage, p.color);
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        enemy.knockbackX += (dx / dist) * 180;
        enemy.knockbackY += (dy / dist) * 180;
      }
    }
  }

  private handleProjectileObstacleCollisions() {
    const projectiles = this.state.projectiles;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      for (const obs of this.state.map.obstacles) {
        if (circleRectCollision(p, obs)) {
          if (p.isExplosive) {
            this.explodeProjectile(p);
          }
          if (obs.destructible) {
            obs.health -= p.damage;
            if (obs.health <= 0) {
              this.particlePool.spawnPreset("smoke", obs.x, obs.y, obs.color, {
                intensity: 1,
              });
              this.particlePool.spawnPreset("spark", obs.x, obs.y, "#f59e0b", {
                intensity: 0.6,
              });
            }
          }
          projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private cleanDeadEnemies() {
    const enemies = this.state.enemies;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (enemy.health <= 0) {
        this.killEnemy(enemy, j);
      }
    }
  }

  private killEnemy(enemy: Enemy, index: number) {
    transitionAnimation(enemy, "death");

    if (shouldExplodeOnDeath(enemy)) {
      this.particlePool.spawnPreset("explosion", enemy.x, enemy.y, enemy.color, {
        intensity: 1.4,
      });
      const explosionRadius = 80;
      if (distance(this.state.player, enemy) <= explosionRadius + this.state.player.radius) {
        this.damagePlayer(enemy.damage * 1.5, true);
      }
      this.fx.addShake(1.5, 0);
      this.fx.addTrauma(0.25);
    }

    if (shouldSplitOnDeath(enemy)) {
      for (let i = 0; i < 2; i++) {
        this.spawnEnemy(enemy.variant === "walker" ? "runner" : "walker", false);
        const split = this.state.enemies[this.state.enemies.length - 1];
        split.x = enemy.x + randomRange(-20, 20);
        split.y = enemy.y + randomRange(-20, 20);
        split.radius *= 0.7;
        split.maxHealth *= 0.5;
        split.health = split.maxHealth;
        split.damage *= 0.6;
      }
    }

    this.state.enemies.splice(index, 1);
    addKill(this.state);
    this.addKillCombo(enemy.isBoss);
    if (enemy.isElite) {
      this.state.stats.elitesKilled++;
      this.state.eliteKillStreak++;
    }
    if (enemy.isBoss) {
      this.state.stats.bossesKilled++;
      this.state.eliteKillStreak = 0;
    }

    const killIntensity = enemy.isBoss ? 3 : enemy.isElite ? 1.8 : 1;
    this.particlePool.spawnPreset("kill-burst", enemy.x, enemy.y, enemy.color, {
      intensity: killIntensity,
    });
    this.particlePool.spawnPreset("explosion", enemy.x, enemy.y, enemy.color, {
      intensity: killIntensity * 0.8,
    });
    if (enemy.isBoss || enemy.isElite) {
      this.particlePool.spawnPreset("energy", enemy.x, enemy.y, "#ffffff", {
        intensity: enemy.isBoss ? 2 : 1,
      });
    }
    if (enemy.isBoss) {
      this.fx.triggerFlash({ duration: 0.45, color: enemy.color, opacity: 0.4 });
    }
    this.dropPickup(enemy);
    audio?.play("explosion");
    this.fx.addShake(enemy.isBoss ? 4 : enemy.isElite ? 1.8 : 0.9, 0);
    this.fx.addTrauma(enemy.isBoss ? 0.5 : enemy.isElite ? 0.25 : 0.15);
  }

  private dropPickup(enemy: Enemy) {
    const roll = Math.random();
    const pickupCfg = DEFAULT_BALANCE.pickups;
    if (enemy.isBoss || (enemy.isElite && roll < pickupCfg.chestEliteChance)) {
      this.state.pickups.push({
        id: uid("pickup"),
        x: enemy.x,
        y: enemy.y,
        radius: 16,
        type: "chest",
        value: 0,
        color: "#e879f9",
        magnetized: false,
      });
      if (enemy.isBoss) return;
    }
    if (roll < 0.015) {
      this.state.pickups.push({
        id: uid("pickup"),
        x: enemy.x,
        y: enemy.y,
        radius: 8,
        type: "health",
        value: pickupCfg.healthValue,
        color: "#34d399",
        magnetized: false,
      });
    } else if (roll < 0.13) {
      this.state.pickups.push({
        id: uid("pickup"),
        x: enemy.x,
        y: enemy.y,
        radius: 7,
        type: "resource",
        value: pickupCfg.resourceValue,
        color: "#f59e0b",
        magnetized: false,
      });
    } else {
      this.state.pickups.push({
        id: uid("pickup"),
        x: enemy.x,
        y: enemy.y,
        radius: enemy.isElite ? 8 : 5,
        type: "xp",
        value: getXpValue(enemy, this.state.difficulty),
        color: "#22d3ee",
        magnetized: false,
      });
    }
  }

  private handlePickupCollisions() {
    const player = this.state.player;
    const pickups = this.state.pickups;
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      if (circleCollision(player, pickup)) {
        if (pickup.type === "xp") {
          player.xp += pickup.value;
          this.state.stats.xpCollected += pickup.value;
          audio?.play("pickup");
          this.checkLevelUp();
        } else if (pickup.type === "health") {
          player.health = Math.min(player.maxHealth, player.health + pickup.value);
          audio?.play("pickup");
        } else if (pickup.type === "resource") {
          addResource(this.state, pickup.value);
          audio?.play("pickup");
        } else if (pickup.type === "chest") {
          this.openChest(pickup);
          audio?.play("pickup");
        }
        pickups.splice(i, 1);
      }
    }
  }

  private openChest(pickup: Pickup) {
    const player = this.state.player;
    this.state.stats.chestsOpened++;
    const drops = [
      { type: "health" as const, value: 30, color: "#34d399" },
      { type: "xp" as const, value: Math.floor(player.xpToNext * 0.4), color: "#22d3ee" },
      { type: "resource" as const, value: 3, color: "#f59e0b" },
    ];
    for (const drop of drops) {
      this.state.pickups.push({
        id: uid("pickup"),
        x: pickup.x + randomRange(-30, 30),
        y: pickup.y + randomRange(-30, 30),
        radius: drop.type === "health" ? 8 : 6,
        type: drop.type,
        value: drop.value,
        color: drop.color,
        magnetized: false,
      });
    }
  }

  private checkLevelUp() {
    const player = this.state.player;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.xpToNext = Math.floor(player.xpToNext * 1.25 + 20);
      audio?.play("levelup");
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp() {
    this.pendingUpgradeOptions = generateUpgradeOptions(this.state.player);
    this.state.status = "levelup";
    this.callbacks.onLevelUp?.(this.pendingUpgradeOptions);
  }

  selectUpgrade(option: UpgradeOption) {
    if (this.state.status !== "levelup") return;
    this.state.player = applyUpgrade(this.state.player, option);
    this.pendingUpgradeOptions = null;
    this.state.status = "running";
    this.state.lastTime = performance.now();
  }

  selectRoguelikeReward(rewardId: string) {
    if (this.state.status !== "reward" || !this.state.roguelikeRunState) return;
    const success = applyReward(this.state.roguelikeRunState, this.state.player, rewardId);
    if (!success) return;
    this.state.status = "running";
    this.state.lastTime = performance.now();
    this.advanceRoguelikeStage();
  }

  surrender() {
    if (this.state.status !== "running" && this.state.status !== "paused") return;
    const result: RunResult = {
      victory: false,
      surrendered: true,
      stats: { ...this.state.stats },
      completedMissions: this.state.missions.filter((m) => m.completed).length,
      elapsed: this.state.stats.timeSurvived,
      mode: this.state.mode,
    };
    this.state.status = "defeat";
    audio?.play("alert");
    this.callbacks.onDefeat?.(result);
  }

  private endRun(victory: boolean) {
    this.state.status = victory ? "victory" : "defeat";
    const result: RunResult = {
      victory,
      stats: { ...this.state.stats },
      completedMissions: this.state.missions.filter((m) => m.completed).length,
      elapsed: this.state.stats.timeSurvived,
      mode: this.state.mode,
    };
    if (victory) {
      audio?.play("levelup");
      this.callbacks.onVictory?.(result);
    } else {
      audio?.play("alert");
      this.callbacks.onDefeat?.(result);
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count = 8) {
    this.particlePool.spawnPreset("explosion", x, y, color, {
      intensity: count / 12,
    });
  }

  private spawnParticle(x: number, y: number, color: string, count = 1) {
    this.particlePool.spawnPreset("trail", x, y, color, {
      intensity: count * 0.5,
    });
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    value: number,
    color: string,
    isCritical = false
  ) {
    this.state.damageNumbers.push({
      id: uid("dmg"),
      x,
      y,
      text: String(Math.round(value)),
      color,
      life: 0.7,
      isCritical,
    });
  }

  private updateCamera() {
    const player = this.state.player;
    const targetX = player.x;
    const targetY = player.y;
    this.state.camera.x += (targetX - this.state.camera.x) * 0.12;
    this.state.camera.y += (targetY - this.state.camera.y) * 0.12;
  }

  // Networking
  serialize(): SerializedGameState {
    return {
      status: this.state.status,
      mode: this.state.mode,
      seed: this.state.seed,
      time: this.state.time,
      map: this.state.map,
      player: this.state.player,
      players: this.state.players,
      enemies: this.state.enemies,
      projectiles: this.state.projectiles,
      enemyProjectiles: this.state.enemyProjectiles,
      pickups: this.state.pickups,
      particles: this.state.particles,
      damageNumbers: this.state.damageNumbers,
      missions: this.state.missions,
      currentMissionIndex: this.state.currentMissionIndex,
      extraction: this.state.extraction,
      extractionTimer: this.state.extractionTimer,
      spawnTimer: this.state.spawnTimer,
      eventTimer: this.state.eventTimer,
      difficulty: this.state.difficulty,
      intensity: this.state.intensity,
      wave: this.state.wave,
      waveTimer: this.state.waveTimer,
      stats: this.state.stats,
      activeEvent: this.state.activeEvent,
      waveEnemiesRemaining: this.state.enemies.length,
      eliteKillStreak: this.state.eliteKillStreak,
      killCombo: this.state.killCombo,
      roguelikeRunState: this.state.roguelikeRunState,
      deathmatchState: this.state.deathmatchState,
    };
  }

  applySerialized(serialized: SerializedGameState): void {
    this.state.status = serialized.status;
    this.state.time = serialized.time;
    this.state.map = serialized.map;
    this.state.player = serialized.player;
    this.state.players = serialized.players;
    this.state.enemies = serialized.enemies;
    this.state.projectiles = serialized.projectiles;
    this.state.enemyProjectiles = serialized.enemyProjectiles;
    this.state.pickups = serialized.pickups;
    this.particlePool.clear();
    for (const p of serialized.particles) {
      this.particlePool.addRaw({ ...p });
    }
    this.state.particles = this.particlePool.getParticles();
    this.state.damageNumbers = serialized.damageNumbers;
    this.state.missions = serialized.missions;
    this.state.currentMissionIndex = serialized.currentMissionIndex;
    this.state.extraction = serialized.extraction;
    this.state.extractionTimer = serialized.extractionTimer;
    this.state.spawnTimer = serialized.spawnTimer;
    this.state.eventTimer = serialized.eventTimer;
    this.state.difficulty = serialized.difficulty;
    this.state.intensity = serialized.intensity;
    this.state.wave = serialized.wave;
    this.state.waveTimer = serialized.waveTimer;
    this.state.stats = serialized.stats;
    this.state.activeEvent = serialized.activeEvent;
    this.state.eliteKillStreak = serialized.eliteKillStreak ?? 0;
    this.state.killCombo = serialized.killCombo ?? { count: 0, timer: 0, best: 0 };
    if (serialized.roguelikeRunState) {
      this.state.roguelikeRunState = serialized.roguelikeRunState;
    }
    if (serialized.deathmatchState) {
      this.state.deathmatchState = serialized.deathmatchState;
    }
  }

  addRemotePlayer(id: string, x: number, y: number): void {
    if (this.state.players.find((p) => p.id === id)) return;
    this.state.players.push(this.createPlayer(id, x, y));
  }

  updateRemotePlayerInput(id: string, input: InputState, dt: number): void {
    const player = this.state.players.find((p) => p.id === id);
    if (!player) return;
    const move = normalize(input.move);
    if (move.x !== 0 || move.y !== 0) {
      player.x += move.x * player.speed * dt;
      player.y += move.y * player.speed * dt;
      transitionAnimation(player, "move");
    } else {
      transitionAnimation(player, "idle");
    }
    if (input.aim.x !== 0 || input.aim.y !== 0) {
      setFacing(player, player.x + input.aim.x, player.y + input.aim.y);
    }
  }

  removeRemotePlayer(id: string): void {
    this.state.players = this.state.players.filter((p) => p.id !== id);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { camera } = this.state;
    const shake = this.fx.getDetailedShakeOffset();

    ctx.save();
    ctx.translate(this.canvasWidth / 2 + shake.x, this.canvasHeight / 2 + shake.y);
    ctx.rotate(shake.rotation);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    this.drawBackground(ctx);
    this.drawHazards(ctx);
    this.drawObstacles(ctx);
    this.drawNodes(ctx);
    this.drawExtraction(ctx);
    this.drawPickups(ctx);
    this.drawParticles(ctx);
    this.drawEnemyProjectiles(ctx);
    this.drawEnemies(ctx);
    this.drawRemotePlayers(ctx);
    this.drawPlayer(ctx);
    this.drawProjectiles(ctx);
    this.drawDamageNumbers(ctx);
    this.drawEvent(ctx);

    ctx.restore();

    this.fx.drawFlash(ctx, this.canvasWidth, this.canvasHeight);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const map = this.state.map;
    const theme = THEMES[map.theme];

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, map.width, map.height);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    const gridSize = 80;
    ctx.beginPath();
    for (let x = 0; x <= map.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, map.height);
    }
    for (let y = 0; y <= map.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(map.width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, map.width, map.height);
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.state.map.obstacles) {
      if (obs.health <= 0) continue;
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      ctx.strokeStyle = "#2a3050";
      ctx.lineWidth = 2;
      ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      if (obs.health < obs.maxHealth) {
        const pct = obs.health / obs.maxHealth;
        ctx.fillStyle = "#1c2033";
        ctx.fillRect(-obs.width / 2, -obs.height / 2 - 8, obs.width, 4);
        ctx.fillStyle = pct > 0.5 ? "#34d399" : "#f43f5e";
        ctx.fillRect(-obs.width / 2, -obs.height / 2 - 8, obs.width * pct, 4);
      }
      ctx.restore();
    }
  }

  private drawNodes(ctx: CanvasRenderingContext2D) {
    const ds = this.state.defenseState;
    if (!ds) return;

    const time = this.state.time;
    for (const node of ds.nodes) {
      ctx.save();
      ctx.translate(node.x, node.y);

      const hintRadius = node.radius + 5;
      const isCaptured = node.captured;
      const isActive = node.active && !isCaptured;
      const baseColor = isCaptured ? "#34d399" : node.color;
      const pulse = isActive ? Math.sin(time * 4) * 0.06 + 0.94 : 1;

      // Outer hint ring (radius + 5 units)
      ctx.beginPath();
      ctx.arc(0, 0, hintRadius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? `${baseColor}88` : `${baseColor}33`;
      ctx.lineWidth = isActive ? 3 : 2;
      if (isActive) {
        ctx.setLineDash([8, 8]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner fill
      ctx.beginPath();
      ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isCaptured ? `${baseColor}22` : `${baseColor}18`;
      ctx.fill();

      // Core ring
      ctx.beginPath();
      ctx.arc(0, 0, node.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `${baseColor}${isActive ? "aa" : "55"}`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Capture progress ring for active uncaptured nodes
      if (isActive && node.captureProgress > 0) {
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          node.radius * 0.85,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * node.captureProgress
        );
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = `${baseColor}${isActive ? "ff" : "99"}`;
      ctx.font = "bold 13px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isCaptured ? "已占领" : isActive ? "能量据点" : "未激活", 0, 0);

      ctx.restore();
    }
  }

  private drawHazards(ctx: CanvasRenderingContext2D) {
    const time = this.state.time;
    for (const hazard of this.state.map.hazards) {
      const pulse = Math.sin(time * 4 + hazard.x) * 0.1 + 0.9;
      ctx.save();
      ctx.translate(hazard.x, hazard.y);
      ctx.beginPath();
      ctx.arc(0, 0, hazard.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${hazard.color}22`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, hazard.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `${hazard.color}33`;
      ctx.fill();
      ctx.strokeStyle = hazard.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawExtraction(ctx: CanvasRenderingContext2D) {
    const ex = this.state.extraction;
    if (!ex || !ex.active) return;

    const isFinal = this.state.currentMissionIndex >= this.state.missions.length;
    const color = isFinal ? "#22d3ee" : "#f59e0b";
    ctx.save();
    ctx.translate(ex.x, ex.y);
    ctx.beginPath();
    ctx.arc(0, 0, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${color}22`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isFinal) {
      ctx.fillStyle = color;
      ctx.font = "bold 16px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("撤离点", 0, 5);
    } else {
      ctx.fillStyle = color;
      ctx.font = "bold 14px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("信标", 0, 5);
    }
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    this.drawEntity(ctx, this.state.player, "#22d3ee", "#0b0d17");
  }

  private drawRemotePlayers(ctx: CanvasRenderingContext2D) {
    for (const player of this.state.players) {
      if (player.id !== this.state.player.id) {
        this.drawEntity(ctx, player, "#f59e0b", "#0b0d17");
      }
    }
  }

  private drawEntity(
    ctx: CanvasRenderingContext2D,
    entity: Player,
    primaryColor: string,
    secondaryColor: string
  ) {
    const flicker = entity.invincible > 0 && Math.floor(this.state.time * 20) % 2 === 0;
    if (flicker) ctx.globalAlpha = 0.5;

    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.rotate(entity.facing);

    const sheet = getPlayerSprite(primaryColor, secondaryColor);
    const frameIndex = getCurrentFrameIndex(entity, sheet);
    const frames = sheet.animations[entity.animation] ?? sheet.animations.idle;
    const frame = frames[frameIndex] ?? frames[0];

    if (sheet.image && sheet.image.complete && frame) {
      ctx.drawImage(
        sheet.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -entity.radius,
        -entity.radius,
        entity.radius * 2,
        entity.radius * 2
      );
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
      ctx.fillStyle = secondaryColor;
      ctx.fill();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = primaryColor;
      ctx.fillRect(entity.radius * 0.5, -3, entity.radius, 6);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.state.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.facing);

      if (enemy.isElite || enemy.isBoss) {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const secondaryColor = enemy.burnDuration > 0 ? "#fb923c" : "#000000";
      const sheet = getEnemySprite(enemy.variant, enemy.color, secondaryColor);
      const frameIndex = getCurrentFrameIndex(enemy, sheet);
      const frames = sheet.animations[enemy.animation] ?? sheet.animations.move;
      const frame = frames[frameIndex] ?? frames[0];

      if (sheet.image && sheet.image.complete && frame) {
        ctx.drawImage(
          sheet.image,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          -enemy.radius,
          -enemy.radius,
          enemy.radius * 2,
          enemy.radius * 2
        );
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = enemy.isBoss ? "#ffffff" : "#000000";
        ctx.lineWidth = enemy.isBoss ? 2 : 1;
        ctx.stroke();
      }

      ctx.restore();

      const healthPct = enemy.health / enemy.maxHealth;
      ctx.fillStyle = "#1c2033";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 4);
      ctx.fillStyle = healthPct > 0.5 ? "#34d399" : "#f43f5e";
      ctx.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius - 8,
        enemy.radius * 2 * healthPct,
        4
      );
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.state.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.weaponId === "rocket") {
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, 5);
        ctx.lineTo(-6, -5);
        ctx.closePath();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
      } else if (p.weaponId === "flame") {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * (1 + Math.random()), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
      } else {
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.beginPath();
        ctx.rect(-6, -2, 12, 4);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  private drawEnemyProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.state.enemyProjectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const pickup of this.state.pickups) {
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
      ctx.fillStyle = pickup.color;
      ctx.shadowColor = pickup.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (pickup.type === "chest") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(-6, -5, 12, 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-2, -5, 4, 10);
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.state.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawDamageNumbers(ctx: CanvasRenderingContext2D) {
    for (const n of this.state.damageNumbers) {
      const alpha = Math.min(1, n.life * 2);
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = n.color;
      ctx.font = n.isCritical
        ? "bold 20px var(--font-geist-mono), monospace"
        : "bold 14px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      if (n.isCritical) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeText(n.text, 0, 0);
      }
      ctx.fillText(n.text, 0, 0);
      ctx.restore();
    }
  }

  private drawEvent(ctx: CanvasRenderingContext2D) {
    const event = this.state.activeEvent;
    if (!event || !event.x || !event.y) return;

    if (event.type === "airdrop") {
      ctx.save();
      ctx.translate(event.x, event.y);
      ctx.strokeStyle = "#e879f9";
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  get formatTimeSurvived() {
    return formatTime(this.state.stats.timeSurvived);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
