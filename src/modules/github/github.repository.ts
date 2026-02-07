import axios from 'axios';
import { injectable } from 'tsyringe';
import { environment } from '@shared/config/environment';
import { logger } from '@shared/logger';
import { ExternalServiceError } from '@error/infra/external-service.error';
import { NetworkError } from '@error/infra/network.error';
import type { ContributionCalendar, GraphQLResponse } from './github.types';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const LOGIN = 'josephinfante';
const QUERY = `query {
  user(login: "${LOGIN}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

@injectable()
export class GithubRepository {
  async fetchContributionCalendar(): Promise<ContributionCalendar> {
    try {
      const { data } = await axios.post<GraphQLResponse>(
        GITHUB_GRAPHQL_ENDPOINT,
        { query: QUERY },
        {
          headers: {
            Authorization: `Bearer ${environment.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          },
          timeout: 10000,
        },
      );

      if (data.errors?.length) {
        const messages = data.errors.map((err) => err.message);
        const isRateLimit = messages.some((message) =>
          message.toLowerCase().includes('rate limit'),
        );

        if (isRateLimit) {
          logger.warn('[GITHUB] Rate limit reached');
          throw new ExternalServiceError('GitHub API rate limit exceeded', 'github');
        }

        logger.error({ errors: data.errors }, '[GITHUB] GraphQL errors');
        throw new ExternalServiceError(messages[0] ?? 'GitHub API error', 'github');
      }

      const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;

      if (!calendar) {
        logger.error('[GITHUB] Missing contribution calendar in response');
        throw new ExternalServiceError('GitHub API returned no contribution data', 'github');
      }

      return calendar;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          logger.error({ error: error.message }, '[GITHUB] GitHub API unreachable');
          throw new NetworkError('GitHub API unreachable', error);
        }

        const status = error.response?.status;
        const remaining = error.response?.headers?.['x-ratelimit-remaining'];
        const message =
          typeof error.response?.data === 'object'
            ? JSON.stringify(error.response?.data)
            : error.message;

        if (status && (status === 403 || status === 429) && remaining === '0') {
          logger.warn('[GITHUB] Rate limit reached');
          throw new ExternalServiceError('GitHub API rate limit exceeded', 'github', error);
        }

        logger.error({ status, message }, '[GITHUB] GitHub API request failed');
        throw new ExternalServiceError('GitHub API request failed', 'github', error);
      }

      logger.error({ error }, '[GITHUB] Unexpected GitHub error');
      throw new NetworkError('GitHub API unreachable', error as Error);
    }
  }
}
