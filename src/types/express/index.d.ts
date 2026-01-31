import type { AuthContext } from '@shared/auth/auth.context';

/**
 * Express type augmentation (correct way)
 * This augments the real Request interface used by Express
 */
declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    auth?: AuthContext;
  }

  interface Response {
    success: (data?: any, meta?: any) => Response;
  }
}

export {};
