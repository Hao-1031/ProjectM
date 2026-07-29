/**
 * 梦想家版本 - 统一游戏事件总线
 * 运行时内存环形缓冲区，覆盖全量游戏事件，支持订阅/发布/过滤/搜索/暂停/导出
 */

// ── 事件分类枚举 ──

export enum GameEventCategory {
  LIFECYCLE = "lifecycle",
  LOGIN = "login",
  SUPPLY = "supply",
  WAVE = "wave",
  BOSS = "boss",
  COOP = "coop",
  SKILL = "skill",
  WEAPON = "weapon",
  ACHIEVEMENT = "achievement",
  RESOURCE = "resource",
  NETWORK = "network",
  UI = "ui",
  ENERGY = "energy",
  UPGRADE = "upgrade",
  REWARD = "reward",
}

// ── 事件类型枚举 ──

export enum GameEventType {
  // 生命周期
  GAME_START = "game:start",
  GAME_END = "game:end",
  GAME_PAUSE = "game:pause",
  GAME_RESUME = "game:resume",
  GAME_RESTART = "game:restart",
  GAME_SURRENDER = "game:surrender",

  // 登录
  LOGIN_REQUEST = "login:request",
  LOGIN_SUCCESS = "login:success",
  LOGIN_FAILURE = "login:failure",
  LOGIN_TIMEOUT = "login:timeout",
  LOGIN_CANCEL = "login:cancel",
  LOGOUT = "logout",

  // 补给窗口
  SUPPLY_OPEN = "supply:open",
  SUPPLY_CLOSE = "supply:close",
  SUPPLY_PURCHASE = "supply:purchase",
  SUPPLY_SKIP = "supply:skip",
  SUPPLY_WARNING = "supply:warning",
  SUPPLY_END = "supply:end",

  // 波次
  WAVE_START = "wave:start",
  WAVE_CLEAR = "wave:clear",
  WAVE_FAIL = "wave:fail",
  WAVE_BOSS = "wave:boss",
  WAVE_STUCK = "wave:stuck",
  WAVE_SKIP = "wave:skip",

  // Boss 战
  BOSS_SPAWN = "boss:spawn",
  BOSS_PHASE_CHANGE = "boss:phase_change",
  BOSS_KILL = "boss:kill",
  BOSS_VARIANT = "boss:variant",

  // 联机
  COOP_ROOM_CREATE = "coop:room_create",
  COOP_ROOM_JOIN = "coop:room_join",
  COOP_ROOM_LEAVE = "coop:room_leave",
  COOP_PEER_CONNECT = "coop:peer_connect",
  COOP_PEER_DISCONNECT = "coop:peer_disconnect",
  COOP_RECONNECTING = "coop:reconnecting",
  COOP_RECONNECTED = "coop:reconnected",
  COOP_SIGNALING_ERROR = "coop:signaling_error",

  // 技能
  SKILL_TRIGGER = "skill:trigger",
  SKILL_COOLDOWN = "skill:cooldown",
  SKILL_READY = "skill:ready",
  SKILL_ULTIMATE = "skill:ultimate",
  SKILL_AWAKEN = "skill:awaken",
  SKILL_TREE_UNLOCK = "skill:tree_unlock",

  // 武器
  WEAPON_FIRE = "weapon:fire",
  WEAPON_UPGRADE = "weapon:upgrade",
  WEAPON_FORGE = "weapon:forge",
  WEAPON_MODULE_APPLY = "weapon:module_apply",

  // 成就
  ACHIEVEMENT_UNLOCK = "achievement:unlock",
  ACHIEVEMENT_PROGRESS = "achievement:progress",
  MILESTONE_REACH = "milestone:reach",

  // 资源
  RESOURCE_COLLECT = "resource:collect",
  RESOURCE_SPEND = "resource:spend",
  RESOURCE_CRITICAL = "resource:critical",

  // 网络
  NETWORK_UP = "network:up",
  NETWORK_DOWN = "network:down",
  NETWORK_LATENCY = "network:latency",
  NETWORK_PACKET_LOSS = "network:packet_loss",

  // UI
  UI_MODAL_OPEN = "ui:modal_open",
  UI_MODAL_CLOSE = "ui:modal_close",
  UI_PANEL_TOGGLE = "ui:panel_toggle",
  UI_HOTKEY = "ui:hotkey",
  UI_ERROR = "ui:error",
}

// ── 事件等级 ──

export enum GameEventLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// ── 事件数据结构 ──

export interface GameEvent {
  /** 事件唯一 ID */
  id: string;
  /** 事件类型 */
  type: GameEventType;
  /** 事件分类 */
  category: GameEventCategory;
  /** 事件等级 */
  level: GameEventLevel;
  /** 事件发生时间戳 */
  timestamp: number;
  /** 事件携带的负载数据 */
  payload: Record<string, unknown>;
  /** 事件来源模块 */
  source: string;
}

// ── 导出格式 ──

export interface EventBusExport {
  exportedAt: number;
  version: string;
  totalEvents: number;
  paused: boolean;
  events: GameEvent[];
  stats: Record<string, number>;
}

// ── 订阅者类型 ──

export type EventSubscriber = (event: GameEvent) => void;

// ── 事件总线配置 ──

interface EventBusConfig {
  /** 环形缓冲区最大容量 */
  maxEvents: number;
  /** 是否启用调试日志 */
  debug: boolean;
}

// ── 事件总线单例 ──

class EventBus {
  private static instance: EventBus;

  private config: EventBusConfig;
  private buffer: GameEvent[] = [];
  private subscribers: Map<GameEventType | "*", Set<EventSubscriber>> = new Map();
  private categorySubscribers: Map<GameEventCategory, Set<EventSubscriber>> = new Map();
  private paused = false;
  private pendingQueue: GameEvent[] = [];
  private eventCounter = 0;

  private constructor(config: EventBusConfig = { maxEvents: 1000, debug: false }) {
    this.config = config;
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // ── 发布 ──

  /** 发布一个事件 */
  publish(
    type: GameEventType,
    category: GameEventCategory,
    level: GameEventLevel,
    payload: Record<string, unknown> = {},
    source = "unknown"
  ): GameEvent {
    const event: GameEvent = {
      id: `${Date.now()}_${this.eventCounter++}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      category,
      level,
      timestamp: Date.now(),
      payload,
      source,
    };

    if (this.paused) {
      this.pendingQueue.push(event);
      return event;
    }

    this.pushToBuffer(event);
    this.dispatch(event);
    return event;
  }

  /** 批量发布 */
  publishBatch(events: Array<{ type: GameEventType; category: GameEventCategory; level: GameEventLevel; payload?: Record<string, unknown>; source?: string }>): void {
    for (const e of events) {
      this.publish(e.type, e.category, e.level, e.payload ?? {}, e.source ?? "unknown");
    }
  }

  // ── 订阅 ──

  /** 订阅特定事件类型 */
  subscribe(type: GameEventType | "*", subscriber: EventSubscriber): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(subscriber);

    return () => {
      this.subscribers.get(type)?.delete(subscriber);
    };
  }

  /** 订阅整个分类 */
  subscribeCategory(category: GameEventCategory, subscriber: EventSubscriber): () => void {
    if (!this.categorySubscribers.has(category)) {
      this.categorySubscribers.set(category, new Set());
    }
    this.categorySubscribers.get(category)!.add(subscriber);

    return () => {
      this.categorySubscribers.get(category)?.delete(subscriber);
    };
  }

  /** 一次性订阅 */
  once(type: GameEventType, subscriber: EventSubscriber): void {
    const unsubscribe = this.subscribe(type, (event) => {
      subscriber(event);
      unsubscribe();
    });
  }

  // ── 查询 ──

  /** 获取所有事件 */
  getAll(): GameEvent[] {
    return [...this.buffer];
  }

  /** 按类型过滤 */
  filterByType(type: GameEventType): GameEvent[] {
    return this.buffer.filter((e) => e.type === type);
  }

  /** 按分类过滤 */
  filterByCategory(category: GameEventCategory): GameEvent[] {
    return this.buffer.filter((e) => e.category === category);
  }

  /** 按等级过滤 */
  filterByLevel(level: GameEventLevel): GameEvent[] {
    return this.buffer.filter((e) => e.level === level);
  }

  /** 关键词搜索 */
  search(keyword: string): GameEvent[] {
    const lower = keyword.toLowerCase();
    return this.buffer.filter(
      (e) =>
        e.type.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower) ||
        e.source.toLowerCase().includes(lower) ||
        JSON.stringify(e.payload).toLowerCase().includes(lower)
    );
  }

  /** 时间范围查询 */
  filterByTimeRange(start: number, end: number): GameEvent[] {
    return this.buffer.filter((e) => e.timestamp >= start && e.timestamp <= end);
  }

  /** 最近 N 个事件 */
  getRecent(n: number): GameEvent[] {
    return this.buffer.slice(-n);
  }

  // ── 统计 ──

  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const event of this.buffer) {
      const key = event.type;
      stats[key] = (stats[key] ?? 0) + 1;
    }
    return stats;
  }

  getCount(): number {
    return this.buffer.length;
  }

  getCategoryStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const event of this.buffer) {
      const key = event.category;
      stats[key] = (stats[key] ?? 0) + 1;
    }
    return stats;
  }

  // ── 控制 ──

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    const queued = [...this.pendingQueue];
    this.pendingQueue = [];
    for (const event of queued) {
      this.pushToBuffer(event);
      this.dispatch(event);
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  clear(): void {
    this.buffer = [];
    this.pendingQueue = [];
    this.eventCounter = 0;
  }

  reset(): void {
    this.clear();
    this.subscribers.clear();
    this.categorySubscribers.clear();
    this.paused = false;
  }

  // ── 导出 ──

  export(): EventBusExport {
    return {
      exportedAt: Date.now(),
      version: "DR-DREAMER",
      totalEvents: this.buffer.length,
      paused: this.paused,
      events: [...this.buffer],
      stats: this.getStats(),
    };
  }

  exportJSON(): string {
    return JSON.stringify(this.export(), null, 2);
  }

  downloadExport(): void {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dreamer-event-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 内部方法 ──

  private pushToBuffer(event: GameEvent): void {
    this.buffer.push(event);
    while (this.buffer.length > this.config.maxEvents) {
      this.buffer.shift();
    }
  }

  private dispatch(event: GameEvent): void {
    // 分发到类型订阅者
    const typeSubscribers = this.subscribers.get(event.type);
    if (typeSubscribers) {
      for (const sub of typeSubscribers) {
        this.safeCall(sub, event);
      }
    }

    // 分发到通配符订阅者
    const wildcardSubscribers = this.subscribers.get("*");
    if (wildcardSubscribers) {
      for (const sub of wildcardSubscribers) {
        this.safeCall(sub, event);
      }
    }

    // 分发到分类订阅者
    const catSubscribers = this.categorySubscribers.get(event.category);
    if (catSubscribers) {
      for (const sub of catSubscribers) {
        this.safeCall(sub, event);
      }
    }
  }

  private safeCall(subscriber: EventSubscriber, event: GameEvent): void {
    try {
      subscriber(event);
    } catch (err) {
      if (this.config.debug) {
        console.error(`[EventBus] subscriber error for ${event.type}:`, err);
      }
    }
  }
}

// ── 导出便捷方法 ──

export const eventBus = EventBus.getInstance();

/** 快捷发布方法 */
export function emit(
  type: GameEventType,
  category: GameEventCategory,
  level: GameEventLevel,
  payload?: Record<string, unknown>,
  source?: string
): GameEvent {
  return eventBus.publish(type, category, level, payload, source);
}

/** 快捷订阅方法 */
export function on(
  type: GameEventType | "*",
  subscriber: EventSubscriber
): () => void {
  return eventBus.subscribe(type, subscriber);
}

/** 快捷分类订阅 */
export function onCategory(
  category: GameEventCategory,
  subscriber: EventSubscriber
): () => void {
  return eventBus.subscribeCategory(category, subscriber);
}