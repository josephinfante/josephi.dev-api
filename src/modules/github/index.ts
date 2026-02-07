import { container } from 'tsyringe';
import { TOKENS } from '@shared/container/tokens';
import { GithubRepository } from './github.repository';
import { GithubService } from './github.service';

export function registerGithubModule() {
  container.registerSingleton(TOKENS.GithubRepository, GithubRepository);
  container.registerSingleton(GithubService);
}
