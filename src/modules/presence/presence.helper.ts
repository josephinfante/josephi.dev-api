import type { MusicPresence, SteamPresence, SteamRecentGame } from './presence.types';

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

export function shouldEmitSteam(prev: SteamPresence | null, next: SteamPresence) {
  if (!prev) return true;

  if (prev.state !== next.state) return true;

  if (prev.profile.steamId !== next.profile.steamId) return true;
  if (prev.profile.nickname !== next.profile.nickname) return true;
  if (prev.profile.profileUrl !== next.profile.profileUrl) return true;
  if (prev.profile.avatar !== next.profile.avatar) return true;
  if (prev.profile.frameUrl !== next.profile.frameUrl) return true;
  if (prev.profile.backgroundSmall !== next.profile.backgroundSmall) return true;
  if (prev.profile.backgroundLarge !== next.profile.backgroundLarge) return true;

  const prevGame = prev.game;
  const nextGame = next.game;

  if (!prevGame && nextGame) return true;
  if (prevGame && !nextGame) return true;

  if (prevGame && nextGame) {
    if (prevGame.appId !== nextGame.appId) return true;
    if (prevGame.name !== nextGame.name) return true;
    if (prevGame.iconUrl !== nextGame.iconUrl) return true;
  }

  const prevSession = prev.session;
  const nextSession = next.session;

  if (!prevSession && nextSession) return true;
  if (prevSession && !nextSession) return true;
  if (prevSession && nextSession && prevSession.startedAt !== nextSession.startedAt) return true;

  return false;
}

export function shouldEmitSteamRecent(prev: SteamRecentGame[], next: SteamRecentGame[]) {
  if (prev.length !== next.length) return true;

  for (let i = 0; i < prev.length; i += 1) {
    const prevItem = prev[i];
    const nextItem = next[i];

    if (!prevItem || !nextItem) return true;
    if (prevItem.appId !== nextItem.appId) return true;
    if (prevItem.name !== nextItem.name) return true;
    if (prevItem.iconUrl !== nextItem.iconUrl) return true;
    if (prevItem.playtime2WeeksMs !== nextItem.playtime2WeeksMs) return true;
    if (prevItem.playtimeForeverMs !== nextItem.playtimeForeverMs) return true;
  }

  return false;
}
