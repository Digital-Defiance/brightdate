/**
 * BrightDate Intervals
 *
 * Represents a time interval (span) between two BrightDate values.
 * Useful for scheduling, range queries, and duration calculations.
 */

import { BrightDate } from './BrightDate';
import { DEFAULT_PRECISION } from './constants';
import { formatDuration, formatRange, toDuration } from './formatting';
import type { BrightDateValue, BrightDuration, Precision } from './types';

/**
 * Represents a closed time interval [start, end] in BrightDate values.
 */
export class BrightDateInterval {
  public readonly start: BrightDate;
  public readonly end: BrightDate;

  constructor(start: BrightDate, end: BrightDate) {
    if (start.value > end.value) {
      throw new Error(
        `Invalid interval: start (${start.toString()}) must be <= end (${end.toString()})`,
      );
    }
    this.start = start;
    this.end = end;
  }

  /**
   * Create an interval from two BrightDate values.
   */
  static fromValues(
    start: BrightDateValue,
    end: BrightDateValue,
  ): BrightDateInterval {
    return new BrightDateInterval(
      BrightDate.fromValue(start),
      BrightDate.fromValue(end),
    );
  }

  /**
   * Create an interval from a start and a duration in days.
   */
  static fromDuration(
    start: BrightDate,
    durationDays: number,
  ): BrightDateInterval {
    return new BrightDateInterval(start, start.addDays(durationDays));
  }

  /**
   * Create an interval from two JavaScript Dates.
   */
  static fromDates(start: Date, end: Date): BrightDateInterval {
    return new BrightDateInterval(
      BrightDate.fromDate(start),
      BrightDate.fromDate(end),
    );
  }

  /**
   * Create an interval from two ISO strings.
   */
  static fromISO(start: string, end: string): BrightDateInterval {
    return new BrightDateInterval(
      BrightDate.fromISO(start),
      BrightDate.fromISO(end),
    );
  }

  /**
   * Get the duration of this interval in decimal days.
   */
  get duration(): number {
    return this.end.value - this.start.value;
  }

  /**
   * Get the duration as metric sub-units.
   */
  get durationMetric(): BrightDuration {
    return toDuration(this.duration);
  }

  /**
   * Get the midpoint of this interval.
   */
  get midpoint(): BrightDate {
    return this.start.midpoint(this.end);
  }

  /**
   * Check if a BrightDate falls within this interval (inclusive).
   */
  contains(date: BrightDate): boolean {
    return date.value >= this.start.value && date.value <= this.end.value;
  }

  /**
   * Check if a numeric value falls within this interval.
   */
  containsValue(value: BrightDateValue): boolean {
    return value >= this.start.value && value <= this.end.value;
  }

  /**
   * Check if this interval overlaps with another.
   */
  overlaps(other: BrightDateInterval): boolean {
    return (
      this.start.value <= other.end.value && this.end.value >= other.start.value
    );
  }

  /**
   * Get the intersection of this interval with another.
   * Returns null if they don't overlap.
   */
  intersection(other: BrightDateInterval): BrightDateInterval | null {
    const start = Math.max(this.start.value, other.start.value);
    const end = Math.min(this.end.value, other.end.value);
    if (start > end) return null;
    return BrightDateInterval.fromValues(start, end);
  }

  /**
   * Get the union of this interval with another.
   * Returns null if they don't overlap (gap between them).
   */
  union(other: BrightDateInterval): BrightDateInterval | null {
    if (!this.overlaps(other) && !this.adjacentTo(other)) {
      return null;
    }
    const start = Math.min(this.start.value, other.start.value);
    const end = Math.max(this.end.value, other.end.value);
    return BrightDateInterval.fromValues(start, end);
  }

  /**
   * Check if this interval is adjacent to another (touching but not overlapping).
   */
  adjacentTo(
    other: BrightDateInterval,
    tolerance: number = 0.000_001,
  ): boolean {
    return (
      Math.abs(this.end.value - other.start.value) <= tolerance ||
      Math.abs(other.end.value - this.start.value) <= tolerance
    );
  }

  /**
   * Check if this interval completely contains another.
   */
  encloses(other: BrightDateInterval): boolean {
    return (
      this.start.value <= other.start.value && this.end.value >= other.end.value
    );
  }

  /**
   * Split this interval into N equal sub-intervals.
   */
  split(count: number): BrightDateInterval[] {
    if (count < 1) {
      throw new Error('Count must be at least 1');
    }
    const step = this.duration / count;
    const intervals: BrightDateInterval[] = [];
    for (let i = 0; i < count; i++) {
      const start = this.start.value + step * i;
      const end = this.start.value + step * (i + 1);
      intervals.push(BrightDateInterval.fromValues(start, end));
    }
    return intervals;
  }

  /**
   * Expand this interval by a given amount on each side.
   */
  expand(days: number): BrightDateInterval {
    return BrightDateInterval.fromValues(
      this.start.value - days,
      this.end.value + days,
    );
  }

  /**
   * Shrink this interval by a given amount on each side.
   * Returns null if the interval would become invalid.
   */
  shrink(days: number): BrightDateInterval | null {
    const start = this.start.value + days;
    const end = this.end.value - days;
    if (start > end) return null;
    return BrightDateInterval.fromValues(start, end);
  }

  /**
   * Shift this interval forward or backward by a given number of days.
   */
  shift(days: number): BrightDateInterval {
    return new BrightDateInterval(
      this.start.addDays(days),
      this.end.addDays(days),
    );
  }

  /**
   * Format this interval as a range string.
   */
  toString(precision?: Precision): string {
    const p = precision ?? (DEFAULT_PRECISION as Precision);
    return formatRange(this.start.value, this.end.value, p);
  }

  /**
   * Format the duration of this interval in human-readable form.
   */
  formatDuration(): string {
    return formatDuration(this.duration);
  }

  /**
   * Iterate over this interval in steps of the given size (days).
   */
  *iterate(stepDays: number): Generator<BrightDate> {
    let current = this.start.value;
    while (current <= this.end.value) {
      yield BrightDate.fromValue(current);
      current += stepDays;
    }
  }

  /**
   * Get an array of BrightDates at regular intervals within this range.
   */
  sample(count: number): BrightDate[] {
    if (count < 1) return [];
    if (count === 1) return [this.midpoint];
    const step = this.duration / (count - 1);
    return Array.from({ length: count }, (_, i) =>
      BrightDate.fromValue(this.start.value + step * i),
    );
  }
}
