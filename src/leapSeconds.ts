/**
 * Leap Second Utilities
 *
 * Provides TAI-UTC offset lookup for any given UTC timestamp.
 * The leap second table is maintained in constants.ts and must be
 * updated when IERS announces new leap seconds.
 */

import {
  CURRENT_TAI_UTC_OFFSET,
  LEAP_SECOND_TABLE,
  LEAP_SECOND_TABLE_REVIEWED_AT,
  LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S,
  TAI_UTC_OFFSET_AT_J2000,
} from "./constants";

/**
 * Has the stale-leap-table warning already been emitted?
 * We warn at most once per process to avoid log spam.
 */
let staleLeapTableWarned = false;

/**
 * Reset the internal "warned" flag. Exported for testing; production
 * code shouldn't need this.
 *
 * @internal
 */
export function __resetLeapTableWarning(): void {
  staleLeapTableWarned = false;
}

/**
 * Emit a one-time warning when the caller queries a leap-second-sensitive
 * function for a timestamp past the table's published validity window.
 */
function warnIfStale(utcUnixSeconds: number): void {
  if (staleLeapTableWarned) return;
  if (utcUnixSeconds <= LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S) return;
  staleLeapTableWarned = true;
  // Single structured console.warn so hosts can filter/route it
  console.warn(
    "[brightdate] Leap-second table is past its validity window " +
      `(reviewed ${LEAP_SECOND_TABLE_REVIEWED_AT}, valid through Unix ` +
      `${LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S}). Queried Unix seconds=` +
      `${utcUnixSeconds}. TAI calculations may be off by ±1s if a leap ` +
      "second was inserted after table review. Update LEAP_SECOND_TABLE " +
      "from IERS Bulletin C if you need authoritative TAI past this date.",
  );
}

/**
 * Get the TAI-UTC offset (in seconds) for a given UTC Unix timestamp (in seconds).
 *
 * Uses binary search on the leap second table for O(log n) lookup.
 *
 * @param utcUnixSeconds - UTC Unix timestamp in seconds
 * @returns TAI-UTC offset in seconds at that moment
 */
export function getTaiUtcOffset(utcUnixSeconds: number): number {
  warnIfStale(utcUnixSeconds);

  // Before the first entry in the table (pre-1972), TAI-UTC is not well-defined
  // in integer seconds. We return 10 as the initial offset for simplicity.
  if (utcUnixSeconds < LEAP_SECOND_TABLE[0][0]) {
    return 10;
  }

  // Binary search for the applicable leap second entry
  let low = 0;
  let high = LEAP_SECOND_TABLE.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const entry = LEAP_SECOND_TABLE[mid];

    if (entry[0] <= utcUnixSeconds) {
      // Check if this is the last applicable entry
      if (
        mid === LEAP_SECOND_TABLE.length - 1 ||
        LEAP_SECOND_TABLE[mid + 1][0] > utcUnixSeconds
      ) {
        return entry[1];
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return CURRENT_TAI_UTC_OFFSET;
}

/**
 * Get the TAI-UTC offset at the J2000.0 epoch.
 * This is a convenience constant (32 seconds).
 */
export function getTaiUtcOffsetAtJ2000(): number {
  return TAI_UTC_OFFSET_AT_J2000;
}

/**
 * Convert a UTC Unix timestamp (seconds) to TAI Unix timestamp (seconds).
 *
 * @param utcUnixSeconds - UTC Unix timestamp in seconds
 * @returns TAI Unix timestamp in seconds
 */
export function utcToTai(utcUnixSeconds: number): number {
  return utcUnixSeconds + getTaiUtcOffset(utcUnixSeconds);
}

/**
 * Result of converting TAI → UTC. The mapping is *not* bijective during a
 * leap-second insertion — the second labelled `23:59:60` UTC has no
 * Unix-second representation, so callers that need to render or store it
 * must know it happened. This struct carries that knowledge.
 *
 * Convention (matching NTP / Linux `CLOCK_TAI`): for a leap-second TAI
 * instant, `utcUnixSeconds` is the **repeated** Unix second (boundary − 1)
 * and `isLeapSecond` is `true`. Formatters should emit `:60` instead of
 * `:59` in that case.
 */
export interface TaiToUtcResult {
  /**
   * UTC Unix seconds (timestamp). For a leap-second TAI instant this is
   * the repeated Unix second `boundary − 1`.
   */
  utcUnixSeconds: number;
  /** `true` iff this TAI instant is a leap second (UTC label `23:59:60`). */
  isLeapSecond: boolean;
}

/**
 * Convert a TAI Unix timestamp to an explicit UTC labelling.
 *
 * Use this in preference to {@link taiToUtc} when you need to detect and
 * render leap seconds (`23:59:60`). The plain `taiToUtc` discards the
 * leap-second flag and is suitable only when sub-leap-second rendering
 * is unnecessary.
 */
export function taiToUtcFull(taiUnixSeconds: number): TaiToUtcResult {
  // Probe with the maximum offset to get an approximate UTC, then look up
  // the actual offset there.
  const probeUtc = taiUnixSeconds - CURRENT_TAI_UTC_OFFSET;
  const offsetAtProbe = getTaiUtcOffset(probeUtc);
  const candidateUtc = taiUnixSeconds - offsetAtProbe;

  const offsetAtCandidate = getTaiUtcOffset(candidateUtc);
  if (offsetAtCandidate === offsetAtProbe) {
    // Stable: no leap-second boundary crossed.
    return { utcUnixSeconds: candidateUtc, isLeapSecond: false };
  }

  // Straddles a leap-second boundary.
  const utcUnderNew = taiUnixSeconds - offsetAtCandidate;
  const utcUnderOld = taiUnixSeconds - offsetAtProbe;
  if (utcUnderOld === utcUnderNew - 1) {
    // TAI = boundary - 1 under old offset → this is the leap second.
    return { utcUnixSeconds: utcUnderNew - 1, isLeapSecond: true };
  }
  return { utcUnixSeconds: utcUnderNew, isLeapSecond: false };
}

/**
 * Convert a TAI Unix timestamp (seconds) to UTC Unix timestamp (seconds).
 *
 * Discards the leap-second flag; for astronomically precise work that may
 * need to render `23:59:60`, use {@link taiToUtcFull}.
 *
 * @param taiUnixSeconds - TAI Unix timestamp in seconds
 * @returns UTC Unix timestamp in seconds
 */
export function taiToUtc(taiUnixSeconds: number): number {
  return taiToUtcFull(taiUnixSeconds).utcUnixSeconds;
}

/**
 * Check if a given UTC Unix timestamp (seconds) falls during a leap second.
 * A leap second occurs at the boundary timestamps in the table.
 *
 * @param utcUnixSeconds - UTC Unix timestamp in seconds
 * @returns true if this timestamp is within a leap second
 */
export function isDuringLeapSecond(utcUnixSeconds: number): boolean {
  for (const [timestamp] of LEAP_SECOND_TABLE) {
    // Leap second occupies the second *before* the listed timestamp
    // (i.e., 23:59:60 UTC on the day before)
    if (utcUnixSeconds >= timestamp - 1 && utcUnixSeconds < timestamp) {
      return true;
    }
  }
  return false;
}

/**
 * Get the total number of leap seconds inserted between two UTC timestamps.
 *
 * @param fromUtcSeconds - Start UTC Unix timestamp in seconds
 * @param toUtcSeconds - End UTC Unix timestamp in seconds
 * @returns Number of leap seconds inserted in the interval
 */
export function leapSecondsBetween(
  fromUtcSeconds: number,
  toUtcSeconds: number,
): number {
  const offsetFrom = getTaiUtcOffset(fromUtcSeconds);
  const offsetTo = getTaiUtcOffset(toUtcSeconds);
  return Math.abs(offsetTo - offsetFrom);
}
