/**
 * Lightweight sliding-window rate limiter for Socket.IO events.
 * No external dependencies — uses a simple in-memory counter per socket.
 */

interface RateLimitRule {
  maxEvents: number;
  windowMs: number;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Cleanup stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}, 60_000);

/**
 * Check if a socket event should be allowed.
 * Returns `true` if allowed, `false` if rate-limited.
 */
export function checkRateLimit(socketId: string, eventName: string, rule: RateLimitRule): boolean {
  const key = `${socketId}:${eventName}`;
  const now = Date.now();

  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    // Window expired or first request — start fresh
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  if (entry.count >= rule.maxEvents) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Clean up all rate limit entries for a disconnected socket.
 */
export function cleanupSocket(socketId: string): void {
  for (const key of buckets.keys()) {
    if (key.startsWith(`${socketId}:`)) {
      buckets.delete(key);
    }
  }
}

// Pre-defined rate limit rules for each event
export const RATE_LIMITS = {
  'content:update': { maxEvents: 10, windowMs: 1_000 },     // 10/sec
  'file:upload':    { maxEvents: 3,  windowMs: 60_000 },     // 3/min
  'file:delete':    { maxEvents: 5,  windowMs: 60_000 },     // 5/min
  'room:join':      { maxEvents: 5,  windowMs: 10_000 },     // 5/10sec
  'room:set_ttl':   { maxEvents: 3,  windowMs: 60_000 },     // 3/min
  'room:destroy':   { maxEvents: 2,  windowMs: 60_000 },     // 2/min
} as const;
