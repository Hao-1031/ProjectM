import type { DefenseState, DefenseCore, EnergyNode, DefenseWave, EnemyVariant, MapConfig, Obstacle } from "./types";
import { uid, randomRange, randomPointInBounds, distance, rectOverlap } from "./math";

const DEFENSE_MAP_WIDTH = 2200;
const DEFENSE_MAP_HEIGHT = 1600;
const CORE_RADIUS = 60;
const NODE_RADIUS = 45;
const NODE_CAPTURE_TIME = 4;

const MECH_VARIANTS: EnemyVariant[] = ["drone", "sentinel", "crusher", "sniper"];

export function createDefenseMap(seed: number): MapConfig {
  const obstacles: Obstacle[] = [];
  const rng = seededRandom(seed);

  const coreX = DEFENSE_MAP_WIDTH / 2;
  const coreY = DEFENSE_MAP_HEIGHT / 2;
  const minPlayerPassage = 60;

  // Core perimeter walls
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 160 + rng() * 40;
    const w = 60 + rng() * 80;
    const h = 24 + rng() * 30;
    const x = coreX + Math.cos(angle) * dist;
    const y = coreY + Math.sin(angle) * dist;
    const wall: Obstacle = {
      id: uid("obs"),
      x,
      y,
      width: w,
      height: h,
      color: "#1c2033",
      health: 400,
      maxHealth: 400,
      destructible: true,
    };

    // Skip wall if it overlaps an existing one; keeps core ring passable.
    if (!obstacles.some((o) => rectOverlap(wall, o, minPlayerPassage))) {
      obstacles.push(wall);
    }
  }

  // Scattered cover
  for (let i = 0; i < 16; i++) {
    let pos = randomPointInBounds(DEFENSE_MAP_WIDTH, DEFENSE_MAP_HEIGHT, 200);
    let attempts = 0;
    while (
      attempts < 20 &&
      (distance(pos, { x: coreX, y: coreY }) < 260 ||
        obstacles.some((o) =>
          rectOverlap(
            { x: pos.x, y: pos.y, width: randomRange(40, 120), height: randomRange(40, 120) },
            o,
            minPlayerPassage
          )
        ))
    ) {
      pos = randomPointInBounds(DEFENSE_MAP_WIDTH, DEFENSE_MAP_HEIGHT, 200);
      attempts++;
    }

    if (distance(pos, { x: coreX, y: coreY }) < 220) continue;

    const cover: Obstacle = {
      id: uid("obs"),
      x: pos.x,
      y: pos.y,
      width: randomRange(40, 120),
      height: randomRange(40, 120),
      color: "#1c2033",
      health: 300,
      maxHealth: 300,
      destructible: true,
    };

    if (!obstacles.some((o) => rectOverlap(cover, o, minPlayerPassage))) {
      obstacles.push(cover);
    }
  }

  return {
    width: DEFENSE_MAP_WIDTH,
    height: DEFENSE_MAP_HEIGHT,
    theme: "industrial",
    obstacles,
    hazards: [],
  };
}

export function createDefenseCore(): DefenseCore {
  return {
    x: DEFENSE_MAP_WIDTH / 2,
    y: DEFENSE_MAP_HEIGHT / 2,
    radius: CORE_RADIUS,
    health: 5000,
    maxHealth: 5000,
    color: "#22d3ee",
  };
}

export function generateDefenseNodes(seed: number): EnergyNode[] {
  const rng = seededRandom(seed);
  const nodes: EnergyNode[] = [];
  const coreX = DEFENSE_MAP_WIDTH / 2;
  const coreY = DEFENSE_MAP_HEIGHT / 2;
  const waveCount = 8;

  for (let wave = 0; wave < waveCount; wave++) {
    const angle = rng() * Math.PI * 2;
    const minDist = 380 + wave * 80;
    const maxDist = minDist + 160;
    const dist = minDist + rng() * (maxDist - minDist);
    let x = coreX + Math.cos(angle) * dist;
    let y = coreY + Math.sin(angle) * dist;
    x = Math.max(120, Math.min(DEFENSE_MAP_WIDTH - 120, x));
    y = Math.max(120, Math.min(DEFENSE_MAP_HEIGHT - 120, y));

    nodes.push({
      id: uid("node"),
      x,
      y,
      radius: NODE_RADIUS,
      active: false,
      captured: false,
      captureProgress: 0,
      captureTime: NODE_CAPTURE_TIME,
      energyValue: 150 + wave * 30,
      waveIndex: wave,
      color: "#f59e0b",
    });
  }
  return nodes;
}

export function generateDefenseWaves(seed: number): DefenseWave[] {
  const rng = seededRandom(seed);
  const waves: DefenseWave[] = [];
  const totalWaves = 8;

  for (let i = 0; i < totalWaves; i++) {
    const baseCount = 12 + i * 4;
    const eliteCount = Math.min(3, Math.floor(i / 2));
    waves.push({
      index: i,
      enemyCount: baseCount,
      enemyVariants: MECH_VARIANTS,
      eliteCount,
      bossVariant: i === totalWaves - 1 ? "colossus" : undefined,
      nodeActivator: true,
      duration: 35 + i * 3,
    });
  }
  return waves;
}

export function createDefenseState(seed: number): DefenseState {
  return {
    core: createDefenseCore(),
    nodes: generateDefenseNodes(seed),
    energy: 0,
    targetEnergy: 1200,
    currentWave: 0,
    totalWaves: 8,
    waveTimer: 0,
    breakTimer: 0,
    waveInProgress: false,
    waves: generateDefenseWaves(seed),
    deployables: [],
    selectedHeroes: {},
  };
}

export function activateNodeForWave(state: DefenseState, waveIndex: number): void {
  for (const node of state.nodes) {
    if (node.waveIndex === waveIndex) {
      node.active = true;
      node.captured = false;
      node.captureProgress = 0;
    }
  }
}

export function getActiveNode(state: DefenseState): EnergyNode | null {
  return state.nodes.find((n) => n.active && !n.captured) ?? null;
}

export function getCapturedNodeCount(state: DefenseState): number {
  return state.nodes.filter((n) => n.captured).length;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
