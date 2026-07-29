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
  Decor,
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
  DeathmatchBotTier,
  BossId,
  Vec2,
  DefenseWave,
  FixedWaveState,
  Deployable,
  DifficultyPreset,
  DifficultyPresetConfig,
} from "./types";
import { DIFFICULTY_PRESETS } from "./types";
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
  randomRangeRng,
  randomPointOnBorderRng,
  randomPointInBoundsRng,
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
  generateDefenseMissions,
  generateSurvivalMissions,
  generateDailyMissions,
  generateDeathmatchMissions,
  generateExtremeSurvivalMissions,
  generatePeakChallengeMissions,
  generateFlagshipMissions,
  generateFlagShipPeakMissions,
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
import { BOSSES, checkBossPhaseTransition, getBossAttackPattern, getRandomBossId, getRandomBossIdRng, getBossTemplate } from "./bosses";
import { AlphaScheduler, generateVariantStats } from "./alpha";
import type { AlphaEnemyStats } from "./alpha/types";
import { runEnemyAI, runBossAI, resetBossState } from "./ai";
import type { AIContext } from "./ai";
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
  returnToMoveAfterRecoil,
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
  shouldOfferCurseBlessing,
  generateCurseBlessingOptions,
  applyCurseBlessingChoice,
} from "./roguelike";
import type { CurseBlessingPair } from "./curseBlessing";
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
  createPeakChallengeState,
  updatePeakChallengeTasks,
  recordPeakChallengeKill,
  recordPeakChallengeBossKill,
  recordPeakChallengeWaveCleared,
  shouldOfferPeakChallengeReward,
  generatePeakChallengeRewardOptions,
  applyPeakChallengeEndRewards,
  PEAK_CHALLENGE_BRANCH_WAVE,
} from "./peak-challenge";
import {
  createFlagshipState,
  updateFlagshipChallenges,
  recordFlagshipKill,
  recordFlagshipBossKill,
  recordFlagshipWaveCleared,
  updateFlagshipCoreHealth,
  applyFlagshipEndRewards,
  FLAGSHIP_TOTAL_WAVES,
  FLAGSHIP_BOSS_WAVE,
} from "./flagship";
import {
  createFlagshipPeakState,
  updateFlagshipPeakChallenges,
  updateFlagshipPeakTasks,
  recordFlagshipPeakKill,
  recordFlagshipPeakBossKill,
  recordFlagshipPeakWaveCleared,
  updateFlagshipPeakCoreHealth,
  applyFlagshipPeakEndRewards,
  FLAGSHIP_PEAK_TOTAL_WAVES,
  FLAGSHIP_PEAK_MAX_TOTAL_WAVES,
  getFlagshipPeakPhase,
  getPhaseDifficultyMultiplier,
  generateFlagshipPeakWaveConfig,
} from "./flagship-peak";
import {
  createDeathmatchState,
  createDeathmatchMap,
  createBotPlayer,
  createBotPlayerRng,
  createBotAI,
  updateDeathmatch,
  respawnPlayer,
  recordKill,
  recordDamage,
  getDeathmatchLeaderId,
  applyDeathmatchHazardDamage,
  getBotTierName,
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
import { HERO_DEFS } from "./heroes";
import { getEquippedSkin, addCoins, addSeasonXp, addSeasonCurrency } from "./save";
import { getCosmetic } from "./cosmetics";
import type { ExtremeSurvivalRun, ExtremeSurvivalPhase, PerformanceSnapshot } from "@/lib/extreme-survival/types";
import {
  calculateWaveConfig,
  calculatePerformanceScore,
  shouldTriggerBranchChoice,
  BRANCH_WAVE,
} from "@/lib/extreme-survival/engine";
import { triggerOverloadShield } from "@/lib/extreme-survival/overloadShield";
import {
  calculateRewards,
  getTodayClaimed,
  addTodayClaimed,
} from "@/lib/extreme-survival/rewards";
import { updateWeather, getWeatherEffect, createWeatherState } from "./weather";
import type { WeatherState } from "./weather";

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;
const DEFAULT_PLAYER_COLOR = "#22d3ee";
const REMOTE_PLAYER_COLOR = "#f59e0b";

function resolvePlayerSkinColor(heroId?: HeroId | null, skinId?: string | null): string {
  if (skinId) {
    const cosmetic = getCosmetic(skinId);
    if (cosmetic?.color) return cosmetic.color;
  }
  if (heroId && heroId in HERO_DEFS) {
    return HERO_DEFS[heroId].color;
  }
  return DEFAULT_PLAYER_COLOR;
}

const THEMES: Record<MapTheme, { bg: string; grid: string; border: string; accent: string; gridAlt?: string }> = {
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
  onCurseBlessingOffer?: (pairs: CurseBlessingPair[]) => void;
  onKillStreak?: (count: number) => void;
  onBranchChoiceRequest?: () => void;
  onBreakEnd?: (purchases: Record<string, number>) => void;
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
  private graphicsQuality: "high" | "medium" | "low" = "medium";
  private alphaScheduler?: AlphaScheduler;
  private alphaPlanRef?: {
    enemyStats: import("./alpha/types").AlphaEnemyStats;
    snapshot: import("./alpha/types").AlphaDifficultySnapshot;
    isBossWave: boolean;
    spawned: number;
    killed: number;
  };
  private extremeSurvivalPendingChoice = false;
  private extremeSurvivalLastSnapshot?: PerformanceSnapshot;
  private extremeSurvivalLastKills = 0;
  private peakChallengePendingChoice = false;
  private _deathDelay = 0;
  private _deathAnimating = false;
  private _pendingBreakPurchases: Record<string, number> = {};
  private difficultyPreset: DifficultyPreset | null = null;
  private difficultyConfig: DifficultyPresetConfig | null = null;

  constructor(
    callbacks: GameCallbacks = {},
    mode: GameModeType = getDefaultMode(),
    seed?: number,
    loadout?: Loadout,
    difficultyPreset?: DifficultyPreset
  ) {
    this.callbacks = callbacks;
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = seededRandom(this.seed);
    this.loadout = {
      heroId: loadout?.heroId ?? null,
      weaponIds: loadout?.weaponIds?.slice(0, DEFAULT_BALANCE.progression.maxWeapons) ?? [],
    };
    this.difficultyPreset = difficultyPreset ?? null;
    this.difficultyConfig = difficultyPreset ? DIFFICULTY_PRESETS[difficultyPreset] : null;
    this.state = this.createInitialState(mode);
    this.state.particles = this.particlePool.getParticles();
  }

  private createInitialState(mode: GameModeType): GameState {
    const modeConfig = createGameModeConfig(mode, this.seed);
    const theme = this.randomTheme();
    const roguelikeRunState = mode === "roguelike" ? createRoguelikeRun(this.seed) : undefined;
    const isDefenseLike = mode === "defense" || mode === "extreme-survival" || mode === "peak-challenge" || mode === "flagship" || mode === "flagship-peak";
    const defenseState = isDefenseLike ? createDefenseState(this.seed) : undefined;
    const extremeSurvivalRun = mode === "extreme-survival" ? this.createExtremeSurvivalRun() : undefined;
    const peakChallengeState = mode === "peak-challenge" ? createPeakChallengeState() : undefined;
    const flagshipState = mode === "flagship" ? createFlagshipState() : undefined;
    const flagshipPeakState = mode === "flagship-peak" ? createFlagshipPeakState() : undefined;
    const missions = (() => {
      if (mode === "roguelike") {
        return roguelikeRunState ? [roguelikeRunState.stages[0].mission] : generateCampaignMissions();
      }
      if (mode === "campaign") return generateCampaignMissions();
      if (mode === "endless") return generateEndlessMissions(1);
      if (mode === "survival") return generateSurvivalMissions();
      if (mode === "daily") return generateDailyMissions(this.seed);
      if (mode === "deathmatch") return generateDeathmatchMissions();
      if (mode === "defense") return generateDefenseMissions(this.seed);
      if (mode === "extreme-survival") return generateExtremeSurvivalMissions();
      if (mode === "peak-challenge") return generatePeakChallengeMissions();
      if (mode === "flagship") return generateFlagshipMissions();
      if (mode === "flagship-peak") return generateFlagShipPeakMissions();
      return modeConfig.allowMissions
        ? generateCampaignMissions()
        : modeConfig.endless
          ? generateEndlessMissions(1)
          : [];
    })();

    let map: MapConfig;
    let deathmatchState: DeathmatchState | undefined;
    if (mode === "defense" || mode === "extreme-survival" || mode === "peak-challenge" || mode === "flagship" || mode === "flagship-peak") {
      map = createDefenseMap(this.seed);
    } else if (mode === "deathmatch") {
      map = createDeathmatchMap(this.seed);
      deathmatchState = createDeathmatchState(this.seed);
    } else {
      map = this.createMap(theme);
    }
    const startX = mode === "defense" || mode === "extreme-survival" || mode === "peak-challenge" || mode === "flagship" || mode === "flagship-peak" || mode === "deathmatch" ? map.width / 2 : MAP_WIDTH / 2;
    const startY = mode === "defense" || mode === "extreme-survival" || mode === "peak-challenge" || mode === "flagship" || mode === "flagship-peak" || mode === "deathmatch" ? map.height / 2 : MAP_HEIGHT / 2;

    const player = this.createPlayer("player", startX, startY);
    const heroId = this.loadout.heroId ?? this.state?.selectedHero;
    const equippedSkin = getEquippedSkin();
    if (heroId) {
      applyHeroToPlayer(player, heroId);
    }
    player.skinColor = resolvePlayerSkinColor(heroId, equippedSkin);

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
      const tierFromSkin: Record<string, DeathmatchBotTier> = {
        "#3b82f6": "rookie",
        "#f59e0b": "elite",
        "#ef4444": "predator",
      };
      for (let i = 0; i < deathmatchState.botCount; i++) {
        const botId = `bot_${i}`;
        const pos = spawnPoints[i % spawnPoints.length];
        const bot = createBotPlayerRng(this.rng, botId, pos.x, pos.y);
        players.push(bot);
        const tier = tierFromSkin[bot.skinColor ?? ""] ?? "veteran";
        deathmatchState.bots.push(createBotAI(botId, tier));
      }
    }

    const state: GameState = {
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
      difficulty: this.difficultyConfig ? this.difficultyConfig.difficultyMultiplier : 1,
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
      fixedWaveState: undefined,
      deathmatchState,
      extremeSurvivalRun,
      peakChallengeState,
      flagshipState,
      flagshipPeakState,
      selectedHero: heroId ?? this.state?.selectedHero,
      deployables: [],
    };

    if (mode === "campaign" || mode === "survival" || mode === "daily" || mode === "endless") {
      const totalWaves = mode === "endless" ? 999 : mode === "daily" ? 12 : 10;
      state.fixedWaveState = {
        waves: this.generateFixedWaves(mode, totalWaves),
        spawned: 0,
        killed: 0,
        inBreak: false,
        breakTimer: 0,
        spawnTimer: 0,
      };
    }

    if (mode === "defense" && state.defenseState) {
      this.initAlphaScheduler(state);
    }

    // Initialize weather system for defense-like modes
    if (isDefenseLike) {
      state.weatherState = createWeatherState();
    }

    if (mode === "extreme-survival" && state.defenseState) {
      state.defenseState.totalWaves = 999;
      state.defenseState.waves = this.generateExtremeSurvivalWaves(state.defenseState, state.extremeSurvivalRun?.phase ?? "normal");
    }

    if (mode === "peak-challenge" && state.defenseState) {
      state.defenseState.totalWaves = 999;
      state.defenseState.waves = this.generatePeakChallengeWaves(state.defenseState, state.peakChallengeState?.phase ?? "normal");
      this.applyPeakChallengeLoadout(player);
    }

    if (mode === "flagship" && state.defenseState && state.flagshipState) {
      state.defenseState.totalWaves = FLAGSHIP_TOTAL_WAVES;
      state.defenseState.waves = this.generateFlagshipWaves(state.defenseState);
      state.flagshipState.coreHealth = state.defenseState.core.health;
      state.flagshipState.coreMaxHealth = state.defenseState.core.maxHealth;
    }

    if (mode === "flagship-peak" && state.defenseState && state.flagshipPeakState) {
      state.defenseState.totalWaves = FLAGSHIP_PEAK_MAX_TOTAL_WAVES;
      state.defenseState.waves = this.generateFlagshipPeakWaves(state.defenseState);
      state.flagshipPeakState.coreHealth = state.defenseState.core.health;
      state.flagshipPeakState.coreMaxHealth = state.defenseState.core.maxHealth;
    }

    return state;
  }

  private createExtremeSurvivalRun(): ExtremeSurvivalRun {
    return {
      runId: `es_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      wave: 1,
      phase: "normal",
      loadout: { heroId: this.loadout.heroId ?? "recon", weaponIds: this.loadout.weaponIds.slice() },
      performanceScore: 50,
      shieldUsed: false,
      overclockBranchChosen: false,
      coreHealthPercent: 1,
      elapsedTime: 0,
      scoreMultiplier: 1,
      totalScore: 0,
      overclockWavesSurvived: 0,
      bossKills: 0,
      eliteKills: 0,
      perfectWaves: 0,
    };
  }

  private applyPeakChallengeLoadout(player: Player) {
    const chosenHero = this.loadout.heroId ?? "recon";
    applyHeroToPlayer(player, chosenHero);
    player.skinColor = resolvePlayerSkinColor(chosenHero, getEquippedSkin());

    const chosenWeapons = this.loadout.weaponIds.length > 0 ? this.loadout.weaponIds : ["pulse", "shotgun", "railgun"];
    player.weapons = chosenWeapons.slice(0, DEFAULT_BALANCE.progression.maxWeapons).map((id) => {
      const weapon = WEAPON_CREATORS[id as WeaponId]();
      weapon.level = Math.min(weapon.maxLevel, 3);
      for (let i = 1; i < weapon.level; i++) {
        weapon.damage = Math.round(weapon.damage * 1.2);
        weapon.cooldown *= 0.92;
      }
      return weapon;
    });

    player.maxHealth = Math.round(player.maxHealth * 1.25);
    player.health = player.maxHealth;
    player.speed *= 1.1;
    player.magnetRange *= 1.2;
  }

  private generatePeakChallengeWaves(ds: DefenseState, phase: "normal" | "overclock"): DefenseWave[] {
    const waves: DefenseWave[] = [];
    for (let i = 0; i < ds.totalWaves; i++) {
      const waveNumber = i + 1;
      const isOverclock = phase === "overclock";
      const count = Math.max(6, Math.round(8 + waveNumber * 1.2 * (isOverclock ? 1.25 : 1)));
      waves.push({
        index: i,
        enemyCount: count,
        enemyVariants: ["walker", "runner", "tank", "spitter", "drone", "sentinel", "crusher", "sniper", "stalker"],
        eliteCount: Math.max(0, Math.round(count * (0.08 + waveNumber * 0.005) * (isOverclock ? 1.5 : 1))),
        bossVariant: waveNumber % 12 === 0 ? getRandomBossIdRng(this.rng) : undefined,
        nodeActivator: false,
        duration: 45 + (isOverclock ? 10 : 0),
        enemyHealthMultiplier: 1 + waveNumber * 0.04 * (isOverclock ? 1.3 : 1),
        enemyDamageMultiplier: 1 + waveNumber * 0.025 * (isOverclock ? 1.25 : 1),
        speedMultiplier: 1 + waveNumber * 0.012 * (isOverclock ? 1.2 : 1),
        spawnIntervalMultiplier: 1 / Math.max(0.5, 1 + waveNumber * 0.015),
        specialEventChance: Math.min(0.25, 0.05 + waveNumber * 0.005),
      });
    }
    return waves;
  }

  private generateFlagshipWaves(ds: DefenseState): DefenseWave[] {
    const waves: DefenseWave[] = [];
    const totalWaves = FLAGSHIP_TOTAL_WAVES;
    for (let i = 0; i < totalWaves; i++) {
      const waveNumber = i + 1;
      const isBossWave = waveNumber === FLAGSHIP_BOSS_WAVE || (waveNumber > FLAGSHIP_BOSS_WAVE && waveNumber % 5 === 0);
      const count = Math.max(8, Math.round(10 + waveNumber * 1.5));
      waves.push({
        index: i,
        enemyCount: count,
        enemyVariants: isBossWave
          ? ["walker", "runner", "tank", "spitter", "drone", "sentinel", "crusher", "sniper", "stalker", "shielder", "artillery"]
          : ["walker", "runner", "tank", "spitter", "drone", "sentinel"],
        eliteCount: Math.max(1, Math.round(count * (0.1 + waveNumber * 0.008))),
        bossVariant: isBossWave ? getRandomBossIdRng(this.rng) : undefined,
        nodeActivator: false,
        duration: 50 + waveNumber * 2,
        enemyHealthMultiplier: 1 + waveNumber * 0.05,
        enemyDamageMultiplier: 1 + waveNumber * 0.03,
        speedMultiplier: 1 + waveNumber * 0.015,
        spawnIntervalMultiplier: 1 / Math.max(0.4, 1 + waveNumber * 0.02),
        specialEventChance: Math.min(0.3, 0.05 + waveNumber * 0.006),
      });
    }
    return waves;
  }

  private generateFlagshipPeakWaves(ds: DefenseState): DefenseWave[] {
    const waves: DefenseWave[] = [];
    for (let i = 0; i < FLAGSHIP_PEAK_MAX_TOTAL_WAVES; i++) {
      const waveNumber = i + 1;
      const cfg = generateFlagshipPeakWaveConfig(waveNumber);
      waves.push({
        index: i,
        enemyCount: cfg.enemyCount,
        enemyVariants: cfg.bossVariant
          ? ["walker", "runner", "tank", "spitter", "drone", "sentinel", "crusher", "sniper", "stalker", "shielder", "artillery"]
          : ["walker", "runner", "tank", "spitter", "drone", "sentinel"],
        eliteCount: cfg.eliteCount,
        bossVariant: cfg.bossVariant ?? undefined,
        nodeActivator: cfg.nodeActivator,
        duration: cfg.duration,
        enemyHealthMultiplier: cfg.healthMultiplier,
        enemyDamageMultiplier: cfg.damageMultiplier,
        spawnIntervalMultiplier: cfg.spawnIntervalMultiplier,
        specialEventChance: cfg.specialEventChance,
      });
    }
    return waves;
  }

  private generateExtremeSurvivalWaves(
    ds: DefenseState,
    phase: ExtremeSurvivalPhase
  ): DefenseWave[] {
    const waves: DefenseWave[] = [];
    for (let i = 0; i < ds.totalWaves; i++) {
      const waveNumber = i + 1;
      const snapshot: PerformanceSnapshot = this.extremeSurvivalLastSnapshot ?? {
        killsLastWave: 0,
        damageTakenLastWave: 0,
        coreHealthPercent: 1,
        elapsedWaveSec: 60,
      };
      const result = calculateWaveConfig(waveNumber, phase, snapshot, this.state?.extremeSurvivalRun?.performanceScore ?? 50);
      const cfg = result.waveConfig.enemyConfig;
      waves.push({
        index: i,
        enemyCount: Math.max(5, Math.round(cfg.spawnCount)),
        enemyVariants: ["walker", "runner", "tank", "spitter", "drone", "sentinel", "crusher", "sniper"],
        eliteCount: Math.max(0, Math.round(cfg.eliteRatio * cfg.spawnCount)),
        bossVariant: waveNumber % 15 === 0 ? "colossus" : undefined,
        nodeActivator: false,
        duration: 40 + (phase === "overclock" ? 10 : 0),
        enemyHealthMultiplier: cfg.healthMultiplier,
        enemyDamageMultiplier: cfg.damageMultiplier,
        speedMultiplier: cfg.speedMultiplier,
        spawnIntervalMultiplier: 1 / Math.max(0.5, cfg.speedMultiplier),
        specialEventChance: cfg.specialChance,
      });
    }
    return waves;
  }

  private generateFixedWaves(mode: GameModeType, totalWaves: number): DefenseWave[] {
    const waves: DefenseWave[] = [];
    const bossInterval =
      mode === "survival"
        ? DEFAULT_BALANCE.modes.survival.bossWaveInterval
        : mode === "endless"
          ? DEFAULT_BALANCE.modes.endlessBossWaveInterval
          : 5;

    for (let i = 0; i < totalWaves; i++) {
      const waveNumber = i + 1;
      let baseCount: number;
      let eliteRatio: number;

      if (mode === "campaign") {
        baseCount = 8 + waveNumber * 2;
        eliteRatio = 0.05 + waveNumber * 0.02;
      } else if (mode === "survival") {
        baseCount = 6 + waveNumber * 1.5;
        eliteRatio = 0.04 + waveNumber * 0.025;
      } else if (mode === "daily") {
        baseCount = 8 + waveNumber * 1.8;
        eliteRatio = 0.06 + waveNumber * 0.03;
      } else {
        // endless
        baseCount = 6 + waveNumber * 1.2;
        eliteRatio = 0.03 + waveNumber * 0.02;
      }

      const count = Math.max(5, Math.round(baseCount));
      waves.push({
        index: i,
        enemyCount: count,
        enemyVariants: [
          "walker",
          "runner",
          "tank",
          "spitter",
          "drone",
          "sentinel",
          "crusher",
          "sniper",
          "stalker",
        ],
        eliteCount: Math.max(0, Math.round(count * eliteRatio)),
        bossVariant: waveNumber % bossInterval === 0 ? getRandomBossIdRng(this.rng) : undefined,
        nodeActivator: false,
        duration: mode === "survival" ? DEFAULT_BALANCE.modes.survival.waveDuration : 60,
        enemyHealthMultiplier: 1 + waveNumber * 0.04,
        enemyDamageMultiplier: 1 + waveNumber * 0.025,
        speedMultiplier: 1 + waveNumber * 0.015,
        spawnIntervalMultiplier: 1 / Math.max(0.5, 1 + waveNumber * 0.015),
        specialEventChance: Math.min(0.25, 0.05 + waveNumber * 0.005),
      });
    }
    return waves;
  }

  private initAlphaScheduler(state: GameState) {
    const ds = state.defenseState;
    if (!ds) return;

    const bossWaves = ds.waves
      .map((w, i): { w: DefenseWave; i: number } => ({ w, i }))
      .filter(({ w }) => !!w.bossVariant)
      .map(({ i }) => i);

    this.alphaScheduler = new AlphaScheduler({
      totalWaves: ds.totalWaves,
      bossWaves,
      playerCount: 1 + state.players.length,
    });
    this.alphaScheduler.syncPlayers([state.player, ...state.players]);
    this.alphaScheduler.setWave(ds.currentWave);
    this.applyAlphaPlanToDefenseState(ds);
  }

  private applyAlphaPlanToDefenseState(ds: DefenseState) {
    if (!this.alphaScheduler) return;
    const plan = this.alphaScheduler.getCurrentPlan();
    const wave = ds.waves[ds.currentWave];
    if (!wave) return;

    wave.enemyCount = plan.enemyStats.waveEnemyCount;
    wave.eliteCount = plan.enemyStats.eliteCount;
    wave.enemyVariants = Object.keys(plan.enemyStats.variantWeights) as EnemyVariant[];
    wave.bossVariant = plan.isBossWave ? plan.bossStats?.bossId ?? "colossus" : undefined;

    this.alphaPlanRef = {
      enemyStats: plan.enemyStats,
      snapshot: plan.snapshot,
      isBossWave: plan.isBossWave,
      spawned: 0,
      killed: 0,
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
      damage: 10,
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
      leopardFrenzyActive: false,
      leopardPounceSpeedTimer: 0,
      leopardBloodlustStacks: 0,
      leopardBloodlustTimer: 0,
      twilightCocoonTimer: 0,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      burnDamage: 0,
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
      skinColor: DEFAULT_PLAYER_COLOR,
    };
  }

  private randomTheme(): MapTheme {
    const themes: MapTheme[] = ["industrial", "frozen", "biohazard", "wasteland", "orbital"];
    return themes[Math.floor(this.rng() * themes.length)];
  }

  private createMap(theme: MapTheme): MapConfig {
    const obstacles: Obstacle[] = [];
    const hazards: Hazard[] = [];
    const decors: Decor[] = [];

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

    decors.push(...this.generateDecors(theme, MAP_WIDTH, MAP_HEIGHT, spawnClearance, obstacles));

    return { width: MAP_WIDTH, height: MAP_HEIGHT, theme, obstacles, hazards, decors };
  }

  private generateDecors(
    theme: MapTheme,
    mapW: number,
    mapH: number,
    spawnClearance: number,
    obstacles: Obstacle[]
  ): Decor[] {
    const decors: Decor[] = [];
    const centerX = mapW / 2;
    const centerY = mapH / 2;

    const decorConfig: Record<MapTheme, { types: Decor["type"][]; count: number; colors: string[] }> = {
      industrial: { types: ["rock", "debris", "crate", "vent"], count: 45, colors: ["#2a3050", "#3b4256", "#1e2538", "#4a5568"] },
      frozen: { types: ["rock", "crystal", "debris"], count: 38, colors: ["#1a3a52", "#2d4a6e", "#0f2438", "#3b82f6"] },
      biohazard: { types: ["grass", "debris", "vent", "rock"], count: 50, colors: ["#1a2410", "#2a3a18", "#1c3020", "#4ade80"] },
      wasteland: { types: ["rock", "debris", "crate", "grass"], count: 42, colors: ["#2a2318", "#3d3528", "#1c1812", "#d97706"] },
      orbital: { types: ["crystal", "rock", "debris"], count: 35, colors: ["#1e293b", "#312e81", "#1e1b4b", "#818cf8"] },
    };

    const config = decorConfig[theme];
    const typeWeights: Record<Decor["type"], number> = {
      rock: 0.35,
      debris: 0.25,
      grass: 0.15,
      crystal: 0.1,
      vent: 0.08,
      crate: 0.07,
    };

    const isNearObstacle = (x: number, y: number, r: number): boolean => {
      return obstacles.some((o) =>
        x + r > o.x - o.width / 2 - 10 &&
        x - r < o.x + o.width / 2 + 10 &&
        y + r > o.y - o.height / 2 - 10 &&
        y - r < o.y + o.height / 2 + 10
      );
    };

    const isTooClose = (x: number, y: number, r: number): boolean => {
      return decors.some((d) => distance({ x, y }, d) < (r + d.radius + 8));
    };

    const pickType = (): Decor["type"] => {
      const available = config.types;
      const roll = this.rng();
      let cumulative = 0;
      for (const t of available) {
        cumulative += typeWeights[t];
        if (roll < cumulative) return t;
      }
      return available[available.length - 1];
    };

    for (let i = 0; i < config.count; i++) {
      const type = pickType();
      const radius = type === "rock" ? randomRange(8, 18) :
        type === "crate" ? randomRange(10, 16) :
        type === "crystal" ? randomRange(6, 14) :
        type === "vent" ? randomRange(12, 20) :
        type === "grass" ? randomRange(10, 22) :
        randomRange(6, 12); // debris

      let x: number, y: number;
      let attempts = 0;
      do {
        x = randomRange(30, mapW - 30);
        y = randomRange(30, mapH - 30);
        attempts++;
      } while (
        attempts < 30 &&
        (distance({ x, y }, { x: centerX, y: centerY }) < spawnClearance ||
          isNearObstacle(x, y, radius) ||
          isTooClose(x, y, radius))
      );

      if (attempts >= 30) continue;

      const colorIdx = Math.floor(this.rng() * config.colors.length);
      decors.push({
        x,
        y,
        type,
        radius,
        color: config.colors[colorIdx],
        rotation: this.rng() * Math.PI * 2,
      });
    }

    return decors;
  }

  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.updateCamera();
  }

  setQuality(quality: "high" | "medium" | "low") {
    this.graphicsQuality = quality;
    const multipliers = { high: 1, medium: 0.65, low: 0.3 };
    const poolSizes = { high: 768, medium: 512, low: 256 };
    this.particlePool.setQualityMultiplier(multipliers[quality]);
    this.fx.setQualityMultiplier(multipliers[quality]);
    this.particlePool = new ParticlePool(poolSizes[quality]);
    this.state.particles = this.particlePool.getParticles();
  }

  getQuality(): "high" | "medium" | "low" {
    return this.graphicsQuality;
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
      player.skinColor = resolvePlayerSkinColor(heroId, getEquippedSkin());
      if (this.loadout.weaponIds.length > 0) {
        player.weapons = this.loadout.weaponIds.map((id) => WEAPON_CREATORS[id]());
      }
    }

    if (this.state.mode === "extreme-survival" && this.state.extremeSurvivalRun) {
      this.state.extremeSurvivalRun.loadout = {
        heroId: this.loadout.heroId ?? "recon",
        weaponIds: this.loadout.weaponIds.slice(),
      };
    }

    if (this.state.mode === "peak-challenge" && this.state.status === "idle") {
      this.applyPeakChallengeLoadout(this.state.player);
    }
  }

  getExtremeSurvivalPhase(): ExtremeSurvivalPhase | null {
    return this.state.extremeSurvivalRun?.phase ?? null;
  }

  chooseOverclockBranch(choice: "overclock" | "continue") {
    const ds = this.state.defenseState;
    if (!ds) return;

    if (this.state.mode === "extreme-survival" && this.state.extremeSurvivalRun) {
      const run = this.state.extremeSurvivalRun;
      run.overclockBranchChosen = true;
      run.phase = choice === "overclock" ? "overclock" : "normal";
      this.extremeSurvivalPendingChoice = false;
      ds.waves = this.generateExtremeSurvivalWaves(ds, run.phase);
    } else if (this.state.mode === "peak-challenge" && this.state.peakChallengeState) {
      const fs = this.state.peakChallengeState;
      fs.overclockUnlocked = true;
      fs.phase = choice === "overclock" ? "overclock" : "normal";
      this.peakChallengePendingChoice = false;
      ds.waves = this.generatePeakChallengeWaves(ds, fs.phase);
    } else {
      return;
    }

    this.state.status = "running";
    this.state.lastTime = performance.now();
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
    triggerHeroSkill(this.state.player, this.state, this.fx);
  }

  useHeroUltimate() {
    if (this.state.status !== "running") return;
    triggerHeroUltimate(this.state.player, this.state, this.fx);
  }

  /** 应用补给窗口购买的道具到游戏状态 */
  applyBreakPurchases(purchases: Record<string, number>) {
    this._pendingBreakPurchases = { ...purchases };

    const player = this.state.player;
    const ds = this.state.defenseState;

    Object.entries(purchases).forEach(([itemId, count]) => {
      for (let i = 0; i < count; i++) {
        switch (itemId) {
          case "health_pack": {
            const healAmount = Math.floor(player.maxHealth * 0.3);
            player.health = Math.min(player.maxHealth, player.health + healAmount);
            this.particlePool.spawnPreset("heal-burst", player.x, player.y, "#22c55e", { intensity: 0.6 });
            break;
          }
          case "armor_plate": {
            player.armor = (player.armor ?? 0) + 50;
            this.particlePool.spawnPreset("shield-break", player.x, player.y, "#3b82f6", { intensity: 0.5 });
            break;
          }
          case "damage_boost": {
            player.damageMultiplier = (player.damageMultiplier ?? 1) * 1.25;
            player.damageBoostTimer = (player.damageBoostTimer ?? 0) + 60;
            break;
          }
          case "speed_boost": {
            player.speedMultiplier = (player.speedMultiplier ?? 1) * 1.3;
            player.speedBoostTimer = (player.speedBoostTimer ?? 0) + 60;
            break;
          }
          case "core_repair": {
            if (ds) {
              ds.core.health = Math.min(ds.core.maxHealth, ds.core.health + Math.floor(ds.core.maxHealth * 0.15));
            }
            break;
          }
          case "heal_aura": {
            player.healAuraActive = true;
            player.healAuraTimer = (player.healAuraTimer ?? 0) + 30;
            break;
          }
        }
      }
    });
  }

  /** 跳过波次间补给窗口，立即开始下一波 */
  skipBreak() {
    const ds = this.state.defenseState;
    if (!ds || ds.waveInProgress) return false;
    if (ds.currentWave >= ds.totalWaves) return false;
    ds.breakTimer = 0;
    return true;
  }

  /** 强制进入补给窗口（暂停波次计时） */
  forceBreak() {
    const ds = this.state.defenseState;
    if (!ds || !ds.waveInProgress) return false;
    ds.waveInProgress = false;
    ds.breakTimer = this.difficultyConfig ? this.difficultyConfig.breakDuration : 8;
    return true;
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
    const dt = Math.min((now - this.state.lastTime) / 1000, 0.05);
    this.state.lastTime = now;

    if (this._deathDelay > 0) {
      this._deathDelay -= dt;
      if (this._deathDelay <= 0) {
        this.endRun(false);
      }
      return;
    }

    if (this.state.status !== "running") return;

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
    this.cleanupDestroyedObstacles();

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
    this.updateWeather(dt);

    // 旗舰巅峰阶段切换时更新地图主题色偏移
    if (this.state.mode === "flagship-peak" && this.state.flagshipPeakState) {
      const fp = this.state.flagshipPeakState;
      const currentPhase = getFlagshipPeakPhase(fp.wave);
      if (fp.mapThemePhase !== currentPhase) {
        fp.mapThemePhase = currentPhase;
      }
    }

    if (isDeathmatch) {
      applyDeathmatchHazardDamage(this.state, this.state.player);
      for (const p of this.state.players) {
        if (p.health > 0) {
          applyDeathmatchHazardDamage(this.state, p);
        }
      }
    }

    this.fx.update(dt);
  }

  private updatePlayer(input: InputState, dt: number) {
    const player = this.state.player;
    const move = normalize(input.move);

    const weatherEffect = this.state.weatherState
      ? getWeatherEffect(this.state.weatherState.type)
      : getWeatherEffect("clear");
    const weatherSpeedMul = weatherEffect.playerSpeedMul;

    const accel = 1800;
    player.knockbackX *= Math.max(0, 1 - dt * 6);
    player.knockbackY *= Math.max(0, 1 - dt * 6);

    const effectiveSpeed = player.speed * weatherSpeedMul * (player.speedMultiplier ?? 1);

    if (move.x !== 0 || move.y !== 0) {
      player.knockbackX +=
        (move.x * effectiveSpeed - player.knockbackX) * Math.min(1, (accel * dt) / effectiveSpeed);
      player.knockbackY +=
        (move.y * effectiveSpeed - player.knockbackY) * Math.min(1, (accel * dt) / effectiveSpeed);
      transitionAnimation(player, "move");
    } else {
      transitionAnimation(player, "idle");
    }

    player.x += player.knockbackX * dt;
    player.y += player.knockbackY * dt;

    // BUG 10+14: clamp to map boundary first, then resolve obstacle/wall collisions.
    // This prevents the clamp from pushing the player back into a wall after collision resolution.
    player.x = clamp(player.x, player.radius, this.state.map.width - player.radius);
    player.y = clamp(player.y, player.radius, this.state.map.height - player.radius);

    this.resolveObstacleCollisions(player);

    if (input.aim.x !== 0 || input.aim.y !== 0) {
      setFacing(player, player.x + input.aim.x, player.y + input.aim.y);
    } else if (move.x !== 0 || move.y !== 0) {
      setFacing(player, player.x + move.x, player.y + move.y);
    }

    updateAnimation(player, dt, getPlayerSprite(player.skinColor ?? DEFAULT_PLAYER_COLOR, "#0b0d17"));
    returnToMoveAfterRecoil(player, getPlayerSprite(player.skinColor ?? DEFAULT_PLAYER_COLOR, "#0b0d17"));

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
      if (this.rng() < dt * 4) {
        this.particlePool.spawnPreset(
          "spark",
          player.x + randomRangeRng(this.rng, -10, 10),
          player.y + randomRangeRng(this.rng, -10, 10),
          "#fb923c",
          { intensity: 0.5 }
        );
      }
      if (player.health <= 0) {
        this.endRun(false);
      }
    }

    // 补给窗口临时效果计时器
    if ((player.damageBoostTimer ?? 0) > 0) {
      player.damageBoostTimer = (player.damageBoostTimer ?? 0) - dt;
      if ((player.damageBoostTimer ?? 0) <= 0) {
        player.damageMultiplier = 1;
        player.damageBoostTimer = 0;
      }
    }
    if ((player.speedBoostTimer ?? 0) > 0) {
      player.speedBoostTimer = (player.speedBoostTimer ?? 0) - dt;
      if ((player.speedBoostTimer ?? 0) <= 0) {
        player.speedMultiplier = 1;
        player.speedBoostTimer = 0;
      }
    }
    if ((player.healAuraTimer ?? 0) > 0) {
      player.healAuraTimer = (player.healAuraTimer ?? 0) - dt;
      if (player.healAuraActive) {
        player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.02 * dt);
        if (this.rng() < dt * 3) {
          this.particlePool.spawnPreset(
            "heal-burst",
            player.x + randomRangeRng(this.rng, -15, 15),
            player.y + randomRangeRng(this.rng, -15, 15),
            "#22c55e",
            { intensity: 0.4 }
          );
        }
      }
      if ((player.healAuraTimer ?? 0) <= 0) {
        player.healAuraActive = false;
        player.healAuraTimer = 0;
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
      const remoteColor = player.skinColor || REMOTE_PLAYER_COLOR;
      updateAnimation(player, dt, getPlayerSprite(remoteColor, "#0b0d17"));
    }
  }

  private resolveWallCollision(
    entity: { x: number; y: number; radius: number; id?: string },
    deployables: { x: number; y: number; radius: number; type: string; health: number }[],
    isEnemy: boolean
  ): boolean {
    let resolved = true;
    for (const d of deployables) {
      if (d.type !== "wall" || d.health <= 0) continue;
      const wallBox = { x: d.x - d.radius, y: d.y - d.radius, width: d.radius * 2, height: d.radius * 2 };
      const displacement = resolveCircleRectCollision(entity, wallBox);
      if (displacement) {
        entity.x += displacement.x;
        entity.y += displacement.y;
        if (isEnemy) {
          d.health -= 18;
        }
        resolved = false;
      }
    }
    return resolved;
  }

  private resolveObstacleCollisions(
    entity: { x: number; y: number; radius: number; id?: string },
    isEnemy = false
  ) {
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

      const ds = this.state.defenseState;
      if (ds) {
        if (!this.resolveWallCollision(entity, ds.deployables, isEnemy)) {
          resolved = false;
        }
      }

      if (!this.resolveWallCollision(entity, this.state.deployables, isEnemy)) {
        resolved = false;
      }

      if (resolved) break;
    }
  }

  private updateWeapons(dt: number) {
    const player = this.state.player;
    for (const weapon of player.weapons) {
      const effectiveCooldown = weapon.cooldown * (1 - Math.min(0.75, player.cooldownReduction));
      weapon.timer -= dt;
      if (weapon.timer <= 0) {
        const fired = this.fireWeapon(weapon);
        if (fired) {
          weapon.timer = Math.max(0.04, effectiveCooldown);
        }
      }
    }
  }

  private fireWeapon(weapon: (typeof this.state.player.weapons)[number]): boolean {
    const player = this.state.player;
    transitionAnimation(player, "attack");
    triggerRecoil(player);

    if (weapon.id === "drone") {
      this.fireDrone(weapon);
      return true;
    }

    if (weapon.id === "flame") {
      this.fireFlame(weapon);
      return true;
    }

    if (weapon.isMelee) {
      if (weapon.meleeShape === "arc") {
        this.fireMeleeArc(weapon);
      } else {
        this.fireMeleeThrust(weapon);
      }
      return true;
    }

    const nearest = this.findNearestEnemy(player.x, player.y, weapon.range);
    if (!nearest) return false;

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
    return true;
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

  private fireMeleeArc(weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    const range = weapon.range * player.areaMultiplier;
    const halfAngle = (weapon.meleeAngle ?? Math.PI / 2) / 2;
    const nearest = this.findNearestEnemy(player.x, player.y, range);
    const facing = nearest ? angleBetween(player, nearest) : player.facing;

    const hits: Enemy[] = [];
    for (const enemy of this.state.enemies) {
      const dist = distance(player, enemy);
      if (dist > range + enemy.radius) continue;
      const delta = Math.atan2(enemy.y - player.y, enemy.x - player.x) - facing;
      let normalized = delta;
      while (normalized > Math.PI) normalized -= Math.PI * 2;
      while (normalized < -Math.PI) normalized += Math.PI * 2;
      if (Math.abs(normalized) <= halfAngle) {
        hits.push(enemy);
      }
    }

    hits.sort((a, b) => distance(player, a) - distance(player, b));
    const maxTargets = weapon.pierce + 1;
    const actualHits = hits.slice(0, maxTargets);

    for (const enemy of actualHits) {
      this.damageEnemyWithMelee(enemy, weapon);
    }

    if (actualHits.length > 0) {
      audio?.play("shoot");
      this.spawnMeleeArcEffect(player.x, player.y, facing, range, halfAngle * 2, weapon.color);
    }
  }

  private fireMeleeThrust(weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    const nearest = this.findNearestEnemy(player.x, player.y, weapon.range);
    const angle = nearest ? angleBetween(player, nearest) : player.facing;
    const speed = weapon.projectileSpeed;
    const life = weapon.range / speed;

    this.state.projectiles.push({
      id: uid("proj"),
      x: player.x + Math.cos(angle) * 22,
      y: player.y + Math.sin(angle) * 22,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: (weapon.meleeWidth ?? 30) / 2,
      damage: weapon.damage,
      speed,
      color: weapon.color,
      pierce: weapon.pierce,
      weaponId: weapon.id,
      life,
      ownerId: player.id,
      isMelee: true,
      thrustWidth: weapon.meleeWidth ?? 30,
      thrustLength: weapon.range,
      burnDuration: weapon.burnDuration,
      burnDamage: weapon.burnDuration ? weapon.damage * 0.4 : undefined,
    });
    audio?.play("shoot");
  }

  private damageEnemyWithMelee(enemy: Enemy, weapon: (typeof this.state.player.weapons)[number]) {
    const player = this.state.player;
    const isCrit = this.rng() < player.critChance;
    const comboMul = 1 + Math.min(0.35, this.state.killCombo.count * 0.012);
    const critMul = isCrit ? DEFAULT_BALANCE.player.critDamageMultiplier : 1;
    let damage = weapon.damage * comboMul * critMul * (player.damageMultiplier ?? 1);
    damage = this.applyDamage(enemy, damage, weapon.burnDuration, weapon.burnDuration ? weapon.damage * 0.4 : undefined);
    this.state.stats.damageDealt += damage;

    if (this.alphaScheduler && this.alphaPlanRef && !enemy.isBoss) {
      this.alphaScheduler.telemetry.recordDamageDealt(
        this.alphaPlanRef.snapshot.waveIndex,
        enemy.variant,
        damage
      );
    }
    this.spawnDamageNumber(enemy.x, enemy.y, damage, weapon.color, isCrit);
    if (isCrit) {
      this.fx.addTrauma(0.1);
      this.fx.addShake(0.5, 0);
      this.particlePool.spawnPreset("crit", enemy.x, enemy.y, "#facc15", { intensity: 1.2 });
      audio?.play("crit");
    } else {
      this.particlePool.spawnPreset("hit", enemy.x, enemy.y, weapon.color, { intensity: 0.9 });
    }

    const knockbackPower = weapon.id === "greatsword" ? 160 : weapon.id === "gauntlet" ? 70 : 110;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.knockbackX += (dx / dist) * knockbackPower;
    enemy.knockbackY += (dy / dist) * knockbackPower;
  }

  private spawnMeleeArcEffect(
    x: number,
    y: number,
    facing: number,
    range: number,
    angle: number,
    color: string
  ) {
    const id = uid("melee");
    // Reuse projectile as a short-lived visual marker for the arc
    this.state.projectiles.push({
      id,
      x,
      y,
      vx: Math.cos(facing) * range * 4,
      vy: Math.sin(facing) * range * 4,
      radius: range,
      damage: 0,
      speed: range * 4,
      color,
      pierce: 0,
      weaponId: "meleeArcVisual",
      life: 0.08,
      ownerId: "visual",
      isMelee: true,
      thrustWidth: angle,
      thrustLength: range,
    });
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

      if (p.homing) {
        let target: Enemy | null = null;
        let bestDist = 280;
        for (const enemy of this.state.enemies) {
          const dist = distance({ x: p.x, y: p.y }, enemy);
          if (dist < bestDist) {
            bestDist = dist;
            target = enemy;
          }
        }
        if (target) {
          const desiredAngle = angleBetween({ x: p.x, y: p.y }, target);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let delta = desiredAngle - currentAngle;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          const turn = clamp(delta, -3.5 * dt, 3.5 * dt);
          const newAngle = currentAngle + turn;
          p.vx = Math.cos(newAngle) * p.speed;
          p.vy = Math.sin(newAngle) * p.speed;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // BUG 11: 投射物边界清除 - 所有飞出地图或超出生命周期的投射物必须清理
      const outOfBounds =
        p.x < -200 || p.x > this.state.map.width + 200 ||
        p.y < -200 || p.y > this.state.map.height + 200;
      const lifeExpired = p.life <= 0;
      const isNaNPosition = !isFinite(p.x) || !isFinite(p.y);

      if (lifeExpired || outOfBounds || isNaNPosition) {
        if (p.isExplosive && outOfBounds) {
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

      const outOfBounds =
        p.x < -200 || p.x > this.state.map.width + 200 ||
        p.y < -200 || p.y > this.state.map.height + 200;
      const lifeExpired = p.life <= 0;
      const isNaNPosition = !isFinite(p.x) || !isFinite(p.y);

      if (lifeExpired || outOfBounds || isNaNPosition) {
        projectiles.splice(i, 1);
      }
    }
  }

  private spawnEnemies(dt: number) {
    if (this.state.fixedWaveState) {
      this.spawnFixedWaveEnemies(dt);
      return;
    }

    if (this.state.defenseState) {
      return;
    }

    this.state.spawnTimer -= dt;

    if (this.state.activeEvent?.type === "horde") {
      if (this.state.spawnTimer <= 0) {
        this.state.spawnTimer = DEFAULT_BALANCE.difficulty.hordeSpawnInterval * (this.difficultyConfig ? this.difficultyConfig.spawnIntervalMultiplier : 1);
        for (let i = 0; i < DEFAULT_BALANCE.difficulty.hordeSpawnCount; i++) this.spawnEnemy();
      }
      return;
    }

    if (this.state.spawnTimer <= 0) {
      const difficulty = this.state.difficulty;
      this.state.spawnTimer = getSpawnInterval(difficulty) * (this.difficultyConfig ? this.difficultyConfig.spawnIntervalMultiplier : 1);
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

  private spawnFixedWaveEnemies(dt: number) {
    const fws = this.state.fixedWaveState!;

    if (fws.inBreak) {
      fws.breakTimer -= dt;
      if (fws.breakTimer <= 0) {
        this.callbacks.onBreakEnd?.(this._pendingBreakPurchases);
        fws.inBreak = false;
        fws.spawned = 0;
        fws.killed = 0;
      }
      return;
    }

    const wave = fws.waves[this.state.wave - 1];
    if (!wave) return;

    fws.spawnTimer -= dt;
    if (fws.spawnTimer <= 0 && fws.spawned < wave.enemyCount) {
      const remainingSlots = wave.enemyCount - fws.spawned;
      const batchSize = Math.min(4, Math.max(1, Math.floor(remainingSlots / 4)));
      for (let i = 0; i < batchSize && fws.spawned < wave.enemyCount; i++) {
        const variant = this.pickFixedWaveVariant(wave);
        this.spawnEnemy(variant, false);
        fws.spawned++;
        wave.spawned = (wave.spawned ?? 0) + 1;
      }
      fws.spawnTimer = Math.max(0.35, 0.9 * (wave.spawnIntervalMultiplier ?? 1) * (this.difficultyConfig ? this.difficultyConfig.spawnIntervalMultiplier : 1));
    }

    const eliteChanceMulFixed = this.difficultyConfig?.eliteChanceMultiplier ?? 1;
    if (wave.eliteCount > 0 && this.rng() < 0.008 * dt * 60 * eliteChanceMulFixed) {
      const variant = this.pickFixedWaveVariant(wave);
      this.spawnEnemy(variant, true);
      wave.eliteCount--;
    }

    if (
      wave.bossVariant &&
      fws.spawned >= wave.enemyCount &&
      this.state.enemies.every((e) => !e.isBoss)
    ) {
      const bossId = wave.bossVariant as BossId;
      this.spawnEnemy(bossId as EnemyVariant, true);
      wave.bossVariant = undefined;
    }
  }

  private pickFixedWaveVariant(wave: DefenseWave): EnemyVariant {
    const variants: EnemyVariant[] = wave.enemyVariants.length > 0 ? wave.enemyVariants : ["walker"];
    return variants[Math.floor(this.rng() * variants.length)];
  }

  private spawnEnemy(variantOverride?: EnemyVariant, elite = false, alphaStats?: AlphaEnemyStats) {
    const pos = randomPointOnBorder(this.state.map.width, this.state.map.height);
    const difficulty = this.state.difficulty;
    let variant: EnemyVariant = variantOverride ?? "walker";

    // 检测是否传入 BossId
    if (variantOverride && variantOverride in BOSSES) {
      this.spawnBoss(variantOverride as BossId, pos, alphaStats);
      return;
    }

    const alphaPlan = this.alphaPlanRef;
    const isAlphaMode = this.alphaScheduler && alphaStats && alphaPlan;

    // 仅在非 α 模式下走原有随机分支
    if (!variantOverride && !isAlphaMode) {
      const roll = this.rng();
      if (roll > 0.88) variant = "tank";
      else if (roll > 0.72) variant = "runner";
      else if (roll > 0.58 && difficulty > 3) variant = "spitter";
      else if (roll < getEliteSpawnChance(difficulty) && difficulty > 6) variant = "elite";
    }

    const balance = DEFAULT_BALANCE.enemies[variant] ?? DEFAULT_BALANCE.enemies.base;
    let baseHealth: number;
    let speed: number;
    let damage: number;
    let radius = balance.radius;
    let xpValue = balance.xpValue;
    let color = balance.color;
    let attackCooldown = balance.attackCooldown ?? 0;

    if (variant === "elite" || variant === "boss") {
      elite = true;
    }

    if (isAlphaMode && variant !== "elite" && variant !== "boss") {
      // α 分支：按当前难度与精英状态直接生成数值
      const stats = generateVariantStats(variant, alphaPlan.snapshot.finalDifficulty, elite);
      baseHealth = stats.maxHp;
      speed = stats.speed;
      damage = stats.damage;
    } else {
      // 传统分支
      baseHealth = getDifficultyScaledHealth(difficulty, variant);
      speed = balance.speed;
      damage = balance.damage;

      if (elite && variant !== "elite" && variant !== "boss") {
        const e = balance;
        baseHealth = Math.floor(baseHealth * (e.eliteHealthMul ?? 3));
        damage *= e.eliteDamageMul ?? 1.6;
        speed *= e.eliteSpeedMul ?? 1.1;
        xpValue *= e.eliteXpMul ?? 3;
        radius *= 1.15;
      }
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
        const idx = Math.floor(this.rng() * pool.length);
        affixes.push(pool[idx]);
        pool.splice(idx, 1);
      }
    }

    // Apply difficulty preset multipliers
    if (this.difficultyConfig) {
      const cfg = this.difficultyConfig;
      baseHealth = Math.floor(baseHealth * cfg.enemyHealthMultiplier);
      damage *= cfg.enemyDamageMultiplier;
      if (!isAlphaMode) {
        xpValue = Math.floor(xpValue * cfg.xpMultiplier);
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
      freezeShatterDamage: 0,
      droneMarkTimer: 0,
      isElite: elite,
      isBoss: variant === "boss",
      affixes,
      attackTimer: randomRange(0, attackCooldown),
      attackCooldown,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      burnDamage: 0,
      frostStacks: 0,
      frostTimer: 0,
      venomStacks: 0,
      venomTimer: 0,
      vulnerabilityStacks: 0,
      phase: 0,
      phaseThresholds: variant === "boss" ? [0.65, 0.35] : [],
      targetCore: this.state.mode === "defense" || this.state.mode === "extreme-survival",
      facing: 0,
      animation: "move",
      animationTimer: 0,
    };

    if (this.state.mode === "extreme-survival" && this.state.defenseState) {
      const ds = this.state.defenseState;
      const wave = ds.waves[ds.currentWave];
      if (wave) {
        enemy.maxHealth = Math.max(1, Math.round(enemy.maxHealth * (wave.enemyHealthMultiplier ?? 1)));
        enemy.health = enemy.maxHealth;
        enemy.damage = Math.max(1, enemy.damage * (wave.enemyDamageMultiplier ?? 1));
        enemy.speed = Math.max(0.1, enemy.speed * (wave.speedMultiplier ?? 1));
      }
    }

    if (this.state.fixedWaveState) {
      const wave = this.state.fixedWaveState.waves[this.state.wave - 1];
      if (wave) {
        enemy.maxHealth = Math.max(1, Math.round(enemy.maxHealth * (wave.enemyHealthMultiplier ?? 1)));
        enemy.health = enemy.maxHealth;
        enemy.damage = Math.max(1, enemy.damage * (wave.enemyDamageMultiplier ?? 1));
        enemy.speed = Math.max(0.1, enemy.speed * (wave.speedMultiplier ?? 1));
      }
    }

    applyAffixes(enemy);
    this.state.enemies.push(enemy);

    if (isAlphaMode) {
      this.alphaScheduler!.telemetry.recordSpawn(alphaPlan.snapshot.waveIndex, variant);
      alphaPlan.spawned++;
    }
  }

  private spawnBoss(bossId: BossId, pos: Vec2, alphaStats?: AlphaEnemyStats) {
    const template = getBossTemplate(bossId);
    const alphaPlan = this.alphaPlanRef;
    const isAlphaMode = this.alphaScheduler && alphaPlan;
    const bossStats = isAlphaMode ? this.alphaScheduler!.getCurrentPlan().bossStats : undefined;

    const healthMul = bossStats?.healthMultiplier ?? 1 + (this.state.difficulty - 1) * 0.15;
    const damageMul = bossStats?.damageMultiplier ?? 1;
    const speedMul = bossStats?.speedMultiplier ?? 1;

    const enemy: Enemy = {
      id: uid("enemy"),
      x: pos.x,
      y: pos.y,
      radius: template.radius,
      speed: template.speed * speedMul,
      health: Math.round(template.health * healthMul),
      maxHealth: Math.round(template.health * healthMul),
      damage: Math.round(template.damage * damageMul),
      xpValue: DEFAULT_BALANCE.enemies.base.xpValue * 20,
      color: template.color,
      variant: bossId as EnemyVariant,
      slow: 0,
      slowTimer: 0,
      freezeTimer: 0,
      freezeShatterDamage: 0,
      droneMarkTimer: 0,
      isElite: false,
      isBoss: true,
      affixes: [],
      attackTimer: randomRange(0, (template.phases[0]?.attackCooldown ?? 1.5)),
      attackCooldown: template.phases[0]?.attackCooldown ?? 1.5,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      burnDamage: 0,
      frostStacks: 0,
      frostTimer: 0,
      venomStacks: 0,
      venomTimer: 0,
      vulnerabilityStacks: 0,
      phase: 0,
      phaseThresholds: template.phaseThresholds,
      targetCore: this.state.mode === "defense",
      facing: 0,
      animation: "move",
      animationTimer: 0,
    };

    applyAffixes(enemy);
    this.state.enemies.push(enemy);

    if (isAlphaMode) {
      this.alphaScheduler!.telemetry.recordSpawn(alphaPlan.snapshot.waveIndex, bossId);
      alphaPlan.spawned++;
    }
  }

  private updateEnemies(dt: number) {
    const player = this.state.player;
    const ds = this.state.defenseState;
    const core = ds?.core;

    for (const enemy of this.state.enemies) {
      if (enemy.burnDuration > 0) {
        enemy.burnDuration -= dt;
        enemy.health -= (enemy.burnDamage || 5) * dt;
        if (this.rng() < dt * 6) {
          this.particlePool.spawnPreset(
            "spark",
            enemy.x + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            enemy.y + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            "#fb923c",
            { intensity: 0.8 }
          );
        }
      }

      if (enemy.frostStacks > 0) {
        enemy.frostTimer -= dt;
        if (enemy.frostTimer <= 0) {
          enemy.frostStacks = Math.max(0, enemy.frostStacks - 1);
          enemy.frostTimer = enemy.frostStacks > 0 ? 2 : 0;
        }
        if (enemy.frostStacks > 0 && this.rng() < dt * 3) {
          this.particlePool.spawnPreset(
            "spark",
            enemy.x + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            enemy.y + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            "#38bdf8",
            { intensity: 0.5 }
          );
        }
      }

      if (enemy.freezeTimer > 0) {
        enemy.freezeTimer -= dt;
        if (enemy.freezeTimer <= 0 && enemy.health > 0) {
          const shatterDamage = enemy.freezeShatterDamage > 0 ? enemy.freezeShatterDamage : 180;
          enemy.health -= shatterDamage;
          this.state.stats.damageDealt += shatterDamage;
          enemy.freezeShatterDamage = 0;
          this.particlePool.spawnPreset("spark", enemy.x, enemy.y, "#e0f2fe", { intensity: 1 });
          this.fx.addTrauma(0.06);
        }
      }

      if (enemy.venomStacks > 0) {
        enemy.venomTimer -= dt;
        if (enemy.venomTimer <= 0) {
          enemy.venomStacks = Math.max(0, enemy.venomStacks - 1);
          enemy.venomTimer = enemy.venomStacks > 0 ? 0.5 : 0;
        }
        if (enemy.venomTimer > 0) {
          const dot = enemy.venomStacks * 12 * dt;
          enemy.health -= dot;
          this.state.stats.damageDealt += dot;
        }
        if (enemy.venomStacks > 0 && this.rng() < dt * 4) {
          this.particlePool.spawnPreset(
            "spark",
            enemy.x + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            enemy.y + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
            "#84cc16",
            { intensity: 0.5 }
          );
        }
      }

      if (enemy.vulnerabilityStacks > 0 && this.rng() < dt * 2) {
        this.particlePool.spawnPreset(
          "spark",
          enemy.x + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
          enemy.y + randomRangeRng(this.rng, -enemy.radius, enemy.radius),
          "#a855f7",
          { intensity: 0.4 }
        );
      }

      const regen = getRegenRate(enemy);
      if (regen > 0) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + regen * dt);
      }

      if (enemy.isBoss) {
        const changed = checkBossPhaseTransition(enemy, this);
        if (changed) {
          this.callbacks.onBossPhaseChange?.(enemy, enemy.phase);
          if (this.alphaScheduler && this.alphaPlanRef) {
            this.alphaScheduler.telemetry.recordBossPhase(
              this.alphaPlanRef.snapshot.waveIndex,
              enemy.variant as BossId,
              enemy.phase
            );
          }
          this.particlePool.spawnPreset("energy", enemy.x, enemy.y, enemy.color, {
            intensity: 1.5,
          });
          this.fx.addShake(2, 0);
          this.fx.triggerFlash({ duration: 0.25, color: enemy.color, opacity: 0.25 });
        }
      }

      enemy.knockbackX *= Math.max(0, 1 - dt * 5);
      enemy.knockbackY *= Math.max(0, 1 - dt * 5);

      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) enemy.slow = 0;
      }

      // β AI 行为决策
      const aiCtx = this.buildAIContext(enemy, dt);
      const steering = enemy.isBoss ? runBossAI(aiCtx) : runEnemyAI(aiCtx);

      let speedMul = clamp(steering.speedMultiplier ?? 1, 0.6, 1.4);
      if (enemy.freezeTimer > 0) {
        speedMul = 0;
      } else if (enemy.slow > 0) {
        speedMul *= Math.max(0.1, 1 - enemy.slow);
      }
      const weatherEnemyMul = this.state.weatherState
        ? getWeatherEffect(this.state.weatherState.type).enemySpeedMul
        : 1;
      speedMul *= weatherEnemyMul;
      const moveX = steering.vx * enemy.speed * speedMul * dt;
      const moveY = steering.vy * enemy.speed * speedMul * dt;

      // 朝向移动方向或目标
      if (Math.hypot(steering.vx, steering.vy) > 0.1) {
        setFacing(enemy, enemy.x + steering.vx, enemy.y + steering.vy);
      } else if (steering.targetX !== undefined && steering.targetY !== undefined) {
        setFacing(enemy, steering.targetX, steering.targetY);
      }

      enemy.x += moveX;
      enemy.y += moveY;

      // 远程 / Boss 攻击
      if ((enemy.variant === "spitter" || enemy.isElite || enemy.isBoss) && typeof enemy.attackCooldown === "number" && enemy.attackCooldown >= 0) {
        enemy.attackTimer -= dt;
        if (steering.shouldAttack && enemy.attackTimer <= 0) {
          this.fireEnemyProjectile(enemy);
          enemy.attackTimer = enemy.attackCooldown;
        }
      }

      // Boss 技能/终极技（由 β Boss 状态机触发）
      if (enemy.isBoss) {
        if (steering.shouldUseSkill) {
          this.fireEnemyProjectile(enemy);
          enemy.attackTimer = enemy.attackCooldown;
        }
        if (steering.shouldUseUltimate && enemy.phase >= 2) {
          this.fireEnemyProjectile(enemy);
          enemy.attackTimer = enemy.attackCooldown * 1.5;
        }
      }

      enemy.x += enemy.knockbackX * dt;
      enemy.y += enemy.knockbackY * dt;

      // BUG 10+14: clamp to map boundary first, then resolve collisions
      enemy.x = clamp(enemy.x, enemy.radius, this.state.map.width - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, this.state.map.height - enemy.radius);

      this.resolveObstacleCollisions(enemy, true);

      updateAnimation(
        enemy,
        dt,
        getEnemySprite(enemy.variant, enemy.color, enemy.burnDuration > 0 ? "#fb923c" : "#141210")
      );
    }
  }

  private buildAIContext(enemy: Enemy, dt: number): AIContext {
    const ds = this.state.defenseState;
    const core = ds?.core;
    const nodes = ds?.nodes;

    return {
      enemy,
      player: this.state.player,
      allies: this.state.enemies.filter((e) => e.id !== enemy.id),
      players: [this.state.player, ...this.state.players],
      dt,
      mapWidth: this.state.map.width,
      mapHeight: this.state.map.height,
      difficulty: this.state.difficulty,
      time: this.state.time,
      obstacles: this.state.map.obstacles,
      core,
      nodes,
      alphaSnapshot: this.alphaPlanRef?.snapshot,
      rng: this.rng,
    };
  }

  private fireEnemyProjectile(enemy: Enemy) {
    const player = this.state.player;
    const pattern = getBossAttackPattern(enemy);
    const baseAngle = angleBetween(enemy, player);
    const speed = enemy.isBoss ? 320 : 240;
    const count = pattern.projectileCount;

    if (pattern.attackPattern === "summon") {
      if (this.state.fixedWaveState || this.state.defenseState) return;
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

  private cleanupDestroyedObstacles() {
    const obstacles = this.state.map.obstacles;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].health <= 0) {
        obstacles.splice(i, 1);
      }
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

      if (shouldOfferCurseBlessing(run)) {
        const pairs = generateCurseBlessingOptions(run);
        this.state.status = "curseBlessing";
        this.state.curseBlessingState = run.curseBlessing;
        this.callbacks.onCurseBlessingOffer?.(pairs);
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
    if (this.state.fixedWaveState) {
      this.updateFixedWave(dt);
      return;
    }

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

  private updateFixedWave(dt: number) {
    const fws = this.state.fixedWaveState!;

    if (this.state.mode === "survival") {
      this.state.time += dt;
      const cfg = DEFAULT_BALANCE.modes.survival;
      if (this.state.time >= cfg.timeLimit) {
        this.endRun(true);
        return;
      }
    }

    if (fws.inBreak) {
      return;
    }

    const wave = fws.waves[this.state.wave - 1];
    if (!wave) return;

    const allRegularSpawned = fws.spawned >= wave.enemyCount;
    const bossAlive = this.state.enemies.some((e) => e.isBoss);
    const waveCleared = allRegularSpawned && !bossAlive && this.state.enemies.length === 0 && fws.killed >= fws.spawned;

    if (!waveCleared) {
      this.state.waveTimer += dt;
      return;
    }

    this.state.stats.wavesCleared = (this.state.stats.wavesCleared ?? 0) + 1;
    this.state.waveTimer = 0;

    const isEndless = this.state.mode === "endless";
    const nextWaveIndex = this.state.wave;

    if (nextWaveIndex >= fws.waves.length) {
      if (isEndless) {
        fws.waves = this.generateFixedWaves(this.state.mode, 999);
      } else if (this.state.mode === "daily") {
        this.endRun(true);
        return;
      } else if (this.state.mode === "survival") {
        // Survival victory is time-based; loop waves to keep pressure.
        fws.waves = this.generateFixedWaves(this.state.mode, 10);
        this.state.wave = 1;
      } else {
        // Campaign loops to avoid dead state while missions resolve.
        fws.waves = this.generateFixedWaves(this.state.mode, 10);
        this.state.wave = 1;
      }
    } else {
      this.state.wave += 1;
    }

    fws.inBreak = true;
    fws.breakTimer = this.state.mode === "survival" ? (this.difficultyConfig ? this.difficultyConfig.breakDuration : 5) : (this.difficultyConfig ? this.difficultyConfig.breakDuration : 6);
    fws.spawned = 0;
    fws.killed = 0;

    if (this.state.mode === "daily") {
      this.state.missions = generateEndlessMissions(this.state.wave);
      this.state.currentMissionIndex = 0;
    }

    this.state.difficulty += this.state.mode === "survival"
      ? DEFAULT_BALANCE.modes.survival.difficultyBump
      : DEFAULT_BALANCE.modes.endlessDifficultyBump;
  }

  private updateHeroSkillsAndDeployables(dt: number) {
    updateHeroSkillsAndDeployables(this.state, dt, this.fx);
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
    if (!ds || (this.state.mode !== "defense" && this.state.mode !== "extreme-survival" && this.state.mode !== "peak-challenge" && this.state.mode !== "flagship" && this.state.mode !== "flagship-peak")) return;

    const isExtreme = this.state.mode === "extreme-survival";
    const isPeakChallenge = this.state.mode === "peak-challenge";
    const isFlagship = this.state.mode === "flagship";
    const isFlagshipPeak = this.state.mode === "flagship-peak";
    const run = isExtreme ? this.state.extremeSurvivalRun : undefined;
    const fs = isPeakChallenge ? this.state.peakChallengeState : undefined;
    const fgs = isFlagship ? this.state.flagshipState : undefined;
    const fp = isFlagshipPeak ? this.state.flagshipPeakState : undefined;

    // Victory / defeat checks (defense only)
    if (!isExtreme && !isPeakChallenge && !isFlagship && !isFlagshipPeak) {
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
    }

    // Node capture by all players (defense only)
    let previousCaptured = 0;
    if (!isExtreme && !isPeakChallenge && !isFlagship && !isFlagshipPeak) {
      const players = [this.state.player, ...this.state.players];
      for (const player of players) {
        updateNodeCapture(ds, player, dt);
      }
      previousCaptured = getCapturedNodeCount(ds);
    }

    // Overload shield for extreme survival
    if (isExtreme && run && ds.core.health <= 0 && !run.shieldUsed) {
      triggerOverloadShield(ds, this.state.enemies, ds.core.maxHealth * 0.34);
      run.shieldUsed = true;
      run.coreHealthPercent = ds.core.health / ds.core.maxHealth;
      audio?.play("alert");
      return;
    }

    if ((isExtreme || isPeakChallenge || isFlagship || isFlagshipPeak) && isDefenseDefeat(ds)) {
      this.endRun(false);
      return;
    }

    // Wave management
    if (!ds.waveInProgress) {
      ds.breakTimer -= dt;
      if (ds.breakTimer <= 0 && ds.currentWave < ds.totalWaves) {
        this.callbacks.onBreakEnd?.(this._pendingBreakPurchases);
        ds.waveInProgress = true;
        ds.waveTimer = 0;
        const startingWave = ds.waves[ds.currentWave];
        if (startingWave) {
          startingWave.spawned = 0;
        }
        if (!isExtreme && !isPeakChallenge) {
          activateNodeForWave(ds, ds.currentWave);
        }
        if (this.alphaScheduler) {
          this.alphaScheduler.nextWave();
          this.applyAlphaPlanToDefenseState(ds);
        }
      }
    } else {
      const wave = ds.waves[ds.currentWave];
      if (wave) {
        ds.waveTimer += dt;

        if (this.alphaScheduler && this.alphaPlanRef) {
          // α 动态节律生成 (defense only)
          this.alphaScheduler.tick();
          const alphaStats = this.alphaPlanRef.enemyStats;

          if (ds.spawnTimer === undefined) {
            ds.spawnTimer = 0;
          }
          ds.spawnTimer -= dt;
          if (ds.spawnTimer <= 0) {
            ds.spawnTimer = Math.max(0.22, alphaStats.spawnIntervalMs / 1000);
            const remainingSlots = wave.enemyCount - this.alphaPlanRef.spawned;
            const batchSize = Math.min(4, Math.max(1, Math.floor(remainingSlots / 5)));
            for (let i = 0; i < batchSize && this.alphaPlanRef.spawned < wave.enemyCount; i++) {
              const variant = this.pickAlphaVariant(alphaStats.variantWeights);
              this.spawnEnemy(variant, false, alphaStats);
            }
          }

          const eliteChanceMul = this.difficultyConfig?.eliteChanceMultiplier ?? 1;
          if (wave.eliteCount > 0 && this.rng() < alphaStats.eliteChance * dt * 0.5 * eliteChanceMul) {
            const variant = this.pickAlphaVariant(alphaStats.variantWeights);
            this.spawnEnemy(variant, true, alphaStats);
            wave.eliteCount--;
          }

          if (
            this.alphaPlanRef.isBossWave &&
            wave.bossVariant &&
            this.alphaPlanRef.spawned >= wave.enemyCount &&
            this.state.enemies.every((e) => !e.isBoss)
          ) {
            const bossId = wave.bossVariant as import("./types").BossId;
            this.spawnEnemy(bossId as import("./types").EnemyVariant, true, alphaStats);
            wave.bossVariant = undefined;
          }

          const waveCleared =
            (ds.waveTimer >= wave.duration || (wave.spawned ?? 0) >= wave.enemyCount) &&
            this.state.enemies.length === 0;
          if (waveCleared) {
            this.finalizeDefenseWave(ds);
          }
        } else {
          // Fallback legacy spawn (used by extreme survival)
          if (ds.spawnTimer === undefined) {
            ds.spawnTimer = 0;
          }
          ds.spawnTimer -= dt;
          if (ds.spawnTimer <= 0) {
            const intervalMul = isExtreme ? wave.spawnIntervalMultiplier ?? 1 : 1;
            ds.spawnTimer = Math.max(0.25, (1.4 - ds.currentWave * 0.02) * intervalMul * (this.difficultyConfig ? this.difficultyConfig.spawnIntervalMultiplier : 1));
            const spawned = wave.spawned ?? 0;
            const remainingSlots = wave.enemyCount - spawned;
            const spawnBatch = Math.min(4, Math.max(1, Math.floor(remainingSlots / 4)));
            for (let i = 0; i < spawnBatch && (wave.spawned ?? 0) < wave.enemyCount; i++) {
              const variant = this.pickDefenseWaveVariant(wave);
              this.spawnEnemy(variant, false);
              wave.spawned = (wave.spawned ?? 0) + 1;
            }
          }

          const eliteChanceMulFallback = this.difficultyConfig?.eliteChanceMultiplier ?? 1;
          if (wave.eliteCount > 0 && this.rng() < (isExtreme ? 0.015 : 0.008) * dt * 60 * eliteChanceMulFallback) {
            this.spawnEnemy("elite", true);
            wave.eliteCount--;
          }

          if (
            wave.bossVariant &&
            (wave.spawned ?? 0) >= wave.enemyCount &&
            this.state.enemies.every((e) => !e.isBoss)
          ) {
            const bossId = wave.bossVariant as import("./types").BossId;
            this.spawnEnemy(bossId as import("./types").EnemyVariant, true);
            wave.bossVariant = undefined;
          }

          if (ds.waveTimer >= wave.duration && this.state.enemies.length === 0) {
            this.finalizeDefenseWave(ds);
          }

          const waveClearedFallback =
            ((wave.spawned ?? 0) >= wave.enemyCount) &&
            this.state.enemies.length === 0 &&
            !wave.bossVariant;
          if (waveClearedFallback && ds.waveTimer < wave.duration) {
            // 敌人全部清除，立即结束波次，不等计时器
            this.finalizeDefenseWave(ds);
          }
        }
      }
    }

    // Core damage from enemies that reach it
    if (ds.core.health > 0) {
      ds._coreDamageAccum = ds._coreDamageAccum || 0;
      const FIXED_CORE_DAMAGE_STEP = 1;
      for (const enemy of this.state.enemies) {
        const dist = Math.hypot(enemy.x - ds.core.x, enemy.y - ds.core.y);
        if (dist <= ds.core.radius + enemy.radius) {
          ds._coreDamageAccum += enemy.damage * 2 * dt;
          enemy.health -= 20 * dt;
        }
      }
      while (ds._coreDamageAccum >= FIXED_CORE_DAMAGE_STEP) {
        damageCore(ds, FIXED_CORE_DAMAGE_STEP);
        ds._coreDamageAccum -= FIXED_CORE_DAMAGE_STEP;
      }
    }

    // Track node captures for missions (defense only)
    if (!isExtreme) {
      const currentCaptured = getCapturedNodeCount(ds);
      if (currentCaptured > previousCaptured) {
        addNodeCapture(this.state, currentCaptured - previousCaptured);
        if (this.alphaScheduler && this.alphaPlanRef) {
          this.alphaScheduler.telemetry.recordNodeCaptured(this.alphaPlanRef.snapshot.waveIndex);
        }
      }
    }
  }

  private finalizeDefenseWave(ds: DefenseState) {
    const isExtreme = this.state.mode === "extreme-survival";
    const isPeakChallenge = this.state.mode === "peak-challenge";
    const isFlagship = this.state.mode === "flagship";
    const isFlagshipPeak = this.state.mode === "flagship-peak";
    const run = isExtreme ? this.state.extremeSurvivalRun : undefined;
    const fs = isPeakChallenge ? this.state.peakChallengeState : undefined;
    const fgs = isFlagship ? this.state.flagshipState : undefined;
    const fp = isFlagshipPeak ? this.state.flagshipPeakState : undefined;

    const waveIndex = ds.currentWave;
    const wave = ds.waves[waveIndex];
    const snapshot: PerformanceSnapshot = {
      killsLastWave: this.state.stats.kills - this.extremeSurvivalLastKills,
      damageTakenLastWave: 0,
      coreHealthPercent: ds.core.health / ds.core.maxHealth,
      elapsedWaveSec: ds.waveTimer,
    };

    if (isExtreme && run) {
      run.wave = waveIndex + 1;
      run.coreHealthPercent = snapshot.coreHealthPercent;
      run.elapsedTime = this.state.stats.timeSurvived;
      run.performanceScore = calculatePerformanceScore(snapshot);
      run.scoreMultiplier = 1 + (run.phase === "overclock" ? run.overclockWavesSurvived * 0.1 : 0);
      run.totalScore += Math.round(snapshot.killsLastWave * 10 * run.scoreMultiplier);
      if (run.phase === "overclock") {
        run.overclockWavesSurvived += 1;
      }
      if (snapshot.coreHealthPercent >= 0.95) {
        run.perfectWaves += 1;
        run.totalScore += 100;
      }
      this.extremeSurvivalLastSnapshot = snapshot;
      this.extremeSurvivalLastKills = this.state.stats.kills;
    }

    if (isPeakChallenge && fs) {
      recordPeakChallengeWaveCleared(this.state);
      updatePeakChallengeTasks(this.state, ds);
    }

    if (isFlagship && fgs) {
      recordFlagshipWaveCleared(this.state);
      updateFlagshipChallenges(this.state, ds);
      updateFlagshipCoreHealth(this.state, ds);
    }

    if (isFlagshipPeak && fp) {
      recordFlagshipPeakWaveCleared(this.state);
      updateFlagshipPeakChallenges(this.state, ds);
      updateFlagshipPeakTasks(this.state, ds);
      updateFlagshipPeakCoreHealth(this.state, ds);
    }

    ds.waveInProgress = false;
    ds.currentWave += 1;
    ds.breakTimer = isExtreme || isPeakChallenge || isFlagship || isFlagshipPeak ? (this.difficultyConfig ? this.difficultyConfig.breakDuration : 5) : (this.difficultyConfig ? this.difficultyConfig.breakDuration : 8);
    this.state.stats.wavesCleared = (this.state.stats.wavesCleared ?? 0) + 1;

    if (isExtreme && run && shouldTriggerBranchChoice(waveIndex + 1, run.phase) && !this.extremeSurvivalPendingChoice) {
      this.extremeSurvivalPendingChoice = true;
      this.state.status = "paused";
      this.callbacks.onBranchChoiceRequest?.();
      return;
    }

    if (isPeakChallenge && fs && waveIndex + 1 === PEAK_CHALLENGE_BRANCH_WAVE && !this.peakChallengePendingChoice && fs.phase === "normal") {
      fs.rewardBranchOffered = true;
      this.peakChallengePendingChoice = true;
      this.state.status = "paused";
      this.callbacks.onBranchChoiceRequest?.();
      return;
    }

    if (isPeakChallenge && fs && shouldOfferPeakChallengeReward(fs, waveIndex + 1)) {
      const options = generatePeakChallengeRewardOptions(this.state.player);
      fs.pendingRewards = options;
      this.pendingUpgradeOptions = options;
      this.state.status = "levelup";
      this.callbacks.onLevelUp?.(options);
      return;
    }

    if (isExtreme && ds.currentWave >= ds.waves.length - 5) {
      ds.waves = this.generateExtremeSurvivalWaves(ds, run?.phase ?? "normal");
    }

    if (isPeakChallenge && ds.currentWave >= ds.waves.length - 5) {
      ds.waves = this.generatePeakChallengeWaves(ds, fs?.phase ?? "normal");
    }

    // Flagship victory check
    if (isFlagship && fgs && ds.currentWave >= ds.totalWaves) {
      fgs.phase = "victory";
      this.endRun(true);
      return;
    }

    if (isFlagship && fgs && ds.currentWave >= ds.waves.length - 5) {
      ds.waves = this.generateFlagshipWaves(ds);
    }

    // Flagship Peak victory check
    if (isFlagshipPeak && fp && ds.currentWave >= ds.totalWaves) {
      fp.phase = "victory";
      this.endRun(true);
      return;
    }

    if (isFlagshipPeak && fp && ds.currentWave >= ds.waves.length - 5) {
      ds.waves = this.generateFlagshipPeakWaves(ds);
    }
  }

  private pickDefenseWaveVariant(
    wave: import("./types").DefenseWave
  ): import("./types").EnemyVariant {
    const fallback: import("./types").EnemyVariant[] = ["drone", "sentinel"];
    const variants = wave.enemyVariants.length > 0 ? wave.enemyVariants : fallback;
    return variants[Math.floor(this.rng() * variants.length)];
  }

  private pickAlphaVariant(weights: Record<EnemyVariant, number>): EnemyVariant {
    const entries = Object.entries(weights)
      .filter(([, w]) => w > 0)
      .map(([variant, weight]) => ({ item: variant as EnemyVariant, weight }));
    if (entries.length === 0) return "walker";

    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = this.rng() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return entries[entries.length - 1].item;
  }

  private startRandomEvent() {
    const type = pickRandomEventType(this.state, this.rng);
    const event = startGameEvent(type, this.state);

    if (type === "eliteHunt" && !this.state.fixedWaveState && !this.state.defenseState) {
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
          const isCrit = this.rng() < this.state.player.critChance;
          const comboMul = 1 + Math.min(0.35, this.state.killCombo.count * 0.012);
          const critMul = isCrit ? DEFAULT_BALANCE.player.critDamageMultiplier : 1;
          let damage = p.damage * comboMul * critMul * (this.state.player.damageMultiplier ?? 1);
          damage = this.applyDamage(enemy, damage, p.burnDuration, p.burnDamage);
          p.pierce -= 1;
          this.state.stats.damageDealt += damage;

          if (this.alphaScheduler && this.alphaPlanRef && !enemy.isBoss) {
            this.alphaScheduler.telemetry.recordDamageDealt(
              this.alphaPlanRef.snapshot.waveIndex,
              enemy.variant,
              damage
            );
          }
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

    if (this.alphaScheduler && this.alphaPlanRef && source) {
      this.alphaScheduler.telemetry.recordDamageTaken(
        this.alphaPlanRef.snapshot.waveIndex,
        source.variant,
        reduced
      );
    }

    if (withInvincibility) {
      player.invincible = 0.5;
    }
    this.fx.addShake(1, 0);
    this.fx.addTrauma(0.15);
    audio?.play("hurt");
    transitionAnimation(player, "hit");
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
    const vulnerabilityMul = 1 + enemy.vulnerabilityStacks * 0.1;
    const droneMul = enemy.droneMarkTimer > 0 ? 1.18 : 1;
    const finalDamage = rawDamage * vulnerabilityMul * droneMul;
    enemy.health -= finalDamage;
    if (burnDuration && burnDamage) {
      enemy.burnDuration = burnDuration;
      enemy.burnDamage = burnDamage;
    }
    audio?.play("hit");
    return finalDamage;
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
        if (obs.health <= 0) continue;
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

    if (shouldSplitOnDeath(enemy) && !this.state.fixedWaveState && !this.state.defenseState) {
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

    if (enemy.venomStacks > 0) {
      const corpseBurstRadius = 120;
      for (const other of this.state.enemies) {
        if (other.id === enemy.id) continue;
        if (distance(other, enemy) <= corpseBurstRadius + other.radius) {
          other.health -= 130;
          this.state.stats.damageDealt += 130;
          other.venomStacks = Math.min(5, other.venomStacks + 1);
          other.venomTimer = Math.max(other.venomTimer, 4);
        }
      }
      this.particlePool.spawnPreset("explosion", enemy.x, enemy.y, "#84cc16", { intensity: 0.9 });
      this.fx.addTrauma(0.08);
    }

    this.state.enemies.splice(index, 1);
    addKill(this.state);

    if (this.state.fixedWaveState) {
      this.state.fixedWaveState.killed++;
    }

    if (this.alphaScheduler && this.alphaPlanRef) {
      this.alphaScheduler.telemetry.recordKill(this.alphaPlanRef.snapshot.waveIndex, enemy.variant);
      this.alphaPlanRef.killed++;
    }

    this.addKillCombo(enemy.isBoss);
    if (this.state.mode === "peak-challenge") {
      recordPeakChallengeKill(this.state, enemy.isElite || enemy.isBoss);
      if (enemy.isBoss) {
        recordPeakChallengeBossKill(this.state);
      }
    }
    if (this.state.mode === "flagship") {
      recordFlagshipKill(this.state, enemy.isElite || enemy.isBoss);
      if (enemy.isBoss) {
        recordFlagshipBossKill(this.state);
      }
    }
    if (this.state.mode === "flagship-peak") {
      recordFlagshipPeakKill(this.state, enemy.isElite || enemy.isBoss);
      if (enemy.isBoss) {
        recordFlagshipPeakBossKill(this.state);
      }
    }
    if (this.state.mode === "extreme-survival" && this.state.extremeSurvivalRun) {
      const run = this.state.extremeSurvivalRun;
      if (enemy.isBoss) {
        run.bossKills += 1;
        run.totalScore += 500;
      }
      if (enemy.isElite) {
        run.eliteKills += 1;
        run.totalScore += 50;
      }
    }

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
    const roll = this.rng();
    const pickupCfg = DEFAULT_BALANCE.pickups;
    const dropMul = this.difficultyConfig?.dropRateMultiplier ?? 1;

    if (enemy.isBoss || (enemy.isElite && roll < pickupCfg.chestEliteChance * dropMul)) {
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

    const healthThreshold = 0.015 * dropMul;
    const resourceThreshold = healthThreshold + 0.115 * dropMul;

    if (roll < healthThreshold) {
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
    } else if (roll < resourceThreshold) {
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
    if (this.state.status === "levelup") return;
    if (player.xp >= player.xpToNext) {
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

  selectCurseBlessing(pairIndex: number) {
    if (this.state.status !== "curseBlessing" || !this.state.roguelikeRunState) return;
    const success = applyCurseBlessingChoice(
      this.state.roguelikeRunState,
      pairIndex,
      this.state.player
    );
    if (!success) return;
    this.state.curseBlessingState = this.state.roguelikeRunState.curseBlessing;
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
    if (!victory && !this._deathAnimating) {
      this._deathAnimating = true;
      this._deathDelay = 0.6;
      transitionAnimation(this.state.player, "death");
      this.fx.addTrauma(0.3);
      this.fx.addShake(2, 0.3);
      return;
    }
    this._deathAnimating = false;
    this._deathDelay = 0;
    this.state.status = victory ? "victory" : "defeat";

    if (this.state.mode === "extreme-survival") {
      this.applyExtremeSurvivalRewards();
    }

    if (this.state.mode === "peak-challenge") {
      this.applyPeakChallengeRewards();
    }

    if (this.state.mode === "flagship") {
      this.applyFlagshipRewards();
    }

    const result: RunResult = {
      victory,
      stats: { ...this.state.stats },
      completedMissions: this.state.missions.filter((m) => m.completed).length,
      elapsed: this.state.stats.timeSurvived,
      mode: this.state.mode,
      extremeSurvivalPhase: this.state.extremeSurvivalRun?.phase,
      peakChallengePhase: this.state.peakChallengeState?.phase,
      flagshipPhase: this.state.flagshipState?.phase,
    };
    if (victory) {
      audio?.play("levelup");
      this.callbacks.onVictory?.(result);
    } else {
      audio?.play("alert");
      this.callbacks.onDefeat?.(result);
    }
  }

  private applyExtremeSurvivalRewards() {
    const run = this.state.extremeSurvivalRun;
    if (!run) return;
    const todayClaimed = getTodayClaimed();
    const reward = calculateRewards({
      wave: run.wave,
      isOverclock: run.phase === "overclock",
      performanceScore: run.performanceScore,
      elapsedTime: run.elapsedTime,
      todayClaimed,
    });
    this.state.stats.score = reward.tokens;
    if (reward.tokens > 0) {
      addTodayClaimed(reward.tokens);
      addCoins(reward.tokens);
    }
  }

  private applyPeakChallengeRewards() {
    const rewards = applyPeakChallengeEndRewards(this.state);
    this.state.stats.score = rewards.currency;
    if (rewards.currency > 0) {
      addSeasonCurrency(rewards.currency);
    }
    if (rewards.xp > 0) {
      addSeasonXp(rewards.xp);
    }
  }

  private applyFlagshipRewards() {
    const rewards = applyFlagshipEndRewards(this.state);
    this.state.stats.score = rewards.score;
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

    const halfW = (this.canvasWidth / 2) / this.state.camera.scale;
    const halfH = (this.canvasHeight / 2) / this.state.camera.scale;
    const minX = halfW;
    const minY = halfH;
    const maxX = this.state.map.width - halfW;
    const maxY = this.state.map.height - halfH;
    // BUG 8: 当视口大于地图时，摄像机锁定在地图中心，防止显示地图外区域
    if (maxX > minX) {
      this.state.camera.x = clamp(this.state.camera.x, minX, maxX);
    } else {
      this.state.camera.x = this.state.map.width / 2;
    }
    if (maxY > minY) {
      this.state.camera.y = clamp(this.state.camera.y, minY, maxY);
    } else {
      this.state.camera.y = this.state.map.height / 2;
    }
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
      peakChallengeState: this.state.peakChallengeState,
      flagshipState: this.state.flagshipState,
      fixedWaveState: this.state.fixedWaveState,
      deployables: this.state.deployables,
      weatherState: this.state.weatherState,
      curseBlessingState: this.state.curseBlessingState,
      selectedHero: this.state.selectedHero,
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
    if (serialized.peakChallengeState) {
      this.state.peakChallengeState = serialized.peakChallengeState;
    }
    if (serialized.flagshipState) {
      this.state.flagshipState = serialized.flagshipState;
    }
    if (serialized.fixedWaveState) {
      this.state.fixedWaveState = serialized.fixedWaveState;
    }
    if (serialized.deployables) {
      this.state.deployables = serialized.deployables;
    }
    if (serialized.weatherState) {
      this.state.weatherState = serialized.weatherState;
    }
    if (serialized.curseBlessingState) {
      this.state.curseBlessingState = serialized.curseBlessingState;
    }
    if (serialized.selectedHero) {
      this.state.selectedHero = serialized.selectedHero;
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

    // BUG 9: 在变换前填充整个画布背景色，确保视口溢出时不会出现透明区域
    const theme = THEMES[this.state.map.theme];
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.save();
    ctx.translate(this.canvasWidth / 2 + shake.x, this.canvasHeight / 2 + shake.y);
    ctx.rotate(shake.rotation);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    // Layer 1: 地面纹理
    this.drawBackground(ctx);
    // Layer 2: 地面装饰物
    this.drawDecors(ctx);
    // Layer 3: 危险区域
    this.drawHazards(ctx);
    // Layer 4: 障碍物 (Y轴排序)
    this.drawObstacles(ctx);
    // Layer 5: 据点核心
    this.drawCore(ctx);
    // Layer 6: 能量节点
    this.drawNodes(ctx);
    // Layer 7: 撤离点
    this.drawExtraction(ctx);
    // Layer 8: 掉落物
    this.drawPickups(ctx);
    // Layer 9: 部署物 (Y轴排序)
    this.drawDeployables(ctx);
    // Layer 10: 敌人投射物
    this.drawEnemyProjectiles(ctx);
    // Layer 11: 实体 (enemies + players, Y轴排序)
    this.drawEntitiesDepthSorted(ctx);
    // Layer 12: 状态效果叠加 (burn/freeze/slow/shield)
    this.drawStatusEffects(ctx);
    // Layer 13: 天气DOT警示叠加
    this.drawWeatherOverlay(ctx);
    // Layer 14: 粒子特效
    this.drawParticles(ctx);
    // Layer 14: 玩家投射物
    this.drawProjectiles(ctx);
    // Layer 15: 伤害数字
    this.drawDamageNumbers(ctx);
    // Layer 16: 血条
    this.drawHealthBars(ctx);
    // Layer 17: 事件特效
    this.drawEvent(ctx);

    ctx.restore();

    this.fx.drawFlash(ctx, this.canvasWidth, this.canvasHeight);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const map = this.state.map;
    const theme = THEMES[map.theme];
    const { camera } = this.state;

    ctx.fillStyle = theme.bg;
    // Fill the entire viewport-extended area to prevent empty space when camera is at map edges
    const viewLeft = camera.x - (this.canvasWidth / 2) / camera.scale - 100;
    const viewTop = camera.y - (this.canvasHeight / 2) / camera.scale - 100;
    const viewRight = camera.x + (this.canvasWidth / 2) / camera.scale + 100;
    const viewBottom = camera.y + (this.canvasHeight / 2) / camera.scale + 100;
    ctx.fillRect(viewLeft, viewTop, viewRight - viewLeft, viewBottom - viewTop);

    ctx.fillStyle = theme.gridAlt ?? "#1a1f33";
    ctx.fillRect(0, 0, map.width, map.height);

    // BUG 19: 地面纹理层 - 程序化tile pattern
    this.drawGroundTexture(ctx, map.width, map.height, theme);

    // Viewport culling: only draw grid lines that can be seen.
    const halfW = (this.canvasWidth / 2) / camera.scale;
    const halfH = (this.canvasHeight / 2) / camera.scale;
    const gridSize = 80;
    const left = Math.max(0, Math.floor((camera.x - halfW) / gridSize) * gridSize - gridSize);
    const right = Math.min(map.width, Math.ceil((camera.x + halfW) / gridSize) * gridSize + gridSize);
    const top = Math.max(0, Math.floor((camera.y - halfH) / gridSize) * gridSize - gridSize);
    const bottom = Math.min(map.height, Math.ceil((camera.y + halfH) / gridSize) * gridSize + gridSize);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = left; x <= right; x += gridSize) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = top; y <= bottom; y += gridSize) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, map.width - 4, map.height - 4);
  }

  // BUG 19: 程序化地面纹理 - 视口裁剪的tile pattern
  private drawGroundTexture(
    ctx: CanvasRenderingContext2D,
    mapW: number,
    mapH: number,
    theme: { bg: string; grid: string; border: string; accent: string; gridAlt?: string }
  ) {
    const { camera } = this.state;
    const halfW = (this.canvasWidth / 2) / camera.scale;
    const halfH = (this.canvasHeight / 2) / camera.scale;
    const tileSize = 40;
    const startX = Math.max(0, Math.floor((camera.x - halfW) / tileSize) * tileSize);
    const endX = Math.min(mapW, Math.ceil((camera.x + halfW) / tileSize) * tileSize);
    const startY = Math.max(0, Math.floor((camera.y - halfH) / tileSize) * tileSize);
    const endY = Math.min(mapH, Math.ceil((camera.y + halfH) / tileSize) * tileSize);

    const dotColor = `${theme.grid}44`;
    const crossColor = `${theme.grid}22`;

    ctx.fillStyle = dotColor;
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        // 中心微点
        ctx.fillRect(x + tileSize / 2 - 1, y + tileSize / 2 - 1, 2, 2);

        // 对角微点
        ctx.fillRect(x + tileSize - 4, y + 4, 1, 1);
        ctx.fillRect(x + 4, y + tileSize - 4, 1, 1);
      }
    }

    // 网格交叉点标记
    ctx.strokeStyle = crossColor;
    ctx.lineWidth = 1;
    const crossSize = 3;
    const crossStep = tileSize * 2;
    const crossStartX = Math.max(0, Math.floor((camera.x - halfW) / crossStep) * crossStep);
    const crossEndX = Math.min(mapW, Math.ceil((camera.x + halfW) / crossStep) * crossStep);
    const crossStartY = Math.max(0, Math.floor((camera.y - halfH) / crossStep) * crossStep);
    const crossEndY = Math.min(mapH, Math.ceil((camera.y + halfH) / crossStep) * crossStep);

    ctx.beginPath();
    for (let x = crossStartX; x < crossEndX; x += crossStep) {
      for (let y = crossStartY; y < crossEndY; y += crossStep) {
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y + crossSize);
      }
    }
    ctx.stroke();
  }

  // Layer 2: 地面装饰物 (placeholder - extensibility point for future decor system)
  private drawDecors(ctx: CanvasRenderingContext2D) {
    const decors = this.state.map.decors;
    if (!decors || decors.length === 0) return;

    const { camera } = this.state;
    const halfW = (this.canvasWidth / 2) / camera.scale + 40;
    const halfH = (this.canvasHeight / 2) / camera.scale + 40;
    const viewLeft = camera.x - halfW;
    const viewRight = camera.x + halfW;
    const viewTop = camera.y - halfH;
    const viewBottom = camera.y + halfH;

    const time = this.state.time;

    for (const decor of decors) {
      if (decor.x + decor.radius < viewLeft || decor.x - decor.radius > viewRight ||
          decor.y + decor.radius < viewTop || decor.y - decor.radius > viewBottom) {
        continue;
      }

      ctx.save();
      ctx.translate(decor.x, decor.y);
      ctx.rotate(decor.rotation);

      switch (decor.type) {
        case "rock": {
          ctx.fillStyle = decor.color;
          ctx.beginPath();
          ctx.moveTo(-decor.radius * 0.8, decor.radius * 0.6);
          ctx.lineTo(-decor.radius * 0.3, -decor.radius * 0.9);
          ctx.lineTo(decor.radius * 0.7, -decor.radius * 0.4);
          ctx.lineTo(decor.radius * 0.9, decor.radius * 0.5);
          ctx.lineTo(0, decor.radius * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `${decor.color}88`;
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        }
        case "debris": {
          ctx.fillStyle = decor.color;
          ctx.beginPath();
          ctx.arc(0, 0, decor.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `${decor.color}66`;
          ctx.beginPath();
          ctx.arc(decor.radius * 0.3, -decor.radius * 0.2, decor.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-decor.radius * 0.25, decor.radius * 0.25, decor.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "grass": {
          ctx.fillStyle = `${decor.color}55`;
          ctx.beginPath();
          ctx.arc(0, 0, decor.radius, 0, Math.PI * 2);
          ctx.fill();
          const bladeCount = 5;
          for (let b = 0; b < bladeCount; b++) {
            const angle = (b / bladeCount) * Math.PI * 2 + decor.rotation * 0.3;
            const bx = Math.cos(angle) * decor.radius * 0.5;
            const by = Math.sin(angle) * decor.radius * 0.5;
            ctx.strokeStyle = `${decor.color}aa`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(
              bx + Math.cos(angle + 0.3) * decor.radius * 0.6,
              by + Math.sin(angle + 0.3) * decor.radius * 0.6,
              bx + Math.cos(angle) * decor.radius * 0.9,
              by + Math.sin(angle) * decor.radius * 0.9
            );
            ctx.stroke();
          }
          break;
        }
        case "crystal": {
          const crystalPulse = 1 + Math.sin(time * 2 + decor.x * 0.01) * 0.15;
          ctx.fillStyle = decor.color;
          ctx.globalAlpha = 0.5 + Math.sin(time * 3 + decor.y * 0.01) * 0.2;
          ctx.beginPath();
          ctx.moveTo(0, -decor.radius * crystalPulse);
          ctx.lineTo(decor.radius * 0.5 * crystalPulse, 0);
          ctx.lineTo(0, decor.radius * 0.6 * crystalPulse);
          ctx.lineTo(-decor.radius * 0.5 * crystalPulse, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `${decor.color}cc`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        }
        case "vent": {
          ctx.fillStyle = `${decor.color}33`;
          ctx.beginPath();
          ctx.arc(0, 0, decor.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = decor.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          const ventPulse = 1 + Math.sin(time * 3) * 0.2;
          ctx.fillStyle = `${decor.color}88`;
          ctx.beginPath();
          ctx.arc(0, 0, decor.radius * 0.35 * ventPulse, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "crate": {
          const s = decor.radius;
          ctx.fillStyle = decor.color;
          ctx.fillRect(-s, -s, s * 2, s * 2);
          ctx.strokeStyle = `${decor.color}aa`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          ctx.beginPath();
          ctx.moveTo(-s, -s);
          ctx.lineTo(s, s);
          ctx.moveTo(s, -s);
          ctx.lineTo(-s, s);
          ctx.strokeStyle = `${decor.color}44`;
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    const { camera } = this.state;
    const halfW = (this.canvasWidth / 2) / camera.scale + 60;
    const halfH = (this.canvasHeight / 2) / camera.scale + 60;
    const viewLeft = camera.x - halfW;
    const viewRight = camera.x + halfW;
    const viewTop = camera.y - halfH;
    const viewBottom = camera.y + halfH;

    // Layer 4: Y轴排序 - 收集视口内可见障碍物，按Y排序
    const visible: Obstacle[] = [];
    for (const obs of this.state.map.obstacles) {
      if (obs.health <= 0) continue;
      if (
        obs.x + obs.width / 2 < viewLeft ||
        obs.x - obs.width / 2 > viewRight ||
        obs.y + obs.height / 2 < viewTop ||
        obs.y - obs.height / 2 > viewBottom
      ) {
        continue;
      }
      visible.push(obs);
    }
    visible.sort((a, b) => a.y - b.y);

    for (const obs of visible) {
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

  private drawCore(ctx: CanvasRenderingContext2D) {
    const ds = this.state.defenseState;
    if (!ds) return;

    const core = ds.core;
    const time = this.state.time;
    const healthRatio = core.health / core.maxHealth;
    const isCritical = healthRatio <= 0.25;
    const isLow = healthRatio <= 0.5;

    ctx.save();
    ctx.translate(core.x, core.y);

    const pulse = 1 + Math.sin(time * 3) * 0.04;
    const criticalPulse = isCritical ? 1 + Math.sin(time * 8) * 0.08 : 1;

    const outerRadius = core.radius * pulse * criticalPulse;
    const innerRadius = core.radius * 0.65;

    const baseColor = isCritical ? "#ef4444" : isLow ? "#f59e0b" : core.color;
    const glowColor = isCritical ? "#ef4444" : isLow ? "#f59e0b" : "#22d3ee";

    if (isCritical) {
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius + 12, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0, 0, outerRadius, 0, 0, outerRadius + 14);
      grad.addColorStop(0, `${glowColor}44`);
      grad.addColorStop(1, `${glowColor}00`);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = `${glowColor}55`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const outerGrad = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
    outerGrad.addColorStop(0, `${baseColor}99`);
    outerGrad.addColorStop(0.7, `${baseColor}44`);
    outerGrad.addColorStop(1, `${baseColor}11`);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `${baseColor}aa`;
    ctx.lineWidth = 3;
    ctx.stroke();

    const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius);
    innerGrad.addColorStop(0, `${baseColor}dd`);
    innerGrad.addColorStop(0.5, `${baseColor}66`);
    innerGrad.addColorStop(1, `${baseColor}22`);
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    const healthAngle = -Math.PI / 2;
    const healthSweep = Math.PI * 2 * healthRatio;
    ctx.beginPath();
    ctx.arc(0, 0, core.radius * 0.85, healthAngle, healthAngle + healthSweep);
    ctx.strokeStyle = isCritical ? "#ef4444" : isLow ? "#f59e0b" : "#22d3ee";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    if (healthRatio < 1) {
      ctx.beginPath();
      ctx.arc(0, 0, core.radius * 0.85, healthAngle + healthSweep, healthAngle + Math.PI * 2);
      ctx.strokeStyle = `${baseColor}33`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px var(--font-geist-sans), sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("核心", 0, 0);

    const labelY = outerRadius + 16;
    ctx.fillStyle = `${baseColor}cc`;
    ctx.font = "bold 11px var(--font-geist-sans), monospace";
    ctx.fillText(`${Math.ceil(core.health)} / ${core.maxHealth}`, 0, labelY);

    ctx.restore();
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

  // Layer 11: 实体绘制 (仅绘制精灵，不含状态效果和血条)
  private drawEntitiesDepthSorted(ctx: CanvasRenderingContext2D) {
    interface DrawableEntity {
      y: number;
      draw: () => void;
    }
    const drawables: DrawableEntity[] = [];

    for (const enemy of this.state.enemies) {
      drawables.push({
        y: enemy.y,
        draw: () => this.drawEnemySprite(ctx, enemy),
      });
    }

    for (const player of this.state.players) {
      if (player.id !== this.state.player.id) {
        drawables.push({
          y: player.y,
          draw: () => {
            const remoteColor = player.skinColor || REMOTE_PLAYER_COLOR;
            this.drawEntitySprite(ctx, player, remoteColor, "#0b0d17");
          },
        });
      }
    }

    drawables.push({
      y: this.state.player.y,
      draw: () => {
        this.drawEntitySprite(ctx, this.state.player, this.state.player.skinColor ?? DEFAULT_PLAYER_COLOR, "#0b0d17");
      },
    });

    drawables.sort((a, b) => a.y - b.y);

    for (const d of drawables) {
      d.draw();
    }
  }

  // 仅绘制实体精灵（不含状态效果和血条）
  private drawEntitySprite(
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
      ctx.beginPath();
      ctx.moveTo(entity.radius * 0.3, 0);
      ctx.lineTo(entity.radius * 1.1, -entity.radius * 0.35);
      ctx.lineTo(entity.radius * 1.1, entity.radius * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // 仅绘制敌人精灵（不含状态效果和血条）
  private drawEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.isElite || enemy.isBoss) {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.rotate(enemy.facing);

    const secondaryColor = enemy.burnDuration > 0 ? "#fb923c" : "#141210";
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
      ctx.strokeStyle = enemy.isBoss ? "#ffffff" : "#141210";
      ctx.lineWidth = enemy.isBoss ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = enemy.isBoss ? "#ffffff" : enemy.color;
      ctx.beginPath();
      ctx.moveTo(enemy.radius * 0.3, 0);
      ctx.lineTo(enemy.radius * 1.1, -enemy.radius * 0.35);
      ctx.lineTo(enemy.radius * 1.1, enemy.radius * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Layer 12: 状态效果叠加 (burn/freeze/slow/shield/berserk/regen)
  private drawStatusEffects(ctx: CanvasRenderingContext2D) {
    const time = this.state.time;

    // 玩家状态效果
    const player = this.state.player;
    this.drawPlayerStatusEffects(ctx, player, time);

    // 远程玩家状态效果
    for (const p of this.state.players) {
      if (p.id !== player.id) {
        this.drawPlayerStatusEffects(ctx, p, time);
      }
    }

    // 敌人状态效果
    for (const enemy of this.state.enemies) {
      this.drawEnemyStatusEffects(ctx, enemy, time);
    }
  }

  private drawPlayerStatusEffects(ctx: CanvasRenderingContext2D, entity: Player, time: number) {
    // 护盾效果
    if (entity.invincible > 0) {
      ctx.save();
      ctx.translate(entity.x, entity.y);
      const shieldPulse = 1 + Math.sin(time * 6) * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius * 1.4 * shieldPulse, 0, Math.PI * 2);
      const shieldGrad = ctx.createRadialGradient(0, 0, entity.radius * 1.1, 0, 0, entity.radius * 1.5);
      shieldGrad.addColorStop(0, "rgba(56, 189, 248, 0.15)");
      shieldGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.35)");
      shieldGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 狂暴效果
    if (entity.leopardFrenzyActive) {
      ctx.save();
      ctx.translate(entity.x, entity.y);
      const frenzyPulse = 1 + Math.sin(time * 10) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius * 1.25 * frenzyPulse, 0, Math.PI * 2);
      const frenzyGrad = ctx.createRadialGradient(0, 0, entity.radius * 0.8, 0, 0, entity.radius * 1.3);
      frenzyGrad.addColorStop(0, "rgba(249, 115, 22, 0)");
      frenzyGrad.addColorStop(0.6, "rgba(249, 115, 22, 0.2)");
      frenzyGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
      ctx.fillStyle = frenzyGrad;
      ctx.fill();
      ctx.restore();
    }

    // 再生效果
    if (entity.regen > 0) {
      ctx.save();
      ctx.translate(entity.x, entity.y);
      const regenPulse = 1 + Math.sin(time * 4) * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius * 1.2 * regenPulse, 0, Math.PI * 2);
      const regenGrad = ctx.createRadialGradient(0, 0, entity.radius * 0.9, 0, 0, entity.radius * 1.25);
      regenGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      regenGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.15)");
      regenGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = regenGrad;
      ctx.fill();
      ctx.restore();
    }

    // 燃烧效果
    if (entity.burnDuration > 0) {
      this.drawBurnEffect(ctx, entity.x, entity.y, entity.radius, entity.burnDuration, time);
    }
  }

  private drawEnemyStatusEffects(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    // 护盾敌人
    if (enemy.affixes.includes("shielded")) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      const shieldPulse = 1 + Math.sin(time * 5) * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 1.25 * shieldPulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 再生敌人
    if (enemy.affixes.includes("regenerating")) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 1.15, 0, Math.PI * 2);
      const regenGrad = ctx.createRadialGradient(0, 0, enemy.radius * 0.8, 0, 0, enemy.radius * 1.2);
      regenGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      regenGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.12)");
      regenGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = regenGrad;
      ctx.fill();
      ctx.restore();
    }

    // 冻结/减速
    if (enemy.freezeTimer > 0) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 减速效果
    if (enemy.slow > 0 && enemy.slowTimer > 0) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 燃烧效果
    if (enemy.burnDuration > 0) {
      this.drawBurnEffect(ctx, enemy.x, enemy.y, enemy.radius, enemy.burnDuration, time);
    }
  }

  private drawBurnEffect(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, burnDuration: number, time: number) {
    ctx.save();
    const burnIntensity = Math.min(1, burnDuration / 3);
    const flameCount = Math.floor(4 * burnIntensity);
    for (let i = 0; i < flameCount; i++) {
      const angle = (Math.PI * 2 * i) / flameCount + time * 3;
      const dist = radius * 1.1 + Math.sin(time * 8 + i) * 3;
      const fx = x + Math.cos(angle) * dist;
      const fy = y + Math.sin(angle) * dist;
      const flameSize = 2 + Math.random() * 3 * burnIntensity;
      ctx.beginPath();
      ctx.arc(fx, fy, flameSize, 0, Math.PI * 2);
      const flameGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, flameSize);
      flameGrad.addColorStop(0, "rgba(251, 146, 60, 0.8)");
      flameGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.5)");
      flameGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = flameGrad;
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWeatherOverlay(ctx: CanvasRenderingContext2D) {
    const ws = this.state.weatherState;
    if (!ws || ws.transitionProgress > 0) return;

    const effect = getWeatherEffect(ws.type);
    if (!effect || effect.dotDamagePerSec <= 0) return;

    const { camera } = this.state;
    const camW = this.canvasWidth / camera.scale;
    const camH = this.canvasHeight / camera.scale;
    const camX = camera.x - camW / 2;
    const camY = camera.y - camH / 2;

    const healthPercent = this.state.player.health / Math.max(1, this.state.player.maxHealth);
    const isCritical = healthPercent < 0.35;
    const dotIntensity = Math.min(1, effect.dotDamagePerSec / 8);

    ctx.save();
    // 屏幕边缘DOT警示：视口四边红色渐变叠加
    const edgeWidth = 40;
    const edgeAlpha = isCritical ? 0.25 + Math.sin(this.state.time * 4) * 0.08 : 0.12 * dotIntensity;

    // 上边
    const topGrad = ctx.createLinearGradient(camX, camY, camX, camY + edgeWidth);
    topGrad.addColorStop(0, `rgba(239, 68, 68, ${edgeAlpha})`);
    topGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(camX, camY, camW, edgeWidth);

    // 下边
    const bottomGrad = ctx.createLinearGradient(camX, camY + camH, camX, camY + camH - edgeWidth);
    bottomGrad.addColorStop(0, `rgba(239, 68, 68, ${edgeAlpha})`);
    bottomGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(camX, camY + camH - edgeWidth, camW, edgeWidth);

    // 左边
    const leftGrad = ctx.createLinearGradient(camX, camY, camX + edgeWidth, camY);
    leftGrad.addColorStop(0, `rgba(239, 68, 68, ${edgeAlpha})`);
    leftGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = leftGrad;
    ctx.fillRect(camX, camY, edgeWidth, camH);

    // 右边
    const rightGrad = ctx.createLinearGradient(camX + camW, camY, camX + camW - edgeWidth, camY);
    rightGrad.addColorStop(0, `rgba(239, 68, 68, ${edgeAlpha})`);
    rightGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = rightGrad;
    ctx.fillRect(camX + camW - edgeWidth, camY, edgeWidth, camH);

    // DOT 粒子：在玩家周围随机生成警告粒子
    if (isCritical) {
      const player = this.state.player;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = player.radius * 1.3 + Math.random() * 20;
        const px = player.x + Math.cos(angle) * dist;
        const py = player.y + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Layer 16: 血条 (所有实体的血条统一绘制)
  private drawHealthBars(ctx: CanvasRenderingContext2D) {
    const player = this.state.player;

    // 玩家血条 + 等级
    this.drawHealthBar(ctx, player.x, player.y - player.radius - 14, player.radius * 2, 6, player.health, player.maxHealth, player.skinColor ?? DEFAULT_PLAYER_COLOR);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px var(--font-geist-sans), monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Lv.${player.level}`, player.x, player.y + player.radius + 14);

    // 远程玩家血条 + 名称
    for (const p of this.state.players) {
      if (p.id !== player.id) {
        const remoteColor = p.skinColor || REMOTE_PLAYER_COLOR;
        this.drawHealthBar(ctx, p.x, p.y - p.radius - 14, p.radius * 2, 5, p.health, p.maxHealth, remoteColor);
        ctx.fillStyle = "#ffffffcc";
        ctx.font = "bold 9px var(--font-geist-sans), sans-serif";
        ctx.textAlign = "center";
        const shortName = p.id.length > 8 ? p.id.slice(0, 7) + "…" : p.id;
        ctx.fillText(shortName, p.x, p.y - p.radius - 18);
      }
    }

    // 敌人血条
    for (const enemy of this.state.enemies) {
      this.drawHealthBar(ctx, enemy.x, enemy.y - enemy.radius - 10, enemy.radius * 2, 4, enemy.health, enemy.maxHealth, enemy.color);
    }
  }

  // 通用血条绘制
  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    health: number,
    maxHealth: number,
    accentColor: string
  ) {
    const pct = health / maxHealth;
    ctx.fillStyle = "#1c2033cc";
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.fillStyle = pct > 0.5 ? "#34d399" : pct > 0.25 ? "#f59e0b" : "#f43f5e";
    ctx.fillRect(x - width / 2, y, width * pct, height);
    ctx.strokeStyle = `${accentColor}44`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y, width, height);
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.state.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.weaponId === "meleeArcVisual") {
        ctx.rotate(Math.atan2(p.vy, p.vx));
        const alpha = Math.min(1, p.life / 0.08);
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, p.radius, -(p.thrustWidth ?? Math.PI / 2) / 2, (p.thrustWidth ?? Math.PI / 2) / 2);
        ctx.closePath();
        ctx.fill();
      } else if (p.isMelee) {
        ctx.rotate(Math.atan2(p.vy, p.vx));
        const alpha = Math.min(1, p.life / 0.12);
        ctx.globalAlpha = alpha * 0.75;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        const length = (p.thrustLength ?? 60) * 0.35;
        const width = p.thrustWidth ?? 30;
        ctx.beginPath();
        ctx.roundRect(-length * 0.2, -width / 2, length, width, width / 2);
        ctx.fill();
      } else if (p.weaponId === "rocket") {
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

  // Layer 9: 部署物 (Y轴排序)
  private drawDeployables(ctx: CanvasRenderingContext2D) {
    const allDeployables: Deployable[] = [
      ...this.state.deployables,
    ];
    const ds = this.state.defenseState;
    if (ds) {
      allDeployables.push(...ds.deployables);
    }
    if (allDeployables.length === 0) return;

    // Y轴排序
    allDeployables.sort((a, b) => a.y - b.y);

    const time = this.state.time;

    for (const d of allDeployables) {
      if (d.health <= 0) continue;
      ctx.save();
      ctx.translate(d.x, d.y);

      switch (d.type) {
        case "wall": {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(-d.radius, -d.radius, d.radius * 2, d.radius * 2);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.strokeRect(-d.radius, -d.radius, d.radius * 2, d.radius * 2);
          const wallHp = d.health / d.maxHealth;
          ctx.fillStyle = wallHp > 0.5 ? "#34d399" : "#f43f5e";
          ctx.fillRect(-d.radius, -d.radius - 6, d.radius * 2 * wallHp, 3);
          break;
        }
        case "turret": {
          const pulse = 1 + Math.sin(time * 4) * 0.1;
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `${d.color}33`;
          ctx.fill();
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = d.color;
          ctx.fillRect(-3, -8, 6, 16);
          ctx.fillRect(-8, -3, 16, 6);
          break;
        }
        case "shield": {
          const pulse = 1 + Math.sin(time * 3) * 0.08;
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * pulse, 0, Math.PI * 2);
          const shieldGrad = ctx.createRadialGradient(0, 0, d.radius * 0.5, 0, 0, d.radius);
          shieldGrad.addColorStop(0, "rgba(56, 189, 248, 0.15)");
          shieldGrad.addColorStop(1, "rgba(56, 189, 248, 0.05)");
          ctx.fillStyle = shieldGrad;
          ctx.fill();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case "mine": {
          ctx.beginPath();
          ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${d.color}44`;
          ctx.fill();
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          const blink = Math.sin(time * 6) > 0;
          if (blink) {
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#ef4444";
            ctx.fill();
          }
          break;
        }
        case "beacon": {
          const pulse = 1 + Math.sin(time * 3) * 0.12;
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${d.color}66`;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
          break;
        }
        case "healAura": {
          const pulse = 1 + Math.sin(time * 3) * 0.1;
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * pulse, 0, Math.PI * 2);
          const healGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius);
          healGrad.addColorStop(0, "rgba(52, 211, 153, 0.2)");
          healGrad.addColorStop(1, "rgba(52, 211, 153, 0.02)");
          ctx.fillStyle = healGrad;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#34d399";
          ctx.fill();
          break;
        }
        case "freezeField": {
          ctx.beginPath();
          ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
          const freezeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius);
          freezeGrad.addColorStop(0, "rgba(125, 211, 252, 0.2)");
          freezeGrad.addColorStop(1, "rgba(125, 211, 252, 0.02)");
          ctx.fillStyle = freezeGrad;
          ctx.fill();
          ctx.strokeStyle = "rgba(125, 211, 252, 0.4)";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case "poisonField": {
          ctx.beginPath();
          ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
          const poisonGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius);
          poisonGrad.addColorStop(0, "rgba(132, 204, 22, 0.2)");
          poisonGrad.addColorStop(1, "rgba(132, 204, 22, 0.02)");
          ctx.fillStyle = poisonGrad;
          ctx.fill();
          break;
        }
        case "drone": {
          const hover = Math.sin(time * 5) * 3;
          ctx.translate(0, hover);
          ctx.beginPath();
          ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${d.color}55`;
          ctx.fill();
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = d.color;
          ctx.fillRect(-4, -1, 8, 2);
          break;
        }
        case "laserBeam": {
          if (d.targetId) {
            const target = this.state.enemies.find((e) => e.id === d.targetId);
            if (target) {
              const dx = target.x - d.x;
              const dy = target.y - d.y;
              const len = Math.hypot(dx, dy);
              const angle = Math.atan2(dy, dx);
              ctx.rotate(angle);
              const beamAlpha = 0.3 + Math.sin(time * 10) * 0.15;
              ctx.strokeStyle = `rgba(239, 68, 68, ${beamAlpha})`;
              ctx.lineWidth = 3;
              ctx.shadowColor = "#ef4444";
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(len, 0);
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
          break;
        }
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

  private updateWeather(dt: number) {
    const ws = this.state.weatherState;
    if (!ws) return;

    const updated = updateWeather(ws, dt);
    this.state.weatherState = updated;

    if (updated.transitionProgress > 0) return;
    const effect = getWeatherEffect(updated.type);
    if (!effect) return;

    // Apply DOT damage to player
    if (effect.dotDamagePerSec > 0) {
      this.state.player.health -= effect.dotDamagePerSec * dt;
      if (this.state.player.health <= 1) {
        this.state.player.health = 1;
      }
    }

    // Apply DOT damage to enemies
    if (effect.dotDamagePerSec > 0) {
      for (let i = this.state.enemies.length - 1; i >= 0; i--) {
        const enemy = this.state.enemies[i];
        if (enemy.health <= 0) continue;
        enemy.health -= effect.dotDamagePerSec * dt;
        if (enemy.health <= 0) {
          enemy.health = 0;
          this.killEnemy(enemy, i);
        }
      }
    }

    // Lightning strikes on enemies
    if (effect.lightningChancePerSec > 0 && this.state.enemies.length > 0) {
      for (let i = this.state.enemies.length - 1; i >= 0; i--) {
        const enemy = this.state.enemies[i];
        if (enemy.health <= 0) continue;
        if (Math.random() < effect.lightningChancePerSec * dt) {
          enemy.health -= effect.lightningDamage;
          this.particlePool.spawnPreset(
            "spark",
            enemy.x,
            enemy.y,
            "#6366f1",
            { intensity: 0.9 }
          );
          if (enemy.health <= 0) {
            enemy.health = 0;
            this.killEnemy(enemy, i);
          }
        }
      }
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
