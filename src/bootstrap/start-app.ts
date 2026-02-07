import http from 'http';
import { createApp } from '@bootstrap/create-app';
import { environment } from '@shared/config/environment';
import { logger } from '@shared/logger';
import { startMusicIngestWS } from '@modules/music/music.ingest.ws';
import { startSteamPoller } from '@modules/steam/steam.poller';

export async function startApp() {
  const app = createApp();

  const httpServer = http.createServer(app);

  startMusicIngestWS(httpServer);
  const stopSteamPoller = startSteamPoller();

  httpServer.listen(environment.PORT, () => {
    logger.info(`Server running in ${environment.NODE_ENV} mode on port ${environment.PORT}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    httpServer.close();
    stopSteamPoller();
    logger.info('Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
