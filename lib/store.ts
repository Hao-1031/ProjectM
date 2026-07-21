import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GraphicsQuality = "high" | "medium" | "low";
export type JoystickSize = "small" | "medium" | "large";

export interface AppSettings {
  audioEnabled: boolean;
  volume: number;
  bgmVolume: number;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  graphicsQuality: GraphicsQuality;
  // Mobile control settings
  aimAssistEnabled: boolean;
  autoFireEnabled: boolean;
  smartSkillHintsEnabled: boolean;
  joystickSize: JoystickSize;
  joystickOpacity: number;
  hudScale: number;
}

interface AppState {
  settings: AppSettings;
  setAudioEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setBgmVolume: (volume: number) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setAimAssistEnabled: (enabled: boolean) => void;
  setAutoFireEnabled: (enabled: boolean) => void;
  setSmartSkillHintsEnabled: (enabled: boolean) => void;
  setJoystickSize: (size: JoystickSize) => void;
  setJoystickOpacity: (opacity: number) => void;
  setHudScale: (scale: number) => void;
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
        graphicsQuality: "medium",
        aimAssistEnabled: true,
        autoFireEnabled: true,
        smartSkillHintsEnabled: true,
        joystickSize: "medium",
        joystickOpacity: 0.65,
        hudScale: 1,
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
      setAimAssistEnabled: (aimAssistEnabled) =>
        set((state) => ({ settings: { ...state.settings, aimAssistEnabled } })),
      setAutoFireEnabled: (autoFireEnabled) =>
        set((state) => ({ settings: { ...state.settings, autoFireEnabled } })),
      setSmartSkillHintsEnabled: (smartSkillHintsEnabled) =>
        set((state) => ({ settings: { ...state.settings, smartSkillHintsEnabled } })),
      setJoystickSize: (joystickSize) =>
        set((state) => ({ settings: { ...state.settings, joystickSize } })),
      setJoystickOpacity: (joystickOpacity) =>
        set((state) => ({ settings: { ...state.settings, joystickOpacity } })),
      setHudScale: (hudScale) => set((state) => ({ settings: { ...state.settings, hudScale } })),
    }),
    {
      name: "project_m_app_v2",
      version: 2,
    }
  )
);
