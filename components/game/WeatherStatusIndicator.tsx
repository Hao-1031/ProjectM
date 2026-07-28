import { motion, AnimatePresence } from "framer-motion";
import type { WeatherState, WeatherType } from "@/lib/game/weather";
import { getWeatherEffect, getWeatherDisplayName, getWeatherColor, getWeatherDescription } from "@/lib/game/weather";

interface WeatherStatusIndicatorProps {
  weatherState?: WeatherState;
  playerHealth: number;
  playerMaxHealth: number;
}

function getWeatherEmoji(type: WeatherType): string {
  switch (type) {
    case "clear": return "☀";
    case "sandstorm": return "🌪";
    case "thunderstorm": return "⚡";
    case "fog": return "🌫";
    case "acidRain": return "☣";
    case "blizzard": return "❄";
  }
}

export default function WeatherStatusIndicator({ weatherState, playerHealth, playerMaxHealth }: WeatherStatusIndicatorProps) {
  if (!weatherState) return null;

  const isTransitioning = weatherState.transitionProgress > 0;
  const activeType = isTransitioning ? weatherState.nextType : weatherState.type;
  const effect = getWeatherEffect(activeType);
  const hasDOT = effect.dotDamagePerSec > 0;
  const hasVision = effect.visionRange > 0 && effect.visionRange < 9999;
  const hasLightning = effect.lightningChancePerSec > 0;
  const hasSpeed = effect.playerSpeedMul < 0.95;

  const healthPercent = playerMaxHealth > 0 ? playerHealth / playerMaxHealth : 1;
  const isCritical = healthPercent < 0.3 && hasDOT;

  if (activeType === "clear") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="weather-status"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto absolute right-4 top-4 z-40 flex flex-col gap-2"
      >
        <div
          className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-panel/90 px-3.5 py-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
          style={{
            borderColor: isCritical ? "rgba(239,68,68,0.4)" : `${getWeatherColor(activeType)}20`,
          }}
        >
          <span className="text-lg">{getWeatherEmoji(activeType)}</span>
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold"
                style={{ color: getWeatherColor(activeType) }}
              >
                {getWeatherDisplayName(activeType)}
              </span>
              {isTransitioning && (
                <span className="font-mono text-[10px] text-muted">→ {getWeatherDisplayName(weatherState.nextType)}</span>
              )}
            </div>
            <span className="max-w-[160px] text-[10px] leading-relaxed text-muted">
              {getWeatherDescription(activeType)}
            </span>
          </div>
        </div>

        {/* Active effects badges */}
        <div className="flex flex-wrap gap-1.5">
          {hasDOT && (
            <motion.span
              animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-flex items-center gap-1 rounded-lg border border-danger/20 bg-danger/10 px-2 py-1 text-[10px] font-bold text-danger"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              {effect.dotDamagePerSec}/s DOT
            </motion.span>
          )}
          {hasVision && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-panel-raised/60 px-2 py-1 text-[10px] text-muted">
              视野 {effect.visionRange}px
            </span>
          )}
          {hasSpeed && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-panel-raised/60 px-2 py-1 text-[10px] text-muted">
              速度 -{Math.round((1 - effect.playerSpeedMul) * 100)}%
            </span>
          )}
          {hasLightning && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-entropy/20 bg-entropy/10 px-2 py-1 text-[10px] font-bold text-entropy">
              落雷
            </span>
          )}
          {effect.healingMul < 0.9 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-danger/10 bg-danger/5 px-2 py-1 text-[10px] text-danger">
              治疗 -{Math.round((1 - effect.healingMul) * 100)}%
            </span>
          )}
          {effect.damageMul !== 1 && (
            <span
              className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-panel-raised/60 px-2 py-1 text-[10px]"
              style={{ color: effect.damageMul > 1 ? "var(--danger)" : "var(--success)" }}
            >
              伤害 {effect.damageMul > 1 ? "+" : ""}{Math.round((effect.damageMul - 1) * 100)}%
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}