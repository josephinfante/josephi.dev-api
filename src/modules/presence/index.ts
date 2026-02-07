import { container } from 'tsyringe';
import { PresenceCache } from './presence.cache';
import { PresenceService } from './presence.service';
import { TOKENS } from '@shared/container/tokens';

export function registerPresenceModule() {
  container.registerSingleton(TOKENS.PresenceCache, PresenceCache);
  container.registerSingleton(PresenceService);
}
