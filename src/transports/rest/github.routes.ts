import { Router } from 'express';
import { githubContributionsController } from './github.controller';

export function createGithubRoutes() {
  const router = Router();

  router.get('/contributions', githubContributionsController);

  return router;
}
