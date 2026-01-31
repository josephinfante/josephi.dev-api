import { environment } from '@shared/config/environment';
import { APP_ERROR_KEYS } from '@shared/errors/app-error.keys';
import { AuthorizationError } from '@shared/errors/domain/authorization.error';
import cors from 'cors';

const rawOrigins = environment.ACCEPTED_ORIGINS;
const ACCEPTED_ORIGINS =
  typeof rawOrigins === 'string'
    ? rawOrigins.split(',').map((o) => o.trim())
    : Array.isArray(rawOrigins)
      ? rawOrigins
      : [];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ACCEPTED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(
      new AuthorizationError({
        key: APP_ERROR_KEYS.AUTH_CORS_NOT_ALLOWED,
        additionalMetadata: {
          context: { origin },
        },
      }),
    );
  },
  credentials: false,
});
