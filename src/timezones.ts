/**
 * BrightDate Timezone Utilities
 *
 * While BrightDate is inherently timezone-free (UTC-based),
 * these utilities help bridge to local civil time when needed.
 * The philosophy: store and compute in BrightDate, display in local time only at the edges.
 */

import type { BrightDateValue } from './types';

/**
 * Common timezone offsets in fractional days.
 * Positive = East of UTC, Negative = West of UTC.
 */
export const TIMEZONE_OFFSETS: Record<string, number> = {
  // Americas
  'UTC-12': -12 / 24,
  'UTC-11': -11 / 24,
  'UTC-10': -10 / 24, // Hawaii
  'UTC-9': -9 / 24, // Alaska
  'UTC-8': -8 / 24, // Pacific
  'UTC-7': -7 / 24, // Mountain
  'UTC-6': -6 / 24, // Central
  'UTC-5': -5 / 24, // Eastern
  'UTC-4': -4 / 24, // Atlantic
  'UTC-3': -3 / 24, // Argentina, Brazil
  'UTC-2': -2 / 24,
  'UTC-1': -1 / 24,

  // Europe/Africa
  'UTC+0': 0, // UK, Portugal, Ghana
  'UTC+1': 1 / 24, // Central Europe
  'UTC+2': 2 / 24, // Eastern Europe
  'UTC+3': 3 / 24, // Moscow, East Africa

  // Asia
  'UTC+4': 4 / 24, // Gulf
  'UTC+5': 5 / 24, // Pakistan
  'UTC+5.5': 5.5 / 24, // India
  'UTC+5.75': 5.75 / 24, // Nepal
  'UTC+6': 6 / 24, // Bangladesh
  'UTC+6.5': 6.5 / 24, // Myanmar
  'UTC+7': 7 / 24, // Indochina
  'UTC+8': 8 / 24, // China, Singapore
  'UTC+9': 9 / 24, // Japan, Korea
  'UTC+9.5': 9.5 / 24, // Central Australia
  'UTC+10': 10 / 24, // Eastern Australia
  'UTC+11': 11 / 24,
  'UTC+12': 12 / 24, // New Zealand
  'UTC+13': 13 / 24, // Samoa
  'UTC+14': 14 / 24, // Line Islands
};

/**
 * Convert a BrightDate (UTC) to a "local BrightDate" by applying a timezone offset.
 * This shifts the value so that the fractional day represents local time-of-day.
 *
 * Note: This is for display purposes only. The returned value is NOT a true BrightDate
 * (it's offset from the universal timeline). Use with care.
 *
 * @param brightDate - BrightDate value (UTC)
 * @param offsetDays - Timezone offset in fractional days (e.g., -5/24 for UTC-5)
 * @returns Shifted value representing local time
 */
export function toLocalValue(
  brightDate: BrightDateValue,
  offsetDays: number,
): BrightDateValue {
  return brightDate + offsetDays;
}

/**
 * Convert a "local BrightDate" back to UTC by removing the timezone offset.
 *
 * @param localValue - Local-shifted BrightDate value
 * @param offsetDays - Timezone offset in fractional days
 * @returns UTC BrightDate value
 */
export function fromLocalValue(
  localValue: BrightDateValue,
  offsetDays: number,
): BrightDateValue {
  return localValue - offsetDays;
}

/**
 * Get the timezone offset in fractional days for a named timezone.
 *
 * @param timezone - Timezone name (e.g., "UTC+5.5", "UTC-8")
 * @returns Offset in fractional days, or undefined if not found
 */
export function getTimezoneOffset(timezone: string): number | undefined {
  return TIMEZONE_OFFSETS[timezone];
}

/**
 * Convert a timezone offset in hours to fractional days.
 *
 * @param hours - Offset in hours (e.g., -5, 5.5, 9)
 * @returns Offset in fractional days
 */
export function hoursToFractionalDays(hours: number): number {
  return hours / 24;
}

/**
 * Convert a timezone offset in fractional days to hours.
 *
 * @param fractionalDays - Offset in fractional days
 * @returns Offset in hours
 */
export function fractionalDaysToHours(fractionalDays: number): number {
  return fractionalDays * 24;
}

/**
 * Format a BrightDate with a timezone annotation.
 * Example: "9622.50417 (UTC-5: 9622.29584)"
 *
 * @param brightDate - BrightDate value (UTC)
 * @param timezone - Timezone name
 * @param precision - Decimal places
 * @returns Formatted string with timezone info
 */
export function formatWithTimezone(
  brightDate: BrightDateValue,
  timezone: string,
  precision: number = 5,
): string {
  const offset = TIMEZONE_OFFSETS[timezone];
  if (offset === undefined) {
    return `${brightDate.toFixed(precision)} (unknown timezone: ${timezone})`;
  }
  const local = toLocalValue(brightDate, offset);
  return `${brightDate.toFixed(precision)} (${timezone}: ${local.toFixed(precision)})`;
}

/**
 * Get the local time-of-day as a fraction [0, 1) for a given BrightDate and timezone.
 *
 * @param brightDate - BrightDate value (UTC)
 * @param offsetDays - Timezone offset in fractional days
 * @returns Fractional day representing local time-of-day [0, 1)
 */
export function localTimeOfDay(
  brightDate: BrightDateValue,
  offsetDays: number,
): number {
  const local = brightDate + offsetDays;
  const fraction = local - Math.floor(local);
  return ((fraction % 1) + 1) % 1; // Ensure [0, 1)
}

/**
 * Determine if it's "daytime" at a given BrightDate and timezone.
 * Simple approximation: daytime = 6:00 to 18:00 local time.
 *
 * @param brightDate - BrightDate value (UTC)
 * @param offsetDays - Timezone offset in fractional days
 * @returns true if local time is between 6:00 and 18:00
 */
export function isDaytime(
  brightDate: BrightDateValue,
  offsetDays: number,
): boolean {
  const tod = localTimeOfDay(brightDate, offsetDays);
  return tod >= 0.25 && tod < 0.75; // 6/24 = 0.25, 18/24 = 0.75
}

/**
 * Get the system's local timezone offset in fractional days.
 * Uses JavaScript's Date.getTimezoneOffset() which returns minutes.
 *
 * @returns Local timezone offset in fractional days
 */
export function getSystemTimezoneOffset(): number {
  // getTimezoneOffset returns minutes WEST of UTC (negative for East)
  // We want East-positive, so negate
  const minutesWest = new Date().getTimezoneOffset();
  return -minutesWest / 1440; // 1440 minutes per day
}

/**
 * Convert a BrightDate to the system's local time representation.
 *
 * @param brightDate - BrightDate value (UTC)
 * @returns Shifted value representing system local time
 */
export function toSystemLocal(brightDate: BrightDateValue): BrightDateValue {
  return toLocalValue(brightDate, getSystemTimezoneOffset());
}
