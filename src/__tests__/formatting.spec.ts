/**
 * Tests for BrightDate formatting functions.
 */

import {
  dayFractionToHms,
  decompose,
  format,
  formatDuration,
  formatFull,
  formatLog,
  formatPrefixed,
  formatRange,
  hmsToDayFraction,
  toDuration,
} from '../formatting';

describe('formatting', () => {
  // ─── format ──────────────────────────────────────────────────────────────

  describe('format', () => {
    it('formats with default precision (5)', () => {
      expect(format(9622.50417)).toBe('9622.50417');
    });

    it('formats with precision 2', () => {
      expect(format(9622.50417, 2)).toBe('9622.50');
    });

    it('formats with precision 8', () => {
      expect(format(0, 8)).toBe('0.00000000');
    });

    it('formats negative values', () => {
      expect(format(-10957.5, 1)).toBe('-10957.5');
    });

    it('formats zero', () => {
      expect(format(0, 5)).toBe('0.00000');
    });

    it('formats with precision 1', () => {
      expect(format(9622.56789, 1)).toBe('9622.6');
    });
  });

  // ─── formatFull ──────────────────────────────────────────────────────────

  describe('formatFull', () => {
    it('returns full, day, fraction, friendly', () => {
      const result = formatFull(9622.50417);
      expect(result.full).toBe('9622.50417');
      expect(result.day).toBe('9622');
      expect(result.fraction).toBe('50417');
    });

    it('friendly contains day number and millidays', () => {
      const result = formatFull(9622.50417);
      expect(result.friendly).toContain('9622');
      expect(result.friendly).toContain('md');
    });

    it('handles zero', () => {
      const result = formatFull(0, 5);
      expect(result.full).toBe('0.00000');
      expect(result.day).toBe('0');
      expect(result.fraction).toBe('00000');
    });

    it('handles negative values', () => {
      const result = formatFull(-0.5, 5);
      expect(result.full).toBe('-0.50000');
    });
  });

  // ─── decompose ───────────────────────────────────────────────────────────

  describe('decompose', () => {
    it('decomposes a positive value', () => {
      const result = decompose(9622.504);
      expect(result.day).toBe(9622);
      expect(result.fraction).toBeCloseTo(0.504, 6);
      expect(result.value).toBe(9622.504);
    });

    it('millidays is floor(fraction * 1000)', () => {
      const result = decompose(9622.504);
      expect(result.millidays).toBe(504);
    });

    it('microdays is floor((fraction*1000 - millidays) * 1000)', () => {
      // fraction = 0.504, totalMillidays = 504.0, millidays = 504, microdays = 0
      const result = decompose(9622.504);
      expect(result.microdays).toBe(0);
    });

    it('microdays for 0.5004 fraction', () => {
      // fraction = 0.5004, totalMillidays = 500.4, millidays = 500, microdays = floor(0.4*1000) = 400
      const result = decompose(9622.5004);
      expect(result.millidays).toBe(500);
      expect(result.microdays).toBe(400);
    });

    it('decomposes zero', () => {
      const result = decompose(0);
      expect(result.day).toBe(0);
      expect(result.fraction).toBe(0);
      expect(result.millidays).toBe(0);
      expect(result.microdays).toBe(0);
    });

    it('decomposes negative value', () => {
      const result = decompose(-0.5);
      expect(result.day).toBe(-1);
      expect(result.fraction).toBeCloseTo(0.5, 8);
    });
  });

  // ─── toDuration ──────────────────────────────────────────────────────────

  describe('toDuration', () => {
    it('converts 1 day', () => {
      const d = toDuration(1);
      expect(d.days).toBe(1);
      expect(d.millidays).toBe(1000);
      expect(d.microdays).toBe(1_000_000);
      expect(d.nanodays).toBe(1_000_000_000);
    });

    it('converts 0.001 days (1 milliday)', () => {
      const d = toDuration(0.001);
      expect(d.millidays).toBeCloseTo(1, 6);
      expect(d.microdays).toBeCloseTo(1000, 3);
    });

    it('uses absolute value for millidays/microdays/nanodays', () => {
      const d = toDuration(-2);
      expect(d.days).toBe(-2);
      expect(d.millidays).toBe(2000);
      expect(d.microdays).toBe(2_000_000);
    });

    it('converts zero', () => {
      const d = toDuration(0);
      expect(d.days).toBe(0);
      expect(d.millidays).toBe(0);
    });
  });

  // ─── formatDuration ──────────────────────────────────────────────────────

  describe('formatDuration', () => {
    it('formats days for values >= 1', () => {
      expect(formatDuration(2.5)).toBe('2.500 days');
    });

    it('formats millidays for values in [0.001, 1)', () => {
      expect(formatDuration(0.5)).toBe('500.000 millidays');
    });

    it('formats microdays for values in [0.000001, 0.001)', () => {
      expect(formatDuration(0.0005)).toBe('500.000 microdays');
    });

    it('formats nanodays for values < 0.000001', () => {
      expect(formatDuration(0.0000005)).toBe('500.000 nanodays');
    });

    it('handles negative values with sign prefix', () => {
      expect(formatDuration(-2.5)).toBe('-2.500 days');
    });

    it('handles exactly 1 day', () => {
      expect(formatDuration(1)).toBe('1.000 days');
    });

    it('handles exactly 0.001 (1 milliday)', () => {
      expect(formatDuration(0.001)).toBe('1.000 millidays');
    });

    it('handles zero', () => {
      expect(formatDuration(0)).toBe('0.000 nanodays');
    });
  });

  // ─── formatLog ───────────────────────────────────────────────────────────

  describe('formatLog', () => {
    it('wraps value in brackets', () => {
      expect(formatLog(9622.50417)).toBe('[9622.50417]');
    });

    it('uses specified precision', () => {
      expect(formatLog(9622.50417, 2)).toBe('[9622.50]');
    });

    it('formats zero', () => {
      expect(formatLog(0, 5)).toBe('[0.00000]');
    });
  });

  // ─── formatPrefixed ──────────────────────────────────────────────────────

  describe('formatPrefixed', () => {
    it('uses default prefix "BD:"', () => {
      expect(formatPrefixed(9622.50417)).toBe('BD:9622.50417');
    });

    it('uses custom prefix', () => {
      expect(formatPrefixed(9622.50417, 5, 'TIME:')).toBe('TIME:9622.50417');
    });

    it('uses empty prefix', () => {
      expect(formatPrefixed(9622.50417, 5, '')).toBe('9622.50417');
    });
  });

  // ─── formatRange ─────────────────────────────────────────────────────────

  describe('formatRange', () => {
    it('formats a range with arrow separator', () => {
      expect(formatRange(9622.5, 9623.5)).toBe('9622.50000 → 9623.50000');
    });

    it('uses specified precision', () => {
      expect(formatRange(0, 1, 2)).toBe('0.00 → 1.00');
    });

    it('handles equal start and end', () => {
      expect(formatRange(100, 100, 3)).toBe('100.000 → 100.000');
    });
  });

  // ─── hmsToDayFraction / dayFractionToHms ─────────────────────────────────

  describe('hmsToDayFraction', () => {
    it('midnight (0:00:00) = 0', () => {
      expect(hmsToDayFraction(0, 0, 0)).toBe(0);
    });

    it('noon (12:00:00) = 0.5', () => {
      expect(hmsToDayFraction(12, 0, 0)).toBeCloseTo(0.5, 10);
    });

    it('6:00:00 = 0.25', () => {
      expect(hmsToDayFraction(6, 0, 0)).toBeCloseTo(0.25, 10);
    });

    it('18:00:00 = 0.75', () => {
      expect(hmsToDayFraction(18, 0, 0)).toBeCloseTo(0.75, 10);
    });

    it('1:30:00 = 1.5/24', () => {
      expect(hmsToDayFraction(1, 30, 0)).toBeCloseTo(1.5 / 24, 10);
    });

    it('seconds default to 0', () => {
      expect(hmsToDayFraction(6, 0)).toBeCloseTo(0.25, 10);
    });
  });

  describe('dayFractionToHms', () => {
    it('0 → 0:00:00', () => {
      const result = dayFractionToHms(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBeCloseTo(0, 5);
    });

    it('0.5 → 12:00:00', () => {
      const result = dayFractionToHms(0.5);
      expect(result.hours).toBe(12);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBeCloseTo(0, 5);
    });

    it('0.25 → 6:00:00', () => {
      const result = dayFractionToHms(0.25);
      expect(result.hours).toBe(6);
      expect(result.minutes).toBe(0);
    });

    it('round-trips with hmsToDayFraction', () => {
      const fraction = hmsToDayFraction(14, 30, 45);
      const { hours, minutes, seconds } = dayFractionToHms(fraction);
      expect(hours).toBe(14);
      expect(minutes).toBe(30);
      expect(seconds).toBeCloseTo(45, 3);
    });
  });
});
