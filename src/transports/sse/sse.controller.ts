import { MusicRepository } from '@modules/music/music.repository';
import type { PresenceCache } from '@modules/presence/presence.cache';
import { PresenceService } from '@modules/presence/presence.service';
import { SteamRepository } from '@modules/steam/steam.repository';
import { refreshSteamPresence } from '@modules/steam/steam.poller';
import { TOKENS } from '@shared/container/tokens';
import { logger } from '@shared/logger';
import type { Request, Response } from 'express';
import { container } from 'tsyringe';

export async function sseController(req: Request, res: Response) {
  const presenceService = container.resolve(PresenceService);
  const presenceCache = container.resolve<PresenceCache>(TOKENS.PresenceCache);
  const musicRepository = container.resolve(MusicRepository);
  const steamRepository = container.resolve(SteamRepository);

  const formatSteamDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const withSteamDuration = <T extends { startedAt: Date; endedAt: Date | null }>(entry: T) => {
    if (!entry.endedAt) {
      return { ...entry, durationMs: null, durationLabel: null };
    }

    const durationMs = Math.max(0, entry.endedAt.getTime() - entry.startedAt.getTime());

    return {
      ...entry,
      durationMs,
      durationLabel: formatSteamDuration(durationMs),
    };
  };

  // --- HEADERS SSE ---
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  logger.info('[SSE] Client connected');

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // -------- INITIAL PRESENCE --------
  await refreshSteamPresence();
  let full = await presenceService.getFullPresence();

  if (!full.music) {
    const last = await musicRepository.findLast();

    if (last) {
      full.music = {
        title: last.title,
        artist: last.artist,
        cover: last.cover,
        progressPercent: null,
        progressText: null,
        state: 'STOPPED',
        listenUrl: last.listenUrl,
        timestamp: last.startedAt.getTime(),
      };
    }
  }

  const recent = await musicRepository.findRecent(10);
  send('presence.init', { ...full, history: recent });
  const steamRecent = await steamRepository.findRecent(1);
  send('steam.history.updated', steamRecent.map((entry) => withSteamDuration(entry)));
  const steamRecentGames = await presenceCache.getSteamRecent();
  send('steam.recent.updated', steamRecentGames);

  // -------- REDIS SUBSCRIBE --------
  const unsubscribe = await presenceCache.subscribe('music.updated', (music) => {
    send('music.updated', music);
  });

  const unsubscribeSteam = await presenceCache.subscribe('steam.updated', (steam) => {
    send('steam.updated', steam);
  });

  const unsubscribeSteamRecent = await presenceCache.subscribe('steam.recent.updated', (recent) => {
    send('steam.recent.updated', recent);
  });

  const unsubscribeSteamHistory = await presenceCache.subscribe(
    'steam.history.updated',
    (history) => {
      send('steam.history.updated', history);
    },
  );

  const unsubscribeHistory = await presenceCache.subscribe('music.history.updated', (history) => {
    send('music.history.updated', history);
  });

  // -------- HEARTBEAT --------
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  // -------- DISCONNECT --------
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    unsubscribeSteam();
    unsubscribeSteamRecent();
    unsubscribeSteamHistory();
    unsubscribeHistory();
    logger.info('[SSE] Client disconnected');
  });
}
