/**
 * BrightDate Comparison Utilities
 *
 * Higher-level comparison and query functions for working with
 * collections of BrightDate values.
 */

import { now } from './conversions';
import type { BrightDateValue } from './types';

/**
 * Find the closest BrightDate in an array to a target value.
 *
 * @param target - Target BrightDate value
 * @param candidates - Array of candidate values
 * @returns The closest value, or undefined if array is empty
 */
export function closest(
  target: BrightDateValue,
  candidates: BrightDateValue[],
): BrightDateValue | undefined {
  if (candidates.length === 0) return undefined;

  let best = candidates[0];
  let bestDist = Math.abs(target - best);

  for (let i = 1; i < candidates.length; i++) {
    const dist = Math.abs(target - candidates[i]);
    if (dist < bestDist) {
      best = candidates[i];
      bestDist = dist;
    }
  }

  return best;
}

/**
 * Find all BrightDate values within a given distance of a target.
 *
 * @param target - Target BrightDate value
 * @param candidates - Array of candidate values
 * @param maxDistance - Maximum distance in days
 * @returns Array of values within range
 */
export function within(
  target: BrightDateValue,
  candidates: BrightDateValue[],
  maxDistance: number,
): BrightDateValue[] {
  return candidates.filter((c) => Math.abs(target - c) <= maxDistance);
}

/**
 * Partition BrightDate values into "past" and "future" relative to a reference.
 *
 * @param values - Array of BrightDate values
 * @param reference - Reference point (default: now)
 * @returns Object with past and future arrays
 */
export function partition(
  values: BrightDateValue[],
  reference?: BrightDateValue,
): { past: BrightDateValue[]; future: BrightDateValue[] } {
  const ref = reference ?? now();
  const past: BrightDateValue[] = [];
  const future: BrightDateValue[] = [];

  for (const v of values) {
    if (v < ref) {
      past.push(v);
    } else {
      future.push(v);
    }
  }

  return { past, future };
}

/**
 * Group BrightDate values by their integer day number.
 *
 * @param values - Array of BrightDate values
 * @returns Map from day number to array of values on that day
 */
export function groupByDay(
  values: BrightDateValue[],
): Map<number, BrightDateValue[]> {
  const groups = new Map<number, BrightDateValue[]>();

  for (const v of values) {
    const day = Math.floor(v);
    const existing = groups.get(day);
    if (existing) {
      existing.push(v);
    } else {
      groups.set(day, [v]);
    }
  }

  return groups;
}

/**
 * Calculate statistics for an array of BrightDate values.
 *
 * @param values - Array of BrightDate values
 * @returns Statistics object
 */
export function statistics(values: BrightDateValue[]): {
  count: number;
  min: BrightDateValue;
  max: BrightDateValue;
  range: number;
  mean: BrightDateValue;
  median: BrightDateValue;
} {
  if (values.length === 0) {
    throw new Error('Cannot compute statistics of empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;
  const mean = sorted.reduce((sum, v) => sum + v, 0) / count;

  let median: number;
  if (count % 2 === 0) {
    median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  } else {
    median = sorted[Math.floor(count / 2)];
  }

  return { count, min, max, range, mean, median };
}

/**
 * Calculate the gaps (intervals) between consecutive sorted BrightDate values.
 *
 * @param values - Array of BrightDate values (will be sorted)
 * @returns Array of gap durations in days
 */
export function gaps(values: BrightDateValue[]): number[] {
  if (values.length < 2) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const result: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    result.push(sorted[i] - sorted[i - 1]);
  }

  return result;
}

/**
 * Find the largest gap between consecutive BrightDate values.
 *
 * @param values - Array of BrightDate values
 * @returns Object with gap size and the two bounding values, or undefined if < 2 values
 */
export function largestGap(
  values: BrightDateValue[],
):
  | { gap: number; before: BrightDateValue; after: BrightDateValue }
  | undefined {
  if (values.length < 2) return undefined;

  const sorted = [...values].sort((a, b) => a - b);
  let maxGap = 0;
  let maxBefore = sorted[0];
  let maxAfter = sorted[1];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      maxBefore = sorted[i - 1];
      maxAfter = sorted[i];
    }
  }

  return { gap: maxGap, before: maxBefore, after: maxAfter };
}

/**
 * Check if BrightDate values are monotonically increasing.
 *
 * @param values - Array of BrightDate values
 * @returns true if each value is greater than the previous
 */
export function isMonotonicallyIncreasing(values: BrightDateValue[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) return false;
  }
  return true;
}

/**
 * Check if BrightDate values are monotonically non-decreasing.
 *
 * @param values - Array of BrightDate values
 * @returns true if each value is >= the previous
 */
export function isNonDecreasing(values: BrightDateValue[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) return false;
  }
  return true;
}

/**
 * Deduplicate BrightDate values within a tolerance.
 *
 * @param values - Array of BrightDate values
 * @param tolerance - Maximum difference to consider as duplicate (default: 1 nanoday)
 * @returns Deduplicated array
 */
export function deduplicate(
  values: BrightDateValue[],
  tolerance: number = 0.000_000_001,
): BrightDateValue[] {
  if (values.length === 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const result: BrightDateValue[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - result[result.length - 1] > tolerance) {
      result.push(sorted[i]);
    }
  }

  return result;
}
