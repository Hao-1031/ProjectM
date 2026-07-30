import type { PvPMapDef, PvPMapId, PvPMapTheme } from "./types";

export const PVP_MAP_DEFS: Record<PvPMapId, PvPMapDef> = {
  forge_arena: {
    id: "forge_arena",
    name: "锻炉竞技场",
    theme: "industrial",
    description: "废弃钢铁锻造厂改造的竞技场，熔炉与铁砧提供天然的掩体。中央熔炉周期性喷发。",
    width: 1200,
    height: 800,
    spawnPoints: [
      { x: 100, y: 400 },
      { x: 1100, y: 400 },
    ],
    coverPositions: [
      { x: 300, y: 300 },
      { x: 900, y: 300 },
      { x: 300, y: 500 },
      { x: 900, y: 500 },
      { x: 600, y: 200 },
      { x: 600, y: 600 },
    ],
    hazardZones: [
      {
        x: 500, y: 300, width: 200, height: 200,
        type: "lava", damage: 30, active: true,
      },
    ],
    visualTheme: "工业暗橙",
    backgroundColor: "#1A1A1E",
    borderColor: "#E8652C",
  },

  pipeline_yard: {
    id: "pipeline_yard",
    name: "管道工场",
    theme: "industrial",
    description: "错综复杂的管道网络构成的竞技空间，狭窄通道与开阔区域交替。管道蒸汽喷射造成伤害。",
    width: 1000,
    height: 1000,
    spawnPoints: [
      { x: 100, y: 500 },
      { x: 900, y: 500 },
    ],
    coverPositions: [
      { x: 200, y: 200 },
      { x: 500, y: 200 },
      { x: 800, y: 200 },
      { x: 200, y: 800 },
      { x: 500, y: 800 },
      { x: 800, y: 800 },
    ],
    hazardZones: [
      {
        x: 400, y: 350, width: 200, height: 40,
        type: "electric", damage: 20, active: true,
      },
      {
        x: 400, y: 600, width: 200, height: 40,
        type: "electric", damage: 20, active: true,
      },
    ],
    visualTheme: "工业灰蓝",
    backgroundColor: "#1E1E24",
    borderColor: "#4A5568",
  },

  ancient_grove: {
    id: "ancient_grove",
    name: "古木林地",
    theme: "natural",
    description: "被遗忘的远古树林，巨树根须交错形成天然障碍。林间空地适合远程对决。",
    width: 1100,
    height: 900,
    spawnPoints: [
      { x: 100, y: 450 },
      { x: 1000, y: 450 },
    ],
    coverPositions: [
      { x: 250, y: 250 },
      { x: 550, y: 200 },
      { x: 850, y: 250 },
      { x: 250, y: 650 },
      { x: 550, y: 700 },
      { x: 850, y: 650 },
      { x: 550, y: 450 },
    ],
    hazardZones: [
      {
        x: 550, y: 400, width: 80, height: 80,
        type: "spike", damage: 25, active: true,
      },
    ],
    visualTheme: "自然翠绿",
    backgroundColor: "#1A2A1A",
    borderColor: "#22C55E",
  },

  crystal_cavern: {
    id: "crystal_cavern",
    name: "水晶洞穴",
    theme: "natural",
    description: "发光水晶覆盖的地下洞穴，水晶折射光线影响视野。部分水晶可被击碎造成范围伤害。",
    width: 900,
    height: 900,
    spawnPoints: [
      { x: 100, y: 450 },
      { x: 800, y: 450 },
    ],
    coverPositions: [
      { x: 200, y: 200 },
      { x: 450, y: 150 },
      { x: 700, y: 200 },
      { x: 200, y: 700 },
      { x: 450, y: 750 },
      { x: 700, y: 700 },
    ],
    hazardZones: [
      {
        x: 350, y: 350, width: 200, height: 200,
        type: "spike", damage: 35, active: false,
      },
    ],
    visualTheme: "晶蓝紫",
    backgroundColor: "#1A1A2E",
    borderColor: "#7C3AED",
  },

  server_farm: {
    id: "server_farm",
    name: "服务器集群",
    theme: "tech",
    description: "巨型数据中心内部，服务器机柜排列成迷宫。数据流通道提供加速效果。",
    width: 1000,
    height: 800,
    spawnPoints: [
      { x: 100, y: 400 },
      { x: 900, y: 400 },
    ],
    coverPositions: [
      { x: 200, y: 200 },
      { x: 500, y: 150 },
      { x: 800, y: 200 },
      { x: 200, y: 600 },
      { x: 500, y: 650 },
      { x: 800, y: 600 },
    ],
    hazardZones: [
      {
        x: 450, y: 350, width: 100, height: 100,
        type: "laser", damage: 40, active: true,
      },
    ],
    visualTheme: "科技蓝紫",
    backgroundColor: "#0D1117",
    borderColor: "#3B82F6",
  },

  neon_rooftop: {
    id: "neon_rooftop",
    name: "霓虹天台",
    theme: "tech",
    description: "摩天大楼顶层的天台竞技场，霓虹灯牌环绕。边缘坠落即死，近战需谨慎。",
    width: 800,
    height: 800,
    spawnPoints: [
      { x: 100, y: 400 },
      { x: 700, y: 400 },
    ],
    coverPositions: [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 600 },
      { x: 400, y: 600 },
      { x: 600, y: 600 },
    ],
    hazardZones: [
      { x: 0, y: 0, width: 800, height: 20, type: "void", damage: 999, active: true },
      { x: 0, y: 780, width: 800, height: 20, type: "void", damage: 999, active: true },
      { x: 0, y: 0, width: 20, height: 800, type: "void", damage: 999, active: true },
      { x: 780, y: 0, width: 20, height: 800, type: "void", damage: 999, active: true },
    ],
    visualTheme: "霓虹紫粉",
    backgroundColor: "#0D0D1A",
    borderColor: "#EC4899",
  },

  colosseum: {
    id: "colosseum",
    name: "古代斗兽场",
    theme: "classical",
    description: "古罗马风格斗兽场，圆形竞技场中央开阔。断裂的立柱提供掩体，沙地减缓移动。",
    width: 900,
    height: 900,
    spawnPoints: [
      { x: 100, y: 450 },
      { x: 800, y: 450 },
    ],
    coverPositions: [
      { x: 200, y: 200 },
      { x: 450, y: 200 },
      { x: 700, y: 200 },
      { x: 200, y: 700 },
      { x: 450, y: 700 },
      { x: 700, y: 700 },
      { x: 450, y: 450 },
    ],
    hazardZones: [],
    visualTheme: "古典沙金",
    backgroundColor: "#2A2018",
    borderColor: "#D4A574",
  },

  zen_garden: {
    id: "zen_garden",
    name: "禅意庭院",
    theme: "classical",
    description: "日式禅宗庭院，枯山水与石灯笼构成宁静的决斗场。竹流水声掩蔽脚步声。",
    width: 800,
    height: 800,
    spawnPoints: [
      { x: 100, y: 400 },
      { x: 700, y: 400 },
    ],
    coverPositions: [
      { x: 150, y: 200 },
      { x: 400, y: 150 },
      { x: 650, y: 200 },
      { x: 150, y: 600 },
      { x: 400, y: 650 },
      { x: 650, y: 600 },
    ],
    hazardZones: [
      {
        x: 350, y: 350, width: 100, height: 100,
        type: "spike", damage: 15, active: false,
      },
    ],
    visualTheme: "禅意灰白",
    backgroundColor: "#1C1C1C",
    borderColor: "#9CA3AF",
  },
};

export function getPvPMap(id: PvPMapId): PvPMapDef {
  return PVP_MAP_DEFS[id];
}

export function listPvPMapIds(): PvPMapId[] {
  return Object.keys(PVP_MAP_DEFS) as PvPMapId[];
}

export function listPvPMapsByTheme(theme: PvPMapTheme): PvPMapDef[] {
  return Object.values(PVP_MAP_DEFS).filter((map) => map.theme === theme);
}

export function getPvPMapName(id: PvPMapId): string {
  return PVP_MAP_DEFS[id].name;
}

export function getPvPMapTheme(id: PvPMapId): PvPMapTheme {
  return PVP_MAP_DEFS[id].theme;
}

export function getRandomPvPMap(): PvPMapDef {
  const ids = listPvPMapIds();
  return PVP_MAP_DEFS[ids[Math.floor(Math.random() * ids.length)]];
}

export function getRandomPvPMapByTheme(theme: PvPMapTheme): PvPMapDef {
  const maps = listPvPMapsByTheme(theme);
  return maps[Math.floor(Math.random() * maps.length)];
}