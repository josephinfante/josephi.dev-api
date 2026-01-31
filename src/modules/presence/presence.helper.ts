import type { MusicPresence } from './presence.types';

export function shouldEmitMusic(
  prev: MusicPresence | null,
  next: MusicPresence,
  lastMusicEmittedProgress: number | null,
) {
  if (!prev) return true;

  if (prev.title !== next.title) return true;
  if (prev.artist !== next.artist) return true;
  if (prev.listenUrl !== next.listenUrl) return true;

  if (prev.state !== next.state) return true;

  if (next.state !== 'PLAYING') return false;

  if (
    next.progressPercent !== null &&
    lastMusicEmittedProgress !== null &&
    Math.abs(next.progressPercent - lastMusicEmittedProgress) >= 5
  ) {
    return true;
  }

  return false;
}
