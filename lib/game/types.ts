import type { NetworkRole, NetworkMessage, NetworkPlayer, GameRoom } from "@/lib/network/types";
import type { ExtremeSurvivalRun } from "@/lib/extreme-survival/types";
import type { WeatherState } from "./weather";
import type { CurseBlessingState } from "./curseBlessing";

export type { NetworkRole, NetworkMessage, NetworkPlayer, GameRoom };
export type { ExtremeSurvivalRun };
export type { CurseBlessingState };

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export type GameStatus =
  "idle" | "running" | "paused" | "levelup" | "reward" | "curseBlessing" | "victory" | "defeat";

export type GameModeType =
  | "campaign"
  | "endless"
  | "daily"
  | "roguelike"
  | "defense"
  | "deathmatch"
  | "survival"
  | "extreme-survival"
  | "peak-challenge"
  | "flagship"
  | "flagship-peak";

/** 对局开始前自主选择的难度预设 */
export type DifficultyPreset = "easy" | "hell";

export interface DifficultyPresetConfig {
  preset: DifficultyPreset;
  /** 显示名称 */
  label: string;
  /** 威胁等级标签 */
  threatLabel: string;
  /** 难度系数倍率（相对于标准难度 1.0） */
  difficultyMultiplier: number;
  /** 敌人血量倍率 */
  enemyHealthMultiplier: number;
  /** 敌人伤害倍率 */
  enemyDamageMultiplier: number;
  /** 经验倍率 */
  xpMultiplier: number;
  /** 掉落倍率 */
  dropRateMultiplier: number;
  /** 刷怪间隔倍率（越小越快） */
  spawnIntervalMultiplier: number;
  /** 精英出现概率倍率 */
  eliteChanceMultiplier: number;
  /** 补给窗口时间(秒) */
  breakDuration: number;
  /** 简短描述 */
  description: string;
  /** 视觉强调色 */
  accentColor: string;
}

export const DIFFICULTY_PRESETS: Record<DifficultyPreset, DifficultyPresetConfig> = {
  easy: {
    preset: "easy",
    label: "标准巡航",
    threatLabel: "低",
    difficultyMultiplier: 0.6,
    enemyHealthMultiplier: 0.7,
    enemyDamageMultiplier: 0.65,
    xpMultiplier: 0.8,
    dropRateMultiplier: 0.85,
    spawnIntervalMultiplier: 1.4,
    eliteChanceMultiplier: 0.5,
    breakDuration: 30,
    description: "降低敌人强度与密度，适合熟悉操作与地图探索。",
    accentColor: "var(--success, #22c55e)",
  },
  hell: {
    preset: "hell",
    label: "地狱突入",
    threatLabel: "极高",
    difficultyMultiplier: 2.2,
    enemyHealthMultiplier: 2.0,
    enemyDamageMultiplier: 1.8,
    xpMultiplier: 2.5,
    dropRateMultiplier: 2.0,
    spawnIntervalMultiplier: 0.55,
    eliteChanceMultiplier: 2.5,
    breakDuration: 12,
    description: "敌人密度翻倍、伤害大幅提升、补给窗口缩短。仅推荐资深玩家。",
    accentColor: "var(--danger, #ef4444)",
  },
};

export type MissionType =
  | "eliminate"
  | "survive"
  | "collect"
  | "rescue"
  | "extract"
  | "defendCore"
  | "captureNodes"
  | "surviveTimer"
  | "killStreak"
  | "comboChain"
  | "bossSlay"
  | "eliteHunt"
  | "noDamage"
  | "speedClear"
  | "overclock"
  | "seasonObjective";

export type HeroId = "nitrogen" | "twilight" | "leopard" | "recon" | "viper" | "falcon" | "bastion";

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  timer: number;
  range: number;
  duration: number;
  color: string;
}

export interface Deployable {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: "shield" | "mine" | "turret" | "beacon" | "drone" | "healAura" | "freezeField" | "poisonField" | "wall" | "laserBeam";
  ownerId: string;
  health: number;
  maxHealth: number;
  timer: number;
  maxTimer: number;
  targetId?: string;
  fireTimer?: number;
  fireCooldown?: number;
  tickTimer?: number;
  tickInterval?: number;
  color: string;
}

export interface EnergyNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  captured: boolean;
  captureProgress: number;
  captureTime: number;
  energyValue: number;
  waveIndex: number;
  color: string;
}

export interface DefenseCore {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  color: string;
}

export interface DefenseWave {
  index: number;
  enemyCount: number;
  enemyVariants: EnemyVariant[];
  eliteCount: number;
  bossVariant?: string;
  nodeActivator: boolean;
  duration: number;
  // 已生成普通敌人数，避免以当前存活数计算导致无限补怪
  spawned?: number;
  // DDA 动态难度调整产生的可选参数
  enemyHealthMultiplier?: number;
  enemyDamageMultiplier?: number;
  spawnIntervalMultiplier?: number;
  speedMultiplier?: number;
  specialEventChance?: number;
}

export interface DefenseState {
  core: DefenseCore;
  nodes: EnergyNode[];
  energy: number;
  targetEnergy: number;
  currentWave: number;
  totalWaves: number;
  waveTimer: number;
  breakTimer: number;
  spawnTimer?: number;
  waveInProgress: boolean;
  waves: DefenseWave[];
  deployables: Deployable[];
  selectedHeroes: Record<string, HeroId>;
  _coreDamageAccum?: number;
}

// Fixed-wave state for non-defense modes (campaign / survival / daily / endless)
export interface FixedWaveState {
  waves: DefenseWave[];
  spawned: number;
  killed: number;
  inBreak: boolean;
  breakTimer: number;
  spawnTimer: number;
}

export interface DeathmatchScore {
  kills: number;
  deaths: number;
  damageDealt: number;
  streak: number;
  bestStreak: number;
  multiKillCount: number;
}

export type DeathmatchBotState = "idle" | "chase" | "strafe" | "flee" | "respawn";

export type DeathmatchBotTier = "rookie" | "veteran" | "elite" | "predator";

export interface DeathmatchBot {
  id: string;
  targetId: string | null;
  state: DeathmatchBotState;
  timer: number;
  respawnTimer: number;
  aimX: number;
  aimY: number;
  fireTimer: number;
  tier: DeathmatchBotTier;
  powerUpTimer: number;
  powerUpType: DeathmatchPowerUpType | null;
}

export type DeathmatchPowerUpType = "damage_boost" | "speed_boost" | "shield" | "invisibility" | "armor_boost";

export interface DeathmatchPowerUp {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: DeathmatchPowerUpType;
  duration: number;
  color: string;
}

export interface DeathmatchHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  duration: number;
  timer: number;
  color: string;
}

export interface DeathmatchState {
  scores: Record<string, DeathmatchScore>;
  scoreLimit: number;
  timeLimit: number;
  matchTimer: number;
  bots: DeathmatchBot[];
  botCount: number;
  matchEnded: boolean;
  winnerId: string | null;
  pickupTimer?: number;
  powerUps: DeathmatchPowerUp[];
  powerUpTimer: number;
  hazards: DeathmatchHazard[];
  hazardTimer: number;
  killStreakTimer: number;
  streakAnnouncements: string[];
  comboMultiplier: number;
  phase: "early" | "mid" | "late" | "sudden_death";
  suddenDeathTimer: number;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  timeLimit?: number;
  elapsed: number;
}

export type WeaponId =
  | "pulse"
  | "shotgun"
  | "laser"
  | "rocket"
  | "flame"
  | "drone"
  | "plasma"
  | "railgun"
  | "swarm"
  | "gauss"
  | "arcCaster"
  | "cryoLauncher"
  | "plasmaBlade"
  | "naniteSwarm"
  | "gravityWell"
  | "vortexCannon"
  | "seekerRifle"
  | "shardRepeater"
  | "shortBlade"
  | "spear"
  | "greatsword"
  | "gauntlet";

export interface Weapon {
  id: WeaponId;
  name: string;
  level: number;
  maxLevel: number;
  cooldown: number;
  timer: number;
  damage: number;
  range: number;
  projectileSpeed: number;
  count: number;
  spread: number;
  pierce: number;
  color: string;
  description: string;
  areaRadius?: number;
  burnDuration?: number;
  chainCount?: number;
  chainRange?: number;
  freezeDuration?: number;
  gravityRadius?: number;
  pullStrength?: number;
  homing?: boolean;
  isMelee?: boolean;
  swarmCount?: number;
  // Melee-specific shape and feel
  meleeShape?: "arc" | "thrust";
  meleeAngle?: number;
  meleeWidth?: number;
  lungeDistance?: number;
  comboCount?: number;
}

export type PassiveId =
  "maxHealth" | "speed" | "magnet" | "regen" | "armor" | "crit" | "cooldown" | "area";

export interface PassiveItem {
  id: PassiveId;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  color: string;
}

export interface Player {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  maxHealth: number;
  health: number;
  damage: number;
  level: number;
  xp: number;
  xpToNext: number;
  weapons: Weapon[];
  passives: PassiveItem[];
  invincible: number;
  magnetRange: number;
  // Derived stats from passives
  armor: number;
  critChance: number;
  cooldownReduction: number;
  areaMultiplier: number;
  regen: number;
  // Hero and skill state
  heroId: HeroId | null;
  activeSkill: HeroSkill | null;
  skillTimer: number;
  ultimateSkill: HeroSkill | null;
  ultimateTimer: number;
  // Deployable upgrade progression (talent-purchased permanent ranks)
  deployableUpgrades: Record<string, number>;
  // Hero talent levels purchased this run
  talentLevels: Record<string, number>;
  // Hero-specific transient buffs
  leopardFrenzyTimer: number;
  leopardFrenzyActive: boolean;
  leopardPounceSpeedTimer: number;
  leopardBloodlustStacks: number;
  leopardBloodlustTimer: number;
  twilightCocoonTimer: number;
  // Transient state
  knockbackX: number;
  knockbackY: number;
  burnDuration: number;
  burnDamage: number;
  // Curse/Blessing derived stats
  attackSpeed: number;
  lifesteal: number;
  skillDamageMul: number;
  critMultiplier: number;
  dashCooldown: number;
  explosionOnKill: number;
  thorns: number;
  multishotChance: number;
  periodicShield: number;
  healingReceivedMul: number;
  bloodPactDrain: number;
  rangeMul: number;
  missChance: number;
  luckPenalty: number;
  maxDashes: number;
  threatRadiusMul: number;
  // Animation / visual state
  facing: number;
  animation: SpriteAnimationState;
  animationTimer: number;
  // Cosmetic override for player sprite primary color
  skinColor?: string;
}

export type AffixId =
  | "shielded"
  | "splitting"
  | "explosive"
  | "swift"
  | "corrosive"
  | "regenerating"
  | "freezing"
  | "taunting";

export type EnemyVariant =
  | "walker"
  | "runner"
  | "tank"
  | "spitter"
  | "elite"
  | "boss"
  | "drone"
  | "sentinel"
  | "crusher"
  | "sniper"
  | "stalker"
  | "shielder"
  | "harvester"
  | "artillery"
  | "disruptor"
  | "scorcher"
  | "bomber"
  | "leech"
  | "constructor"
  | "raptor";

export type BossId =
  | "overlord"
  | "plaguebringer"
  | "titan"
  | "ravager"
  | "siren"
  | "colossus"
  | "dreadnought"
  | "juggernaut"
  | "annihilator"
  | "hive"
  | "lancer"
  | "charger"
  | "summoner"
  | "splitter"
  | "corruptor"
  | "phantom"
  | "behemoth"
  | "devourer";

export interface Affix {
  id: AffixId;
  name: string;
  description: string;
  color: string;
  apply: (enemy: Enemy) => void;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  xpValue: number;
  color: string;
  variant: EnemyVariant | BossId;
  slow: number;
  slowTimer: number;
  freezeTimer: number;
  freezeShatterDamage: number;
  droneMarkTimer: number;
  // Elite / boss properties
  isElite: boolean;
  isBoss: boolean;
  affixes: AffixId[];
  attackTimer: number;
  attackCooldown: number;
  knockbackX: number;
  knockbackY: number;
  burnDuration: number;
  burnDamage: number;
  // Hero-specific status stacks
  frostStacks: number;
  frostTimer: number;
  venomStacks: number;
  venomTimer: number;
  vulnerabilityStacks: number;
  // Boss phase
  phase: number;
  phaseThresholds: number[];
  // Mechanical / siege behavior
  targetCore: boolean;
  // Animation / visual state
  facing: number;
  animation: SpriteAnimationState;
  animationTimer: number;
}

export interface BossPhase {
  index: number;
  name: string;
  attackPattern: "single" | "spread" | "burst" | "summon" | "laser" | "charge";
  attackCooldown: number;
  projectileCount: number;
  moveSpeedMultiplier: number;
  onEnter?: (boss: Enemy, engine: unknown) => void;
}

export interface BossTemplate {
  id: string;
  name: string;
  description: string;
  radius: number;
  speed: number;
  health: number;
  damage: number;
  color: string;
  secondaryColor: string;
  phases: BossPhase[];
  phaseThresholds: number[];
  onPhaseEnter?: (boss: Enemy) => void;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  speed: number;
  color: string;
  pierce: number;
  weaponId: string;
  life: number;
  ownerId?: string;
  // Area / status effects
  areaRadius?: number;
  burnDuration?: number;
  burnDamage?: number;
  isExplosive?: boolean;
  chainCount?: number;
  chainRange?: number;
  freezeDuration?: number;
  gravityRadius?: number;
  pullStrength?: number;
  homing?: boolean;
  homingTarget?: string;
  isMelee?: boolean;
  swarmCount?: number;
  // Melee thrust projectile rendering helpers
  thrustWidth?: number;
  thrustLength?: number;
}

export interface EnemyProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  speed: number;
  color: string;
  life: number;
}

export interface Pickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: "xp" | "health" | "resource" | "chest";
  value: number;
  color: string;
  magnetized: boolean;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  isCritical?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  health: number;
  maxHealth: number;
  destructible: boolean;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  interval: number;
  timer: number;
  color: string;
  type: "acid" | "electric";
}

export type MapTheme = "industrial" | "frozen" | "biohazard" | "wasteland" | "orbital";

export interface MapConfig {
  width: number;
  height: number;
  theme: MapTheme;
  obstacles: Obstacle[];
  hazards: Hazard[];
  decors: Decor[];
}

export interface Decor {
  x: number;
  y: number;
  type: "rock" | "grass" | "debris" | "crystal" | "vent" | "crate";
  radius: number;
  color: string;
  rotation: number;
}

export type GameEventType =
  "airdrop" | "horde" | "eliteHunt" | "supply" | "empPulse" | "mechReinforcement" | "coreOverload";

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  active: boolean;
  timer: number;
  duration: number;
  x?: number;
  y?: number;
  metadata?: Record<string, unknown>;
}

export interface HeroTalent {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  category: "damage" | "skill" | "utility";
  variantFor?: "skill" | "ultimate";
  isSkillVariant?: boolean;
  modifiers: {
    damageMul?: number;
    cooldownMul?: number;
    rangeMul?: number;
    areaMul?: number;
    critAdd?: number;
    armorAdd?: number;
    regenAdd?: number;
    speedMul?: number;
    meleeDamageMul?: number;
    meleeRangeMul?: number;
    healthMul?: number;
    skillDurationMul?: number;
    deployableDamageMul?: number;
    deployableHealthMul?: number;
    deployableRangeMul?: number;
    deployableCooldownMul?: number;
    deployableDurationMul?: number;
    countAdd?: number;
  };
}

export interface InputState {
  move: Vec2;
  aim: Vec2;
  fire: boolean;
  pause: boolean;
  useSkill?: boolean;
  useUltimate?: boolean;
}

export interface GameStats {
  kills: number;
  damageDealt: number;
  damageTaken: number;
  xpCollected: number;
  resourcesCollected: number;
  timeSurvived: number;
  chestsOpened: number;
  elitesKilled: number;
  bossesKilled: number;
  wavesCleared?: number;
  score?: number;
}

export interface GameModeConfig {
  type: GameModeType;
  name: string;
  description: string;
  allowMissions: boolean;
  endless: boolean;
  dailySeed?: string;
  roguelikeStages?: RoguelikeStage[];
}

export interface RoguelikeStage {
  id: string;
  name: string;
  type: "combat" | "elite" | "boss" | "reward";
  mission: Mission;
  rewardOptions?: number;
  cleared: boolean;
}

export interface GameState {
  status: GameStatus;
  mode: GameModeType;
  modeConfig: GameModeConfig;
  seed: number;
  lastTime: number;
  time: number;
  map: MapConfig;
  camera: Camera;
  player: Player;
  players: Player[];
  enemies: Enemy[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  pickups: Pickup[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  missions: Mission[];
  currentMissionIndex: number;
  extraction: { x: number; y: number; radius: number; active: boolean } | null;
  extractionTimer: number;
  spawnTimer: number;
  eventTimer: number;
  difficulty: number;
  intensity: number;
  wave: number;
  waveTimer: number;
  stats: GameStats;
  activeEvent: GameEvent | null;
  eliteKillStreak: number;
  killCombo: { count: number; timer: number; best: number };
  roguelikeRunState?: import("./roguelike").RoguelikeRunState;
  defenseState?: DefenseState;
  fixedWaveState?: FixedWaveState;
  deathmatchState?: DeathmatchState;
  extremeSurvivalRun?: ExtremeSurvivalRun;
  peakChallengeState?: PeakChallengeState;
  flagshipState?: FlagshipState;
  flagshipPeakState?: FlagshipPeakState;
  weatherState?: WeatherState;
  curseBlessingState?: CurseBlessingState;
  selectedHero?: HeroId;
  deployables: Deployable[];
}

export type UpgradeOptionType = "weapon" | "passive" | "stat" | "heroTalent";

export interface UpgradeOption {
  id: string;
  type: UpgradeOptionType;
  targetId: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
}

export interface RunResult {
  victory: boolean;
  surrendered?: boolean;
  stats: GameStats;
  completedMissions: number;
  elapsed: number;
  mode: GameModeType;
  extremeSurvivalPhase?: "normal" | "overclock";
  peakChallengePhase?: "normal" | "overclock";
  flagshipPhase?: "prep" | "combat" | "boss" | "victory" | "defeat";
}

// Sprite / animation types
export type SpriteAnimationState =
  | "idle"
  | "move"
  | "attack"
  | "hit"
  | "death"
  | "charge"
  | "stun"
  | "deploy"
  | "recoil"
  | "overheat";

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  id: string;
  image: HTMLImageElement | null;
  dataUri: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<SpriteAnimationState, SpriteFrame[]>;
}

export interface RenderableEntity {
  x: number;
  y: number;
  radius: number;
  facing: number;
  animation: SpriteAnimationState;
  animationTimer: number;
  color?: string;
}

// Networking types are re-exported from @/lib/network/types

export interface PeakChallengeTask {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  rewardCurrency: number;
}

export interface PeakChallengeState {
  phase: "normal" | "overclock";
  wave: number;
  challenges: PeakChallengeTask[];
  pendingRewards: UpgradeOption[] | null;
  rewardBranchOffered: boolean;
  seasonXp: number;
  seasonCurrency: number;
  overclockUnlocked: boolean;
  seasonRank: PeakSeasonRank;
  bossRushWave: boolean;
  challengeStreak: number;
  perfectWaves: number;
  totalScore: number;
}

export type PeakSeasonRank = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "grandmaster";

export interface FlagshipChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardScore: number;
}

export interface FlagshipState {
  phase: "prep" | "combat" | "boss" | "victory" | "defeat";
  wave: number;
  totalWaves: number;
  challenges: FlagshipChallenge[];
  score: number;
  combos: number;
  maxCombo: number;
  bossKills: number;
  eliteKills: number;
  coreHealth: number;
  coreMaxHealth: number;
  timeAttackScore: number;
  perfectWaves: number;
  teamComboMultiplier: number;
  speedRank: FlagshipSpeedRank;
  waveClearTimes: number[];
  comboBreakerCount: number;
}

export type FlagshipSpeedRank = "none" | "bronze" | "silver" | "gold" | "platinum" | "diamond";

// ========================================================================
// 旗舰巅峰统一模式 (Flagship Peak)
// 三阶段25波：标准巡航(1-10) → 超频增压(11-20) → 地狱终局(21-25)
// 双轨挑战 + 双维度评级 + 统一积分制
// ========================================================================

export type FlagshipPeakPhase = "standard" | "overclock" | "hell" | "victory" | "defeat";

export interface FlagshipPeakChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardScore: number;
  category: "fixed" | "dynamic";
}

export interface FlagshipPeakTask {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardScore: number;
  /** 仅在指定阶段生效 */
  phase?: FlagshipPeakPhase;
}

export interface FlagshipPeakState {
  phase: FlagshipPeakPhase;
  wave: number;
  totalWaves: number;
  /** 固定挑战（每5波刷新） */
  challenges: FlagshipPeakChallenge[];
  /** 动态任务（超频阶段追加） */
  tasks: FlagshipPeakTask[];
  /** 统一积分 */
  score: number;
  combos: number;
  maxCombo: number;
  bossKills: number;
  eliteKills: number;
  coreHealth: number;
  coreMaxHealth: number;
  /** 速度评级分数 */
  timeAttackScore: number;
  perfectWaves: number;
  /** 速度评级（每波结算） */
  speedRank: FlagshipSpeedRank;
  /** 赛季段位（累计积分） */
  seasonRank: PeakSeasonRank;
  seasonXp: number;
  waveClearTimes: number[];
  comboBreakerCount: number;
  /** 挑战连胜 */
  challengeStreak: number;
  /** 赛季货币 */
  seasonCurrency: number;
}

export interface SerializedGameState {
  status: GameStatus;
  mode: GameModeType;
  seed: number;
  time: number;
  map: MapConfig;
  player: Player;
  players: Player[];
  enemies: Enemy[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  pickups: Pickup[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  missions: Mission[];
  currentMissionIndex: number;
  extraction: { x: number; y: number; radius: number; active: boolean } | null;
  extractionTimer: number;
  spawnTimer: number;
  eventTimer: number;
  difficulty: number;
  intensity: number;
  wave: number;
  waveTimer: number;
  stats: GameStats;
  activeEvent: GameEvent | null;
  waveEnemiesRemaining: number;
  eliteKillStreak: number;
  killCombo: { count: number; timer: number; best: number };
  roguelikeRunState?: import("./roguelike").RoguelikeRunState;
  defenseState?: DefenseState;
  fixedWaveState?: FixedWaveState;
  deathmatchState?: DeathmatchState;
  extremeSurvivalRun?: ExtremeSurvivalRun;
  peakChallengeState?: PeakChallengeState;
  flagshipState?: FlagshipState;
  flagshipPeakState?: FlagshipPeakState;
  weatherState?: WeatherState;
  curseBlessingState?: CurseBlessingState;
  selectedHero?: HeroId;
  deployables: Deployable[];
}

// Season / Battle Pass types for 2.0
export type SeasonRewardType = "skin" | "currency" | "emote" | "badge" | "convenience" | "heroUnlock";

export interface SeasonReward {
  id: string;
  level: number;
  type: SeasonRewardType;
  name: string;
  description: string;
  icon?: string;
  free: boolean;
  premium: boolean;
  unlocked: boolean;
  claimed: boolean;
}

export type SeasonMissionCategory = "daily" | "weekly" | "season";

export interface SeasonMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  resetWeekly: boolean;
  category: SeasonMissionCategory;
}

export interface SeasonState {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  currentLevel: number;
  currentXp: number;
  xpToNext: number;
  premiumUnlocked: boolean;
  rewards: SeasonReward[];
  missions: SeasonMission[];
  seasonCurrency: number;
}

export interface SeasonShopItem {
  id: string;
  name: string;
  type: SeasonRewardType;
  description: string;
  cost: number;
  available: boolean;
  unlockLevel?: number;
}

export interface PlayerProgression {
  unlockedHeroes: HeroId[];
  ownedSkins: string[];
  ownedEmotes: string[];
  seasonCurrency: number;
  premiumCurrency: number;
  seasonStates: SeasonState[];
}
