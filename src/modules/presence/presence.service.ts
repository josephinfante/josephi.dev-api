import { TOKENS } from '@shared/container/tokens';
import { inject, injectable } from 'tsyringe';
import type { MusicPresence, Presence } from './presence.types';
import type { PresenceCache } from './presence.cache';
import type { MusicRepository } from '@modules/music/music.repository';
import { shouldEmitMusic } from './presence.helper';

@injectable()
export class PresenceService {
  private lastMusicEmittedProgress: number | null = null;
  constructor(
    @inject(TOKENS.PresenceCache) private presenceCache: PresenceCache,
    @inject(TOKENS.MusicRepository) private musicRepository: MusicRepository,
  ) {}

  async getFullPresence(): Promise<Presence> {
    const music = await this.presenceCache.getMusic();

    if (!music) {
      return { music: null, updatedAt: Date.now() };
    }

    const now = Date.now();
    const diff = now - music.timestamp;

    // 30 segundos sin heartbeat = STOPPED
    if (diff > 30000 && music.state === 'PLAYING') {
      music.state = 'STOPPED';
    }

    return {
      music,
      updatedAt: now,
    };
  }

  async updateMusic(music: MusicPresence) {
    const previous = await this.presenceCache.getMusic();

    const becameStopped = music.state === 'STOPPED' && previous && previous.state !== 'STOPPED';

    /* ---------- DB LOGIC ---------- */

    if (becameStopped && previous.title) {
      await this.musicRepository.closeActive();

      await this.musicRepository.create({
        title: previous.title,
        artist: previous.artist,
        cover: previous.cover,
        listenUrl: previous.listenUrl,
        startedAt: new Date(previous.timestamp),
      });
    }

    /* ---------- CACHE ---------- */

    await this.presenceCache.setMusic(music);

    const full = await this.getFullPresence();
    await this.presenceCache.setFull(full);

    /* ---------- EMIT CONTROL ---------- */

    if (!shouldEmitMusic(previous, music, this.lastMusicEmittedProgress)) {
      return;
    }

    await this.presenceCache.publish('music.updated', music);
    this.lastMusicEmittedProgress = music.progressPercent;
  }
}
