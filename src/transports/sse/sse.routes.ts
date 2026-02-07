import { Router } from 'express';
import { sseController } from './sse.controller';

export function createSSERoutes() {
  const router = Router();

  router.get('/presence/stream', sseController);

  return router;
}
