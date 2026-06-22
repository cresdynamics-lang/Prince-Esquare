require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');
const { setIO } = require('./lib/socket');

const PORT = process.env.PORT || 5000;

const verifyDatabase = async () => {
  try {
    await db.query('SELECT 1');
    logger.info({ msg: 'PostgreSQL connected' });
  } catch (err) {
    logger.error({ err, msg: 'PostgreSQL connection failed' });
    process.exit(1);
  }
};

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

setIO(io);

io.on('connection', (socket) => {
  logger.debug({ msg: 'Socket connected', socketId: socket.id });
});

const { runStartupBootstrap } = require('./lib/startupBootstrap');
const { startStockDayScheduler, stopStockDayScheduler } = require('./services/stockDayScheduler');
const { validateMediaStorageOnStartup } = require('./lib/mediaStorage');

const start = async () => {
  await verifyDatabase();
  const mediaStatus = validateMediaStorageOnStartup();
  if (mediaStatus.warning) {
    logger.warn({ msg: mediaStatus.warning, provider: mediaStatus.provider });
  } else {
    logger.info({ msg: 'Media storage ready', provider: mediaStatus.provider });
  }
  await runStartupBootstrap();
  await startStockDayScheduler();
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error({
        err,
        msg: `Port ${PORT} is already in use. Stop the other backend process or set PORT in .env.`,
      });
    } else {
      logger.error({ err, msg: 'HTTP server error' });
    }
    process.exit(1);
  });
  httpServer.listen(PORT, () => {
    logger.info({
      msg: 'Server started',
      port: PORT,
      env: process.env.NODE_ENV,
      url: `http://localhost:${PORT}`,
    });
  });
};

start();

const shutdown = (signal) => {
  logger.info({ msg: `${signal} received — shutting down` });
  stopStockDayScheduler();
  httpServer.close(async () => {
    await db.pool.end();
    logger.info({ msg: 'Server closed' });
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error({ err, msg: 'Unhandled rejection' });
  httpServer.close(() => process.exit(1));
});
