/**
 * BrightDate Types
 *
 * Type definitions for the BrightDate universal decimal time system.
 */

/**
 * A BrightDate value: decimal days since J2000.0 epoch.
 * Positive values are after 2000-01-01T12:00:00 UTC.
 * Negative values are before.
 */
export type BrightDateValue = number;

/**
 * Decimal days since J2000.0 epoch (January 1, 2000, 12:00:00 UTC).
 *
 * This is a plain `number` (IEEE 754 float64), giving ~86 nanosecond precision
 * at current epoch values and a range of ±2^53 days (~24.6 million years).
 *
 * @example
 * ```typescript
 * // Current time as BrightDateTimestamp
 * import { BrightDate } from '@brightchain/brightdate';
 * const now: BrightDateTimestamp = BrightDate.now().value;
 * ```
 */
export type BrightDateTimestamp = BrightDateValue;

/**
 * Precision level for display formatting.
 * 5 = ~0.86 seconds (daily life)
 * 8 = ~0.86 milliseconds (software)
 * 12 = ~86.4 picoseconds (physics)
 */
export type Precision = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Options for creating a BrightDate from components.
 */
export interface BrightDateOptions {
  /** Override the default display precision */
  precision?: Precision;
  /** If true, use TAI-based calculation (accounts for leap seconds) */
  useTAI?: boolean;
}

/**
 * Decomposed BrightDate for human-readable display.
 */
export interface BrightDateComponents {
  /** Integer day number since J2000.0 */
  day: number;
  /** Fractional part of the day [0, 1) */
  fraction: number;
  /** Full decimal value */
  value: BrightDateValue;
  /** Equivalent millidays within the day (0-999) */
  millidays: number;
  /** Equivalent microdays within the current milliday (0-999) */
  microdays: number;
}

/**
 * Duration expressed in BrightDate metric units.
 */
export interface BrightDuration {
  /** Total duration in decimal days */
  days: number;
  /** Duration in millidays */
  millidays: number;
  /** Duration in microdays */
  microdays: number;
  /** Duration in nanodays */
  nanodays: number;
}

/**
 * Result of formatting a BrightDate for display.
 */
export interface FormattedBrightDate {
  /** Full formatted string, e.g. "9622.50417" */
  full: string;
  /** Day part only, e.g. "9622" */
  day: string;
  /** Fractional part only, e.g. "50417" */
  fraction: string;
  /** Human-friendly with metric units, e.g. "Day 9622, 504 md" */
  friendly: string;
}
