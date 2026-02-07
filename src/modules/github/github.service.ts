import { inject, injectable } from 'tsyringe';
import type { CacheService } from '@shared/cache';
import { TOKENS } from '@shared/container/tokens';
import type { NormalizedContributions } from './github.types';
import type { GithubRepository } from './github.repository';

const CACHE_KEY = 'github:contributions:josephinfante';
const CACHE_TTL_SECONDS = 3600;

@injectable()
export class GithubService {
  constructor(
    @inject(TOKENS.CacheService) private cache: CacheService,
    @inject(TOKENS.GithubRepository) private repository: GithubRepository,
  ) {}

  async getContributions(): Promise<NormalizedContributions> {
    const cached = await this.cache.get<NormalizedContributions>(CACHE_KEY);

    if (cached) {
      return cached;
    }

    const calendar = await this.repository.fetchContributionCalendar();
    const days = calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      })),
    );

    const normalized: NormalizedContributions = {
      totalContributions: calendar.totalContributions,
      days,
    };

    await this.cache.set(CACHE_KEY, normalized, CACHE_TTL_SECONDS);

    return normalized;
  }
}
