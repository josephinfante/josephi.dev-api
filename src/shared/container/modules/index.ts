import { registerMusicModule } from '@modules/music';
import { registerPresenceModule } from '@modules/presence';
import { registerSteamModule } from '@modules/steam';

export function registerAllModules() {
  registerPresenceModule();
  registerMusicModule();
  registerSteamModule();
}
