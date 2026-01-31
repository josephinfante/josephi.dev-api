export const TOKENS = {
  RedisClient: Symbol.for('RedisClient'),
  CacheService: Symbol.for('CacheService'),
  Logger: Symbol.for('Logger'),
  PasswordHasher: Symbol.for('PasswordHasher'),
  TokenService: Symbol.for('TokenService'),
  PresenceCache: Symbol.for('PresenceCache'),

  MusicRepository: Symbol.for('MusicRepository'),
} as const;
