export interface OverloadShieldState {
  available: boolean;
  triggered: boolean;
  healPercent: number;
  clearRadius: number;
  invincibleSec: number;
}

export function createOverloadShield(): OverloadShieldState {
  return {
    available: true,
    triggered: false,
    healPercent: 0.33,
    clearRadius: 450,
    invincibleSec: 5,
  };
}

export function canTriggerShield(
  shield: OverloadShieldState,
  coreHealth: number,
  maxCoreHealth: number
): boolean {
  return shield.available && coreHealth <= 0 && maxCoreHealth > 0;
}

export interface ShieldTriggerResult {
  newCoreHealth: number;
  clearRadius: number;
  invincibleSec: number;
}

export function triggerShield(
  shield: OverloadShieldState,
  maxCoreHealth: number
): ShieldTriggerResult {
  shield.available = false;
  shield.triggered = true;

  return {
    newCoreHealth: Math.floor(maxCoreHealth * shield.healPercent),
    clearRadius: shield.clearRadius,
    invincibleSec: shield.invincibleSec,
  };
}

export interface OverloadShieldTarget {
  core: { x: number; y: number; health: number; maxHealth: number };
}

export interface OverloadShieldEnemy {
  x: number;
  y: number;
  health: number;
}

/**
 * 触发极限生存过载护盾：恢复核心生命值并清除核心周围敌人。
 */
export function triggerOverloadShield(
  ds: OverloadShieldTarget,
  enemies: OverloadShieldEnemy[],
  healAmount: number
): void {
  ds.core.health = Math.min(ds.core.maxHealth, Math.floor(healAmount));
  const clearRadius = 450;
  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - ds.core.x, enemy.y - ds.core.y);
    if (dist <= clearRadius) {
      enemy.health = 0;
    }
  }
}
