/**
 * BrightDate Constants
 *
 * Core constants for the BrightDate universal decimal time system.
 * Based on J2000.0 epoch with TAI (International Atomic Time) underneath.
 */

/**
 * J2000.0 epoch in Unix milliseconds (UTC).
 * J2000.0 = January 1, 2000, 11:58:55.816 UTC (= 12:00:00.000 TT)
 * For practical purposes we use the TT definition aligned to UTC noon:
 * 2000-01-01T12:00:00.000 UTC = Unix ms 946728000000
 *
 * Note: The precise TT offset is 32.184s + leap seconds at epoch (32s) = 64.184s
 * but for the public-facing API we anchor to UTC noon for simplicity.
 * Internal TAI calculations account for the offset.
 */
export const J2000_UNIX_MS_UTC = 946728000000;

/**
 * Number of milliseconds in one day.
 */
export const MS_PER_DAY = 86_400_000;

/**
 * Number of seconds in one day.
 */
export const SECONDS_PER_DAY = 86_400;

/**
 * TAI - UTC offset at J2000.0 epoch (32 leap seconds had been inserted by then).
 */
export const TAI_UTC_OFFSET_AT_J2000 = 32;

/**
 * TT - TAI offset (constant, defined by convention).
 * Terrestrial Time = TAI + 32.184 seconds.
 */
export const TT_TAI_OFFSET_SECONDS = 32.184;

/**
 * Default display precision (decimal places for fractional day).
 * 5 decimal places ≈ 0.864 seconds resolution.
 */
export const DEFAULT_PRECISION = 5;

/**
 * Maximum precision supported.
 * 12 decimal places ≈ 86.4 picoseconds (sub-nanosecond).
 */
export const MAX_PRECISION = 12;

/**
 * Leap second table: [UTC Unix timestamp in seconds, cumulative TAI-UTC offset after this leap second].
 * Source: IERS Bulletin C / IANA leap-seconds.list
 * Last updated: includes all leap seconds through 2017-01-01 (latest as of 2024).
 *
 * After 2017-01-01, TAI-UTC = 37 seconds. No new leap seconds have been added since.
 * This table must be updated if/when new leap seconds are announced.
 */
export const LEAP_SECOND_TABLE: ReadonlyArray<readonly [number, number]> = [
  // [Unix timestamp (UTC) when leap second takes effect, new TAI-UTC offset]
  [63072000, 10], // 1972-01-01
  [78796800, 11], // 1972-07-01
  [94694400, 12], // 1973-01-01
  [126230400, 13], // 1974-01-01
  [157766400, 14], // 1975-01-01
  [189302400, 15], // 1976-01-01
  [220924800, 16], // 1977-01-01
  [252460800, 17], // 1978-01-01
  [283996800, 18], // 1979-01-01
  [315532800, 19], // 1980-01-01
  [362793600, 20], // 1981-07-01
  [394329600, 21], // 1982-07-01
  [425865600, 22], // 1983-07-01
  [489024000, 23], // 1985-07-01
  [567993600, 24], // 1988-01-01
  [631152000, 25], // 1990-01-01
  [662688000, 26], // 1991-01-01
  [709948800, 27], // 1992-07-01
  [741484800, 28], // 1993-07-01
  [773020800, 29], // 1994-07-01
  [820454400, 30], // 1996-01-01
  [867715200, 31], // 1997-07-01
  [915148800, 32], // 1999-01-01
  [1136073600, 33], // 2006-01-01
  [1230768000, 34], // 2009-01-01
  [1341100800, 35], // 2012-07-01
  [1435708800, 36], // 2015-07-01
  [1483228800, 37], // 2017-01-01
] as const;

/**
 * Source identifier for the leap second table.
 * Update when the table is refreshed from IERS Bulletin C / IANA leap-seconds.list.
 */
export const LEAP_SECOND_TABLE_SOURCE = 'IERS Bulletin C / IANA leap-seconds.list';

/**
 * The Unix-seconds timestamp through which the leap second table is
 * KNOWN TO BE CORRECT. This is the "valid-until" date published by IERS
 * in the leap-seconds.list file. Past this timestamp, the library
 * emits a warning (once per process) because a new leap second may
 * have been inserted that is not reflected in the table.
 *
 * Current value: 2026-12-28T00:00:00Z
 *
 * IERS typically announces leap-second decisions ~6 months before each
 * potential boundary (June 30 / December 31). The last announcement
 * (January 2026) confirmed no leap second at end of June 2026, so the
 * table is known-good through the next decision point (late 2026 for the
 * December 2026 boundary). Update this constant when you refresh the
 * table from IERS Bulletin C.
 *
 * Source: IERS Bulletin C announcements (confirmed via timeanddate.com,
 * January 2026).
 */
export const LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S = 1_798_416_000; // 2026-12-28T00:00:00Z

/**
 * ISO date when this leap second table was last reviewed against IERS.
 * Human-readable companion to {@link LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S}.
 */
export const LEAP_SECOND_TABLE_REVIEWED_AT = '2026-05-08';

/**
 * Current TAI-UTC offset (seconds). Updated when new leap seconds are added.
 */
export const CURRENT_TAI_UTC_OFFSET = 37;

/**
 * Metric sub-unit names and their values in days.
 */
export const METRIC_UNITS = {
  /** 1 milliday = 0.001 day = 1 minute 26.4 seconds */
  milliday: 0.001,
  /** 1 microday = 0.000001 day = 86.4 milliseconds */
  microday: 0.000_001,
  /** 1 nanoday = 0.000000001 day = 86.4 microseconds */
  nanoday: 0.000_000_001,
} as const;
