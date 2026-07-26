interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export function rateLimiter(key: string, options: RateLimitOptions): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > options.maxAttempts) {
    return true;
  }

  return false;
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}