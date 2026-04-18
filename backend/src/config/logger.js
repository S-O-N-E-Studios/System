const env = require('./env');

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = env.isProduction ? LOG_LEVELS.info : LOG_LEVELS.debug;

const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] > currentLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

module.exports = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};
