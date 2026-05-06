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
  TAI_UTC_OFFSET_AT_J2000,
} from './constants';

/**
 * Get the TAI-UTC offset (in seconds) for a given UTC Unix timestamp (in seconds).
 *
 * Uses binary search on the leap second table for O(log n) lookup.
 *
 * @param utcUnixSeconds - UTC Unix timestamp in seconds
 * @returns TAI-UTC offset in seconds at that moment
 */
export function getTaiUtcOffset(utcUnixSeconds: number): number {
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
 * Convert a TAI Unix timestamp (seconds) to UTC Unix timestamp (seconds).
 *
 * Note: This is slightly ambiguous during a leap second insertion,
 * but for practical purposes we find the UTC time that maps to the given TAI.
 *
 * @param taiUnixSeconds - TAI Unix timestamp in seconds
 * @returns UTC Unix timestamp in seconds
 */
export function taiToUtc(taiUnixSeconds: number): number {
  // Iterative approach: guess UTC, check if utcToTai(guess) == taiUnixSeconds
  // Since offsets are integers and change by 1, one iteration suffices.
  let utcGuess = taiUnixSeconds - CURRENT_TAI_UTC_OFFSET;
  const offset = getTaiUtcOffset(utcGuess);
  utcGuess = taiUnixSeconds - offset;

  // Verify and adjust if we crossed a leap second boundary
  const verifyOffset = getTaiUtcOffset(utcGuess);
  if (verifyOffset !== offset) {
    utcGuess = taiUnixSeconds - verifyOffset;
  }

  return utcGuess;
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
