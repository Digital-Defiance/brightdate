/**
 * BrightDate lens — integer engine ↔ decimal-day presentation.
 *
 * Canonical storage uses a signed integer tick count (attoseconds or
 * picoseconds since J2000.0). The v1 {@link BrightDateValue} (Float64 days)
 * is a **lossy presentation lens** derived via integer divmod, never the
 * source of truth for consensus or serialization.
 *
 * Parsing a displayed decimal day back into ticks is supported for
 * ergonomics but is explicitly lossy when the input carries more digits
 * than the tick resolution can represent.
 *
 * @packageDocumentation
 */

import type { BrightDateValue } from './types';

/** Attoseconds per SI second (exact). */
export const ATTOSECONDS_PER_SECOND = 1_000_000_000_000_000_000n;

/** Picoseconds per attosecond (exact). */
export const ATTOSECONDS_PER_PICOSECOND = 1_000_000n;

/** Attoseconds per SI day = 86_400 × 10¹⁸ (exact). */
export const ATTOSECONDS_PER_DAY =
  BigInt(86_400) * ATTOSECONDS_PER_SECOND;

/** Picoseconds per SI day (exact). */
export const PICOSECONDS_PER_DAY = ATTOSECONDS_PER_DAY / ATTOSECONDS_PER_PICOSECOND;

/** Picosecond engine → attosecond engine (exact). */
export function picosecondsToAttoseconds(picoseconds: bigint): bigint {
  return picoseconds * ATTOSECONDS_PER_PICOSECOND;
}

/** Attosecond engine → picosecond engine (truncates sub-picosecond ticks). */
export function attosecondsToPicoseconds(attoseconds: bigint): bigint {
  return attoseconds / ATTOSECONDS_PER_PICOSECOND;
}

/** Euclidean division (matches Rust `div_euclid`). */
export function divEuclid(a: bigint, b: bigint): bigint {
  const q = a / b;
  const r = a % b;
  if (r !== 0n && (r < 0n) !== (b < 0n)) {
    return q - 1n;
  }
  return q;
}

/** Euclidean remainder (matches Rust `rem_euclid`; always `0 ≤ r < |b|` when `b > 0`). */
export function remEuclid(a: bigint, b: bigint): bigint {
  const r = a % b;
  if (r < 0n) {
    return r + (b < 0n ? -b : b);
  }
  return r;
}

/** Split integer ticks into whole days and sub-day remainder (same unit as `ticks`). */
export function splitTicksIntoDayParts(
  ticks: bigint,
  ticksPerDay: bigint,
): { readonly daysWhole: bigint; readonly remainder: bigint } {
  return {
    daysWhole: divEuclid(ticks, ticksPerDay),
    remainder: remEuclid(ticks, ticksPerDay),
  };
}

/**
 * Convert integer ticks to a {@link BrightDateValue} using divmod only on the
 * fractional limb (the integer day count is exact in Number until ~2⁵³ days).
 */
export function ticksToBrightDateValue(
  ticks: bigint,
  ticksPerDay: bigint,
): BrightDateValue {
  const { daysWhole, remainder } = splitTicksIntoDayParts(ticks, ticksPerDay);
  return Number(daysWhole) + Number(remainder) / Number(ticksPerDay);
}

/**
 * Lossy reverse: Float64 decimal days → attoseconds (rounds fractional day).
 * Preserves the v1 `from_brightdate` strategy (floor days + round fractional limb).
 */
export function brightDateValueToAttoseconds(bd: BrightDateValue): bigint {
  if (!Number.isFinite(bd)) {
    throw new TypeError(
      `brightDateValueToAttoseconds: expected finite BrightDate, got ${bd}`,
    );
  }
  const daysFloor = Math.floor(bd);
  const frac = bd - daysFloor;
  const daysI = BigInt(daysFloor);
  const fracAs = BigInt(
    Math.round(frac * Number(ATTOSECONDS_PER_DAY)),
  );
  return daysI * ATTOSECONDS_PER_DAY + fracAs;
}

/** Lossy reverse: Float64 decimal days → picoseconds. */
export function brightDateValueToPicoseconds(bd: BrightDateValue): bigint {
  if (!Number.isFinite(bd)) {
    throw new TypeError(
      `brightDateValueToPicoseconds: expected finite BrightDate, got ${bd}`,
    );
  }
  const daysFloor = Math.floor(bd);
  const frac = bd - daysFloor;
  const daysI = BigInt(daysFloor);
  const fracPs = BigInt(Math.round(frac * Number(PICOSECONDS_PER_DAY)));
  return daysI * PICOSECONDS_PER_DAY + fracPs;
}

/**
 * Format the fractional part of a day as a fixed-width decimal string without
 * floating-point division on the remainder.
 */
export function formatFractionOfDay(
  remainderTicks: bigint,
  fractionDigits: number,
  ticksPerDay: bigint,
): string {
  if (fractionDigits <= 0) {
    return '';
  }
  const scale = 10n ** BigInt(fractionDigits);
  const frac = (remainderTicks * scale) / ticksPerDay;
  return frac.toString().padStart(fractionDigits, '0');
}

/**
 * Decimal-day string from attoseconds (presentation / display).
 * Uses integer divmod; safe to show on watch faces and widgets.
 */
export function formatBrightDateFromAttoseconds(
  attoseconds: bigint,
  fractionDigits = 5,
): string {
  const { daysWhole, remainder } = splitTicksIntoDayParts(
    attoseconds,
    ATTOSECONDS_PER_DAY,
  );
  const sign = daysWhole < 0n ? '-' : '';
  const absDays = daysWhole < 0n ? -daysWhole : daysWhole;
  const frac = formatFractionOfDay(
    remainder,
    fractionDigits,
    ATTOSECONDS_PER_DAY,
  );
  return frac.length > 0
    ? `${sign}${absDays}.${frac}`
    : `${sign}${absDays}`;
}
