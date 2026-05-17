import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected'));

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await client.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttl: number = 3600
): Promise<void> {
  try {
    await client.setEx(key, ttl, value);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await client.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

export async function cacheClear(pattern: string): Promise<void> {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get JSON error:', error);
    return null;
  }
}

export async function cacheSetJSON<T>(
  key: string,
  value: T,
  ttl: number = 3600
): Promise<void> {
  try {
    const jsonString = JSON.stringify(value);
    await client.setEx(key, ttl, jsonString);
  } catch (error) {
    console.error('Cache set JSON error:', error);
  }
}

// Ensure client is connected on module load
(async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

export async function closeClient(): Promise<void> {
  if (client.isOpen) {
    await client.quit();
  }
}

export default client;
