import type { Router } from 'express';
import { createSSERoutes } from 'transports/sse/sse.routes';

export interface ModuleRoute {
  path: string;
  router: Router;
}

export function getModuleRoutes(): ModuleRoute[] {
  return [{ path: '/', router: createSSERoutes() }];
}
