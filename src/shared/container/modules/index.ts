import { registerMusicModule } from '@modules/music';
import { registerPresenceModule } from '@modules/presence';

export function registerAllModules() {
  registerPresenceModule();
  registerMusicModule();
}
