import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => `${ts} ${level}: ${stack || message}`)
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

/**
 * Secure, structured logger.
 * - Never logs raw request bodies, tokens, or file buffers (see auditLogger.js for what IS logged).
 * - In production emits JSON for ingestion by log aggregators (ELK, CloudWatch, Datadog, etc).
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exitOnError: false,
});

export default logger;
