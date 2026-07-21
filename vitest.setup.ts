import "@testing-library/jest-dom";
import { useEffect } from "react";
import { vi } from "vitest";

class MockHowl {
  private _playing = false;
  play = vi.fn(() => {
    this._playing = true;
    return 0;
  });
  stop = vi.fn(() => {
    this._playing = false;
  });
  pause = vi.fn();
  playing = vi.fn(() => this._playing);
  volume = vi.fn((value?: number) => (value === undefined ? 1 : undefined));
  mute = vi.fn();
  unload = vi.fn();
  loop = vi.fn();
  rate = vi.fn((value?: number) => (value === undefined ? 1 : undefined));
  pos = vi.fn((x?: number, y?: number, z?: number) => {
    if (x === undefined) return { x: 0, y: 0, z: 0 };
    return undefined;
  });
  stereo = vi.fn((value?: number) => (value === undefined ? 0 : undefined));
}

const MockHowler = {
  mute: vi.fn(),
  volume: vi.fn(),
  unload: vi.fn(),
  pos: vi.fn(),
};

vi.mock("howler", () => ({
  Howl: MockHowl,
  Howler: MockHowler,
}));

class MockLocalStorage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MockLocalStorage(),
  writable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockCanvasGradient {
  stops: { offset: number; color: string }[] = [];

  addColorStop(offset: number, color: string): void {
    this.stops.push({ offset, color });
  }
}

class MockCanvasRenderingContext2D {
  fillStyle: string | CanvasGradient = "#000000";
  strokeStyle: string | CanvasGradient = "#000000";
  lineWidth = 1;
  globalAlpha = 1;

  private path: { x: number; y: number }[] = [];

  clearRect(_x: number, _y: number, _w: number, _h: number): void {}
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}

  beginPath(): void {
    this.path = [];
  }

  arc(x: number, y: number, _radius: number, _startAngle: number, _endAngle: number): void {
    this.path.push({ x, y });
  }

  ellipse(
    x: number,
    y: number,
    _rx: number,
    _ry: number,
    _rotation: number,
    _start: number,
    _end: number
  ): void {
    this.path.push({ x, y });
  }

  moveTo(x: number, y: number): void {
    this.path.push({ x, y });
  }

  lineTo(x: number, y: number): void {
    this.path.push({ x, y });
  }

  closePath(): void {}
  fill(): void {}
  stroke(): void {}
  save(): void {}
  restore(): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}

  createRadialGradient(
    _x0: number,
    _y0: number,
    _r0: number,
    _x1: number,
    _y1: number,
    _r1: number
  ): CanvasGradient {
    return new MockCanvasGradient() as unknown as CanvasGradient;
  }

  bezierCurveTo(
    _cp1x: number,
    _cp1y: number,
    _cp2x: number,
    _cp2y: number,
    _x: number,
    _y: number
  ): void {}
}

const originalCreateElement = document.createElement.bind(document);

function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;
  (
    canvas as unknown as { getContext: (type: string) => MockCanvasRenderingContext2D | null }
  ).getContext = (type: string) => {
    if (type === "2d")
      return new MockCanvasRenderingContext2D() as unknown as MockCanvasRenderingContext2D;
    return null;
  };
  (canvas as unknown as { toDataURL: () => string }).toDataURL = () => "data:image/png;base64,mock";
  return canvas;
}

document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
  if (tagName.toLowerCase() === "canvas") {
    return createMockCanvas(300, 150);
  }
  return originalCreateElement(tagName, options);
}) as typeof document.createElement;

interface MockTween {
  fromTo: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  restart: ReturnType<typeof vi.fn>;
  reverse: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
  progress: ReturnType<typeof vi.fn>;
}

const mockTween: MockTween = {
  fromTo: vi.fn(() => mockTween),
  to: vi.fn(() => mockTween),
  kill: vi.fn(),
  pause: vi.fn(),
  play: vi.fn(),
  restart: vi.fn(),
  reverse: vi.fn(),
  seek: vi.fn(),
  progress: vi.fn(),
};

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    to: vi.fn(() => mockTween),
    fromTo: vi.fn(() => mockTween),
    timeline: vi.fn(() => mockTween),
    utils: {
      toArray: vi.fn(() => []),
    },
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: vi.fn(),
    getAll: vi.fn(() => []),
    killAll: vi.fn(),
  },
}));

vi.mock("@gsap/react", () => ({
  useGSAP: (fn: () => void) => {
    useEffect(() => {
      fn();
    }, []);
  },
}));

class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin = "0px";
  thresholds: readonly number[] = [0];

  constructor(private callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ],
      this
    );
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  value: MockIntersectionObserver,
  writable: true,
});
