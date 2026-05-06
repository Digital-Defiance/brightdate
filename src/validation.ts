/**
 * BrightDate Validation
 *
 * Input validation and error handling utilities.
 */

import { MAX_PRECISION } from './constants';
import type { BrightDateValue, Precision } from './types';

/**
 * Error thrown when a BrightDate value is invalid.
 */
export class BrightDateError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'BrightDateError';
    this.code = code;
  }
}

/**
 * Validate that a value is a finite number.
 *
 * @param value - Value to validate
 * @param name - Name of the parameter (for error messages)
 * @throws BrightDateError if the value is not a finite number
 */
export function validateFiniteNumber(
  value: unknown,
  name: string,
): asserts value is number {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new BrightDateError(
      `${name} must be a finite number, got: ${String(value)}`,
      'INVALID_NUMBER',
    );
  }
}

/**
 * Validate a BrightDate value.
 *
 * @param value - Value to validate
 * @throws BrightDateError if the value is invalid
 */
export function validateBrightDateValue(
  value: unknown,
): asserts value is BrightDateValue {
  validateFiniteNumber(value, 'BrightDate value');
}

/**
 * Validate a precision value.
 *
 * @param precision - Precision to validate
 * @throws BrightDateError if the precision is invalid
 */
export function validatePrecision(
  precision: unknown,
): asserts precision is Precision {
  if (
    typeof precision !== 'number' ||
    !Number.isInteger(precision) ||
    precision < 1 ||
    precision > MAX_PRECISION
  ) {
    throw new BrightDateError(
      `Precision must be an integer between 1 and ${MAX_PRECISION}, got: ${String(precision)}`,
      'INVALID_PRECISION',
    );
  }
}

/**
 * Validate that a string is a valid BrightDate string.
 *
 * @param value - String to validate
 * @returns true if the string is a valid BrightDate representation
 */
export function isValidBrightDateString(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  // Must match pattern: optional negative sign, digits, optional decimal point and digits
  const pattern = /^-?\d+(\.\d+)?$/;
  if (!pattern.test(trimmed)) return false;

  const parsed = parseFloat(trimmed);
  return isFinite(parsed);
}

/**
 * Validate that a value is a valid Unix timestamp in milliseconds.
 * Rejects values that are clearly out of range (before year 1000 or after year 9999).
 *
 * @param value - Value to validate
 * @throws BrightDateError if the value is out of range
 */
export function validateUnixMs(value: number): void {
  validateFiniteNumber(value, 'Unix timestamp (ms)');
  // Year 1000 ≈ -30610224000000, Year 9999 ≈ 253402300800000
  const MIN_UNIX_MS = -30_610_224_000_000;
  const MAX_UNIX_MS = 253_402_300_800_000;
  if (value < MIN_UNIX_MS || value > MAX_UNIX_MS) {
    throw new BrightDateError(
      `Unix timestamp (ms) out of reasonable range: ${value}`,
      'OUT_OF_RANGE',
    );
  }
}

/**
 * Validate that a Julian Date is within a reasonable range.
 *
 * @param jd - Julian Date to validate
 * @throws BrightDateError if the value is out of range
 */
export function validateJulianDate(jd: number): void {
  validateFiniteNumber(jd, 'Julian Date');
  // JD 0 = 4713 BCE, JD ~5373484 = year 9999
  if (jd < 0 || jd > 5_373_484) {
    throw new BrightDateError(
      `Julian Date out of reasonable range: ${jd}`,
      'OUT_OF_RANGE',
    );
  }
}

/**
 * Validate that a GPS week number is reasonable.
 *
 * @param week - GPS week number
 * @throws BrightDateError if the value is out of range
 */
export function validateGPSWeek(week: number): void {
  validateFiniteNumber(week, 'GPS week');
  if (!Number.isInteger(week) || week < 0 || week > 9999) {
    throw new BrightDateError(
      `GPS week must be a non-negative integer <= 9999, got: ${week}`,
      'INVALID_GPS_WEEK',
    );
  }
}

/**
 * Validate that GPS seconds within a week are reasonable.
 *
 * @param seconds - Seconds within GPS week
 * @throws BrightDateError if the value is out of range
 */
export function validateGPSSeconds(seconds: number): void {
  validateFiniteNumber(seconds, 'GPS seconds');
  if (seconds < 0 || seconds >= 604800) {
    throw new BrightDateError(
      `GPS seconds must be in [0, 604800), got: ${seconds}`,
      'INVALID_GPS_SECONDS',
    );
  }
}

/**
 * Type guard: check if a value is a valid BrightDate number.
 */
export function isBrightDateValue(value: unknown): value is BrightDateValue {
  return typeof value === 'number' && isFinite(value);
}
