/**
 * Keys convention
 *
 * Format:
 *   inboxly:{scope}:{resource}:{id?}:{extra?}
 */
const PREFIX = 'inboxly';

export const CacheKeys = {
  // =========================
  // Users
  // =========================
  userById: (orgId: string, userId: string) => `${PREFIX}:org:${orgId}:user:${userId}`,
  userByEmail: (email: string) => `${PREFIX}:user:email:${email}`,

  // =========================
  // Organizations
  // =========================
  organizationById: (orgId: string) => `${PREFIX}:org:${orgId}`,

  // =========================
  // Auth / Sessions
  // =========================
  sessionByToken: (token: string) => `${PREFIX}:session:${token}`,

  // =========================
  // Rate limit
  // =========================
  rateLimit: (key: string) => `${PREFIX}:ratelimit:${key}`,
};
