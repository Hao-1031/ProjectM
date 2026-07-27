// Delta state synchronization
// Reduces bandwidth by sending only changed fields instead of full state snapshots

import type { SerializedGameState, Player, Enemy, Projectile, Pickup } from "@/lib/game/types";

export type DeltaType = "full" | "delta";

export interface PlayerDelta {
  x?: number;
  y?: number;
  health?: number;
  maxHealth?: number;
  level?: number;
  xp?: number;
  speed?: number;
  damage?: number;
  armor?: number;
}

export interface EnemyDelta {
  id: string;
  x?: number;
  y?: number;
  health?: number;
  maxHealth?: number;
  speed?: number;
  slow?: number;
  burnDuration?: number;
  removed?: boolean;
}

export interface ProjectileDelta {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  removed?: boolean;
}

export interface PickupDelta {
  id: string;
  removed?: boolean;
}

export interface DeltaMessage {
  type: DeltaType;
  frame: number;
  timestamp: number;
  playerDelta?: PlayerDelta;
  enemyDeltas: EnemyDelta[];
  projectileDeltas: ProjectileDelta[];
  pickupDeltas: PickupDelta[];
  wave?: number;
  difficulty?: number;
  stats?: Partial<SerializedGameState["stats"]>;
}

export interface DeltaSnapshot {
  frame: number;
  player: { x: number; y: number; health: number };
  enemies: Map<string, { x: number; y: number; health: number }>;
  projectiles: Map<string, { x: number; y: number }>;
  pickups: Set<string>;
}

const POSITION_THRESHOLD = 0.5;
const HEALTH_THRESHOLD = 1;

export class DeltaEncoder {
  private lastSnapshot: DeltaSnapshot | null = null;
  private frameCounter = 0;
  private fullStateInterval: number;

  constructor(fullStateInterval = 30) {
    this.fullStateInterval = fullStateInterval;
  }

  encode(state: SerializedGameState): DeltaMessage {
    this.frameCounter++;

    const shouldSendFull = this.frameCounter % this.fullStateInterval === 0;

    if (shouldSendFull || !this.lastSnapshot) {
      this.lastSnapshot = this.createSnapshot(state);
      return {
        type: "full",
        frame: this.frameCounter,
        timestamp: Date.now(),
        enemyDeltas: state.enemies.map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          health: e.health,
          maxHealth: e.maxHealth,
          speed: e.speed,
        })),
        projectileDeltas: state.projectiles.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
        })),
        pickupDeltas: state.pickups.map((p) => ({
          id: p.id,
        })),
        wave: state.wave,
        difficulty: state.difficulty,
        stats: state.stats,
      };
    }

    const current = this.createSnapshot(state);
    const prev = this.lastSnapshot;
    const delta = this.computeDelta(prev, current, state);

    this.lastSnapshot = current;

    return {
      ...delta,
      type: "delta",
      frame: this.frameCounter,
      timestamp: Date.now(),
    };
  }

  private createSnapshot(state: SerializedGameState): DeltaSnapshot {
    const enemies = new Map<string, { x: number; y: number; health: number }>();
    for (const e of state.enemies) {
      enemies.set(e.id, { x: e.x, y: e.y, health: e.health });
    }

    const projectiles = new Map<string, { x: number; y: number }>();
    for (const p of state.projectiles) {
      projectiles.set(p.id, { x: p.x, y: p.y });
    }

    const pickups = new Set(state.pickups.map((p) => p.id));

    return {
      frame: this.frameCounter,
      player: { x: state.player.x, y: state.player.y, health: state.player.health },
      enemies,
      projectiles,
      pickups,
    };
  }

  private computeDelta(
    prev: DeltaSnapshot,
    current: DeltaSnapshot,
    state: SerializedGameState
  ): Omit<DeltaMessage, "type" | "frame" | "timestamp"> {
    const playerDelta: PlayerDelta = {};
    if (Math.abs(current.player.x - prev.player.x) > POSITION_THRESHOLD) {
      playerDelta.x = state.player.x;
    }
    if (Math.abs(current.player.y - prev.player.y) > POSITION_THRESHOLD) {
      playerDelta.y = state.player.y;
    }
    if (Math.abs(current.player.health - prev.player.health) > HEALTH_THRESHOLD) {
      playerDelta.health = state.player.health;
      playerDelta.maxHealth = state.player.maxHealth;
    }

    const enemyDeltas: EnemyDelta[] = [];
    for (const e of state.enemies) {
      const prevEnemy = prev.enemies.get(e.id);
      if (!prevEnemy) {
        enemyDeltas.push({
          id: e.id,
          x: e.x,
          y: e.y,
          health: e.health,
          maxHealth: e.maxHealth,
          speed: e.speed,
        });
        continue;
      }
      const delta: EnemyDelta = { id: e.id };
      if (Math.abs(e.x - prevEnemy.x) > POSITION_THRESHOLD) delta.x = e.x;
      if (Math.abs(e.y - prevEnemy.y) > POSITION_THRESHOLD) delta.y = e.y;
      if (Math.abs(e.health - prevEnemy.health) > HEALTH_THRESHOLD) {
        delta.health = e.health;
        delta.maxHealth = e.maxHealth;
      }
      if (Object.keys(delta).length > 1) {
        enemyDeltas.push(delta);
      }
    }

    for (const [id] of prev.enemies) {
      if (!current.enemies.has(id)) {
        enemyDeltas.push({ id, removed: true });
      }
    }

    const projectileDeltas: ProjectileDelta[] = [];
    for (const p of state.projectiles) {
      if (!prev.projectiles.has(p.id)) {
        projectileDeltas.push({ id: p.id, x: p.x, y: p.y, vx: p.vx, vy: p.vy });
      }
    }
    for (const [id] of prev.projectiles) {
      if (!current.projectiles.has(id)) {
        projectileDeltas.push({ id, removed: true });
      }
    }

    const pickupDeltas: PickupDelta[] = [];
    for (const p of state.pickups) {
      if (!prev.pickups.has(p.id)) {
        pickupDeltas.push({ id: p.id });
      }
    }
    for (const id of prev.pickups) {
      if (!current.pickups.has(id)) {
        pickupDeltas.push({ id, removed: true });
      }
    }

    return { playerDelta, enemyDeltas, projectileDeltas, pickupDeltas };
  }

  reset(): void {
    this.lastSnapshot = null;
    this.frameCounter = 0;
  }
}

export class DeltaDecoder {
  private baseState: SerializedGameState | null = null;

  apply(message: DeltaMessage): SerializedGameState | null {
    if (message.type === "full") {
      this.baseState = this.buildFullState(message);
      return this.baseState;
    }

    if (!this.baseState) return null;

    const state = { ...this.baseState };

    if (message.playerDelta) {
      const pd = message.playerDelta;
      state.player = {
        ...state.player,
        ...(pd.x !== undefined && { x: pd.x }),
        ...(pd.y !== undefined && { y: pd.y }),
        ...(pd.health !== undefined && { health: pd.health }),
        ...(pd.maxHealth !== undefined && { maxHealth: pd.maxHealth }),
        ...(pd.level !== undefined && { level: pd.level }),
        ...(pd.xp !== undefined && { xp: pd.xp }),
        ...(pd.speed !== undefined && { speed: pd.speed }),
        ...(pd.damage !== undefined && { damage: pd.damage }),
        ...(pd.armor !== undefined && { armor: pd.armor }),
      };
    }

    for (const ed of message.enemyDeltas) {
      if (ed.removed) {
        state.enemies = state.enemies.filter((e) => e.id !== ed.id);
        continue;
      }
      const idx = state.enemies.findIndex((e) => e.id === ed.id);
      if (idx >= 0) {
        state.enemies[idx] = {
          ...state.enemies[idx],
          ...(ed.x !== undefined && { x: ed.x }),
          ...(ed.y !== undefined && { y: ed.y }),
          ...(ed.health !== undefined && { health: ed.health }),
          ...(ed.maxHealth !== undefined && { maxHealth: ed.maxHealth }),
          ...(ed.speed !== undefined && { speed: ed.speed }),
          ...(ed.slow !== undefined && { slow: ed.slow }),
          ...(ed.burnDuration !== undefined && { burnDuration: ed.burnDuration }),
        };
      } else {
        state.enemies.push({
          id: ed.id,
          x: ed.x ?? 0,
          y: ed.y ?? 0,
          radius: 12,
          speed: ed.speed ?? 120,
          health: ed.health ?? 50,
          maxHealth: ed.maxHealth ?? 50,
          damage: 10,
          xpValue: 10,
          color: "#ff4444",
          variant: "walker",
          slow: ed.slow ?? 0,
          slowTimer: 0,
          freezeTimer: 0,
          freezeShatterDamage: 0,
          droneMarkTimer: 0,
          isElite: false,
          isBoss: false,
          affixes: [],
          attackTimer: 0,
          attackCooldown: 0,
          knockbackX: 0,
          knockbackY: 0,
          burnDuration: ed.burnDuration ?? 0,
          burnDamage: 0,
          frostStacks: 0,
          frostTimer: 0,
          venomStacks: 0,
          venomTimer: 0,
          vulnerabilityStacks: 0,
          phase: 0,
          phaseThresholds: [],
          targetCore: false,
          facing: 0,
          animation: "idle",
          animationTimer: 0,
        });
      }
    }

    for (const pd of message.projectileDeltas) {
      if (pd.removed) {
        state.projectiles = state.projectiles.filter((p) => p.id !== pd.id);
        continue;
      }
      const idx = state.projectiles.findIndex((p) => p.id === pd.id);
      if (idx >= 0) {
        state.projectiles[idx] = {
          ...state.projectiles[idx],
          ...(pd.x !== undefined && { x: pd.x }),
          ...(pd.y !== undefined && { y: pd.y }),
          ...(pd.vx !== undefined && { vx: pd.vx }),
          ...(pd.vy !== undefined && { vy: pd.vy }),
        };
      }
    }

    for (const pd of message.pickupDeltas) {
      if (pd.removed) {
        state.pickups = state.pickups.filter((p) => p.id !== pd.id);
      }
    }

    if (message.wave !== undefined) state.wave = message.wave;
    if (message.difficulty !== undefined) state.difficulty = message.difficulty;
    if (message.stats) {
      state.stats = { ...state.stats, ...message.stats };
    }

    this.baseState = state;
    return state;
  }

  private buildFullState(message: DeltaMessage): SerializedGameState {
    return {
      status: "running",
      mode: "campaign",
      seed: 0,
      time: 0,
      map: { width: 2400, height: 1800, theme: "industrial", obstacles: [], hazards: [], decors: [] },
      player: {
        id: "player",
        x: message.playerDelta?.x ?? 0,
        y: message.playerDelta?.y ?? 0,
        radius: 14,
        speed: 260,
        maxHealth: message.playerDelta?.maxHealth ?? 100,
        health: message.playerDelta?.health ?? 100,
        damage: message.playerDelta?.damage ?? 10,
        level: message.playerDelta?.level ?? 1,
        xp: 0,
        xpToNext: 50,
        weapons: [],
        passives: [],
        invincible: 0,
        magnetRange: 120,
        armor: message.playerDelta?.armor ?? 0,
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
      },
      players: [],
      enemies: message.enemyDeltas
        .filter((e) => !e.removed)
        .map((e) => ({
          id: e.id,
          x: e.x ?? 0,
          y: e.y ?? 0,
          radius: 12,
          speed: e.speed ?? 120,
          health: e.health ?? 50,
          maxHealth: e.maxHealth ?? 50,
          damage: 10,
          xpValue: 10,
          color: "#ff4444",
          variant: "walker" as const,
          slow: 0,
          slowTimer: 0,
          freezeTimer: 0,
          freezeShatterDamage: 0,
          droneMarkTimer: 0,
          isElite: false,
          isBoss: false,
          affixes: [],
          attackTimer: 0,
          attackCooldown: 0,
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
          phaseThresholds: [],
          targetCore: false,
          facing: 0,
          animation: "idle" as const,
          animationTimer: 0,
        })),
      projectiles: [],
      enemyProjectiles: [],
      pickups: [],
      particles: [],
      damageNumbers: [],
      missions: [],
      currentMissionIndex: 0,
      extraction: null,
      extractionTimer: 0,
      spawnTimer: 0,
      eventTimer: 0,
      difficulty: message.difficulty ?? 1,
      intensity: 1,
      wave: message.wave ?? 0,
      waveTimer: 0,
      stats: {
        kills: message.stats?.kills ?? 0,
        damageDealt: message.stats?.damageDealt ?? 0,
        damageTaken: message.stats?.damageTaken ?? 0,
        xpCollected: message.stats?.xpCollected ?? 0,
        resourcesCollected: message.stats?.resourcesCollected ?? 0,
        timeSurvived: message.stats?.timeSurvived ?? 0,
        chestsOpened: message.stats?.chestsOpened ?? 0,
        elitesKilled: message.stats?.elitesKilled ?? 0,
        bossesKilled: message.stats?.bossesKilled ?? 0,
      },
      activeEvent: null,
      waveEnemiesRemaining: 0,
      eliteKillStreak: 0,
      killCombo: { count: 0, timer: 0, best: 0 },
      deployables: [],
    };
  }

  reset(): void {
    this.baseState = null;
  }
}