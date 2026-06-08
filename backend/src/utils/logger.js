const pino = require('pino');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  base: { service: 'prince-esquare-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  ...(process.env.NODE_ENV !== 'production' && !process.env.LOG_JSON
    ? { transport: { target: 'pino/file', options: { destination: 1 } } }
    : {}),
});

module.exports = logger;
