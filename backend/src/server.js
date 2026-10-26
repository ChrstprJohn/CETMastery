import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`CETMastery API: http://${env.HOST}:${env.PORT}/api/health`);
});
server.on('error', (error) => {
  console.error('Unable to start API:', error.message);
  process.exitCode = 1;
});

function shutdown() {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
