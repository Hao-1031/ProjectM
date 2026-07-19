import type { Mission, GameState, MapConfig } from "./types";
import { uid, randomRange, clamp } from "./math";

const MISSION_TEMPLATES: Omit<Mission, "id" | "progress" | "completed" | "elapsed">[] = [
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

export function generateMissions(): Mission[] {
  return MISSION_TEMPLATES.map((template) => ({
    ...template,
    id: uid("mission"),
    progress: 0,
    completed: false,
    elapsed: 0,
  }));
}

export function getCurrentMission(state: GameState): Mission | null {
  return state.missions[state.currentMissionIndex] ?? null;
}

export function updateMissions(state: GameState, dt: number): GameState {
  const current = getCurrentMission(state);
  if (!current || current.completed) return state;

  current.elapsed += dt;

  if (current.type === "survive") {
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
