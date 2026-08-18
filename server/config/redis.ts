import Redis from "ioredis";
import { env } from "@config/env";

let client: Redis | null = null;
let hasLoggedUnavailable = false;

const isEnabled = Boolean(env.REDIS_URL);

const getClient = (): Redis | null => {
  if (!isEnabled) return null;
  if (client) return client;

  client = new Redis(env.REDIS_URL as string, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    lazyConnect: false,
    enableOfflineQueue: false,
  });

  client.on("error", (err) => {
    if (!hasLoggedUnavailable) {
      console.error(
        "Redis connection error (falling back to no-cache mode):",
        err.message
      );
      hasLoggedUnavailable = true;
    }
  });

  client.on("connect", () => {
    hasLoggedUnavailable = false;
    console.log("Redis connected");
  });

  return client;
};

export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
  const redis = getClient();
  if (!redis || redis.status !== "ready") return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> => {
  const redis = getClient();
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache write failures are non-fatal; the request continues to serve fresh data.
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  const redis = getClient();
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.del(key);
  } catch {
    // Non-fatal.
  }
};

const versionKey = (namespace: string) => `cache:version:${namespace}`;

export const getCacheVersion = async (namespace: string): Promise<number> => {
  const redis = getClient();
  if (!redis || redis.status !== "ready") return 0;
  try {
    const raw = await redis.get(versionKey(namespace));
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const bumpCacheVersion = async (namespace: string): Promise<void> => {
  const redis = getClient();
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.incr(versionKey(namespace));
  } catch {
    // Non-fatal: worst case the previous cached version stays live until its TTL expires.
  }
};

export const isCacheEnabled = (): boolean => isEnabled;