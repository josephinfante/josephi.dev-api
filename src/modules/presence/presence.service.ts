import { TOKENS } from '@shared/container/tokens';
import { inject, injectable } from 'tsyringe';
import type { MusicPresence, Presence, SteamPresence } from './presence.types';
import type { PresenceCache } from './presence.cache';
import type { MusicRepository } from '@modules/music/music.repository';
import type { SteamRepository } from '@modules/steam/steam.repository';
import { shouldEmitMusic, shouldEmitSteam } from './presence.helper';

function formatSteamDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function withSteamDuration<T extends { startedAt: Date; endedAt: Date | null }>(entry: T) {
  if (!entry.endedAt) {
    return { ...entry, durationMs: null, durationLabel: null };
  }

  const durationMs = Math.max(0, entry.endedAt.getTime() - entry.startedAt.getTime());

  return {
    ...entry,
    durationMs,
    durationLabel: formatSteamDuration(durationMs),
  };
}

@injectable()
export class PresenceService {
  private lastMusicEmittedProgress: number | null = null;
  constructor(
    @inject(TOKENS.PresenceCache) private presenceCache: PresenceCache,
    @inject(TOKENS.MusicRepository) private musicRepository: MusicRepository,
    @inject(TOKENS.SteamRepository) private steamRepository: SteamRepository,
  ) {}

  async getFullPresence(): Promise<Presence> {
    const [music, steam] = await Promise.all([
      this.presenceCache.getMusic(),
      this.presenceCache.getSteam(),
    ]);

    if (!music) {
      return { music: null, steam, updatedAt: Date.now() };
    }

    const now = Date.now();
    const diff = now - music.timestamp;

    // 30 segundos sin heartbeat = STOPPED
    if (diff > 30000 && music.state === 'PLAYING') {
      music.state = 'STOPPED';
    }

    return {
      music,
      steam,
      updatedAt: now,
    };
  }

  async updateMusic(music: MusicPresence) {
    const previous = await this.presenceCache.getMusic();

    const becameStopped =
      music.state === 'STOPPED' && previous !== null && previous.state !== 'STOPPED';

    const trackChanged =
      previous !== null &&
      previous.state !== 'STOPPED' &&
      (previous.title !== music.title ||
        previous.artist !== music.artist ||
        previous.listenUrl !== music.listenUrl);

    /* ---------- DB LOGIC ---------- */

    if ((becameStopped || trackChanged) && previous?.title && previous?.artist) {
      const isDuplicate = await this.musicRepository.existsByIdentity({
        title: previous.title,
        artist: previous.artist,
        listenUrl: previous.listenUrl ?? null,
      });

      if (!isDuplicate) {
        await this.musicRepository.trimForInsert(10);
        await this.musicRepository.create({
          title: previous.title,
          artist: previous.artist,
          cover: previous.cover,
          listenUrl: previous.listenUrl,
          startedAt: new Date(previous.timestamp),
          endedAt: new Date(music.timestamp),
        });

        const recent = await this.musicRepository.findRecent(10);
        await this.presenceCache.publish('music.history.updated', recent);
      }
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

  async updateSteam(steam: SteamPresence, previous?: SteamPresence | null) {
    const prev = previous ?? (await this.presenceCache.getSteam());

    const endedSession =
      prev?.state === 'PLAYING' &&
      prev.game !== null &&
      (steam.state !== 'PLAYING' || prev.game.appId !== steam.game?.appId);

    if (endedSession) {
      const previousGame = prev?.game;
      if (!previousGame) {
        return;
      }
      await this.steamRepository.replaceLatest({
        appId: previousGame.appId,
        name: previousGame.name,
        iconUrl: previousGame.iconUrl ?? null,
        startedAt: new Date(prev.session?.startedAt ?? Date.now()),
        endedAt: new Date(steam.lastUpdatedAt),
      });

      const recent = await this.steamRepository.findRecent(1);
      await this.presenceCache.publish(
        'steam.history.updated',
        recent.map((entry) => withSteamDuration(entry)),
      );
    }

    await this.presenceCache.setSteam(steam);

    const full = await this.getFullPresence();
    await this.presenceCache.setFull(full);

    if (!shouldEmitSteam(prev, steam)) {
      return;
    }

    await this.presenceCache.publish('steam.updated', steam);
  }
}
