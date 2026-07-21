import type { MapConfig, MapTheme, Obstacle, Hazard } from "./types";

export type MapId = "industrial-ruins" | "abandoned-refinery" | "frozen-orbit" | "biohazard-lab";

const MAP_REGISTRY: Record<MapId, () => MapConfig> = {
  "industrial-ruins": createIndustrialRuinsMap,
  "abandoned-refinery": createAbandonedRefineryMap,
  "frozen-orbit": createFrozenOrbitMap,
  "biohazard-lab": createBiohazardLabMap,
};

export const DEFAULT_DEFENSE_MAP_ID: MapId = "industrial-ruins";

export function getMapById(id: MapId): MapConfig {
  const factory = MAP_REGISTRY[id];
  if (!factory) throw new Error(`Unknown map id: ${id}`);
  return factory();
}

export function listMapIds(): MapId[] {
  return Object.keys(MAP_REGISTRY) as MapId[];
}

export function getMapName(id: MapId): string {
  const names: Record<MapId, string> = {
    "industrial-ruins": "工业废墟",
    "abandoned-refinery": "废弃精炼厂",
    "frozen-orbit": "冰封轨道站",
    "biohazard-lab": "生物污染实验室",
  };
  return names[id];
}

export function getMapDescription(id: MapId): string {
  const descriptions: Record<MapId, string> = {
    "industrial-ruins": "标准据点防守训练场，障碍物分布均衡。",
    "abandoned-refinery": "核污染废土中的旧精炼设施，狭长通道适合伏击，但敌人也更容易集结。",
    "frozen-orbit": "破碎轨道站残骸漂浮在冰原上空，开阔地形适合远程火力覆盖。",
    "biohazard-lab": "被遗弃的生物实验设施，狭窄走廊与酸液池迫使战斗进入近距离。",
  };
  return descriptions[id];
}

function createObstacle(
  x: number,
  y: number,
  width: number,
  height: number,
  color = "#1c2033",
  health = 300
): Obstacle {
  return {
    id: `obs_${x}_${y}`,
    x,
    y,
    width,
    height,
    color,
    health,
    maxHealth: health,
    destructible: true,
  };
}

function createIndustrialRuinsMap(): MapConfig {
  // Backwards-compatible default layout used by defense.ts before map selection existed.
  const width = 2200;
  const height = 1600;
  const coreX = width / 2;
  const coreY = height / 2;
  const obstacles: Obstacle[] = [];

  // Core ring walls
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 170;
    obstacles.push(
      createObstacle(
        coreX + Math.cos(angle) * dist - 35,
        coreY + Math.sin(angle) * dist - 12,
        70,
        24,
        "#1c2033",
        400
      )
    );
  }

  // Four corner covers
  obstacles.push(createObstacle(300, 300, 120, 80, "#292524", 300));
  obstacles.push(createObstacle(1780, 300, 120, 80, "#292524", 300));
  obstacles.push(createObstacle(300, 1220, 120, 80, "#292524", 300));
  obstacles.push(createObstacle(1780, 1220, 120, 80, "#292524", 300));

  return {
    width,
    height,
    theme: "industrial" as MapTheme,
    obstacles,
    hazards: [] as Hazard[],
  };
}

function createAbandonedRefineryMap(): MapConfig {
  const width = 2400;
  const height = 1800;
  const coreX = width / 2;
  const coreY = height / 2;
  const rustColor = "#3f3529";
  const darkRust = "#2a231a";
  const obstacles: Obstacle[] = [];

  // Central refinery structure - a heavy ring around the core
  const ringSegments = 10;
  for (let i = 0; i < ringSegments; i++) {
    const angle = (i / ringSegments) * Math.PI * 2;
    const dist = 190;
    obstacles.push(
      createObstacle(
        coreX + Math.cos(angle) * dist - 45,
        coreY + Math.sin(angle) * dist - 18,
        90,
        36,
        darkRust,
        600
      )
    );
  }

  // Two large horizontal process pipes north and south of core
  obstacles.push(createObstacle(coreX - 380, coreY - 320, 760, 48, rustColor, 450));
  obstacles.push(createObstacle(coreX - 380, coreY + 272, 760, 48, rustColor, 450));

  // Vertical separator walls creating east/west flanking lanes
  obstacles.push(createObstacle(coreX - 600, coreY - 180, 48, 360, rustColor, 400));
  obstacles.push(createObstacle(coreX + 552, coreY - 180, 48, 360, rustColor, 400));

  // Storage tanks in corners
  obstacles.push(createObstacle(220, 220, 160, 160, darkRust, 500));
  obstacles.push(createObstacle(width - 380, 220, 160, 160, darkRust, 500));
  obstacles.push(createObstacle(220, height - 380, 160, 160, darkRust, 500));
  obstacles.push(createObstacle(width - 380, height - 380, 160, 160, darkRust, 500));

  // Scattered debris cover
  obstacles.push(createObstacle(520, 800, 90, 60, rustColor, 250));
  obstacles.push(createObstacle(width - 610, 800, 90, 60, rustColor, 250));
  obstacles.push(createObstacle(520, height - 860, 90, 60, rustColor, 250));
  obstacles.push(createObstacle(width - 610, height - 860, 90, 60, rustColor, 250));

  // Acid hazard pools in the far north/south channels
  const hazards: Hazard[] = [
    {
      id: "hz_north",
      x: coreX - 160,
      y: 140,
      radius: 90,
      damage: 8,
      interval: 0.5,
      timer: 0,
      color: "#65a30d",
      type: "acid",
    },
    {
      id: "hz_south",
      x: coreX + 160,
      y: height - 140,
      radius: 90,
      damage: 8,
      interval: 0.5,
      timer: 0,
      color: "#65a30d",
      type: "acid",
    },
  ];

  return {
    width,
    height,
    theme: "wasteland" as MapTheme,
    obstacles,
    hazards,
  };
}

function createFrozenOrbitMap(): MapConfig {
  const width = 2800;
  const height = 2000;
  const coreX = width / 2;
  const coreY = height / 2;
  const iceColor = "#1a3a52";
  const darkIce = "#0f2438";
  const obstacles: Obstacle[] = [];

  // Core platform ring
  const ringSegments = 8;
  for (let i = 0; i < ringSegments; i++) {
    const angle = (i / ringSegments) * Math.PI * 2;
    const dist = 200;
    obstacles.push(
      createObstacle(
        coreX + Math.cos(angle) * dist - 40,
        coreY + Math.sin(angle) * dist - 14,
        80,
        28,
        darkIce,
        500
      )
    );
  }

  // Scattered ice pillars / station debris in the open field
  const debris = [
    [520, 520, 100, 70],
    [width - 620, 520, 100, 70],
    [520, height - 590, 100, 70],
    [width - 620, height - 590, 100, 70],
    [coreX - 500, coreY - 120, 80, 240],
    [coreX + 420, coreY - 120, 80, 240],
    [coreX - 120, coreY - 520, 240, 80],
    [coreX - 120, coreY + 440, 240, 80],
  ];
  for (const [x, y, w, h] of debris) {
    obstacles.push(createObstacle(x, y, w as number, h as number, iceColor, 350));
  }

  // Cryo hazard pools near outer ring
  const hazards: Hazard[] = [
    { id: "hz_nw", x: coreX - 420, y: coreY - 420, radius: 85, damage: 6, interval: 0.6, timer: 0, color: "#22d3ee", type: "electric" },
    { id: "hz_ne", x: coreX + 420, y: coreY - 420, radius: 85, damage: 6, interval: 0.6, timer: 0, color: "#22d3ee", type: "electric" },
    { id: "hz_sw", x: coreX - 420, y: coreY + 420, radius: 85, damage: 6, interval: 0.6, timer: 0, color: "#22d3ee", type: "electric" },
    { id: "hz_se", x: coreX + 420, y: coreY + 420, radius: 85, damage: 6, interval: 0.6, timer: 0, color: "#22d3ee", type: "electric" },
  ];

  return {
    width,
    height,
    theme: "frozen" as MapTheme,
    obstacles,
    hazards,
  };
}

function createBiohazardLabMap(): MapConfig {
  const width = 2200;
  const height = 1800;
  const coreX = width / 2;
  const coreY = height / 2;
  const bioColor = "#2a3a18";
  const darkBio = "#1a2410";
  const obstacles: Obstacle[] = [];

  // Central containment chamber with four gaps
  obstacles.push(createObstacle(coreX - 280, coreY - 280, 560, 60, darkBio, 600));
  obstacles.push(createObstacle(coreX - 280, coreY + 220, 560, 60, darkBio, 600));
  obstacles.push(createObstacle(coreX - 280, coreY - 220, 60, 440, darkBio, 600));
  obstacles.push(createObstacle(coreX + 220, coreY - 220, 60, 440, darkBio, 600));

  // Corridor walls creating narrow lanes
  obstacles.push(createObstacle(coreX - 780, coreY - 120, 360, 48, bioColor, 400));
  obstacles.push(createObstacle(coreX + 420, coreY - 120, 360, 48, bioColor, 400));
  obstacles.push(createObstacle(coreX - 780, coreY + 72, 360, 48, bioColor, 400));
  obstacles.push(createObstacle(coreX + 420, coreY + 72, 360, 48, bioColor, 400));

  // Corner lab blocks
  obstacles.push(createObstacle(180, 180, 160, 160, darkBio, 500));
  obstacles.push(createObstacle(width - 340, 180, 160, 160, darkBio, 500));
  obstacles.push(createObstacle(180, height - 340, 160, 160, darkBio, 500));
  obstacles.push(createObstacle(width - 340, height - 340, 160, 160, darkBio, 500));

  // Acid hazard pools in corridors
  const hazards: Hazard[] = [
    { id: "hz_north", x: coreX - 180, y: 260, radius: 80, damage: 10, interval: 0.5, timer: 0, color: "#65a30d", type: "acid" },
    { id: "hz_south", x: coreX + 180, y: height - 260, radius: 80, damage: 10, interval: 0.5, timer: 0, color: "#65a30d", type: "acid" },
    { id: "hz_west", x: 320, y: coreY, radius: 70, damage: 10, interval: 0.5, timer: 0, color: "#65a30d", type: "acid" },
    { id: "hz_east", x: width - 320, y: coreY, radius: 70, damage: 10, interval: 0.5, timer: 0, color: "#65a30d", type: "acid" },
  ];

  return {
    width,
    height,
    theme: "biohazard" as MapTheme,
    obstacles,
    hazards,
  };
}
