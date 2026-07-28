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
    {
      id: "endless_kills",
      type: "eliminate",
      title: "收割者",
      description: `消灭 ${50 + wave * 15} 个感染者`,
      target: 50 + wave * 15,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "endless_boss",
      type: "bossSlay",
      title: "首领猎手",
      description: `击败 ${Math.max(1, Math.floor(wave / 5))} 个首领`,
      target: Math.max(1, Math.floor(wave / 5)),
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateSurvivalMissions(): Mission[] {
  return [
    {
      id: "surv_elite",
      type: "eliteHunt",
      title: "精英清剿",
      description: "消灭 15 个精英感染者",
      target: 15,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "surv_combo",
      type: "comboChain",
      title: "连击大师",
      description: "达成 50 连击",
      target: 50,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "surv_survive",
      type: "survive",
      title: "极限生存",
      description: "存活 600 秒",
      target: 600,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateDailyMissions(seed: number): Mission[] {
  const rng = seededRandom(seed);
  const missionPools = [
    [
      { type: "eliminate" as MissionType, title: "每日清剿", description: "消灭 50 个感染者", target: 50 },
      { type: "eliminate" as MissionType, title: "快速收割", description: "消灭 80 个感染者", target: 80 },
      { type: "eliminate" as MissionType, title: "屠杀盛宴", description: "消灭 120 个感染者", target: 120 },
    ],
    [
      { type: "survive" as MissionType, title: "时间考验", description: "存活 180 秒", target: 180 },
      { type: "survive" as MissionType, title: "持久战", description: "存活 300 秒", target: 300 },
      { type: "survive" as MissionType, title: "钢铁意志", description: "存活 480 秒", target: 480 },
    ],
    [
      { type: "eliteHunt" as MissionType, title: "精英猎手", description: "消灭 8 个精英感染者", target: 8 },
      { type: "bossSlay" as MissionType, title: "首领挑战", description: "击败 2 个首领", target: 2 },
      { type: "comboChain" as MissionType, title: "连击之星", description: "达成 30 连击", target: 30 },
    ],
  ];

  const missions: Mission[] = [];
  for (const pool of missionPools) {
    const idx = Math.floor(rng() * pool.length);
    const template = pool[idx];
    missions.push({
      id: `daily_${uid("m")}`,
      ...template,
      progress: 0,
      completed: false,
      elapsed: 0,
    });
  }
  return missions;
}

export function generateDeathmatchMissions(): Mission[] {
  return [
    {
      id: "dm_kills",
      type: "eliminate",
      title: "击杀竞赛",
      description: "率先达到 15 次击杀",
      target: 15,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "dm_streak",
      type: "killStreak",
      title: "连杀之星",
      description: "达成 5 连杀",
      target: 5,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "dm_nodamage",
      type: "noDamage",
      title: "无伤挑战",
      description: "在 30 秒内不受伤害并完成 3 次击杀",
      target: 3,
      timeLimit: 30,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "dm_combo",
      type: "comboChain",
      title: "连击风暴",
      description: "达成 10 连击",
      target: 10,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "dm_powerup",
      type: "collect",
      title: "能量收集",
      description: "收集 3 个强化道具",
      target: 3,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateExtremeSurvivalMissions(): Mission[] {
  return [
    {
      id: "es_overclock",
      type: "overclock",
      title: "超频极限",
      description: "在第 25 波选择超频并存活 10 波",
      target: 10,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "es_defend",
      type: "defendCore",
      title: "核心守护",
      description: "核心生命值保持在 50% 以上完成第 10 波",
      target: 10,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "es_elite",
      type: "eliteHunt",
      title: "变异清剿",
      description: "在超频阶段消灭 30 个精英敌人",
      target: 30,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "es_perfect",
      type: "noDamage",
      title: "完美防线",
      description: "核心不受伤害完成 3 波",
      target: 3,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "es_score",
      type: "speedClear",
      title: "得分挑战",
      description: "累计获得 10000 分",
      target: 10000,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generatePeakChallengeMissions(): Mission[] {
  return [
    {
      id: "pc_season",
      type: "seasonObjective",
      title: "赛季目标",
      description: "在巅峰挑战中累计获得 5000 赛季经验",
      target: 5000,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "pc_boss",
      type: "bossSlay",
      title: "巅峰猎杀",
      description: "在巅峰挑战中击败 5 个首领",
      target: 5,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "pc_speed",
      type: "speedClear",
      title: "极速通关",
      description: "在 180 秒内完成一波且核心生命不低于 80%",
      target: 1,
      timeLimit: 180,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "pc_rank",
      type: "seasonObjective",
      title: "段位晋升",
      description: "赛季排名达到黄金段位",
      target: 5000,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "pc_challenge",
      type: "comboChain",
      title: "挑战达人",
      description: "连续完成 3 轮挑战",
      target: 3,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateFlagshipMissions(): Mission[] {
  return [
    {
      id: "fs_dominate",
      type: "eliminate",
      title: "制霸战场",
      description: "在旗舰模式中消灭 200 个敌人",
      target: 200,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fs_boss",
      type: "bossSlay",
      title: "旗舰猎手",
      description: "击败 3 个旗舰首领",
      target: 3,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fs_survive",
      type: "surviveTimer",
      title: "旗舰坚守",
      description: "在核心存活的前提下坚守 300 秒",
      target: 300,
      timeLimit: 360,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fs_speed",
      type: "speedClear",
      title: "速度之星",
      description: "获得铂金及以上速度评级",
      target: 1,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fs_perfect",
      type: "noDamage",
      title: "完美旗舰",
      description: "完成 3 波完美防线",
      target: 3,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateFlagShipPeakMissions(): Mission[] {
  return [
    {
      id: "fp_eliminate",
      type: "eliminate",
      title: "终极制霸",
      description: "在旗舰巅峰中消灭 300 个敌人",
      target: 300,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fp_boss",
      type: "bossSlay",
      title: "巅峰猎手",
      description: "击败 5 个旗舰巅峰首领",
      target: 5,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fp_survive",
      type: "surviveTimer",
      title: "巅峰坚守",
      description: "在核心存活的前提下坚守 600 秒",
      target: 600,
      timeLimit: 720,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fp_speed",
      type: "speedClear",
      title: "巅峰速度",
      description: "获得钻石速度评级",
      target: 1,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fp_season",
      type: "seasonObjective",
      title: "宗师之路",
      description: "赛季段位达到大师及以上",
      target: 50000,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
    {
      id: "fp_perfect",
      type: "noDamage",
      title: "完美巅峰",
      description: "完成 5 波完美防线",
      target: 5,
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

  if (current.type === "rescue" || current.type === "extract") {
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

  if (current.type === "bossSlay") {
    updateBossSlayMission(state, current);
  }

  if (current.type === "overclock") {
    updateOverclockMission(state, current);
  }

  if (current.type === "speedClear") {
    updateSpeedClearMission(state, current);
  }

  if (current.type === "seasonObjective") {
    updateSeasonObjectiveMission(state, current);
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

function updateBossSlayMission(state: GameState, mission: Mission): void {
  mission.progress = clamp(state.stats.bossesKilled, 0, mission.target);
}

function updateOverclockMission(state: GameState, mission: Mission): void {
  const run = state.extremeSurvivalRun;
  if (!run) return;
  if (run.phase === "overclock") {
    const ds = state.defenseState;
    if (ds) {
      mission.progress = clamp(ds.currentWave - 25, 0, mission.target);
    }
  }
}

function updateSpeedClearMission(state: GameState, mission: Mission): void {
  const ds = state.defenseState;
  if (!ds || !ds.waveInProgress) return;
  const coreRatio = ds.core.health / ds.core.maxHealth;
  if (ds.waveTimer <= (mission.timeLimit ?? 180) && coreRatio >= 0.8 && ds.waveInProgress) {
    mission.progress = 1;
  }
}

function updateSeasonObjectiveMission(state: GameState, mission: Mission): void {
  const fs = state.peakChallengeState;
  if (!fs) return;
  mission.progress = clamp(fs.seasonXp, 0, mission.target);
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
      // Final extraction — reuse beacon if extract mission already created it
      if (!state.extraction) {
        state.extraction = createExtractionPoint(state.map, state.player);
      }
      state.extractionTimer = 30;
    } else {
      // Create extraction beacon for rescue / extract mission types
      const next = state.missions[state.currentMissionIndex];
      if (next.type === "rescue" || next.type === "extract") {
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
  if (current && !current.completed) {
    if (current.type === "eliminate") {
      current.progress = clamp(current.progress + count, 0, current.target);
    }
    if (current.type === "killStreak" || current.type === "comboChain") {
      current.progress = Math.max(current.progress, count);
    }
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
    case "bossSlay":
      return {
        xp: Math.floor(baseXp * 2 * difficultyMul),
        resources: Math.floor(baseResources * 2),
        energy: 0,
        score: Math.floor(baseScore * 2),
      };
    case "eliteHunt":
      return {
        xp: Math.floor(baseXp * 1.2 * difficultyMul),
        resources: Math.floor(baseResources * 1.3),
        energy: 0,
        score: Math.floor(baseScore * 1.4),
      };
    case "comboChain":
    case "killStreak":
      return {
        xp: Math.floor(baseXp * 1.4 * difficultyMul),
        resources: Math.floor(baseResources * 1.2),
        energy: 0,
        score: Math.floor(baseScore * 1.5),
      };
    case "noDamage":
      return {
        xp: Math.floor(baseXp * 1.8 * difficultyMul),
        resources: Math.floor(baseResources * 1.5),
        energy: 0,
        score: Math.floor(baseScore * 2.2),
      };
    case "overclock":
      return {
        xp: Math.floor(baseXp * 2.5 * difficultyMul),
        resources: Math.floor(baseResources * 3),
        energy: Math.floor(200 * difficultyMul),
        score: Math.floor(baseScore * 3),
      };
    case "speedClear":
      return {
        xp: Math.floor(baseXp * 1.6 * difficultyMul),
        resources: Math.floor(baseResources * 1.5),
        energy: Math.floor(100 * difficultyMul),
        score: Math.floor(baseScore * 1.8),
      };
    case "seasonObjective":
      return {
        xp: Math.floor(baseXp * 3 * difficultyMul),
        resources: Math.floor(baseResources * 4),
        energy: Math.floor(300 * difficultyMul),
        score: Math.floor(baseScore * 3.5),
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
