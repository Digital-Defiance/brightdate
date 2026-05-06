/**
 * BrightDate Calendar Utilities
 *
 * Functions for working with traditional calendar concepts
 * (year boundaries, month boundaries, etc.) in BrightDate space.
 * These are convenience bridges for users transitioning from
 * traditional date systems.
 */

import { BrightDate } from './BrightDate';
import { fromDate } from './conversions';
import { BrightDateInterval } from './intervals';
import type { BrightDateValue } from './types';

/**
 * Get the BrightDate value for the start of a given year (Jan 1, 00:00:00 UTC).
 *
 * @param year - Calendar year (e.g., 2025)
 * @returns BrightDate value
 */
export function startOfYear(year: number): BrightDateValue {
  return fromDate(new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)));
}

/**
 * Get the BrightDate value for the end of a given year (Dec 31, 23:59:59.999 UTC).
 *
 * @param year - Calendar year
 * @returns BrightDate value
 */
export function endOfYear(year: number): BrightDateValue {
  return fromDate(new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)));
}

/**
 * Get the BrightDate interval for an entire year.
 *
 * @param year - Calendar year
 * @returns BrightDateInterval spanning the year
 */
export function yearInterval(year: number): BrightDateInterval {
  return new BrightDateInterval(
    BrightDate.fromValue(startOfYear(year)),
    BrightDate.fromValue(endOfYear(year)),
  );
}

/**
 * Get the BrightDate value for the start of a given month.
 *
 * @param year - Calendar year
 * @param month - Month (1-12)
 * @returns BrightDate value
 */
export function startOfMonth(year: number, month: number): BrightDateValue {
  return fromDate(new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)));
}

/**
 * Get the BrightDate value for the end of a given month.
 *
 * @param year - Calendar year
 * @param month - Month (1-12)
 * @returns BrightDate value
 */
export function endOfMonth(year: number, month: number): BrightDateValue {
  // Day 0 of next month = last day of current month
  const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return fromDate(lastDay);
}

/**
 * Get the BrightDate interval for a given month.
 *
 * @param year - Calendar year
 * @param month - Month (1-12)
 * @returns BrightDateInterval spanning the month
 */
export function monthInterval(year: number, month: number): BrightDateInterval {
  return new BrightDateInterval(
    BrightDate.fromValue(startOfMonth(year, month)),
    BrightDate.fromValue(endOfMonth(year, month)),
  );
}

/**
 * Get the calendar year for a given BrightDate value.
 *
 * @param brightDate - BrightDate value
 * @returns Calendar year
 */
export function getYear(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  return date.getUTCFullYear();
}

/**
 * Get the calendar month (1-12) for a given BrightDate value.
 *
 * @param brightDate - BrightDate value
 * @returns Month number (1-12)
 */
export function getMonth(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  return date.getUTCMonth() + 1;
}

/**
 * Get the day of month (1-31) for a given BrightDate value.
 *
 * @param brightDate - BrightDate value
 * @returns Day of month
 */
export function getDayOfMonth(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  return date.getUTCDate();
}

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a given BrightDate value.
 *
 * @param brightDate - BrightDate value
 * @returns Day of week (0-6)
 */
export function getDayOfWeek(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  return date.getUTCDay();
}

/**
 * Get the day of year (1-366) for a given BrightDate value.
 *
 * @param brightDate - BrightDate value
 * @returns Day of year
 */
export function getDayOfYear(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  const startOfYearDate = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - startOfYearDate.getTime();
  return Math.floor(diffMs / 86_400_000) + 1;
}

/**
 * Check if a BrightDate falls in a leap year.
 *
 * @param brightDate - BrightDate value
 * @returns true if the year is a leap year
 */
export function isLeapYear(brightDate: BrightDateValue): boolean {
  const year = getYear(brightDate);
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the number of days in the year containing the given BrightDate.
 *
 * @param brightDate - BrightDate value
 * @returns 365 or 366
 */
export function daysInYear(brightDate: BrightDateValue): number {
  return isLeapYear(brightDate) ? 366 : 365;
}

/**
 * Get the number of days in the month containing the given BrightDate.
 *
 * @param brightDate - BrightDate value
 * @returns Number of days in the month (28-31)
 */
export function daysInMonth(brightDate: BrightDateValue): number {
  const date = BrightDate.fromValue(brightDate).toDate();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Get the BrightDate for a specific calendar date.
 *
 * @param year - Calendar year
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @param hour - Hour (0-23, default 0)
 * @param minute - Minute (0-59, default 0)
 * @param second - Second (0-59, default 0)
 * @returns BrightDate value
 */
export function fromCalendar(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): BrightDateValue {
  return fromDate(
    new Date(Date.UTC(year, month - 1, day, hour, minute, second)),
  );
}

/**
 * Decompose a BrightDate into traditional calendar components.
 *
 * @param brightDate - BrightDate value
 * @returns Calendar components
 */
export function toCalendar(brightDate: BrightDateValue): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
} {
  const date = BrightDate.fromValue(brightDate).toDate();
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
  };
}

/**
 * Get notable epoch BrightDate values for reference.
 */
export const NOTABLE_EPOCHS = {
  /** J2000.0 epoch (BrightDate 0) */
  J2000: 0,
  /** Unix epoch: 1970-01-01T00:00:00Z */
  UNIX: fromDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0))),
  /** GPS epoch: 1980-01-06T00:00:00Z */
  GPS: fromDate(new Date(Date.UTC(1980, 0, 6, 0, 0, 0))),
  /** Y2K: 2000-01-01T00:00:00Z */
  Y2K: fromDate(new Date(Date.UTC(2000, 0, 1, 0, 0, 0))),
  /** Apollo 11 landing: 1969-07-20T20:17:40Z */
  APOLLO_11: fromDate(new Date(Date.UTC(1969, 6, 20, 20, 17, 40))),
  /** First Sputnik: 1957-10-04T19:28:34Z */
  SPUTNIK: fromDate(new Date(Date.UTC(1957, 9, 4, 19, 28, 34))),
} as const;
