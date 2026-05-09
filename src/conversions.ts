/**
 * BrightDate Conversions
 *
 * Core conversion functions between BrightDate values and other time representations.
 */

import {
  J2000_UNIX_MS_UTC,
  MS_PER_DAY,
  SECONDS_PER_DAY,
  TAI_UTC_OFFSET_AT_J2000,
} from './constants';
import { getTaiUtcOffset, utcToTai } from './leapSeconds';
import type { BrightDateValue } from './types';

/**
 * Convert a JavaScript Date to a BrightDate value (UTC-based).
 *
 * Behavior for edge-case inputs:
 * - Non-Date input (string, number, null, etc.) → throws `TypeError`.
 * - Invalid Date (e.g. `new Date('bad-string')`) → returns `NaN`. This
 *   matches the behavior of `Date.getTime()` itself (which returns `NaN`
 *   for invalid Dates) and avoids breaking callers — particularly
 *   property-based test generators like fast-check's `fc.date()` — that
 *   may produce invalid Dates during shrinking. Downstream code should
 *   treat a `NaN` BrightDate as "invalid input" and reject it at its
 *   own boundaries, as it would for any `NaN` number.
 *
 * Cross-realm safety: `instanceof Date` fails when a Date crosses a
 * VM realm boundary (e.g. Jest's custom test environments). We therefore
 * use `Object.prototype.toString.call(v) === '[object Date]'` as the
 * cross-realm-safe type check.
 *
 * @param date - JavaScript Date object
 * @returns BrightDate value (decimal days since J2000.0); NaN if `date`
 *   is an Invalid Date.
 * @throws TypeError if `date` is not a Date instance.
 */
export function fromDate(date: Date): BrightDateValue {
  // Cross-realm-safe Date check.
  // `instanceof Date` fails for Dates that cross VM realm boundaries
  // (common in Jest custom environments, vm.runInContext, worker threads).
  // The toString tag is the canonical duck-typed check for built-in types.
  if (
    date === null ||
    typeof date !== 'object' ||
    Object.prototype.toString.call(date) !== '[object Date]'
  ) {
    throw new TypeError(
      `fromDate: expected a Date instance, got ${
        date === null ? 'null' : typeof date
      }`,
    );
  }
  // Invalid Date -> getTime() returns NaN -> we propagate NaN.
  // This preserves the standard JavaScript convention that NaN propagates
  // through arithmetic, making invalid input "loud enough to notice at
  // the final boundary" without forcing every caller to pre-validate.
  return (date.getTime() - J2000_UNIX_MS_UTC) / MS_PER_DAY;
}

/**
 * Convert a BrightDate value to a JavaScript Date (UTC-based).
 *
 * @param brightDate - BrightDate value (decimal days since J2000.0)
 * @returns JavaScript Date object
 */
export function toDate(brightDate: BrightDateValue): Date {
  const unixMs = brightDate * MS_PER_DAY + J2000_UNIX_MS_UTC;
  return new Date(unixMs);
}

/**
 * Convert a Unix timestamp (milliseconds) to a BrightDate value.
 *
 * @param unixMs - Unix timestamp in milliseconds
 * @returns BrightDate value
 * @throws TypeError if `unixMs` is NaN or not finite.
 */
export function fromUnixMs(unixMs: number): BrightDateValue {
  if (typeof unixMs !== 'number' || !isFinite(unixMs)) {
    throw new TypeError(
      `fromUnixMs: expected a finite number, got ${String(unixMs)}`,
    );
  }
  return (unixMs - J2000_UNIX_MS_UTC) / MS_PER_DAY;
}

/**
 * Convert a BrightDate value to a Unix timestamp (milliseconds).
 *
 * @param brightDate - BrightDate value
 * @returns Unix timestamp in milliseconds
 */
export function toUnixMs(brightDate: BrightDateValue): number {
  return brightDate * MS_PER_DAY + J2000_UNIX_MS_UTC;
}

/**
 * Convert a Unix timestamp (seconds) to a BrightDate value.
 *
 * @param unixSeconds - Unix timestamp in seconds
 * @returns BrightDate value
 * @throws TypeError if `unixSeconds` is NaN or not finite.
 */
export function fromUnixSeconds(unixSeconds: number): BrightDateValue {
  if (typeof unixSeconds !== 'number' || !isFinite(unixSeconds)) {
    throw new TypeError(
      `fromUnixSeconds: expected a finite number, got ${String(unixSeconds)}`,
    );
  }
  return fromUnixMs(unixSeconds * 1000);
}

/**
 * Convert a BrightDate value to a Unix timestamp (seconds).
 *
 * @param brightDate - BrightDate value
 * @returns Unix timestamp in seconds
 */
export function toUnixSeconds(brightDate: BrightDateValue): number {
  return toUnixMs(brightDate) / 1000;
}

/**
 * Convert a Julian Date (JD) to a BrightDate value.
 * JD at J2000.0 = 2451545.0
 *
 * @param jd - Julian Date
 * @returns BrightDate value
 */
export function fromJulianDate(jd: number): BrightDateValue {
  return jd - 2451545.0;
}

/**
 * Convert a BrightDate value to a Julian Date (JD).
 *
 * @param brightDate - BrightDate value
 * @returns Julian Date
 */
export function toJulianDate(brightDate: BrightDateValue): number {
  return brightDate + 2451545.0;
}

/**
 * Convert a Modified Julian Date (MJD) to a BrightDate value.
 * MJD = JD - 2400000.5
 * At J2000.0: MJD = 51544.5
 *
 * @param mjd - Modified Julian Date
 * @returns BrightDate value
 */
export function fromModifiedJulianDate(mjd: number): BrightDateValue {
  return mjd - 51544.5;
}

/**
 * Convert a BrightDate value to a Modified Julian Date (MJD).
 *
 * @param brightDate - BrightDate value
 * @returns Modified Julian Date
 */
export function toModifiedJulianDate(brightDate: BrightDateValue): number {
  return brightDate + 51544.5;
}

/**
 * Convert a UTC-based BrightDate to a TAI-based BrightDate.
 *
 * TAI-based values are monotonically increasing (no leap-second discontinuities)
 * — use them for durations that must span leap seconds, audit trails, or any
 * context where "seconds elapsed" must be the true physical count.
 *
 * ### Numerical note — this is NOT a simple +N seconds shift
 *
 * The function re-anchors to a TAI-based J2000 epoch (which is itself 32 s
 * ahead of the UTC J2000 instant — that was the TAI-UTC offset at the
 * J2000.0 moment). The numeric difference between the returned TAI
 * BrightDate and the input UTC BrightDate equals
 *   `(currentOffset − 32) / 86400` days
 * NOT `currentOffset / 86400` days.
 *
 * - At J2000.0 (offset = 32): difference is 0.
 * - At 2020-01-01 (offset = 37): difference is 5 seconds.
 *
 * If you want the pure TAI-minus-UTC offset in seconds at a given moment,
 * call {@link getTaiUtcOffset} with the Unix-seconds timestamp.
 *
 * @param utcBrightDate - BrightDate value computed from UTC
 * @returns BrightDate value in TAI timescale
 */
export function utcToTaiBrightDate(
  utcBrightDate: BrightDateValue,
): BrightDateValue {
  const unixMs = toUnixMs(utcBrightDate);
  const utcSeconds = unixMs / 1000;
  const taiSeconds = utcToTai(utcSeconds);
  // Re-anchor to J2000.0 in TAI
  const j2000TaiSeconds = J2000_UNIX_MS_UTC / 1000 + TAI_UTC_OFFSET_AT_J2000;
  return (taiSeconds - j2000TaiSeconds) / SECONDS_PER_DAY;
}

/**
 * Convert a TAI-based BrightDate to a UTC-based BrightDate.
 *
 * Inverse of {@link utcToTaiBrightDate}. See that function's JSDoc for the
 * re-anchoring explanation.
 *
 * @param taiBrightDate - BrightDate value in TAI timescale
 * @returns BrightDate value in UTC timescale
 */
export function taiToUtcBrightDate(
  taiBrightDate: BrightDateValue,
): BrightDateValue {
  const j2000TaiSeconds = J2000_UNIX_MS_UTC / 1000 + TAI_UTC_OFFSET_AT_J2000;
  const taiSeconds = taiBrightDate * SECONDS_PER_DAY + j2000TaiSeconds;
  const offset = getTaiUtcOffset(taiSeconds - 37); // approximate UTC for offset lookup
  const utcSeconds = taiSeconds - offset;
  return fromUnixSeconds(utcSeconds);
}

/**
 * Get the TAI − UTC offset in seconds at the moment a UTC BrightDate
 * represents. This is the unambiguous "how many seconds is TAI ahead of
 * UTC right now" number — the one most people mean when they say "TAI
 * offset." Unlike {@link utcToTaiBrightDate}, which re-anchors to
 * TAI-J2000, this returns the raw cumulative leap-second count.
 *
 * @example
 * ```ts
 * taiUtcOffsetSecondsAt(fromISO('2000-01-01T12:00:00Z'));  // 32
 * taiUtcOffsetSecondsAt(fromISO('2020-06-15T00:00:00Z'));  // 37
 * taiUtcOffsetSecondsAt(fromISO('1980-01-06T00:00:00Z'));  // 19
 * ```
 *
 * @param utcBrightDate - BrightDate value (UTC-based)
 * @returns Cumulative TAI-UTC offset in seconds at that instant
 */
export function taiUtcOffsetSecondsAt(
  utcBrightDate: BrightDateValue,
): number {
  const unixSeconds = toUnixSeconds(utcBrightDate);
  return getTaiUtcOffset(unixSeconds);
}

/**
 * Convert an ISO 8601 date string to a BrightDate value.
 *
 * @param isoString - ISO 8601 formatted date string
 * @returns BrightDate value
 * @throws Error if the string cannot be parsed
 */
export function fromISO(isoString: string): BrightDateValue {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 date string: "${isoString}"`);
  }
  return fromDate(date);
}

/**
 * Convert a BrightDate value to an ISO 8601 date string.
 *
 * @param brightDate - BrightDate value
 * @returns ISO 8601 formatted date string
 */
export function toISO(brightDate: BrightDateValue): string {
  return toDate(brightDate).toISOString();
}

/**
 * Convert GPS time (weeks and seconds) to a BrightDate value.
 * GPS epoch: January 6, 1980, 00:00:00 UTC
 * GPS time does not include leap seconds (like TAI, offset by 19s).
 *
 * @param gpsWeek - GPS week number
 * @param gpsSeconds - Seconds within the GPS week
 * @returns BrightDate value (UTC-based)
 */
export function fromGPSTime(
  gpsWeek: number,
  gpsSeconds: number,
): BrightDateValue {
  // GPS epoch in Unix seconds: Jan 6, 1980 00:00:00 UTC
  const GPS_EPOCH_UNIX = 315964800;
  const SECONDS_PER_WEEK = 604800;

  // GPS time in Unix seconds (GPS timescale, no leap seconds)
  const gpsUnixSeconds =
    GPS_EPOCH_UNIX + gpsWeek * SECONDS_PER_WEEK + gpsSeconds;

  // GPS time = TAI - 19 seconds, so TAI = GPS + 19
  // To get UTC: subtract current TAI-UTC offset from TAI
  const taiSeconds = gpsUnixSeconds + 19;
  const taiUtcOffset = getTaiUtcOffset(gpsUnixSeconds); // approximate
  const utcSeconds = taiSeconds - taiUtcOffset;

  return fromUnixSeconds(utcSeconds);
}

/**
 * Convert a BrightDate value to GPS time (weeks and seconds).
 *
 * @param brightDate - BrightDate value
 * @returns Object with gpsWeek and gpsSeconds
 */
export function toGPSTime(brightDate: BrightDateValue): {
  gpsWeek: number;
  gpsSeconds: number;
} {
  const GPS_EPOCH_UNIX = 315964800;
  const SECONDS_PER_WEEK = 604800;

  const utcSeconds = toUnixSeconds(brightDate);
  const taiUtcOffset = getTaiUtcOffset(utcSeconds);
  const taiSeconds = utcSeconds + taiUtcOffset;
  // GPS = TAI - 19
  const gpsSeconds = taiSeconds - 19;
  const gpsTotalSeconds = gpsSeconds - GPS_EPOCH_UNIX;

  const gpsWeek = Math.floor(gpsTotalSeconds / SECONDS_PER_WEEK);
  const gpsSecondsOfWeek = gpsTotalSeconds - gpsWeek * SECONDS_PER_WEEK;

  return { gpsWeek, gpsSeconds: gpsSecondsOfWeek };
}

/**
 * Get the current time as a BrightDate value.
 *
 * @returns BrightDate value for the current moment
 */
export function now(): BrightDateValue {
  return fromDate(new Date());
}

/**
 * Parse a BrightDate string (e.g., "9622.50417") back to a numeric value.
 *
 * @param brightDateString - String representation of a BrightDate
 * @returns BrightDate value
 * @throws Error if the string cannot be parsed
 */
export function parse(brightDateString: string): BrightDateValue {
  const value = parseFloat(brightDateString);
  if (isNaN(value)) {
    throw new Error(`Invalid BrightDate string: "${brightDateString}"`);
  }
  return value;
}

/**
 * Normalize any timestamp input to a BrightDateValue.
 *
 * Accepts a BrightDateValue (number), a JavaScript Date, or an ISO 8601 string
 * and returns the equivalent BrightDateValue. Use this at system boundaries
 * where external data may arrive in any of these forms.
 *
 * @param input - A BrightDateValue, JavaScript Date, or ISO 8601 string
 * @returns BrightDateValue (decimal days since J2000.0)
 * @throws TypeError if input is NaN, non-finite, or an unparseable date string
 */
export function normalize(input: BrightDateValue | Date | string): BrightDateValue {
  if (typeof input === 'number') {
    if (!isFinite(input)) {
      throw new TypeError(`BrightDateValue must be a finite number, got: ${input}`);
    }
    return input;
  }
  if (input instanceof Date) {
    return fromDate(input);
  }
  // string path — re-throw as TypeError for consistent error type
  try {
    return fromISO(input);
  } catch {
    throw new TypeError(`Invalid date string: "${input}"`);
  }
}
