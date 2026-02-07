import { environment } from '@shared/config/environment';
import { ErrorMapper } from '@shared/errors/app-error.mapper';
import { logger } from '@shared/logger';
import type { NextFunction, Request, Response } from 'express';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const { statusCode, safeResponse, logPayload } = ErrorMapper.map(err, {
    env: environment.NODE_ENV,
    context: {
      correlationId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  });

  // Logging siempre
  logger.error(logPayload, `[${safeResponse.code}] ${safeResponse.message}`);

  res.status(statusCode).json({
    success: false,
    error: safeResponse,
  });
}
