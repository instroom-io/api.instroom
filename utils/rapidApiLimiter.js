// utils/rapidApiLimiter.js
// Tracks monthly RapidAPI call count in Redis.
// Blocks requests once the monthly cap is reached.

const Redis = require('ioredis');

const MONTHLY_CAP = parseInt(process.env.RAPIDAPI_MONTHLY_CAP, 10) || 29990;
const BILLING_CYCLE_DAY = parseInt(process.env.RAPIDAPI_BILLING_DAY, 10) || 16;

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
 * Returns the start date of the current billing cycle based on BILLING_CYCLE_DAY.
 * e.g. if BILLING_CYCLE_DAY=16 and today is Apr 20 → Apr 16
 *      if BILLING_CYCLE_DAY=16 and today is Apr 10 → Mar 16
 */
function billingCycleStart() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (d >= BILLING_CYCLE_DAY) {
    return new Date(Date.UTC(y, m, BILLING_CYCLE_DAY));
  }
  return new Date(Date.UTC(y, m - 1, BILLING_CYCLE_DAY));
}

/**
 * Returns the Redis key for the current billing cycle, e.g. "rapidapi:calls:2026-03-16"
 */
function monthlyKey() {
  const start = billingCycleStart();
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, '0');
  const d = String(start.getUTCDate()).padStart(2, '0');
  return `rapidapi:calls:${y}-${m}-${d}`;
}

/**
 * Returns seconds until the next billing cycle reset date (used as Redis TTL).
 */
function secondsUntilEndOfCycle() {
  const now = new Date();
  const start = billingCycleStart();
  const nextReset = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, BILLING_CYCLE_DAY));
  return Math.ceil((nextReset - now) / 1000);
}

/**
 * Checks if the monthly cap is reached, then increments the counter by `amount`.
 * Throws an error with HTTP 429 status if the cap is exceeded.
 * Falls through silently if Redis is unavailable (fail-open).
 * @param {string} [tag] - Optional tag for per-endpoint tracking (e.g. 'instroomApp', 'instroomExtension')
 * @param {number} [amount=1] - Number of calls to reserve
 * @param {string} [subtag] - Optional subtag for granular breakdown within a tag (e.g. 'users', 'hashtags')
 */
async function checkAndIncrement(tag, amount = 1, subtag) {
  const client = getRedis();
  const key = monthlyKey();

  try {
    await client.connect().catch(() => {}); // no-op if already connected

    // Single pipeline: GET current count + INCRBY + tag INCRBY + subtag INCRBY (1 round trip)
    const ttl = secondsUntilEndOfCycle();
    const pipe = client.pipeline();
    pipe.get(key);
    pipe.incrby(key, amount);
    if (tag) pipe.incrby(`${key}:${tag}`, amount);
    if (tag && subtag) pipe.incrby(`${key}:${tag}:${subtag}`, amount);
    const results = await pipe.exec();

    const current = parseInt(results[0][1], 10) || 0;
    if (current + amount > MONTHLY_CAP) {
      // Rollback the increments
      const rollback = client.pipeline();
      rollback.decrby(key, amount);
      if (tag) rollback.decrby(`${key}:${tag}`, amount);
      if (tag && subtag) rollback.decrby(`${key}:${tag}:${subtag}`, amount);
      await rollback.exec();

      const nextReset = new Date(billingCycleStart());
      nextReset.setUTCMonth(nextReset.getUTCMonth() + 1);
      const err = new Error(`Monthly RapidAPI call limit of ${MONTHLY_CAP} reached. Resets on ${nextReset.toISOString().split('T')[0]}.`);
      err.status = 429;
      throw err;
    }

    // Set TTL on first call of the cycle
    const newCount = parseInt(results[1][1], 10);
    if (newCount === amount) {
      const ttlPipe = client.pipeline();
      ttlPipe.expire(key, ttl);
      if (tag) ttlPipe.expire(`${key}:${tag}`, ttl);
      if (tag && subtag) ttlPipe.expire(`${key}:${tag}:${subtag}`, ttl);
      await ttlPipe.exec();
    }
  } catch (err) {
    if (err.status === 429) throw err;
    console.warn('[RapidAPI Limiter] Redis unavailable, skipping limit check:', err.message);
  }
}

/**
 * Returns the current month's call count, remaining quota, and per-endpoint breakdown.
 */
async function getStats() {
  const client = getRedis();
  const key = monthlyKey();

  try {
    await client.connect().catch(() => {});

    // Fetch all counters in a single pipeline
    const pipe = client.pipeline();
    pipe.get(key);
    pipe.get(`${key}:instroomApp`);
    pipe.get(`${key}:instroomExtension`);
    pipe.get(`${key}:instroomApp:users`);
    pipe.get(`${key}:instroomApp:similar`);
    pipe.get(`${key}:instroomApp:hashtags`);
    pipe.get(`${key}:instroomApp:locations`);
    pipe.get(`${key}:instroomApp:posts`);
    const results = await pipe.exec();

    const parse = (i) => parseInt(results[i][1], 10) || 0;
    const used = parse(0);

    const start = billingCycleStart();
    const nextReset = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, BILLING_CYCLE_DAY));

    return {
      used,
      cap: MONTHLY_CAP,
      remaining: Math.max(0, MONTHLY_CAP - used),
      cycleStart: start.toISOString().split('T')[0],
      cycleEnd: nextReset.toISOString().split('T')[0],
      breakdown: {
        instroomApp: {
          total: parse(1),
          users: parse(3),
          similar: parse(4),
          hashtags: parse(5),
          locations: parse(6),
          posts: parse(7),
        },
        instroomExtension: parse(2),
      }
    };
  } catch {
    return { used: null, cap: MONTHLY_CAP, remaining: null, breakdown: null, error: 'Redis unavailable' };
  }
}

module.exports = { checkAndIncrement, getStats };
