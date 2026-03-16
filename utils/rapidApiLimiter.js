// utils/rapidApiLimiter.js
// Tracks monthly RapidAPI call count in Redis.
// Blocks requests once the monthly cap is reached.

const Redis = require('ioredis');

const MONTHLY_CAP = parseInt(process.env.RAPIDAPI_MONTHLY_CAP, 10) || 29990;

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('error', (err) => {
      console.error('[RapidAPI Limiter] Redis error:', err.message);
    });
  }
  return redis;
}

/**
 * Returns the Redis key for the current month, e.g. "rapidapi:calls:2026-03"
 */
function monthlyKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `rapidapi:calls:${y}-${m}`;
}

/**
 * Returns seconds until end of current UTC month (used as Redis TTL).
 */
function secondsUntilEndOfMonth() {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.ceil((nextMonth - now) / 1000);
}

/**
 * Checks if the monthly cap is reached, then increments the counter.
 * Throws an error with HTTP 429 status if the cap is exceeded.
 * Falls through silently if Redis is unavailable (fail-open).
 */
async function checkAndIncrement() {
  const client = getRedis();
  const key = monthlyKey();

  try {
    await client.connect().catch(() => {}); // no-op if already connected

    const current = await client.get(key);
    const count = parseInt(current, 10) || 0;

    if (count >= MONTHLY_CAP) {
      const err = new Error(`Monthly RapidAPI call limit of ${MONTHLY_CAP} reached. Resets next month.`);
      err.status = 429;
      throw err;
    }

    // Atomically increment and set TTL on first call of the month
    const newCount = await client.incr(key);
    if (newCount === 1) {
      await client.expire(key, secondsUntilEndOfMonth());
    }
  } catch (err) {
    if (err.status === 429) throw err; // re-throw our own limit error

    // Redis unavailable — log and fail-open (allow the call)
    console.warn('[RapidAPI Limiter] Redis unavailable, skipping limit check:', err.message);
  }
}

/**
 * Returns the current month's call count and remaining quota.
 */
async function getStats() {
  const client = getRedis();
  const key = monthlyKey();

  try {
    await client.connect().catch(() => {});
    const current = await client.get(key);
    const used = parseInt(current, 10) || 0;
    return { used, cap: MONTHLY_CAP, remaining: Math.max(0, MONTHLY_CAP - used) };
  } catch {
    return { used: null, cap: MONTHLY_CAP, remaining: null, error: 'Redis unavailable' };
  }
}

module.exports = { checkAndIncrement, getStats };
