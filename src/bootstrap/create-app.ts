import type { Application } from 'express';
import express from 'express';
import { helmetMiddleware } from '@bootstrap/middlewares/helmet.middleware';
import { requestIdMiddleware } from '@bootstrap/middlewares/request-id.middleware';
import { requestLoggerMiddleware } from '@bootstrap/middlewares/request-logger.middleware';
import { errorMiddleware } from '@bootstrap/middlewares/error.middleware';
import { getModuleRoutes } from './routes';
import { corsMiddleware } from '@bootstrap/middlewares/cors.middleware';

export function createApp() {
  const app: Application = express();

  app.set('trust proxy', true);

  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  const moduleRoutes = getModuleRoutes();
  for (const { path, router } of moduleRoutes) {
    app.use(path, router);
  }

  app.use(errorMiddleware);

  return app;
}
