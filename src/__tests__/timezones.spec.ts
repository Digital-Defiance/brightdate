/**
 * Tests for BrightDate timezone utilities.
 */

import {
  TIMEZONE_OFFSETS,
  formatWithTimezone,
  fractionalDaysToHours,
  fromLocalValue,
  getSystemTimezoneOffset,
  getTimezoneOffset,
  hoursToFractionalDays,
  isDaytime,
  localTimeOfDay,
  toLocalValue,
  toSystemLocal,
} from '../timezones';

describe('timezones', () => {
  // ─── TIMEZONE_OFFSETS ────────────────────────────────────────────────────

  describe('TIMEZONE_OFFSETS', () => {
    it('UTC+0 is 0', () => {
      expect(TIMEZONE_OFFSETS['UTC+0']).toBe(0);
    });

    it('UTC+8 is 8/24', () => {
      expect(TIMEZONE_OFFSETS['UTC+8']).toBeCloseTo(8 / 24, 10);
    });

    it('UTC-5 is -5/24', () => {
      expect(TIMEZONE_OFFSETS['UTC-5']).toBeCloseTo(-5 / 24, 10);
    });

    it('UTC+5.5 (India) is 5.5/24', () => {
      expect(TIMEZONE_OFFSETS['UTC+5.5']).toBeCloseTo(5.5 / 24, 10);
    });

    it('contains entries for all major offsets', () => {
      expect(Object.keys(TIMEZONE_OFFSETS).length).toBeGreaterThan(20);
    });
  });

  // ─── toLocalValue / fromLocalValue ───────────────────────────────────────

  describe('toLocalValue', () => {
    it('adds the offset to the BrightDate', () => {
      const bd = 9622.5;
      const offset = 8 / 24; // UTC+8
      expect(toLocalValue(bd, offset)).toBeCloseTo(bd + offset, 10);
    });

    it('subtracts for negative offset (west of UTC)', () => {
      const bd = 9622.5;
      const offset = -5 / 24; // UTC-5
      expect(toLocalValue(bd, offset)).toBeCloseTo(bd - 5 / 24, 10);
    });
  });

  describe('fromLocalValue', () => {
    it('round-trips toLocalValue → fromLocalValue', () => {
      const bd = 9622.5;
      const offset = 8 / 24;
      expect(fromLocalValue(toLocalValue(bd, offset), offset)).toBeCloseTo(
        bd,
        10,
      );
    });

    it('is the inverse of toLocalValue', () => {
      const bd = 9622.5;
      const offset = -5 / 24;
      const local = toLocalValue(bd, offset);
      expect(fromLocalValue(local, offset)).toBeCloseTo(bd, 10);
    });
  });

  // ─── getTimezoneOffset ───────────────────────────────────────────────────

  describe('getTimezoneOffset', () => {
    it('returns the offset for a known timezone', () => {
      expect(getTimezoneOffset('UTC+8')).toBeCloseTo(8 / 24, 10);
    });

    it('returns undefined for unknown timezone', () => {
      expect(getTimezoneOffset('UTC+99')).toBeUndefined();
    });

    it('returns 0 for UTC+0', () => {
      expect(getTimezoneOffset('UTC+0')).toBe(0);
    });
  });

  // ─── hoursToFractionalDays / fractionalDaysToHours ───────────────────────

  describe('hoursToFractionalDays', () => {
    it('converts 24 hours to 1 day', () => {
      expect(hoursToFractionalDays(24)).toBe(1);
    });

    it('converts 12 hours to 0.5 days', () => {
      expect(hoursToFractionalDays(12)).toBe(0.5);
    });

    it('converts 0 hours to 0', () => {
      expect(hoursToFractionalDays(0)).toBe(0);
    });

    it('converts negative hours', () => {
      expect(hoursToFractionalDays(-5)).toBeCloseTo(-5 / 24, 10);
    });
  });

  describe('fractionalDaysToHours', () => {
    it('converts 1 day to 24 hours', () => {
      expect(fractionalDaysToHours(1)).toBe(24);
    });

    it('converts 0.5 days to 12 hours', () => {
      expect(fractionalDaysToHours(0.5)).toBe(12);
    });

    it('round-trips with hoursToFractionalDays', () => {
      const hours = 5.5;
      expect(fractionalDaysToHours(hoursToFractionalDays(hours))).toBeCloseTo(
        hours,
        10,
      );
    });
  });

  // ─── formatWithTimezone ──────────────────────────────────────────────────

  describe('formatWithTimezone', () => {
    it('includes the original UTC value followed by the shifted local value', () => {
      const bd = 9622.5;
      const tz = 'UTC+8';
      const offset = TIMEZONE_OFFSETS[tz];
      const result = formatWithTimezone(bd, tz);
      const utcStr = bd.toFixed(5);
      const localStr = (bd + offset).toFixed(5);
      expect(result).toContain(utcStr);
      expect(result).toContain(localStr);
      expect(result).toContain(tz);
      // The UTC value MUST appear BEFORE the local value (readable format)
      expect(result.indexOf(utcStr)).toBeLessThan(result.indexOf(localStr));
    });

    it('shifted local value differs from UTC value for non-zero offset', () => {
      const bd = 9622.5;
      const result = formatWithTimezone(bd, 'UTC-5');
      // UTC-5 shifts by -5/24 = -0.20833...; local = 9622.29167
      expect(result).toContain('9622.50000');
      expect(result).toContain('9622.29167');
    });

    it('handles unknown timezone gracefully', () => {
      const result = formatWithTimezone(9622.5, 'UTC+99');
      expect(result).toContain('unknown timezone');
      expect(result).toContain('UTC+99');
    });
  });

  // ─── localTimeOfDay ──────────────────────────────────────────────────────

  describe('localTimeOfDay', () => {
    it('returns a value in [0, 1)', () => {
      const tod = localTimeOfDay(9622.5, 0);
      expect(tod).toBeGreaterThanOrEqual(0);
      expect(tod).toBeLessThan(1);
    });

    it('noon fraction (0.5) with UTC+0 offset returns 0.5', () => {
      // A BrightDate value of 0.5 represents J2000.0 + 12 hours = 2000-01-02
      // 00:00 UTC (midnight civil-time-of-next-day, i.e. the *next* civil
      // day starts here because the BrightDate "day" starts at noon).
      // For localTimeOfDay purposes, 0.5 is simply fraction 0.5 of a day,
      // which with zero offset maps to 0.5 — civil noon.
      expect(localTimeOfDay(0.5, 0)).toBeCloseTo(0.5, 8);
    });

    it('wraps around midnight correctly', () => {
      // 0.9 + 0.2 = 1.1 → should wrap to 0.1
      const tod = localTimeOfDay(0.9, 0.2);
      expect(tod).toBeCloseTo(0.1, 5);
    });
  });

  // ─── isDaytime ───────────────────────────────────────────────────────────

  describe('isDaytime', () => {
    it('returns true at noon (fraction=0.5)', () => {
      // 0.5 = 12:00 UTC, with UTC+0 offset
      expect(isDaytime(0.5, 0)).toBe(true);
    });

    it('returns false at midnight (fraction=0)', () => {
      expect(isDaytime(0, 0)).toBe(false);
    });

    it('returns true at 6:00 (fraction=0.25)', () => {
      expect(isDaytime(0.25, 0)).toBe(true);
    });

    it('returns false just before 6:00', () => {
      // 0.249 < 0.25
      expect(isDaytime(0.249, 0)).toBe(false);
    });

    it('returns false at 18:00 (fraction=0.75)', () => {
      // isDaytime is [0.25, 0.75) — 0.75 is NOT daytime
      expect(isDaytime(0.75, 0)).toBe(false);
    });
  });

  // ─── getSystemTimezoneOffset ─────────────────────────────────────────────

  describe('getSystemTimezoneOffset', () => {
    it('returns a finite number', () => {
      expect(isFinite(getSystemTimezoneOffset())).toBe(true);
    });

    it('returns a value in [-0.5, 0.625] (UTC-12 to UTC+15)', () => {
      const offset = getSystemTimezoneOffset();
      expect(offset).toBeGreaterThanOrEqual(-0.5);
      expect(offset).toBeLessThanOrEqual(0.625);
    });

    it('matches -getTimezoneOffset()/1440 (JS returns minutes west of UTC)', () => {
      // Cross-check against the underlying JavaScript primitive
      const jsMinutesWest = new Date().getTimezoneOffset();
      const expectedFractionalDay = -jsMinutesWest / 1440;
      expect(getSystemTimezoneOffset()).toBe(expectedFractionalDay);
    });
  });

  // ─── toSystemLocal ───────────────────────────────────────────────────────

  describe('toSystemLocal', () => {
    it('returns a finite number', () => {
      expect(isFinite(toSystemLocal(9622.5))).toBe(true);
    });

    it('differs from UTC by the system offset', () => {
      const bd = 9622.5;
      const offset = getSystemTimezoneOffset();
      expect(toSystemLocal(bd)).toBeCloseTo(bd + offset, 10);
    });
  });
});
