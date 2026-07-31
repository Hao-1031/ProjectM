import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Funnel,
  MagnifyingGlass,
  Pause,
  Play,
  Download,
  Trash,
  Terminal,
  Warning,
  Info,
  Bug,
  XCircle,
  ChartBar,
  Clock,
  Tag,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";
import {
  eventBus,
  type GameEvent,
  GameEventCategory,
  GameEventType,
  GameEventLevel,
  type EventBusExport,
} from "@/lib/game/event-bus";

// ── 等级图标映射 ──

const LEVEL_ICON: Record<GameEventLevel, typeof Bug> = {
  [GameEventLevel.DEBUG]: Bug,
  [GameEventLevel.INFO]: Info,
  [GameEventLevel.WARN]: Warning,
  [GameEventLevel.ERROR]: XCircle,
};

const LEVEL_COLOR: Record<GameEventLevel, string> = {
  [GameEventLevel.DEBUG]: "text-muted",
  [GameEventLevel.INFO]: "text-info",
  [GameEventLevel.WARN]: "text-warning",
  [GameEventLevel.ERROR]: "text-danger",
};

const LEVEL_BG: Record<GameEventLevel, string> = {
  [GameEventLevel.DEBUG]: "bg-muted/10",
  [GameEventLevel.INFO]: "bg-info/10",
  [GameEventLevel.WARN]: "bg-warning/10",
  [GameEventLevel.ERROR]: "bg-danger/10",
};

// ── 分类标签 ──

const CATEGORY_LABELS: Record<GameEventCategory, string> = {
  [GameEventCategory.LIFECYCLE]: "生命周期",
  [GameEventCategory.LOGIN]: "登录",
  [GameEventCategory.SUPPLY]: "补给",
  [GameEventCategory.WAVE]: "波次",
  [GameEventCategory.BOSS]: "Boss",
  [GameEventCategory.COOP]: "联机",
  [GameEventCategory.SKILL]: "技能",
  [GameEventCategory.WEAPON]: "武器",
  [GameEventCategory.ACHIEVEMENT]: "成就",
  [GameEventCategory.RESOURCE]: "资源",
  [GameEventCategory.NETWORK]: "网络",
  [GameEventCategory.UI]: "界面",
  [GameEventCategory.ENERGY]: "能量",
  [GameEventCategory.UPGRADE]: "升级",
  [GameEventCategory.REWARD]: "奖励",
};

// ── 事件简要视图 ──

function EventRow({ event, isExpanded, onToggle }: { event: GameEvent; isExpanded: boolean; onToggle: () => void }) {
  const Icon = LEVEL_ICON[event.level];
  const time = new Date(event.timestamp).toLocaleTimeString("zh-CN", { hour12: false });

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-panel-raised/50"
      >
        <span className="shrink-0">
          {isExpanded ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
        </span>
        <Icon size={12} weight="bold" className={`shrink-0 ${LEVEL_COLOR[event.level]}`} />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{event.type}</span>
        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium bg-panel-raised text-muted">
          {CATEGORY_LABELS[event.category]}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-muted">{time}</span>
      </button>
      {isExpanded && (
        <div className={`px-8 py-1.5 pb-2 ${LEVEL_BG[event.level]}`}>
          <div className="font-mono text-[10px] text-muted">
            <span className="text-foreground/70">id:</span> {event.id}
          </div>
          <div className="font-mono text-[10px] text-muted">
            <span className="text-foreground/70">source:</span> {event.source}
          </div>
          {Object.keys(event.payload).length > 0 && (
            <div className="mt-1 font-mono text-[10px] text-muted">
              <span className="text-foreground/70">payload:</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-all rounded bg-background/50 p-1 text-[9px]">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 主组件 ──

export default function EventMonitor() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [filterCategory, setFilterCategory] = useState<GameEventCategory | "all">("all");
  const [filterLevel, setFilterLevel] = useState<GameEventLevel | "all">("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // 订阅全部事件
  useEffect(() => {
    const unsubscribe = eventBus.subscribe("*", (event) => {
      setEvents((prev) => [...prev, event]);
      setNewEventIds((prev) => {
        const next = new Set(prev);
        next.add(event.id);
        return next;
      });
      setTimeout(() => {
        setNewEventIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }, 1500);
    });
    return unsubscribe;
  }, []);

  // 自动滚动
  useEffect(() => {
    if (autoScrollRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1" || (e.key === "`" && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (paused) {
      eventBus.resume();
      setPaused(false);
    } else {
      eventBus.pause();
      setPaused(true);
    }
  }, [paused]);

  const handleClear = useCallback(() => {
    eventBus.clear();
    setEvents([]);
    setExpandedIds(new Set());
  }, []);

  const handleExport = useCallback(() => {
    eventBus.downloadExport();
  }, []);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 过滤后的事件
  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterCategory !== "all") {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (filterLevel !== "all") {
      result = result.filter((e) => e.level === filterLevel);
    }
    if (searchKeyword.trim()) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(
        (e) =>
          e.type.toLowerCase().includes(lower) ||
          e.category.toLowerCase().includes(lower) ||
          e.source.toLowerCase().includes(lower) ||
          JSON.stringify(e.payload).toLowerCase().includes(lower)
      );
    }
    return result;
  }, [events, filterCategory, filterLevel, searchKeyword]);

  // 统计摘要
  const stats = useMemo(() => eventBus.getStats(), []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed bottom-4 right-4 z-50 flex h-[520px] w-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-panel/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Terminal size={16} weight="bold" className="text-primary" />
              <span className="text-sm font-bold">事件监测</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {events.length}
              </span>
              {paused && (
                <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                  已暂停
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowStats((v) => !v)}
                className={`rounded-lg p-1.5 transition-colors ${showStats ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
                title="统计"
              >
                <ChartBar size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handlePauseToggle}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
                title={paused ? "恢复" : "暂停"}
              >
                {paused ? <Play size={14} weight="bold" /> : <Pause size={14} weight="bold" />}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
                title="导出 JSON"
              >
                <Download size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                title="清空"
              >
                <Trash size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
                title="关闭 (F1 / ~)"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* 过滤栏 */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={12} weight="bold" className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索事件..."
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-[11px] outline-none transition-colors focus:border-primary/40"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as GameEventCategory | "all")}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] outline-none"
            >
              <option value="all">全部分类</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as GameEventLevel | "all")}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] outline-none"
            >
              <option value="all">全部等级</option>
              <option value={GameEventLevel.DEBUG}>DEBUG</option>
              <option value={GameEventLevel.INFO}>INFO</option>
              <option value={GameEventLevel.WARN}>WARN</option>
              <option value={GameEventLevel.ERROR}>ERROR</option>
            </select>
          </div>

          {/* 统计面板 */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border"
              >
                <div className="grid grid-cols-3 gap-1 p-3">
                  {Object.entries(stats).length === 0 ? (
                    <p className="col-span-3 py-3 text-center text-[10px] text-muted">暂无事件数据</p>
                  ) : (
                    Object.entries(stats).slice(0, 15).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between rounded bg-background/50 px-2 py-1">
                        <span className="truncate font-mono text-[9px] text-muted">{type}</span>
                        <span className="ml-1 font-mono text-[10px] font-bold">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 事件列表 */}
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Terminal size={24} weight="regular" className="mx-auto text-muted/30" />
                  <p className="mt-2 text-[11px] text-muted">
                    {events.length === 0 ? "等待事件..." : "无匹配事件"}
                  </p>
                </div>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isExpanded={expandedIds.has(event.id)}
                  onToggle={() => toggleExpand(event.id)}
                />
              ))
            )}
          </div>

          {/* 底部状态栏 */}
          <div className="flex items-center justify-between border-t border-border px-4 py-1.5">
            <span className="font-mono text-[10px] text-muted">
              {filteredEvents.length}/{events.length} 条事件
            </span>
            <span className="font-mono text-[10px] text-muted">
              F1 / ~ 切换
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}