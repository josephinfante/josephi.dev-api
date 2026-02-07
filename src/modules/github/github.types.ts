export interface Root {
  data: Data;
}

export interface Data {
  user: User;
}

export interface User {
  contributionsCollection: ContributionsCollection;
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: Week[];
}

export interface Week {
  contributionDays: ContributionDay[];
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface NormalizedContributions {
  totalContributions: number;
  days: { date: string; count: number }[];
}

export interface GraphQLError {
  message: string;
  type?: string;
}

export interface GraphQLResponse extends Root {
  errors?: GraphQLError[];
}
