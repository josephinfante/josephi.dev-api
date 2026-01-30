import type { Router } from 'express';

export interface ModuleRoute {
  path: string;
  router: Router;
}

export function getModuleRoutes(): ModuleRoute[] {
  return [];
}
