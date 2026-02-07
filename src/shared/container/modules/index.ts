import { registerMusicModule } from '@modules/music';
import { registerPresenceModule } from '@modules/presence';
import { registerSteamModule } from '@modules/steam';
import { registerGithubModule } from '@modules/github';

export function registerAllModules() {
  registerPresenceModule();
  registerMusicModule();
  registerSteamModule();
  registerGithubModule();
}
