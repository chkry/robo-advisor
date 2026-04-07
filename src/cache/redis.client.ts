import Redis from 'ioredis';
import config from '../config/app.config';

const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('  \x1b[32m✓\x1b[0m Redis connected');
});

export default redis;
