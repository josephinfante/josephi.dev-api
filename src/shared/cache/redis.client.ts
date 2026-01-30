import { environment } from '@shared/config/environment';
import { logger } from '@shared/logger';
import Redis from 'ioredis';
import { injectable } from 'tsyringe';

@injectable()
export class RedisClient {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(environment.REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.client.on('connect', () => logger.info('🔌 Redis connected'));
    this.client.on('ready', () => logger.info('⚡ Redis ready'));
    this.client.on('error', (err) => logger.error({ err }, '❌ Redis error'));
    this.client.on('reconnecting', () => logger.warn('🔄 Redis reconnecting'));
    this.client.on('end', () => logger.warn('❗ Redis connection closed'));
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.quit();
  }

  get instance(): Redis {
    return this.client;
  }
}
