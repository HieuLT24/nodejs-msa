const getRedisClient = require('../config/redisClient');

const DEFAULT_TTL = 300; // seconds

/**
 * Cache-Aside: try Redis first; on miss (or Redis unavailable) fall back to the DB callback,
 * store the result in Redis, then return it.
 */
async function getOrSetCache(key, ttlSeconds, dbCallback) {
  const client = getRedisClient();

  try {
    if (!client.isOpen) await client.connect();
    const cached = await client.get(key);
    if (cached) {
      return { data: JSON.parse(cached), fromCache: true };
    }
  } catch (err) {
    // Redis down -> fall back to DB directly, don't fail the request
    console.error('Cache read failed, falling back to DB:', err.message);
  }

  const data = await dbCallback();

  try {
    if (client.isOpen) {
      await client.set(key, JSON.stringify(data), { EX: ttlSeconds || DEFAULT_TTL });
    }
  } catch (err) {
    console.error('Cache write failed:', err.message);
  }

  return { data, fromCache: false };
}

async function invalidateProductCache() {
  const client = getRedisClient();
  try {
    if (!client.isOpen) await client.connect();
    const keys = await client.keys('products:list:*');
    if (keys.length) await client.del(keys);
  } catch (err) {
    console.error('Cache invalidation failed:', err.message);
  }
}

module.exports = { getOrSetCache, invalidateProductCache };
