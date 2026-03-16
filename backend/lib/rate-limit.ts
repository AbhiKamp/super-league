// backend/lib/rate-limit.ts

type LimitTracker = {
  count: number;
  expiresAt: number;
};

// This Map acts as our lightweight, in-memory database!
const memoryStore = new Map<string, LimitTracker>();

export function checkRateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  // If this is their first request, or their old time window expired
  if (!record || record.expiresAt < now) {
    memoryStore.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { success: true };
  }

  // If they have exceeded the limit within the time window
  if (record.count >= limit) {
    return { success: false };
  }

  // Otherwise, increment their count and let them through
  record.count += 1;
  memoryStore.set(identifier, record);
  return { success: true };
}