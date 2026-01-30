import { APP_ERROR_KEYS } from '@error/app-error.keys';
import { EnvironmentError } from '@error/infra/environment.error';
import { zodErrorMapper } from '@shared/helpers/zod-error-mapper';
import z from 'zod';

export type NODE_ENV = 'development' | 'production';
export type LOG_LEVEL = 'debug' | 'info' | 'warn' | 'error';

export interface IEnvironmentVariables {
  NODE_ENV: NODE_ENV;
  PORT: number;
  ACCEPTED_ORIGINS?: string;
  LOG_LEVEL?: LOG_LEVEL;
  DB_URL: string;
  DB_SSL: boolean;
  REDIS_URL: string;
  APP_VERSION?: string;
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  PORT: z.coerce.number().min(1).max(65535),

  ACCEPTED_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),

  DB_URL: z
    .string()
    .min(1)
    .refine((v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    }, 'DB_URL must be a valid database URL'),
  DB_SSL: z.coerce.boolean(),
  REDIS_URL: z
    .string()
    .min(1)
    .refine((v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    }, 'REDIS_URL must be a valid Redis URL'),
  APP_VERSION: z.string().optional().default('1.0.0'),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const errors = zodErrorMapper(result.error);

  console.error(`❌ ${APP_ERROR_KEYS.ENV_INVALID_VARIABLES}`, errors);

  throw new EnvironmentError(APP_ERROR_KEYS.ENV_INVALID_VARIABLES, undefined, {
    context: {
      errors,
    },
  });
}

export const environment: IEnvironmentVariables = result.data;
