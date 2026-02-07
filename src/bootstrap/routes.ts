import type { Router } from 'express';
import { createSSERoutes } from 'transports/sse/sse.routes';
import { createGithubRoutes } from 'transports/rest/github.routes';

export interface ModuleRoute {
  path: string;
  router: Router;
}

export function getModuleRoutes(): ModuleRoute[] {
  return [
    { path: '/', router: createSSERoutes() },
    { path: '/github', router: createGithubRoutes() },
  ];
}
