import { container } from 'tsyringe';
import { MusicRepository } from './music.repository';
import { TOKENS } from '@shared/container/tokens';

export function registerMusicModule() {
  container.registerSingleton(TOKENS.MusicRepository, MusicRepository);
}
