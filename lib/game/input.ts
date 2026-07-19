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

export class InputManager {
  state: InputState = {
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    fire: false,
    pause: false,
  };

  joystick: JoystickState = {
    active: false,
    origin: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    vector: { x: 0, y: 0 },
  };

  private keys = new Set<string>();
  private pausePressed = false;
  private onPauseCallback?: () => void;

  constructor(private element: HTMLElement) {
    this.bind();
  }

  onPause(cb: () => void) {
    this.onPauseCallback = cb;
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
    return false;
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
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      this.pausePressed = false;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const target = touch.target as HTMLElement | null;
    if (target && this.isInteractive(target)) {
      return;
    }
    e.preventDefault();
    const rect = this.element.getBoundingClientRect();
    this.joystick.active = true;
    this.joystick.origin = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    this.joystick.current = { ...this.joystick.origin };
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.joystick.active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.element.getBoundingClientRect();
    this.joystick.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    this.joystick.active = false;
    this.joystick.vector = { x: 0, y: 0 };
    this.joystick.current = { ...this.joystick.origin };
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
      const maxRadius = 60;
      const len = Math.hypot(dx, dy);
      const scale = len > maxRadius ? maxRadius / len : 1;
      this.joystick.vector = {
        x: (dx * scale) / maxRadius,
        y: (dy * scale) / maxRadius,
      };
      move.x += this.joystick.vector.x;
      move.y += this.joystick.vector.y;
    }

    const len = Math.hypot(move.x, move.y);
    if (len > 1) {
      move.x /= len;
      move.y /= len;
    }

    this.state.move = move;
    this.state.aim = { ...move };
    this.state.fire = len > 0.1;
  }
}
