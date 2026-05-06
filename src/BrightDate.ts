/**
 * BrightDate Class
 *
 * Immutable object-oriented wrapper around BrightDate values.
 * Provides a fluent API for creating, manipulating, and formatting BrightDates.
 */

import {
  absoluteDifference,
  add,
  addMicrodays,
  addMillidays,
  ceilToDay,
  compare,
  difference,
  equals,
  floorToDay,
  isInRange,
  lerp,
  midpoint,
  roundToMicroday,
  roundToMilliday,
  subtract,
} from './arithmetic';
import { DEFAULT_PRECISION } from './constants';
import {
  fromDate,
  fromGPSTime,
  fromISO,
  fromJulianDate,
  fromModifiedJulianDate,
  fromUnixMs,
  fromUnixSeconds,
  now,
  parse,
  taiToUtcBrightDate,
  toDate,
  toGPSTime,
  toISO,
  toJulianDate,
  toModifiedJulianDate,
  toUnixMs,
  toUnixSeconds,
  utcToTaiBrightDate,
} from './conversions';
import {
  decompose,
  format,
  formatDuration,
  formatFull,
  formatLog,
  formatPrefixed,
  formatRange,
  toDuration,
} from './formatting';
import type {
  BrightDateComponents,
  BrightDateOptions,
  BrightDateValue,
  BrightDuration,
  FormattedBrightDate,
  Precision,
} from './types';

/**
 * Immutable BrightDate instance.
 *
 * Represents a point in time as decimal days since J2000.0 epoch
 * (January 1, 2000, 12:00:00 UTC).
 *
 * @example
 * ```typescript
 * // Current time
 * const now = BrightDate.now();
 *
 * // From a JavaScript Date
 * const bd = BrightDate.fromDate(new Date('2025-06-15T10:30:00Z'));
 *
 * // Arithmetic
 * const tomorrow = bd.addDays(1);
 * const elapsed = tomorrow.difference(bd); // 1.0
 *
 * // Formatting
 * console.log(bd.toString()); // "9296.93750"
 * console.log(bd.toLogString()); // "[9296.93750]"
 * ```
 */
export class BrightDate {
  /** The raw BrightDate value (decimal days since J2000.0) */
  public readonly value: BrightDateValue;

  /** Display precision for this instance */
  public readonly precision: Precision;

  /** Whether this instance uses TAI timescale */
  public readonly isTAI: boolean;

  private constructor(value: BrightDateValue, options?: BrightDateOptions) {
    this.value = value;
    this.precision = options?.precision ?? (DEFAULT_PRECISION as Precision);
    this.isTAI = options?.useTAI ?? false;
  }

  // ─── Static Factory Methods ──────────────────────────────────────────

  /**
   * Create a BrightDate from a raw numeric value.
   */
  static fromValue(
    value: BrightDateValue,
    options?: BrightDateOptions,
  ): BrightDate {
    return new BrightDate(value, options);
  }

  /**
   * Create a BrightDate from the current time.
   */
  static now(options?: BrightDateOptions): BrightDate {
    return new BrightDate(now(), options);
  }

  /**
   * Create a BrightDate from a JavaScript Date.
   */
  static fromDate(date: Date, options?: BrightDateOptions): BrightDate {
    return new BrightDate(fromDate(date), options);
  }

  /**
   * Create a BrightDate from a Unix timestamp in milliseconds.
   */
  static fromUnixMs(unixMs: number, options?: BrightDateOptions): BrightDate {
    return new BrightDate(fromUnixMs(unixMs), options);
  }

  /**
   * Create a BrightDate from a Unix timestamp in seconds.
   */
  static fromUnixSeconds(
    unixSeconds: number,
    options?: BrightDateOptions,
  ): BrightDate {
    return new BrightDate(fromUnixSeconds(unixSeconds), options);
  }

  /**
   * Create a BrightDate from a Julian Date.
   */
  static fromJulianDate(jd: number, options?: BrightDateOptions): BrightDate {
    return new BrightDate(fromJulianDate(jd), options);
  }

  /**
   * Create a BrightDate from a Modified Julian Date.
   */
  static fromModifiedJulianDate(
    mjd: number,
    options?: BrightDateOptions,
  ): BrightDate {
    return new BrightDate(fromModifiedJulianDate(mjd), options);
  }

  /**
   * Create a BrightDate from an ISO 8601 string.
   */
  static fromISO(isoString: string, options?: BrightDateOptions): BrightDate {
    return new BrightDate(fromISO(isoString), options);
  }

  /**
   * Create a BrightDate from GPS time.
   */
  static fromGPSTime(
    gpsWeek: number,
    gpsSeconds: number,
    options?: BrightDateOptions,
  ): BrightDate {
    return new BrightDate(fromGPSTime(gpsWeek, gpsSeconds), options);
  }

  /**
   * Parse a BrightDate string (e.g., "9622.50417").
   */
  static parse(
    brightDateString: string,
    options?: BrightDateOptions,
  ): BrightDate {
    return new BrightDate(parse(brightDateString), options);
  }

  /**
   * Create a BrightDate representing the J2000.0 epoch itself (value = 0).
   */
  static epoch(options?: BrightDateOptions): BrightDate {
    return new BrightDate(0, options);
  }

  // ─── Conversion Methods ──────────────────────────────────────────────

  /**
   * Convert to a JavaScript Date.
   */
  toDate(): Date {
    return toDate(this.value);
  }

  /**
   * Convert to Unix timestamp in milliseconds.
   */
  toUnixMs(): number {
    return toUnixMs(this.value);
  }

  /**
   * Convert to Unix timestamp in seconds.
   */
  toUnixSeconds(): number {
    return toUnixSeconds(this.value);
  }

  /**
   * Convert to Julian Date.
   */
  toJulianDate(): number {
    return toJulianDate(this.value);
  }

  /**
   * Convert to Modified Julian Date.
   */
  toModifiedJulianDate(): number {
    return toModifiedJulianDate(this.value);
  }

  /**
   * Convert to ISO 8601 string.
   */
  toISO(): string {
    return toISO(this.value);
  }

  /**
   * Convert to GPS time.
   */
  toGPSTime(): { gpsWeek: number; gpsSeconds: number } {
    return toGPSTime(this.value);
  }

  /**
   * Convert to TAI-based BrightDate (monotonic, no leap second gaps).
   */
  toTAI(): BrightDate {
    if (this.isTAI) return this;
    return new BrightDate(utcToTaiBrightDate(this.value), {
      precision: this.precision,
      useTAI: true,
    });
  }

  /**
   * Convert from TAI-based BrightDate back to UTC-based.
   */
  toUTC(): BrightDate {
    if (!this.isTAI) return this;
    return new BrightDate(taiToUtcBrightDate(this.value), {
      precision: this.precision,
      useTAI: false,
    });
  }

  // ─── Formatting Methods ──────────────────────────────────────────────

  /**
   * Format as a string with the instance's precision.
   */
  toString(): string {
    return format(this.value, this.precision);
  }

  /**
   * Format with full decomposition.
   */
  toFormattedObject(): FormattedBrightDate {
    return formatFull(this.value, this.precision);
  }

  /**
   * Format as a log-friendly bracketed string.
   */
  toLogString(): string {
    return formatLog(this.value, this.precision);
  }

  /**
   * Format with a prefix (default "BD:").
   */
  toPrefixedString(prefix?: string): string {
    return formatPrefixed(this.value, this.precision, prefix);
  }

  /**
   * Decompose into components (day, fraction, millidays, microdays).
   */
  decompose(): BrightDateComponents {
    return decompose(this.value);
  }

  /**
   * Get the integer day number.
   */
  get day(): number {
    return Math.floor(this.value);
  }

  /**
   * Get the fractional part of the day.
   */
  get fraction(): number {
    return this.value - Math.floor(this.value);
  }

  /**
   * Get the numeric value (alias for value).
   */
  valueOf(): number {
    return this.value;
  }

  /**
   * JSON serialization.
   */
  toJSON(): string {
    return this.toString();
  }

  // ─── Arithmetic Methods ──────────────────────────────────────────────

  /**
   * Add days to this BrightDate, returning a new instance.
   */
  addDays(days: number): BrightDate {
    return new BrightDate(add(this.value, days), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Subtract days from this BrightDate, returning a new instance.
   */
  subtractDays(days: number): BrightDate {
    return new BrightDate(subtract(this.value, days), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Add millidays to this BrightDate.
   */
  addMillidays(md: number): BrightDate {
    return new BrightDate(addMillidays(this.value, md), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Add microdays to this BrightDate.
   */
  addMicrodays(ud: number): BrightDate {
    return new BrightDate(addMicrodays(this.value, ud), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Add hours to this BrightDate.
   */
  addHours(hours: number): BrightDate {
    return this.addDays(hours / 24);
  }

  /**
   * Add minutes to this BrightDate.
   */
  addMinutes(minutes: number): BrightDate {
    return this.addDays(minutes / 1440);
  }

  /**
   * Add seconds to this BrightDate.
   */
  addSeconds(seconds: number): BrightDate {
    return this.addDays(seconds / 86400);
  }

  /**
   * Calculate the difference between this and another BrightDate (in days).
   */
  difference(other: BrightDate): number {
    return difference(this.value, other.value);
  }

  /**
   * Calculate the absolute difference between this and another BrightDate.
   */
  absoluteDifference(other: BrightDate): number {
    return absoluteDifference(this.value, other.value);
  }

  /**
   * Get the duration between this and another BrightDate as metric units.
   */
  durationTo(other: BrightDate): BrightDuration {
    return toDuration(other.value - this.value);
  }

  /**
   * Format the duration between this and another BrightDate.
   */
  formatDurationTo(other: BrightDate): string {
    return formatDuration(other.value - this.value);
  }

  // ─── Comparison Methods ──────────────────────────────────────────────

  /**
   * Compare with another BrightDate.
   * @returns -1, 0, or 1
   */
  compareTo(other: BrightDate): -1 | 0 | 1 {
    return compare(this.value, other.value);
  }

  /**
   * Check equality with tolerance.
   */
  equals(other: BrightDate, tolerance?: number): boolean {
    return equals(this.value, other.value, tolerance);
  }

  /**
   * Check if this BrightDate is before another.
   */
  isBefore(other: BrightDate): boolean {
    return this.value < other.value;
  }

  /**
   * Check if this BrightDate is after another.
   */
  isAfter(other: BrightDate): boolean {
    return this.value > other.value;
  }

  /**
   * Check if this BrightDate falls within a range.
   */
  isInRange(start: BrightDate, end: BrightDate): boolean {
    return isInRange(this.value, start.value, end.value);
  }

  // ─── Rounding Methods ────────────────────────────────────────────────

  /**
   * Floor to the start of the current day.
   */
  floorToDay(): BrightDate {
    return new BrightDate(floorToDay(this.value), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Ceil to the start of the next day.
   */
  ceilToDay(): BrightDate {
    return new BrightDate(ceilToDay(this.value), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Round to the nearest milliday.
   */
  roundToMilliday(): BrightDate {
    return new BrightDate(roundToMilliday(this.value), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Round to the nearest microday.
   */
  roundToMicroday(): BrightDate {
    return new BrightDate(roundToMicroday(this.value), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  // ─── Utility Methods ─────────────────────────────────────────────────

  /**
   * Create a copy with different options.
   */
  withOptions(options: BrightDateOptions): BrightDate {
    return new BrightDate(this.value, {
      precision: options.precision ?? this.precision,
      useTAI: options.useTAI ?? this.isTAI,
    });
  }

  /**
   * Create a copy with different precision.
   */
  withPrecision(precision: Precision): BrightDate {
    return new BrightDate(this.value, {
      precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Calculate the midpoint between this and another BrightDate.
   */
  midpoint(other: BrightDate): BrightDate {
    return new BrightDate(midpoint(this.value, other.value), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Interpolate between this and another BrightDate.
   * @param other - Target BrightDate
   * @param t - Interpolation factor [0, 1]
   */
  lerp(other: BrightDate, t: number): BrightDate {
    return new BrightDate(lerp(this.value, other.value, t), {
      precision: this.precision,
      useTAI: this.isTAI,
    });
  }

  /**
   * Format a range from this BrightDate to another.
   */
  formatRangeTo(other: BrightDate): string {
    return formatRange(this.value, other.value, this.precision);
  }

  /**
   * Check if this BrightDate represents a time in the future.
   */
  isFuture(): boolean {
    return this.value > now();
  }

  /**
   * Check if this BrightDate represents a time in the past.
   */
  isPast(): boolean {
    return this.value < now();
  }

  /**
   * Get the timescale label for this instance.
   */
  get timescale(): 'UTC' | 'TAI' {
    return this.isTAI ? 'TAI' : 'UTC';
  }

  /**
   * Custom inspection for Node.js console.log.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    const ts = this.isTAI ? ' TAI' : '';
    return `BrightDate(${this.toString()}${ts})`;
  }
}
