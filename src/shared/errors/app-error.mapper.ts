import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity } from '@error/app-error.i';
import { SystemError } from '@error/infra/system.error';

interface IRequestContext {
  correlationId?: string;
  method?: string;
  url?: string;
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

interface IMapperOptions {
  env: 'development' | 'production' | 'test';
  context?: IRequestContext;
}

export interface IErrorMapperResult {
  statusCode: number;
  safeResponse: Record<string, unknown>;
  logPayload: Record<string, unknown>;
}

export class ErrorMapper {
  static map(error: unknown, options: IMapperOptions): IErrorMapperResult {
    const { env, context } = options;

    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = ErrorMapper.fromNativeError(error, context);
    }

    const isValidation = appError.category === ErrorCategory.VALIDATION;

    const safeResponse: Record<string, unknown> = {
      name: appError.name,
      message: appError.message,
      statusCode: appError.statusCode,
      code: appError.code,
      ...(isValidation && { details: appError.metadata?.context }),
    };

    if (env !== 'production') {
      safeResponse.metadata = appError.metadata;
    }

    const logPayload = {
      name: appError.name,
      message: appError.message,
      statusCode: appError.statusCode,
      code: appError.code,
      severity: appError.severity,
      category: appError.category,
      metadata: {
        ...appError.metadata,
        request: context,
      },
    };

    return {
      statusCode: appError.statusCode,
      safeResponse,
      logPayload,
    };
  }

  static fromNativeError(error: unknown, context?: IRequestContext): AppError {
    const err = error instanceof Error ? error : new Error('Unknown error');

    return new SystemError('internal.server.error', err, {
      context: {
        originalMessage: err.message,
        stack: err.stack,
        ...context,
      },
    });
  }
}
