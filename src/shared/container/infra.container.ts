import { container } from 'tsyringe';
import { TOKENS } from './tokens';
import { CacheService, RedisClient } from '@shared/cache';
import { logger } from '@shared/logger';

export function registerInfrastructure() {
  container.registerSingleton(TOKENS.RedisClient, RedisClient);
  container.registerSingleton(TOKENS.CacheService, CacheService);
  container.registerInstance(TOKENS.Logger, logger);
}
