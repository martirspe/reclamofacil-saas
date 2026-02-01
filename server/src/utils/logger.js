const pino = require('pino');
const path = require('path');

const level = process.env.LOG_LEVEL || 'info';
const pretty = (process.env.LOG_PRETTY || 'false') === 'true';
const toFile = (process.env.LOG_TO_FILE || 'false') === 'true';

function createLogger() {
  if (toFile) {
    const filePath = path.join(__dirname, '..', '..', 'logs', 'app.log');
    return pino({ level }, pino.destination(filePath));
  }
  if (pretty && process.env.NODE_ENV !== 'production') {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false
        }
      }
    });
  }
  return pino({ level });
}

module.exports = createLogger();
