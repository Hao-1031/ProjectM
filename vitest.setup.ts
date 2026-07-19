import "@testing-library/jest-dom";

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
