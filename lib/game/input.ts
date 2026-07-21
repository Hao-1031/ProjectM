import type { InputState, Vec2 } from "./types";

const KEYS: Record<string, Vec2> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
};

export interface JoystickState {
  active: boolean;
  origin: Vec2;
  current: Vec2;
  vector: Vec2;
}

export interface AimAssistConfig {
  enabled: boolean;
  strength: number;
  range: number;
  angle: number;
}

export interface AutoFireConfig {
  enabled: boolean;
  range: number;
}

interface TrackedTouch {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  role: "joystick";
}

export class InputManager {
  state: InputState = {
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    fire: false,
    pause: false,
    useSkill: false,
    useUltimate: false,
  };

  joystick: JoystickState = {
    active: false,
    origin: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    vector: { x: 0, y: 0 },
  };

  aimAssist: AimAssistConfig = {
    enabled: true,
    strength: 0.35,
    range: 260,
    angle: Math.PI / 3,
  };

  autoFire: AutoFireConfig = {
    enabled: true,
    range: 220,
  };

  private keys = new Set<string>();
  private pausePressed = false;
  private skillPressed = false;
  private ultimatePressed = false;
  private onPauseCallback?: () => void;

  // Multi-touch tracking. Only joystick touches are tracked internally.
  private touches = new Map<number, TrackedTouch>();
  private joystickTouchId: number | null = null;

  // Joystick is restricted to the left 55% of the screen below the top 18%
  // to avoid conflicting with HUD buttons on the right and top bar.
  private readonly JOYSTICK_DEADZONE = 0.08;
  private readonly JOYSTICK_MAX_RADIUS = 72;

  constructor(private element: HTMLElement) {
    this.bind();
  }

  onPause(cb: () => void) {
    this.onPauseCallback = cb;
  }

  setAimAssist(config: Partial<AimAssistConfig>) {
    this.aimAssist = { ...this.aimAssist, ...config };
  }

  setAutoFire(config: Partial<AutoFireConfig>) {
    this.autoFire = { ...this.autoFire, ...config };
  }

  setJoystickSize(size: "small" | "medium" | "large") {
    const radii = { small: 54, medium: 72, large: 92 };
    (this as unknown as Record<string, number>).__joystickMaxRadius = radii[size];
  }

  private getJoystickMaxRadius(): number {
    return (this as unknown as Record<string, number>).__joystickMaxRadius ?? this.JOYSTICK_MAX_RADIUS;
  }

  private isInteractive(target: HTMLElement): boolean {
    const tag = target.tagName.toLowerCase();
    if (
      tag === "button" ||
      tag === "a" ||
      tag === "input" ||
      tag === "select" ||
      tag === "textarea"
    ) {
      return true;
    }
    if (target.closest("button, a, input, select, textarea, [role='button']")) {
      return true;
    }
    if (target.getAttribute("data-touch-target") === "true") {
      return true;
    }
    return false;
  }

  private isInJoystickZone(x: number, y: number, rect: DOMRect): boolean {
    const nx = x / rect.width;
    const ny = y / rect.height;
    return nx < 0.55 && ny > 0.18;
  }

  bind() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.element.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.element.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.element.addEventListener("touchend", this.handleTouchEnd);
    this.element.addEventListener("touchcancel", this.handleTouchEnd);
  }

  unbind() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchmove", this.handleTouchMove);
    this.element.removeEventListener("touchend", this.handleTouchEnd);
    this.element.removeEventListener("touchcancel", this.handleTouchEnd);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (KEYS[e.key]) {
      this.keys.add(e.key);
      e.preventDefault();
    }
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      if (!this.pausePressed) {
        this.pausePressed = true;
        this.onPauseCallback?.();
      }
      e.preventDefault();
    }
    if (e.key === "e" || e.key === "E") {
      this.skillPressed = true;
      e.preventDefault();
    }
    if (e.key === "q" || e.key === "Q") {
      this.ultimatePressed = true;
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      this.pausePressed = false;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    const rect = this.element.getBoundingClientRect();
    let consumed = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const target = touch.target as HTMLElement | null;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Never hijack touches that start on interactive UI elements (buttons, links, inputs,
      // or elements explicitly marked as touch targets). Let them receive their own events.
      if (target && this.isInteractive(target)) {
        continue;
      }

      // Only claim touches inside the joystick zone. Right-side touches are left untouched
      // so skill buttons and other HUD controls can respond without interference.
      if (this.joystickTouchId !== null || !this.isInJoystickZone(x, y, rect)) {
        continue;
      }

      const tracked: TrackedTouch = {
        id: touch.identifier,
        startX: x,
        startY: y,
        x,
        y,
        role: "joystick",
      };
      this.touches.set(touch.identifier, tracked);
      this.joystickTouchId = touch.identifier;
      this.joystick.active = true;
      this.joystick.origin = { x, y };
      this.joystick.current = { x, y };
      this.joystick.vector = { x: 0, y: 0 };
      consumed = true;
    }

    if (consumed) {
      e.preventDefault();
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    const rect = this.element.getBoundingClientRect();
    let consumed = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const tracked = this.touches.get(touch.identifier);
      if (!tracked) continue;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      tracked.x = x;
      tracked.y = y;

      if (tracked.role === "joystick") {
        this.joystick.current = { x, y };
        consumed = true;
      }
    }

    if (consumed) {
      e.preventDefault();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    let consumed = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const tracked = this.touches.get(touch.identifier);
      if (!tracked) continue;

      if (tracked.role === "joystick" && this.joystickTouchId === touch.identifier) {
        this.joystickTouchId = null;
        this.joystick.active = false;
        this.joystick.vector = { x: 0, y: 0 };
        consumed = true;
      }

      this.touches.delete(touch.identifier);
    }

    if (consumed) {
      e.preventDefault();
    }
  };

  update() {
    let move = { x: 0, y: 0 };
    this.keys.forEach((key) => {
      const dir = KEYS[key];
      if (dir) {
        move.x += dir.x;
        move.y += dir.y;
      }
    });

    if (this.joystick.active) {
      const dx = this.joystick.current.x - this.joystick.origin.x;
      const dy = this.joystick.current.y - this.joystick.origin.y;
      const len = Math.hypot(dx, dy);
      const maxRadius = this.getJoystickMaxRadius();
      const scale = len > maxRadius ? maxRadius / len : 1;
      const nx = (dx * scale) / maxRadius;
      const ny = (dy * scale) / maxRadius;

      // Apply a small deadzone to prevent drift when the finger is near the origin.
      const deadzone = this.JOYSTICK_DEADZONE;
      const finalLen = Math.hypot(nx, ny);
      if (finalLen < deadzone) {
        this.joystick.vector = { x: 0, y: 0 };
      } else {
        const adjusted = (finalLen - deadzone) / (1 - deadzone);
        this.joystick.vector = {
          x: (nx / finalLen) * adjusted,
          y: (ny / finalLen) * adjusted,
        };
      }

      move.x += this.joystick.vector.x;
      move.y += this.joystick.vector.y;
    }

    this.state.useSkill = this.skillPressed;
    this.state.useUltimate = this.ultimatePressed;
    this.skillPressed = false;
    this.ultimatePressed = false;

    const len = Math.hypot(move.x, move.y);
    if (len > 1) {
      move.x /= len;
      move.y /= len;
    }

    this.state.move = move;
    this.state.aim = { ...move };
    this.state.fire = len > 0.1;
  }

  /**
   * Apply aim assist and auto-fire using current game world state.
   * Should be called after update() each frame.
   */
  applyAimAssist(
    playerX: number,
    playerY: number,
    enemies: ReadonlyArray<{ x: number; y: number; radius: number; health: number }>,
    dt: number
  ) {
    // Auto-fire: if moving and an enemy is within range, set fire true.
    if (this.autoFire.enabled) {
      let nearestDist = Infinity;
      for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - playerX, enemy.y - playerY) - enemy.radius;
        if (dist < nearestDist) nearestDist = dist;
      }
      if (nearestDist <= this.autoFire.range) {
        this.state.fire = true;
      }
    }

    // Aim assist: gently nudge aim vector toward the nearest enemy in front.
    if (!this.aimAssist.enabled || enemies.length === 0) return;

    const aimAngle = Math.atan2(this.state.aim.y, this.state.aim.x);
    let bestEnemy: { x: number; y: number; score: number } | null = null;

    for (const enemy of enemies) {
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const dist = Math.hypot(dx, dy) - enemy.radius;
      if (dist > this.aimAssist.range || dist <= 0) continue;

      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - aimAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) > this.aimAssist.angle) continue;

      // Prefer closer, more centered enemies.
      const centerScore = 1 - Math.abs(angleDiff) / this.aimAssist.angle;
      const rangeScore = 1 - dist / this.aimAssist.range;
      const score = centerScore * 0.6 + rangeScore * 0.4;

      if (!bestEnemy || score > bestEnemy.score) {
        bestEnemy = { x: enemy.x, y: enemy.y, score };
      }
    }

    if (!bestEnemy) return;

    const dx = bestEnemy.x - playerX;
    const dy = bestEnemy.y - playerY;
    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - aimAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const assistRate = this.aimAssist.strength * Math.min(1, dt * 12);
    const newAngle = aimAngle + angleDiff * assistRate;
    this.state.aim = {
      x: Math.cos(newAngle),
      y: Math.sin(newAngle),
    };
  }
}
