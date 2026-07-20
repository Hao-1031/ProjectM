import type { NetworkRole, NetworkMessage, NetworkPlayer, GameRoom } from "@/lib/network/types";

export type { NetworkRole, NetworkMessage, NetworkPlayer, GameRoom };

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
  "idle" | "running" | "paused" | "levelup" | "reward" | "victory" | "defeat";

export type GameModeType =
  | "campaign"
  | "endless"
  | "daily"
  | "roguelike"
  | "defense"
  | "deathmatch"
  | "survival";

export type MissionType =
  | "eliminate"
  | "survive"
  | "collect"
  | "rescue"
  | "extract"
  | "defendCore"
  | "captureNodes"
  | "surviveTimer";

export type HeroId = "nitrogen" | "twilight" | "leopard" | "recon";

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
  type: "shield" | "mine" | "turret" | "beacon" | "drone" | "healAura" | "freezeField";
  ownerId: string;
  health: number;
  maxHealth: number;
  timer: number;
  maxTimer: number;
  targetId?: string;
  fireTimer?: number;
  fireCooldown?: number;
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
}

export interface DeathmatchScore {
  kills: number;
  deaths: number;
  damageDealt: number;
}

export type DeathmatchBotState = "idle" | "chase" | "strafe" | "flee" | "respawn";

export interface DeathmatchBot {
  id: string;
  targetId: string | null;
  state: DeathmatchBotState;
  timer: number;
  respawnTimer: number;
  aimX: number;
  aimY: number;
  fireTimer: number;
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
  | "shardRepeater";

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
  leopardBloodlustStacks: number;
  leopardBloodlustTimer: number;
  // Transient state
  knockbackX: number;
  knockbackY: number;
  burnDuration: number;
  burnDamage: number;
  // Animation / visual state
  facing: number;
  animation: SpriteAnimationState;
  animationTimer: number;
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
  | "hive";

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
    healthMul?: number;
    skillDurationMul?: number;
    deployableDamageMul?: number;
    deployableHealthMul?: number;
    deployableRangeMul?: number;
    deployableCooldownMul?: number;
    deployableDurationMul?: number;
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
  deathmatchState?: DeathmatchState;
  selectedHero?: HeroId;
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
  deathmatchState?: DeathmatchState;
  selectedHero?: HeroId;
}
