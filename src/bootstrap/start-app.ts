import { createApp } from '@bootstrap/create-app';
import { environment } from '@shared/config/environment';
import { logger } from '@shared/logger';

export async function startApp() {
  const app = createApp();

  const server = app.listen(environment.PORT, () => {
    logger.info(`Server running in ${environment.NODE_ENV} mode on port ${environment.PORT}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    server.close();
    logger.info('Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
