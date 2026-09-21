const redis = require('redis');

let client = null;

function getRedisClient() {
  if (!client) {
    client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => console.error('Redis Client Error', err));
  }
  return client;
}

module.exports = getRedisClient;
