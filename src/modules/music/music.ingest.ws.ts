import { PresenceService } from '@modules/presence/presence.service';
import { logger } from '@shared/logger';
import { container } from 'tsyringe';
import { WebSocketServer } from 'ws';
import { parseMusicPresence } from './music.parser';
import { validateMusicWsToken } from '@shared/security/ws-auth';

let disconnectTimer: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL_MS = 25000;

export function startMusicIngestWS(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws/music' });
  const heartbeatTimer = setInterval(() => {
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.ping();
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  const presenceService = container.resolve(PresenceService);

  let lastTitle: string | null = null;
  let lastState: string | null = null;

  wss.on('connection', (ws, req) => {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }

    const url = new URL(req.url!, 'http://localhost');
    const token = url.searchParams.get('token');
    const clientId = url.searchParams.get('clientId') || 'unknown';

    if (!validateMusicWsToken(token)) {
      logger.warn(`[WS] Unauthorized music client (clientId=${clientId})`);
      ws.close();
      return;
    }

    logger.info(`[WS] Music client authenticated (clientId=${clientId})`);

    ws.on('message', async (msg) => {
      try {
        const raw = JSON.parse(msg.toString());
        const music = parseMusicPresence(raw);

        if (!music) return;

        await presenceService.updateMusic(music);

        if (music.title !== lastTitle || music.state !== lastState) {
          logger.info(`[WS] Music → ${music.title} (${music.state})`);
          lastTitle = music.title;
          lastState = music.state;
        }
      } catch (err) {
        logger.error(`[WS] Invalid music payload - ${err}`);
      }
    });

    ws.on('close', async (code, reasonBuffer) => {
      const reason = reasonBuffer?.toString() || '';
      logger.info(
        `[WS] Music client disconnected (clientId=${clientId}, code=${code}, reason=${reason || 'empty'})`,
      );

      if (disconnectTimer) clearTimeout(disconnectTimer);

      disconnectTimer = setTimeout(async () => {
        logger.info('[WS] No reconnection → STOPPED');

        const previous = await presenceService.getFullPresence();
        const prevMusic = previous.music;

        if (!prevMusic) return;

        await presenceService.updateMusic({
          title: prevMusic.title,
          artist: prevMusic.artist,
          cover: prevMusic.cover,
          progressPercent: prevMusic.progressPercent,
          progressText: prevMusic.progressText,
          listenUrl: prevMusic.listenUrl,
          state: 'STOPPED',
          timestamp: Date.now(),
        });
      }, 5000);
    });
  });

  wss.on('close', () => {
    clearInterval(heartbeatTimer);
  });
}
