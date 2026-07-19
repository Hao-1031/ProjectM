import type { SpriteSheet, SpriteAnimationState, BossId, MapTheme } from "./types";

const SPRITE_SIZE = 64;

function createCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (typeof document === "undefined") {
    return { canvas: {} as HTMLCanvasElement, ctx: {} as CanvasRenderingContext2D };
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");
  return { canvas, ctx };
}

function toDataUri(canvas: HTMLCanvasElement): string {
  if (typeof canvas.toDataURL !== "function") return "";
  return canvas.toDataURL("image/png");
}

function loadImage(dataUri: string): HTMLImageElement | null {
  if (typeof document === "undefined" || !dataUri) return null;
  const img = new Image();
  img.src = dataUri;
  return img;
}

function frame(x: number, y: number): { x: number; y: number; width: number; height: number } {
  return { x: x * SPRITE_SIZE, y: y * SPRITE_SIZE, width: SPRITE_SIZE, height: SPRITE_SIZE };
}

function generateFrames(row: number, count: number) {
  return Array.from({ length: count }, (_, i) => frame(i, row));
}

export function createPlayerSpriteSheet(primaryColor: string, secondaryColor: string): SpriteSheet {
  const { canvas, ctx } = createCanvas(SPRITE_SIZE * 4);

  const rows: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
  const frameCounts = { idle: 2, move: 4, attack: 3, hit: 2, death: 4 };

  rows.forEach((anim, rowIndex) => {
    for (let i = 0; i < frameCounts[anim]; i++) {
      const fx = i * SPRITE_SIZE;
      const fy = rowIndex * SPRITE_SIZE;
      const cx = fx + SPRITE_SIZE / 2;
      const cy = fy + SPRITE_SIZE / 2;

      ctx.clearRect(fx, fy, SPRITE_SIZE, SPRITE_SIZE);

      if (anim === "death") {
        const progress = i / (frameCounts.death - 1);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy + progress * 16,
          14 - progress * 10,
          8 - progress * 4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // Body
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator / weapon
        ctx.save();
        ctx.translate(cx, cy);
        if (anim === "attack") {
          ctx.rotate((i * Math.PI) / 4);
        }
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(8, -3, 14, 6);
        ctx.restore();

        // Movement bobbing
        if (anim === "move") {
          const bob = i % 2 === 0 ? -2 : 2;
          ctx.clearRect(fx, fy, SPRITE_SIZE, SPRITE_SIZE);
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(cx, cy + bob, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.translate(cx, cy + bob);
          ctx.fillStyle = secondaryColor;
          ctx.fillRect(8, -3, 14, 6);
          ctx.restore();
        }

        // Hit flash
        if (anim === "hit" && i === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.beginPath();
          ctx.arc(cx, cy, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  const dataUri = toDataUri(canvas);
  const animations: Record<
    SpriteAnimationState,
    { x: number; y: number; width: number; height: number }[]
  > = {
    idle: generateFrames(0, frameCounts.idle),
    move: generateFrames(1, frameCounts.move),
    attack: generateFrames(2, frameCounts.attack),
    hit: generateFrames(3, frameCounts.hit),
    death: generateFrames(4, frameCounts.death),
  };

  return {
    id: `player_${primaryColor.replace("#", "")}`,
    image: loadImage(dataUri),
    dataUri,
    frameWidth: SPRITE_SIZE,
    frameHeight: SPRITE_SIZE,
    animations,
  };
}

export function createEnemySpriteSheet(
  variant: string,
  primaryColor: string,
  secondaryColor: string
): SpriteSheet {
  const { canvas, ctx } = createCanvas(SPRITE_SIZE * 4);

  const rows: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
  const frameCounts = { idle: 2, move: 4, attack: 3, hit: 2, death: 4 };

  rows.forEach((anim, rowIndex) => {
    for (let i = 0; i < frameCounts[anim]; i++) {
      const fx = i * SPRITE_SIZE;
      const fy = rowIndex * SPRITE_SIZE;
      const cx = fx + SPRITE_SIZE / 2;
      const cy = fy + SPRITE_SIZE / 2;

      ctx.clearRect(fx, fy, SPRITE_SIZE, SPRITE_SIZE);

      if (anim === "death") {
        const progress = i / (frameCounts.death - 1);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14 + progress * 14);
        ctx.lineTo(cx + 14 - progress * 14, cy + 14 - progress * 14);
        ctx.lineTo(cx - 14 + progress * 14, cy + 14 - progress * 14);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        const shapeRadius = variant === "tank" ? 16 : variant === "runner" ? 11 : 13;
        ctx.fillStyle = primaryColor;

        if (variant === "spitter") {
          ctx.beginPath();
          ctx.moveTo(cx + shapeRadius, cy);
          ctx.lineTo(cx - shapeRadius / 2, cy - shapeRadius);
          ctx.lineTo(cx - shapeRadius / 2, cy + shapeRadius);
          ctx.closePath();
          ctx.fill();
        } else if (variant === "boss") {
          ctx.beginPath();
          for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI) / 4;
            const r = j % 2 === 0 ? shapeRadius + 4 : shapeRadius;
            ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, shapeRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyes / mouth
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy + 4, 2, 0, Math.PI * 2);
        ctx.fill();

        if (anim === "move") {
          const wobble = i % 2 === 0 ? -2 : 2;
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath();
          ctx.ellipse(cx + wobble, cy + shapeRadius + 4, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (anim === "attack") {
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, shapeRadius + 4 + i * 2, -0.3, 0.3);
          ctx.stroke();
        }

        if (anim === "hit" && i === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.arc(cx, cy, shapeRadius + 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  const dataUri = toDataUri(canvas);
  const animations: Record<
    SpriteAnimationState,
    { x: number; y: number; width: number; height: number }[]
  > = {
    idle: generateFrames(0, frameCounts.idle),
    move: generateFrames(1, frameCounts.move),
    attack: generateFrames(2, frameCounts.attack),
    hit: generateFrames(3, frameCounts.hit),
    death: generateFrames(4, frameCounts.death),
  };

  return {
    id: `enemy_${variant}_${primaryColor.replace("#", "")}`,
    image: loadImage(dataUri),
    dataUri,
    frameWidth: SPRITE_SIZE,
    frameHeight: SPRITE_SIZE,
    animations,
  };
}

export function createWeaponProjectileSprite(color: string): string {
  const { canvas, ctx } = createCanvas(32);
  const cx = 16;
  const cy = 16;

  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  return toDataUri(canvas);
}

export function createPickupSprite(type: string, color: string): string {
  const { canvas, ctx } = createCanvas(32);
  const cx = 16;
  const cy = 16;

  ctx.fillStyle = color;
  if (type === "chest") {
    ctx.fillRect(6, 10, 20, 14);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(14, 12, 4, 6);
  } else if (type === "health") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.bezierCurveTo(cx + 12, cy - 16, cx + 16, cy - 4, cx, cy + 10);
    ctx.bezierCurveTo(cx - 16, cy - 4, cx - 12, cy - 16, cx, cy - 10);
    ctx.fill();
  } else if (type === "resource") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx + 10, cy - 4);
    ctx.lineTo(cx + 6, cy + 10);
    ctx.lineTo(cx - 6, cy + 10);
    ctx.lineTo(cx - 10, cy - 4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  return toDataUri(canvas);
}

export function createBossSpriteSheet(
  id: BossId,
  primaryColor: string,
  secondaryColor: string
): SpriteSheet {
  const { canvas, ctx } = createCanvas(SPRITE_SIZE * 4);

  const rows: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
  const frameCounts = { idle: 2, move: 4, attack: 3, hit: 2, death: 4 };

  function drawBossShape(
    ox: number,
    oy: number,
    radius: number,
    anim: SpriteAnimationState,
    frame: number
  ) {
    let cx = ox;
    let cy = oy;
    let scale = 1;

    if (anim === "move") {
      scale = 1 + Math.sin(frame * 0.8) * 0.02;
      cy = oy + (frame % 2 === 0 ? -1 : 1);
    }

    if (anim === "attack") {
      cx = ox - frame * 1.5;
    }

    const sx = (x: number) => cx + x * scale;
    const sy = (y: number) => cy + y * scale;

    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;

    switch (id) {
      case "overlord": {
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3 - Math.PI / 6;
          const r = j % 2 === 0 ? radius + 6 : radius - 4;
          ctx.lineTo(sx(Math.cos(angle) * r), sy(Math.sin(angle) * r));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = secondaryColor;
        ctx.fill();
        break;
      }
      case "plaguebringer": {
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const angle = (j * Math.PI) / 4;
          const r = j % 2 === 0 ? radius + 5 : radius - 6;
          const wobble = Math.sin(angle * 3 + frame) * 2;
          ctx.lineTo(sx(Math.cos(angle) * (r + wobble)), sy(Math.sin(angle) * (r + wobble)));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = secondaryColor;
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI * 2) / 3 + frame * 0.3;
          ctx.beginPath();
          ctx.arc(
            sx(Math.cos(a) * radius * 0.4),
            sy(Math.sin(a) * radius * 0.4),
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        break;
      }
      case "titan": {
        ctx.fillRect(
          cx - radius * scale,
          cy - radius * 0.9 * scale,
          radius * 2 * scale,
          radius * 1.8 * scale
        );
        ctx.beginPath();
        ctx.moveTo(sx(-radius), sy(-radius * 0.9));
        ctx.lineTo(sx(radius), sy(-radius * 0.9));
        ctx.lineTo(sx(radius), sy(radius * 0.9));
        ctx.lineTo(sx(-radius), sy(radius * 0.9));
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(
          cx - radius * 0.25 * scale,
          cy - radius * 0.35 * scale,
          radius * 0.5 * scale,
          radius * 0.7 * scale
        );
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(sx(-radius), sy(-radius * 0.9));
        ctx.lineTo(cx, sy(-radius * 1.35));
        ctx.lineTo(sx(radius), sy(-radius * 0.9));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "ravager": {
        ctx.beginPath();
        ctx.moveTo(sx(radius + 4), cy);
        ctx.lineTo(sx(-radius * 0.6), sy(-radius));
        ctx.lineTo(sx(-radius * 0.3), cy);
        ctx.lineTo(sx(-radius * 0.6), sy(radius));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(sx(radius * 0.4), sy(-radius * 0.4));
        ctx.lineTo(sx(radius + 8), sy(-radius * 0.7));
        ctx.lineTo(sx(radius * 0.6), cy);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx(radius * 0.4), sy(radius * 0.4));
        ctx.lineTo(sx(radius + 8), sy(radius * 0.7));
        ctx.lineTo(sx(radius * 0.6), cy);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "siren": {
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
          const r = j % 2 === 0 ? radius + 2 : radius - 3;
          ctx.lineTo(sx(Math.cos(angle) * r), sy(Math.sin(angle) * r));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 1;
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.25 * k, -0.5, 0.5);
          ctx.stroke();
        }
        break;
      }
    }
  }

  rows.forEach((anim, rowIndex) => {
    for (let i = 0; i < frameCounts[anim]; i++) {
      const fx = i * SPRITE_SIZE;
      const fy = rowIndex * SPRITE_SIZE;
      const cx = fx + SPRITE_SIZE / 2;
      const cy = fy + SPRITE_SIZE / 2;

      ctx.clearRect(fx, fy, SPRITE_SIZE, SPRITE_SIZE);

      if (anim === "death") {
        const progress = i / (frameCounts.death - 1);
        const deathRadius = 22 * (1 - progress * 0.4);
        drawBossShape(cx, cy + progress * 12, deathRadius, anim, i);
      } else {
        drawBossShape(cx, cy, 22, anim, i);

        if (anim === "hit" && i === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  const dataUri = toDataUri(canvas);
  const animations: Record<
    SpriteAnimationState,
    { x: number; y: number; width: number; height: number }[]
  > = {
    idle: generateFrames(0, frameCounts.idle),
    move: generateFrames(1, frameCounts.move),
    attack: generateFrames(2, frameCounts.attack),
    hit: generateFrames(3, frameCounts.hit),
    death: generateFrames(4, frameCounts.death),
  };

  return {
    id: `boss_${id}`,
    image: loadImage(dataUri),
    dataUri,
    frameWidth: SPRITE_SIZE,
    frameHeight: SPRITE_SIZE,
    animations,
  };
}

export type DecorType = "crate" | "barrel" | "rock" | "plant" | "column" | "debris";

const THEME_PALETTES: Record<MapTheme, { primary: string; secondary: string; shadow: string }> = {
  industrial: { primary: "#57534e", secondary: "#a8a29e", shadow: "#292524" },
  frozen: { primary: "#93c5fd", secondary: "#e0f2fe", shadow: "#1e3a8a" },
  biohazard: { primary: "#86efac", secondary: "#bbf7d0", shadow: "#14532d" },
};

export function createDecorSprite(type: DecorType, theme: MapTheme = "industrial"): string {
  const { canvas, ctx } = createCanvas(64);
  const palette = THEME_PALETTES[theme];
  const cx = 32;
  const cy = 32;

  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.shadow;
  ctx.lineWidth = 2;

  switch (type) {
    case "crate": {
      ctx.fillRect(12, 12, 40, 40);
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(52, 12);
      ctx.lineTo(52, 52);
      ctx.lineTo(12, 52);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = palette.secondary;
      ctx.fillRect(28, 12, 8, 40);
      ctx.fillRect(12, 28, 40, 8);
      break;
    }
    case "barrel": {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = palette.secondary;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 10, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 14, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "rock": {
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 14);
      ctx.lineTo(cx - 8, cy - 18);
      ctx.lineTo(cx + 10, cy - 16);
      ctx.lineTo(cx + 18, cy + 6);
      ctx.lineTo(cx + 6, cy + 18);
      ctx.lineTo(cx - 14, cy + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = palette.shadow;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 4);
      ctx.lineTo(cx + 6, cy + 2);
      ctx.lineTo(cx + 2, cy + 10);
      ctx.lineTo(cx - 8, cy + 4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "plant": {
      ctx.strokeStyle = palette.shadow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 18);
      ctx.lineTo(cx - 10, cy);
      ctx.lineTo(cx - 14, cy - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + 18);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx + 12, cy - 12);
      ctx.stroke();
      ctx.fillStyle = palette.secondary;
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 12, cy - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "column": {
      ctx.fillRect(20, 8, 24, 48);
      ctx.beginPath();
      ctx.moveTo(20, 8);
      ctx.lineTo(44, 8);
      ctx.lineTo(44, 56);
      ctx.lineTo(20, 56);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = palette.secondary;
      ctx.fillRect(18, 6, 28, 6);
      ctx.fillRect(18, 52, 28, 6);
      break;
    }
    case "debris": {
      for (let i = 0; i < 5; i++) {
        const dx = (i % 3) * 12 - 8;
        const dy = Math.floor(i / 3) * 14 + 6;
        const size = 6 + (i % 3) * 2;
        ctx.fillRect(cx + dx, cy + dy - 16, size, size);
      }
      break;
    }
  }

  return toDataUri(canvas);
}

export type ParticleType = "explosion" | "spark" | "smoke" | "flash" | "ember" | "shockwave";

export function createParticleSprite(type: ParticleType, color: string): string {
  const { canvas, ctx } = createCanvas(32);
  const cx = 16;
  const cy = 16;

  switch (type) {
    case "explosion": {
      const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.3, color);
      gradient.addColorStop(1, "rgba(255,165,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "spark": {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const len = 4 + (i % 2) * 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
      break;
    }
    case "smoke": {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
      gradient.addColorStop(0, "rgba(120,120,120,0.6)");
      gradient.addColorStop(1, "rgba(80,80,80,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "flash": {
      const gradient = ctx.createRadialGradient(cx, cy, 4, cx, cy, 12);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ember": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "shockwave": {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }

  return toDataUri(canvas);
}

const spriteCache = new Map<string, SpriteSheet>();
const decorCache = new Map<string, string>();
const particleCache = new Map<string, string>();

export function getPlayerSprite(primaryColor: string, secondaryColor: string): SpriteSheet {
  const key = `player_${primaryColor}_${secondaryColor}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, createPlayerSpriteSheet(primaryColor, secondaryColor));
  }
  return spriteCache.get(key)!;
}

export function getEnemySprite(
  variant: string,
  primaryColor: string,
  secondaryColor: string
): SpriteSheet {
  const key = `enemy_${variant}_${primaryColor}_${secondaryColor}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, createEnemySpriteSheet(variant, primaryColor, secondaryColor));
  }
  return spriteCache.get(key)!;
}

export function getBossSprite(
  id: BossId,
  primaryColor: string,
  secondaryColor: string
): SpriteSheet {
  const key = `boss_${id}_${primaryColor}_${secondaryColor}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, createBossSpriteSheet(id, primaryColor, secondaryColor));
  }
  return spriteCache.get(key)!;
}

export function getDecorSprite(type: DecorType, theme: MapTheme = "industrial"): string {
  const key = `decor_${type}_${theme}`;
  if (!decorCache.has(key)) {
    decorCache.set(key, createDecorSprite(type, theme));
  }
  return decorCache.get(key)!;
}

export function getParticleSprite(type: ParticleType, color: string): string {
  const key = `particle_${type}_${color}`;
  if (!particleCache.has(key)) {
    particleCache.set(key, createParticleSprite(type, color));
  }
  return particleCache.get(key)!;
}

export function clearSpriteCache() {
  spriteCache.clear();
  decorCache.clear();
  particleCache.clear();
}
