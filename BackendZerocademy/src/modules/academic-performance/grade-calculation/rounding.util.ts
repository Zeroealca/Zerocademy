import { RoundingStrategy } from '@prisma/client';

/**
 * Applies institution-configured rounding to a computed average.
 */
export function applyRounding(
  value: number,
  strategy: RoundingStrategy,
  decimalPlaces: number,
): number {
  const factor = 10 ** decimalPlaces;

  switch (strategy) {
    case RoundingStrategy.ROUND_DOWN:
      return Math.floor(value * factor) / factor;
    case RoundingStrategy.ROUND_UP:
      return Math.ceil(value * factor) / factor;
    case RoundingStrategy.TRUNCATE:
      return Math.trunc(value * factor) / factor;
    case RoundingStrategy.ROUND_HALF_UP:
    default:
      return Math.round(value * factor) / factor;
  }
}
