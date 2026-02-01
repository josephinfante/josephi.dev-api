import { MusicRepository } from '@modules/music/music.repository';
import type { PresenceCache } from '@modules/presence/presence.cache';
import { PresenceService } from '@modules/presence/presence.service';
import { TOKENS } from '@shared/container/tokens';
import { logger } from '@shared/logger';
import type { Request, Response } from 'express';
import { container } from 'tsyringe';

export async function sseController(req: Request, res: Response) {
  const presenceService = container.resolve(PresenceService);
  const presenceCache = container.resolve<PresenceCache>(TOKENS.PresenceCache);
  const musicRepository = container.resolve(MusicRepository);

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

  // -------- REDIS SUBSCRIBE --------
  const unsubscribe = await presenceCache.subscribe('music.updated', (music) => {
    send('music.updated', music);
  });

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
    unsubscribeHistory();
    logger.info('[SSE] Client disconnected');
  });
}
