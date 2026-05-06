/**
 * BrightDate Formatting
 *
 * Functions for formatting BrightDate values into human-readable strings
 * and decomposing them into metric sub-units.
 */

import { DEFAULT_PRECISION } from './constants';
import type {
  BrightDateComponents,
  BrightDateValue,
  BrightDuration,
  FormattedBrightDate,
  Precision,
} from './types';

/**
 * Format a BrightDate value as a string with the specified precision.
 *
 * @param brightDate - BrightDate value
 * @param precision - Number of decimal places (default: 5)
 * @returns Formatted string, e.g. "9622.50417"
 */
export function format(
  brightDate: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
): string {
  return brightDate.toFixed(precision);
}

/**
 * Format a BrightDate value with full decomposition.
 *
 * @param brightDate - BrightDate value
 * @param precision - Number of decimal places (default: 5)
 * @returns FormattedBrightDate object with multiple representations
 */
export function formatFull(
  brightDate: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
): FormattedBrightDate {
  const full = format(brightDate, precision);
  const dotIndex = full.indexOf('.');
  const day = dotIndex >= 0 ? full.substring(0, dotIndex) : full;
  const fraction =
    dotIndex >= 0 ? full.substring(dotIndex + 1) : '0'.repeat(precision);

  const components = decompose(brightDate);
  const friendly = `Day ${components.day}, ${components.millidays} md`;

  return { full, day, fraction, friendly };
}

/**
 * Decompose a BrightDate value into its component parts.
 *
 * @param brightDate - BrightDate value
 * @returns BrightDateComponents with day, fraction, millidays, microdays
 */
export function decompose(brightDate: BrightDateValue): BrightDateComponents {
  const day = Math.floor(brightDate);
  const fraction = brightDate - day;

  // Millidays: 0-999 within the day
  const totalMillidays = fraction * 1000;
  const millidays = Math.floor(totalMillidays);

  // Microdays within the current milliday: 0-999
  const microdays = Math.floor((totalMillidays - millidays) * 1000);

  return {
    day,
    fraction,
    value: brightDate,
    millidays,
    microdays,
  };
}

/**
 * Convert a duration (in decimal days) to metric sub-units.
 *
 * @param durationDays - Duration in decimal days
 * @returns BrightDuration with days, millidays, microdays, nanodays
 */
export function toDuration(durationDays: number): BrightDuration {
  const absDays = Math.abs(durationDays);
  return {
    days: durationDays,
    millidays: absDays * 1_000,
    microdays: absDays * 1_000_000,
    nanodays: absDays * 1_000_000_000,
  };
}

/**
 * Format a duration in the most human-appropriate metric unit.
 *
 * @param durationDays - Duration in decimal days
 * @returns Human-readable duration string, e.g. "2.5 millidays" or "150 microdays"
 */
export function formatDuration(durationDays: number): string {
  const abs = Math.abs(durationDays);
  const sign = durationDays < 0 ? '-' : '';

  if (abs >= 1) {
    return `${sign}${abs.toFixed(3)} days`;
  } else if (abs >= 0.001) {
    return `${sign}${(abs * 1000).toFixed(3)} millidays`;
  } else if (abs >= 0.000_001) {
    return `${sign}${(abs * 1_000_000).toFixed(3)} microdays`;
  } else {
    return `${sign}${(abs * 1_000_000_000).toFixed(3)} nanodays`;
  }
}

/**
 * Format a BrightDate as a compact log-friendly string.
 * Example: "[9622.50417]"
 *
 * @param brightDate - BrightDate value
 * @param precision - Number of decimal places (default: 5)
 * @returns Bracketed string suitable for log entries
 */
export function formatLog(
  brightDate: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
): string {
  return `[${format(brightDate, precision)}]`;
}

/**
 * Format a BrightDate with a prefix label.
 * Example: "BD:9622.50417"
 *
 * @param brightDate - BrightDate value
 * @param precision - Number of decimal places (default: 5)
 * @param prefix - Prefix string (default: "BD:")
 * @returns Prefixed string
 */
export function formatPrefixed(
  brightDate: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
  prefix: string = 'BD:',
): string {
  return `${prefix}${format(brightDate, precision)}`;
}

/**
 * Format a BrightDate range as a string.
 * Example: "9622.50000 → 9622.75000"
 *
 * @param start - Start BrightDate value
 * @param end - End BrightDate value
 * @param precision - Number of decimal places (default: 5)
 * @returns Formatted range string
 */
export function formatRange(
  start: BrightDateValue,
  end: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
): string {
  return `${format(start, precision)} → ${format(end, precision)}`;
}

/**
 * Convert traditional hours:minutes:seconds to fractional day.
 *
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param seconds - Seconds (0-59.999...)
 * @returns Fractional day value [0, 1)
 */
export function hmsToDayFraction(
  hours: number,
  minutes: number,
  seconds: number = 0,
): number {
  return (hours * 3600 + minutes * 60 + seconds) / 86400;
}

/**
 * Convert a fractional day to traditional hours:minutes:seconds.
 *
 * @param fraction - Fractional day [0, 1)
 * @returns Object with hours, minutes, seconds
 */
export function dayFractionToHms(fraction: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSeconds = fraction * 86400;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}
