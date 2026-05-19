export const SEED_LOGGER_CONTEXT = 'PrismaSeed';

export interface SeedLogPayload {
  event: string;
  message: string;
  metadata?: Record<string, string | number | boolean | string[]>;
}

export function seedLog(payload: SeedLogPayload): void {
  const entry = {
    context: SEED_LOGGER_CONTEXT,
    event: payload.event,
    message: payload.message,
    metadata: payload.metadata,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(entry));
}

export function seedWarn(payload: SeedLogPayload): void {
  seedLog({ ...payload, event: `WARN_${payload.event}` });
}

export function seedError(payload: SeedLogPayload): void {
  const entry = {
    context: SEED_LOGGER_CONTEXT,
    level: 'error',
    event: payload.event,
    message: payload.message,
    metadata: payload.metadata,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(entry));
}
