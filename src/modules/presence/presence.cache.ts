import type { CacheService } from '@shared/cache';
import { TOKENS } from '@shared/container/tokens';
import { inject, injectable } from 'tsyringe';
import type { MusicPresence, Presence, SteamPresence, SteamRecentGame } from './presence.types';
import { PRESENCE_KEYS } from '@shared/cache/cache.keys';

@injectable()
export class PresenceCache {
  constructor(@inject(TOKENS.CacheService) private cache: CacheService) {}

  /* -------- MUSIC -------- */

  async setMusic(music: MusicPresence | null) {
    await this.cache.set(PRESENCE_KEYS.MUSIC, music, 600);
  }

  async getMusic(): Promise<MusicPresence | null> {
    return this.cache.get<MusicPresence>(PRESENCE_KEYS.MUSIC);
  }

  /* -------- STEAM -------- */

  async setSteam(steam: SteamPresence | null) {
    await this.cache.set(PRESENCE_KEYS.STEAM, steam, 600);
  }

  async getSteam(): Promise<SteamPresence | null> {
    return this.cache.get<SteamPresence>(PRESENCE_KEYS.STEAM);
  }

  async setSteamRecent(recent: SteamRecentGame[]) {
    await this.cache.set(PRESENCE_KEYS.STEAM_RECENT, recent, 600);
  }

  async getSteamRecent(): Promise<SteamRecentGame[]> {
    return (await this.cache.get<SteamRecentGame[]>(PRESENCE_KEYS.STEAM_RECENT)) ?? [];
  }

  /* -------- FULL SNAPSHOT -------- */

  async setFull(presence: Presence) {
    await this.cache.set(PRESENCE_KEYS.FULL, presence);
  }

  async getFull(): Promise<Presence | null> {
    return this.cache.get<Presence>(PRESENCE_KEYS.FULL);
  }

  /* -------- PUBSUB -------- */

  async publish(event: string, payload: unknown) {
    await this.cache.publish(PRESENCE_KEYS.CHANNEL, {
      event,
      payload,
    });
  }

  async subscribe(event: string, handler: (payload: any) => void): Promise<() => void> {
    return this.cache.subscribe(PRESENCE_KEYS.CHANNEL, (data: any) => {
      if (data.event === event) {
        handler(data.payload);
      }
    });
  }
}
