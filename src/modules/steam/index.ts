import { container } from 'tsyringe';
import { TOKENS } from '@shared/container/tokens';
import { SteamRepository } from './steam.repository';

export function registerSteamModule() {
  container.registerSingleton(TOKENS.SteamRepository, SteamRepository);
}
