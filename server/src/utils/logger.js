/* eslint-disable no-console */
const isTest = process.env.NODE_ENV === 'test';

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase()}: ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  info(message, meta) {
    if (!isTest) console.info(format('info', message, meta));
  },
  warn(message, meta) {
    if (!isTest) console.warn(format('warn', message, meta));
  },
  error(message, meta) {
    console.error(format('error', message, meta));
  },
  debug(message, meta) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format('debug', message, meta));
    }
  },
};

