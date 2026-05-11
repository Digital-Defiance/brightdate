/**
 * BrightDate Conversions
 *
 * Core conversion functions between BrightDate values and other time
 * representations.
 *
 * # Model
 *
 * BrightDate is **TAI-coherent at the substrate**. A BrightDate `bd` is
 * defined as `(taiUnixSeconds − J2000_TAI_UNIX_S) / 86_400`. All arithmetic
 * on BrightDate values is therefore in uniform SI seconds — no leap-second
 * discontinuities. Leap seconds appear only at the UTC presentation boundary
 * (`fromUnixMs`, `toUnixMs`, `fromISO`, `toISO`).
 *
 * # Identities
 *
 * - `toJulianDate(bd)` ≡ `bd + J2000_JD` (exact)
 * - `toModifiedJulianDate(bd)` ≡ `bd + J2000_MJD` (exact)
 * - UTC ↔ BD uses the leap-second table at the conversion boundary.
 */

import {
  J2000_JD,
  J2000_MJD,
  J2000_TAI_UNIX_S,
  SECONDS_PER_DAY,
} from "./constants";
import { getTaiUtcOffset, taiToUtcFull } from "./leapSeconds";
import type { BrightDateValue } from "./types";

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** BrightDate → TAI Unix seconds (continuous, leap-second-free). */
function bdToTaiUnixSeconds(bd: BrightDateValue): number {
  return bd * SECONDS_PER_DAY + J2000_TAI_UNIX_S;
}

/** UTC Unix ms → BrightDate (leap-second-aware). */
function utcUnixMsToBd(ms: number): BrightDateValue {
  const utcSeconds = ms / 1000;
  const offset = getTaiUtcOffset(Math.floor(utcSeconds));
  const taiSeconds = utcSeconds + offset;
  return (taiSeconds - J2000_TAI_UNIX_S) / SECONDS_PER_DAY;
}

// ─── Date / Unix-ms conversions ────────────────────────────────────────────────

/**
 * Convert a JavaScript Date to a BrightDate value.
 *
 * Behavior for edge-case inputs:
 * - Non-Date input → throws `TypeError`.
 * - Invalid Date (e.g. `new Date('bad-string')`) → returns `NaN`.
 *
 * Cross-realm safety: uses `Object.prototype.toString.call(v) === '[object Date]'`.
 */
export function fromDate(date: Date): BrightDateValue {
  if (
    date === null ||
    typeof date !== "object" ||
    Object.prototype.toString.call(date) !== "[object Date]"
  ) {
    throw new TypeError(
      `fromDate: expected a Date instance, got ${
        date === null ? "null" : typeof date
      }`,
    );
  }
  const ms = date.getTime();
  if (!Number.isFinite(ms)) return NaN;
  return utcUnixMsToBd(ms);
}

/** Convert a BrightDate value to a JavaScript Date (UTC label). */
export function toDate(brightDate: BrightDateValue): Date {
  return new Date(toUnixMs(brightDate));
}

/**
 * Convert a Unix timestamp (milliseconds, UTC label) to a BrightDate value.
 *
 * @throws TypeError if `unixMs` is not a finite number.
 */
export function fromUnixMs(unixMs: number): BrightDateValue {
  if (typeof unixMs !== "number" || !isFinite(unixMs)) {
    throw new TypeError(
      `fromUnixMs: expected a finite number, got ${String(unixMs)}`,
    );
  }
  return utcUnixMsToBd(unixMs);
}

/** Convert a BrightDate value to Unix milliseconds (UTC label). */
export function toUnixMs(brightDate: BrightDateValue): number {
  const taiSeconds = bdToTaiUnixSeconds(brightDate);
  const taiSecondsFloor = Math.floor(taiSeconds);
  const frac = taiSeconds - taiSecondsFloor;
  const conv = taiToUtcFull(taiSecondsFloor);
  // Unix ms are integers by convention; round to nearest to absorb float-precision
  // noise from the TAI ↔ UTC round-trip (error is always < 1 µs, i.e. << 0.5 ms).
  return Math.round((conv.utcUnixSeconds + frac) * 1000);
}

/** Convert a Unix timestamp (seconds, UTC label) to a BrightDate value. */
export function fromUnixSeconds(unixSeconds: number): BrightDateValue {
  if (typeof unixSeconds !== "number" || !isFinite(unixSeconds)) {
    throw new TypeError(
      `fromUnixSeconds: expected a finite number, got ${String(unixSeconds)}`,
    );
  }
  return fromUnixMs(unixSeconds * 1000);
}

/** Convert a BrightDate value to Unix seconds (UTC label). */
export function toUnixSeconds(brightDate: BrightDateValue): number {
  return toUnixMs(brightDate) / 1000;
}

// ─── Julian Date / Modified Julian Date ────────────────────────────────────────

/** Convert Julian Date → BrightDate. Exact by definition (bd ≡ JD − J2000_JD). */
export function fromJulianDate(jd: number): BrightDateValue {
  return jd - J2000_JD;
}

/** Convert BrightDate → Julian Date. Exact by definition (JD ≡ bd + J2000_JD). */
export function toJulianDate(brightDate: BrightDateValue): number {
  return brightDate + J2000_JD;
}

/** Convert Modified Julian Date → BrightDate. Exact. */
export function fromModifiedJulianDate(mjd: number): BrightDateValue {
  return mjd - J2000_MJD;
}

/** Convert BrightDate → Modified Julian Date. Exact. */
export function toModifiedJulianDate(brightDate: BrightDateValue): number {
  return brightDate + J2000_MJD;
}

// ─── TAI re-anchoring (legacy / identity) ──────────────────────────────────────

/**
 * @deprecated Now an identity. BrightDate is already TAI-coherent at the
 * substrate; there is no longer a separate "TAI BrightDate" anchor.
 * Retained for back-compat; new code can drop the wrapper.
 */
export function utcToTaiBrightDate(
  utcBrightDate: BrightDateValue,
): BrightDateValue {
  return utcBrightDate;
}

/** @deprecated Now an identity. See {@link utcToTaiBrightDate}. */
export function taiToUtcBrightDate(
  taiBrightDate: BrightDateValue,
): BrightDateValue {
  return taiBrightDate;
}

/**
 * Cumulative TAI − UTC offset (seconds) at the moment a BrightDate represents.
 *
 * @example
 * ```ts
 * taiUtcOffsetSecondsAt(fromISO('2000-01-01T11:58:55.816Z'));  // 32
 * taiUtcOffsetSecondsAt(fromISO('2020-06-15T00:00:00Z'));      // 37
 * ```
 */
export function taiUtcOffsetSecondsAt(brightDate: BrightDateValue): number {
  const taiSeconds = bdToTaiUnixSeconds(brightDate);
  const conv = taiToUtcFull(Math.floor(taiSeconds));
  return getTaiUtcOffset(conv.utcUnixSeconds);
}

// ─── ISO ───────────────────────────────────────────────────────────────────────

/** Parse an ISO 8601 string to a BrightDate value. */
export function fromISO(isoString: string): BrightDateValue {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 date string: "${isoString}"`);
  }
  return fromDate(date);
}

/**
 * Render a BrightDate as an ISO 8601 UTC string. Leap-second instants
 * render with `:60` in the seconds field.
 */
export function toISO(brightDate: BrightDateValue): string {
  const taiSeconds = bdToTaiUnixSeconds(brightDate);
  const taiSecondsFloor = Math.floor(taiSeconds);
  const frac = taiSeconds - taiSecondsFloor;
  const conv = taiToUtcFull(taiSecondsFloor);

  if (conv.isLeapSecond) {
    // Borrow JS Date to format the broken-down calendar fields, then patch :60.
    const baseMs = conv.utcUnixSeconds * 1000;
    const dt = new Date(baseMs);
    const yyyy = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    const hh = String(dt.getUTCHours()).padStart(2, "0");
    const mi = String(dt.getUTCMinutes()).padStart(2, "0");
    const ms = String(Math.floor(frac * 1000)).padStart(3, "0");
    return `${yyyy}-${mo}-${dd}T${hh}:${mi}:60.${ms}Z`;
  }
  const utcMs = (conv.utcUnixSeconds + frac) * 1000;
  return new Date(utcMs).toISOString();
}

// ─── GPS time ──────────────────────────────────────────────────────────────────

/** GPS epoch (1980-01-06T00:00:00 UTC) as a TAI Unix-second integer. */
const GPS_EPOCH_UNIX_TAI = 315_964_819; // 315_964_800 UTC + 19 (GPS-TAI offset)
const SECONDS_PER_WEEK = 604_800;

/**
 * Convert GPS time (weeks + seconds-of-week) to a BrightDate value.
 *
 * GPS is TAI-anchored (no leap seconds). The conversion is exact through TAI.
 */
export function fromGPSTime(
  gpsWeek: number,
  gpsSeconds: number,
): BrightDateValue {
  const taiUnixSeconds =
    GPS_EPOCH_UNIX_TAI + gpsWeek * SECONDS_PER_WEEK + gpsSeconds;
  return (taiUnixSeconds - J2000_TAI_UNIX_S) / SECONDS_PER_DAY;
}

/** Convert a BrightDate value to GPS time (weeks + seconds-of-week). */
export function toGPSTime(brightDate: BrightDateValue): {
  gpsWeek: number;
  gpsSeconds: number;
} {
  const taiSeconds = bdToTaiUnixSeconds(brightDate);
  const gpsTotalSeconds = taiSeconds - GPS_EPOCH_UNIX_TAI;
  const gpsWeek = Math.floor(gpsTotalSeconds / SECONDS_PER_WEEK);
  const gpsSeconds = gpsTotalSeconds - gpsWeek * SECONDS_PER_WEEK;
  return { gpsWeek, gpsSeconds };
}

// ─── Misc ──────────────────────────────────────────────────────────────────────

/** Current BrightDate value (UTC-anchored via `Date.now()`). */
export function now(): BrightDateValue {
  return fromDate(new Date());
}

/** Parse a BrightDate string (e.g. `"9622.50417"`) back to a number. */
export function parse(brightDateString: string): BrightDateValue {
  const value = parseFloat(brightDateString);
  if (isNaN(value)) {
    throw new Error(`Invalid BrightDate string: "${brightDateString}"`);
  }
  return value;
}

/**
 * Coerce a BrightDateValue | Date | ISO-string to a BrightDateValue.
 *
 * @throws TypeError if input is NaN, non-finite, or an unparseable date string.
 */
export function normalize(
  input: BrightDateValue | Date | string,
): BrightDateValue {
  if (typeof input === "number") {
    if (!isFinite(input)) {
      throw new TypeError(
        `BrightDateValue must be a finite number, got: ${input}`,
      );
    }
    return input;
  }
  if (input instanceof Date) {
    return fromDate(input);
  }
  try {
    return fromISO(input);
  } catch {
    throw new TypeError(`Invalid date string: "${input}"`);
  }
}
