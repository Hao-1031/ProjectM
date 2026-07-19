import type { Mission, GameState, MapConfig, MissionType } from "./types";
import { uid, randomRange, clamp } from "./math";

// =======================================================================
// 任务模板
// =======================================================================

const CAMPAIGN_TEMPLATES: Omit<Mission, "id" | "progress" | "completed" | "elapsed">[] = [
  {
    type: "eliminate",
    title: "清剿感染者",
    description: "消灭 30 个感染者",
    target: 30,
  },
  {
    type: "survive",
    title: "坚守阵地",
    description: "存活 60 秒",
    target: 60,
    timeLimit: 70,
  },
  {
    type: "collect",
    title: "资源回收",
    description: "收集 15 个资源箱",
    target: 15,
  },
  {
    type: "rescue",
    title: "营救信号",
    description: "抵达信标并防守 30 秒",
    target: 30,
    timeLimit: 45,
  },
];

const DEFENSE_TEMPLATES: Omit<Mission, "id" | "progress" | "completed" | "elapsed">[] = [
  {
    type: "defendCore",
    title: "核心防线",
    description: "核心生命值保持在 60% 以上完成第 3 波",
    target: 3,
  },
  {
    type: "captureNodes",
    title: "节点扩张",
    description: "占领 3 个能量节点",
    target: 3,
  },
  {
    type: "surviveTimer",
    title: "极限坚守",
    description: "在核心存活的前提下坚守 90 秒",
    target: 90,
    timeLimit: 120,
  },
];

// =======================================================================
// 任务生成
// =======================================================================

export function generateMissions(): Mission[] {
  return CAMPAIGN_TEMPLATES.map((template) => ({
    ...template,
    id: uid("mission"),
    progress: 0,
    completed: false,
    elapsed: 0,
  }));
}

export function generateCampaignMissions(): Mission[] {
  return generateMissions();
}

export function generateDefenseMissions(seed?: number): Mission[] {
  const templates = [...DEFENSE_TEMPLATES];
  if (seed) {
    const rng = seededRandom(seed);
    for (let i = templates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [templates[i], templates[j]] = [templates[j], templates[i]];
    }
  }
  return templates.map((template) => ({
    ...template,
    id: uid("mission"),
    progress: 0,
    completed: false,
    elapsed: 0,
  }));
}

export function generateEndlessMissions(wave: number): Mission[] {
  return [
    {
      id: "endless_survive",
      type: "survive",
      title: "坚守",
      description: `在无尽感染潮中存活 ${120 + wave * 30} 秒`,
      target: 120 + wave * 30,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function createMission(
  type: MissionType,
  title: string,
  description: string,
  target: number,
  timeLimit?: number
): Mission {
  return {
    id: uid("mission"),
    type,
    title,
    description,
    target,
    progress: 0,
    completed: false,
    elapsed: 0,
    timeLimit,
  };
}

// =======================================================================
// 任务进度更新
// =======================================================================

export function getCurrentMission(state: GameState): Mission | null {
  return state.missions[state.currentMissionIndex] ?? null;
}

export function updateMissions(state: GameState, dt: number): GameState {
  const current = getCurrentMission(state);
  if (!current || current.completed) return state;

  current.elapsed += dt;

  if (current.type === "survive" || current.type === "surviveTimer") {
    current.progress = clamp(current.elapsed, 0, current.target);
  }

  if (current.type === "rescue") {
    const player = state.player;
    const beacon = state.extraction;
    if (beacon) {
      const dx = player.x - beacon.x;
      const dy = player.y - beacon.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= beacon.radius * beacon.radius) {
        current.progress = clamp(current.progress + dt, 0, current.target);
      }
    }
  }

  if (current.type === "defendCore") {
    updateDefendCoreMission(state, current, dt);
  }

  if (current.type === "captureNodes") {
    updateCaptureNodesMission(state, current);
  }

  // Fail if time limit exceeded (only for timed missions)
  if (
    current.timeLimit &&
    current.elapsed >= current.timeLimit &&
    current.progress < current.target
  ) {
    state.status = "defeat";
  }

  if (current.progress >= current.target && !current.completed) {
    current.completed = true;
    current.progress = current.target;
  }

  return state;
}

function updateDefendCoreMission(state: GameState, mission: Mission, dt: number): void {
  const ds = state.defenseState;
  if (!ds) return;

  const coreHealthRatio = ds.core.health / ds.core.maxHealth;
  const requiredRatio = 0.6;

  if (coreHealthRatio < requiredRatio) {
    // Reset progress if core drops below threshold
    mission.progress = 0;
    mission.elapsed = Math.min(mission.elapsed, dt);
    return;
  }

  if (ds.currentWave > 0 && ds.waveInProgress === false) {
    // Count completed waves while core is healthy
    mission.progress = clamp(ds.currentWave, 0, mission.target);
  }
}

function updateCaptureNodesMission(state: GameState, mission: Mission): void {
  const ds = state.defenseState;
  if (!ds) return;
  const captured = ds.nodes.filter((n) => n.captured).length;
  mission.progress = clamp(captured, 0, mission.target);
}

// =======================================================================
// 撤离点
// =======================================================================

export function createExtractionPoint(map: MapConfig, playerPos?: { x: number; y: number }) {
  let x = randomRange(map.width * 0.2, map.width * 0.8);
  let y = randomRange(map.height * 0.2, map.height * 0.8);
  if (playerPos) {
    // Ensure extraction is a reasonable distance away
    let attempts = 0;
    while (Math.hypot(x - playerPos.x, y - playerPos.y) < 400 && attempts < 20) {
      x = randomRange(map.width * 0.2, map.width * 0.8);
      y = randomRange(map.height * 0.2, map.height * 0.8);
      attempts++;
    }
  }
  return { x, y, radius: 70, active: true };
}

export function advanceMission(state: GameState): GameState {
  const current = getCurrentMission(state);
  if (current && current.completed) {
    state.currentMissionIndex += 1;
    if (state.currentMissionIndex >= state.missions.length) {
      // Final extraction
      state.extraction = createExtractionPoint(state.map, state.player);
      state.extractionTimer = 30;
    } else {
      // Reset extraction to act as mission beacon for rescue missions
      const next = state.missions[state.currentMissionIndex];
      if (next.type === "rescue") {
        state.extraction = createExtractionPoint(state.map, state.player);
      }
    }
  }
  return state;
}

// =======================================================================
// 统计追踪
// =======================================================================

export function addKill(state: GameState, count = 1): GameState {
  const current = getCurrentMission(state);
  if (current && current.type === "eliminate" && !current.completed) {
    current.progress = clamp(current.progress + count, 0, current.target);
  }
  state.stats.kills += count;
  return state;
}

export function addResource(state: GameState, count = 1): GameState {
  const current = getCurrentMission(state);
  if (current && current.type === "collect" && !current.completed) {
    current.progress = clamp(current.progress + count, 0, current.target);
  }
  state.stats.resourcesCollected += count;
  return state;
}

export function addNodeCapture(state: GameState, count = 1): GameState {
  const current = getCurrentMission(state);
  if (current && current.type === "captureNodes" && !current.completed) {
    current.progress = clamp(current.progress + count, 0, current.target);
  }
  return state;
}

// =======================================================================
// 任务奖励
// =======================================================================

export interface MissionReward {
  xp: number;
  resources: number;
  energy: number;
  score: number;
}

export function calculateMissionReward(mission: Mission, difficulty: number): MissionReward {
  const baseXp = 80;
  const baseResources = 5;
  const baseEnergy = 0;
  const baseScore = 200;

  const difficultyMul = 1 + (difficulty - 1) * 0.1;

  switch (mission.type) {
    case "eliminate":
      return {
        xp: Math.floor(baseXp * 0.8 * difficultyMul),
        resources: Math.floor(baseResources * 0.8),
        energy: 0,
        score: Math.floor(baseScore * 0.9),
      };
    case "survive":
    case "surviveTimer":
      return {
        xp: Math.floor(baseXp * difficultyMul),
        resources: baseResources,
        energy: 0,
        score: Math.floor(baseScore * 1.1),
      };
    case "collect":
      return {
        xp: Math.floor(baseXp * 0.7 * difficultyMul),
        resources: Math.floor(baseResources * 1.5),
        energy: 0,
        score: Math.floor(baseScore * 0.8),
      };
    case "rescue":
      return {
        xp: Math.floor(baseXp * 1.2 * difficultyMul),
        resources: Math.floor(baseResources * 1.2),
        energy: 0,
        score: Math.floor(baseScore * 1.3),
      };
    case "defendCore":
      return {
        xp: Math.floor(baseXp * 1.3 * difficultyMul),
        resources: Math.floor(baseResources * 1.4),
        energy: Math.floor(120 * difficultyMul),
        score: Math.floor(baseScore * 1.4),
      };
    case "captureNodes":
      return {
        xp: Math.floor(baseXp * 1.1 * difficultyMul),
        resources: Math.floor(baseResources * 1.1),
        energy: Math.floor(80 * difficultyMul),
        score: Math.floor(baseScore * 1.2),
      };
    case "extract":
      return {
        xp: Math.floor(baseXp * 1.5 * difficultyMul),
        resources: Math.floor(baseResources * 2),
        energy: 0,
        score: Math.floor(baseScore * 1.5),
      };
    default:
      return {
        xp: Math.floor(baseXp * difficultyMul),
        resources: baseResources,
        energy: baseEnergy,
        score: baseScore,
      };
  }
}

export function grantMissionReward(state: GameState, reward: MissionReward): void {
  state.player.xp += reward.xp;
  state.stats.xpCollected += reward.xp;
  state.stats.resourcesCollected += reward.resources;
  state.stats.score = (state.stats.score ?? 0) + reward.score;
  if (state.defenseState && reward.energy > 0) {
    state.defenseState.energy += reward.energy;
  }
}

export function grantCurrentMissionReward(state: GameState): MissionReward | null {
  const current = getCurrentMission(state);
  if (!current || !current.completed) return null;
  const reward = calculateMissionReward(current, state.difficulty);
  grantMissionReward(state, reward);
  return reward;
}

export function calculateDefenseCompletionRewards(state: GameState): MissionReward {
  const ds = state.defenseState;
  if (!ds) {
    return { xp: 0, resources: 0, energy: 0, score: 0 };
  }

  const coreHealthRatio = ds.core.health / ds.core.maxHealth;
  const capturedNodes = ds.nodes.filter((n) => n.captured).length;
  const totalWaves = ds.totalWaves;
  const completedWaves = ds.currentWave;

  const baseXp = 300;
  const baseResources = 20;
  const baseScore = 1000;

  const coreBonus = coreHealthRatio > 0.75 ? 1.3 : coreHealthRatio > 0.4 ? 1.0 : 0.7;
  const nodeBonus = 1 + capturedNodes * 0.1;
  const waveBonus = 1 + (completedWaves / Math.max(1, totalWaves)) * 0.5;

  return {
    xp: Math.floor(baseXp * coreBonus * nodeBonus * waveBonus),
    resources: Math.floor(baseResources * nodeBonus),
    energy: ds.energy,
    score: Math.floor(baseScore * coreBonus * nodeBonus * waveBonus),
  };
}

// =======================================================================
// 序列化辅助
// =======================================================================

export function sanitizeMissionsForSerialization(missions: Mission[]): Mission[] {
  return missions.map((m) => ({ ...m }));
}

// =======================================================================
// 随机数辅助
// =======================================================================

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
