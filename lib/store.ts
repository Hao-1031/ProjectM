import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GraphicsQuality = "high" | "medium" | "low";

export interface AppSettings {
  audioEnabled: boolean;
  volume: number;
  bgmVolume: number;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  graphicsQuality: GraphicsQuality;
}

interface AppState {
  settings: AppSettings;
  setAudioEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setBgmVolume: (volume: number) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        audioEnabled: true,
        volume: 0.8,
        bgmVolume: 0.35,
        vibrationEnabled: true,
        reducedMotion: false,
        graphicsQuality: "high",
      },
      setAudioEnabled: (audioEnabled) =>
        set((state) => ({ settings: { ...state.settings, audioEnabled } })),
      setVolume: (volume) => set((state) => ({ settings: { ...state.settings, volume } })),
      setBgmVolume: (bgmVolume) => set((state) => ({ settings: { ...state.settings, bgmVolume } })),
      setVibrationEnabled: (vibrationEnabled) =>
        set((state) => ({ settings: { ...state.settings, vibrationEnabled } })),
      setReducedMotion: (reducedMotion) =>
        set((state) => ({ settings: { ...state.settings, reducedMotion } })),
      setGraphicsQuality: (graphicsQuality) =>
        set((state) => ({ settings: { ...state.settings, graphicsQuality } })),
    }),
    {
      name: "project_m_app_v1",
    }
  )
);
