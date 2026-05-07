/**
 * BrightDate Arithmetic
 *
 * Mathematical operations on BrightDate values: addition, subtraction,
 * comparison, interpolation, and interval operations.
 */

import type { BrightDateValue } from './types';

/**
 * Add a duration (in decimal days) to a BrightDate.
 *
 * @param brightDate - Base BrightDate value
 * @param days - Days to add (can be negative)
 * @returns New BrightDate value
 */
export function add(
  brightDate: BrightDateValue,
  days: number,
): BrightDateValue {
  return brightDate + days;
}

/**
 * Subtract a duration (in decimal days) from a BrightDate.
 *
 * @param brightDate - Base BrightDate value
 * @param days - Days to subtract (can be negative)
 * @returns New BrightDate value
 */
export function subtract(
  brightDate: BrightDateValue,
  days: number,
): BrightDateValue {
  return brightDate - days;
}

/**
 * Add millidays to a BrightDate.
 *
 * @param brightDate - Base BrightDate value
 * @param millidays - Millidays to add
 * @returns New BrightDate value
 */
export function addMillidays(
  brightDate: BrightDateValue,
  millidays: number,
): BrightDateValue {
  return brightDate + millidays * 0.001;
}

/**
 * Add microdays to a BrightDate.
 *
 * @param brightDate - Base BrightDate value
 * @param microdays - Microdays to add
 * @returns New BrightDate value
 */
export function addMicrodays(
  brightDate: BrightDateValue,
  microdays: number,
): BrightDateValue {
  return brightDate + microdays * 0.000_001;
}

/**
 * Calculate the difference between two BrightDates in decimal days.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns Difference (a - b) in decimal days
 */
export function difference(a: BrightDateValue, b: BrightDateValue): number {
  return a - b;
}

/**
 * Calculate the absolute difference between two BrightDates.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns Absolute difference in decimal days
 */
export function absoluteDifference(
  a: BrightDateValue,
  b: BrightDateValue,
): number {
  return Math.abs(a - b);
}

/**
 * Compare two BrightDate values.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: BrightDateValue, b: BrightDateValue): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Sort comparator for BrightDate values, compatible with `Array.prototype.sort`.
 *
 * Returns `a - b` (a continuous number) rather than the discrete `-1 | 0 | 1`
 * of `compare`, which is the idiomatic form expected by JavaScript sort.
 *
 * @example
 * ```typescript
 * const sorted = timestamps.sort(sortComparator);
 * ```
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns Negative if a < b, zero if equal, positive if a > b
 */
export function sortComparator(a: BrightDateValue, b: BrightDateValue): number {
  return a - b;
}

/**
 * Check if two BrightDate values are equal within a tolerance.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @param tolerance - Maximum allowed difference in days (default: 1 microday)
 * @returns true if the values are within tolerance
 */
export function equals(
  a: BrightDateValue,
  b: BrightDateValue,
  tolerance: number = 0.000_001,
): boolean {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Check if a BrightDate falls within a range (inclusive).
 *
 * @param value - BrightDate to check
 * @param start - Range start
 * @param end - Range end
 * @returns true if start <= value <= end
 */
export function isInRange(
  value: BrightDateValue,
  start: BrightDateValue,
  end: BrightDateValue,
): boolean {
  return value >= start && value <= end;
}

/**
 * Get the minimum of multiple BrightDate values.
 *
 * @param values - Array of BrightDate values
 * @returns The smallest value
 * @throws Error if the array is empty
 */
export function min(...values: BrightDateValue[]): BrightDateValue {
  if (values.length === 0) {
    throw new Error('Cannot find minimum of empty array');
  }
  return Math.min(...values);
}

/**
 * Get the maximum of multiple BrightDate values.
 *
 * @param values - Array of BrightDate values
 * @returns The largest value
 * @throws Error if the array is empty
 */
export function max(...values: BrightDateValue[]): BrightDateValue {
  if (values.length === 0) {
    throw new Error('Cannot find maximum of empty array');
  }
  return Math.max(...values);
}

/**
 * Clamp a BrightDate value to a range.
 *
 * @param value - BrightDate to clamp
 * @param lower - Lower bound
 * @param upper - Upper bound
 * @returns Clamped value
 */
export function clamp(
  value: BrightDateValue,
  lower: BrightDateValue,
  upper: BrightDateValue,
): BrightDateValue {
  return Math.max(lower, Math.min(upper, value));
}

/**
 * Linearly interpolate between two BrightDate values.
 *
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor [0, 1]
 * @returns Interpolated BrightDate value
 */
export function lerp(
  start: BrightDateValue,
  end: BrightDateValue,
  t: number,
): BrightDateValue {
  return start + (end - start) * t;
}

/**
 * Calculate the midpoint between two BrightDate values.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns Midpoint BrightDate value
 */
export function midpoint(
  a: BrightDateValue,
  b: BrightDateValue,
): BrightDateValue {
  return (a + b) / 2;
}

/**
 * Generate evenly spaced BrightDate values within a range.
 *
 * @param start - Start of range
 * @param end - End of range
 * @param count - Number of values to generate (including start and end)
 * @returns Array of evenly spaced BrightDate values
 */
export function linspace(
  start: BrightDateValue,
  end: BrightDateValue,
  count: number,
): BrightDateValue[] {
  if (count < 2) {
    return [start];
  }
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

/**
 * Sort an array of BrightDate values in ascending order.
 *
 * @param values - Array of BrightDate values
 * @returns New sorted array
 */
export function sort(values: BrightDateValue[]): BrightDateValue[] {
  return [...values].sort((a, b) => a - b);
}

/**
 * Floor a BrightDate to the start of the current day (integer part).
 *
 * @param brightDate - BrightDate value
 * @returns BrightDate at the start of the day
 */
export function floorToDay(brightDate: BrightDateValue): BrightDateValue {
  return Math.floor(brightDate);
}

/**
 * Ceil a BrightDate to the start of the next day.
 *
 * @param brightDate - BrightDate value
 * @returns BrightDate at the start of the next day
 */
export function ceilToDay(brightDate: BrightDateValue): BrightDateValue {
  return Math.ceil(brightDate);
}

/**
 * Round a BrightDate to the nearest milliday.
 *
 * @param brightDate - BrightDate value
 * @returns BrightDate rounded to nearest milliday
 */
export function roundToMilliday(brightDate: BrightDateValue): BrightDateValue {
  return Math.round(brightDate * 1000) / 1000;
}

/**
 * Round a BrightDate to the nearest microday.
 *
 * @param brightDate - BrightDate value
 * @returns BrightDate rounded to nearest microday
 */
export function roundToMicroday(brightDate: BrightDateValue): BrightDateValue {
  return Math.round(brightDate * 1_000_000) / 1_000_000;
}

/**
 * Calculate the number of complete days between two BrightDates.
 *
 * @param a - First BrightDate value
 * @param b - Second BrightDate value
 * @returns Number of complete days (integer)
 */
export function wholeDaysBetween(
  a: BrightDateValue,
  b: BrightDateValue,
): number {
  return Math.floor(Math.abs(a - b));
}
