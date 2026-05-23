import { ConfigService } from '@nestjs/config';
import type { Options } from 'pino-http';

/**
 * Env: LOG_LEVEL, LOG_PRETTY, DB_LOG_QUERIES (see DrizzleService).
 * Clients may send x-request-id for correlation.
 */
export function buildPinoHttpConfig(config: ConfigService): Options {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const logLevel = config.get<string>('LOG_LEVEL') ?? (isProduction ? 'info' : 'debug');
  const logPretty =
    config.get<string>('LOG_PRETTY') !== undefined
      ? config.get<string>('LOG_PRETTY') === 'true'
      : !isProduction;

  return {
    level: logLevel,
    transport: logPretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
        'req.body.phone',
        'req.body.token',
        'req.body.verifyPhoneToken',
        'req.body.resetToken',
        'req.body.code',
        'req.body.otp',
        'req.query.hmac',
      ],
      remove: true,
    },
    autoLogging: true,
    genReqId: (req) =>
      (req.headers['x-request-id'] as string | undefined) ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

export function shouldLogDbQueries(config: ConfigService): boolean {
  const explicit = config.get<string>('DB_LOG_QUERIES');
  if (explicit !== undefined) {
    return explicit === 'true';
  }
  return config.get<string>('NODE_ENV') !== 'production';
}
