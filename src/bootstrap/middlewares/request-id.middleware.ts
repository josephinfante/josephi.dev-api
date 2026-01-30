import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'];

  const requestId = typeof existingId === 'string' && existingId.length > 0 ? existingId : uuidv4();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
}
