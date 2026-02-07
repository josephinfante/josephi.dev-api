import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GithubService } from '@modules/github/github.service';

export async function githubContributionsController(req: Request, res: Response) {
  const githubService = container.resolve(GithubService);
  const contributions = await githubService.getContributions();

  res.json({
    success: true,
    data: contributions,
  });
}
