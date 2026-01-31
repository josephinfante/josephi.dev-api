import type { MusicPresence } from '@modules/presence/presence.types';

type RawMusicEvent = {
  title?: string;
  artist?: string;
  cover?: string | null;
  progressText?: string | null;
  progressPercent?: number | null;
  state?: 'PLAYING' | 'PAUSED' | 'STOPPED';
  listenUrl?: string | null;
  timestamp?: number;
};

export function parseMusicPresence(input: RawMusicEvent): MusicPresence | null {
  if (!input.title || !input.artist) {
    return null;
  }

  return {
    title: input.title.trim(),
    artist: input.artist.trim(),
    cover: input.cover ?? null,
    progressPercent: typeof input.progressPercent === 'number' ? input.progressPercent : null,
    progressText: input.progressText ?? null,
    state: input.state ?? 'STOPPED',
    listenUrl: input.listenUrl ?? null,
    timestamp: input.timestamp ?? Date.now(),
  };
}
