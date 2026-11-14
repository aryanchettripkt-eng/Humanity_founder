import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connect.js';
import { initSocket } from './realtime/socket.js';
import { startGmailPoller } from './services/gmail/poller.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  startGmailPoller();

  server.listen(env.PORT, () => {
    logger.info(`Relay server listening on port ${env.PORT} (ai=${env.effectiveAiProvider})`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { message: err?.message });
  process.exit(1);
});

