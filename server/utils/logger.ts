import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize } = format;

// Custom format
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), customFormat)
    }),
    new transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join('logs', 'combined.log') }),
  ],
});
