import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

export interface StructuredLogPayload {
  context?: string;
  event?: string;
  userId?: string;
  email?: string;
  ip?: string;
  message: string;
  /** Error stack when logging failures — kept out of metadata for easier grep in hosts. */
  stack?: string;
  metadata?: Record<string, unknown>;
}


const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
]);

@Injectable()
export class AppLoggerService implements LoggerService {
  private sanitizeMetadata(
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!metadata) {
      return undefined;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private write(
    level: LogLevel,
    payload: StructuredLogPayload,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: payload.context ?? 'Application',
      event: payload.event,
      userId: payload.userId,
      email: payload.email,
      ip: payload.ip,
      message: payload.message,
      stack: payload.stack,
      metadata: this.sanitizeMetadata(payload.metadata),
    };

    const line = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'debug':
        console.debug(line);
        break;
      default:
        console.log(line);
    }
  }

  log(payload: StructuredLogPayload): void {
    this.write('log', payload);
  }

  warn(payload: StructuredLogPayload): void {
    this.write('warn', payload);
  }

  error(payload: StructuredLogPayload): void {
    this.write('error', payload);
  }

  debug(payload: StructuredLogPayload): void {
    this.write('debug', payload);
  }

  verbose(payload: StructuredLogPayload): void {
    this.write('verbose', payload);
  }
}
