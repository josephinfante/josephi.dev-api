import { environment } from '@shared/config/environment';

export function validateMusicWsToken(token: string | null): boolean {
  if (!token) return false;
  return token === environment.MUSIC_WS_TOKEN;
}
