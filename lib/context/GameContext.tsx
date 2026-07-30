"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchAnnouncements } from "@/hooks/useAnnouncements";
import type { AnnouncementRow } from "@/lib/supabase/api";
import { loadSave, type SaveData } from "@/lib/game/save";

/** 维度状态 */
export interface DimensionStatus {
  onlinePlayers: number;
  activeDimensions: number;
  fleetStatus: "deployed" | "standby" | "maintenance";
  energyLevel: number;
  stability: number;
}

/** 全局游戏上下文 */
export interface GameContextValue {
  /** 实时维度状态 */
  dimension: DimensionStatus;
  /** 用户存档 */
  save: SaveData | null;
  /** 全局公告 */
  announcements: AnnouncementRow[];
  announcementsLoading: boolean;
  /** 用户认证状态 */
  isAuthenticated: boolean;
  /** 刷新存档 */
  refreshSave: () => void;
  /** 刷新公告 */
  refreshAnnouncements: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/** 默认维度状态 */
function defaultDimension(): DimensionStatus {
  return {
    onlinePlayers: 12847,
    activeDimensions: 327,
    fleetStatus: "deployed",
    energyLevel: 78,
    stability: 94.2,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [save, setSave] = useState<SaveData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [dimension, setDimension] = useState<DimensionStatus>(defaultDimension);
  const dimensionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSave = useCallback(() => {
    setSave(loadSave());
  }, []);

  const refreshAnnouncements = useCallback(() => {
    setAnnouncementsLoading(true);
    fetchAnnouncements({ active: true, limit: 5 })
      .then(setAnnouncements)
      .catch(() => {
        /* 公告加载失败保持旧数据 */
      })
      .finally(() => setAnnouncementsLoading(false));
  }, []);

  useEffect(() => {
    refreshSave();
    refreshAnnouncements();
  }, [refreshSave, refreshAnnouncements]);

  useEffect(() => {
    dimensionTimerRef.current = setInterval(() => {
      setDimension((prev) => {
        const playerDelta = Math.floor((Math.random() - 0.45) * 50);
        const dimDelta = Math.floor((Math.random() - 0.5) * 10);
        const energyDelta = (Math.random() - 0.5) * 4;
        const stabilityDelta = (Math.random() - 0.5) * 0.8;

        return {
          onlinePlayers: Math.max(12000, prev.onlinePlayers + playerDelta),
          activeDimensions: Math.max(300, prev.activeDimensions + dimDelta),
          fleetStatus: prev.fleetStatus,
          energyLevel: Math.min(100, Math.max(0, Math.round(prev.energyLevel + energyDelta))),
          stability: Math.min(100, Math.max(85, +(prev.stability + stabilityDelta).toFixed(1))),
        };
      });
    }, 3000);

    return () => {
      if (dimensionTimerRef.current) {
        clearInterval(dimensionTimerRef.current);
      }
    };
  }, []);

  const value: GameContextValue = {
    dimension,
    save,
    announcements,
    announcementsLoading,
    isAuthenticated,
    refreshSave,
    refreshAnnouncements,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGameContext 必须在 GameProvider 内使用");
  }
  return ctx;
}