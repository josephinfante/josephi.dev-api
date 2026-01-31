import { inject, injectable } from 'tsyringe';
import { RedisClient } from '@cache/redis.client';
import type Redis from 'ioredis';
import { TOKENS } from '@shared/container/tokens';

@injectable()
export class CacheService {
  private redis: Redis;
  private subscriber: Redis;

  constructor(@inject(TOKENS.RedisClient) redisClient: RedisClient) {
    this.redis = redisClient.instance;
    this.subscriber = redisClient.instance.duplicate();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);

    if (ttlSeconds) {
      await this.redis.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, data);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /* ---------------- PUB/SUB ---------------- */

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(payload));
  }

  async subscribe(channel: string, handler: (data: any) => void): Promise<() => void> {
    const listener = (_: string, message: string) => {
      try {
        handler(JSON.parse(message));
      } catch {
        handler(message);
      }
    };

    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', listener);

    return async () => {
      await this.subscriber.unsubscribe(channel);
      this.subscriber.removeListener('message', listener);
    };
  }
}
