export const TOKENS = {
  RedisClient: Symbol.for('RedisClient'),
  CacheService: Symbol.for('CacheService'),
  Logger: Symbol.for('Logger'),
  PasswordHasher: Symbol.for('PasswordHasher'),
  TokenService: Symbol.for('TokenService'),
} as const;
