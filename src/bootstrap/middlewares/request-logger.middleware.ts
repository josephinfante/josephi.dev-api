import { logger } from '@shared/logger';
import type { NextFunction, Request, Response } from 'express';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId;

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        clientIp: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
      'HTTP Request Completed',
    );
  });

  next();
}
