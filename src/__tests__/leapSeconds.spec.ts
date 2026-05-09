/**
 * Tests for BrightDate leap second utilities.
 */

import { LEAP_SECOND_TABLE } from '../constants';
import {
  getTaiUtcOffset,
  getTaiUtcOffsetAtJ2000,
  isDuringLeapSecond,
  leapSecondsBetween,
  taiToUtc,
  utcToTai,
} from '../leapSeconds';

describe('leapSeconds', () => {
  // ─── getTaiUtcOffset ─────────────────────────────────────────────────────

  describe('getTaiUtcOffset', () => {
    it('returns 10 before 1972-01-01 (pre-table)', () => {
      // Before first entry (63072000)
      expect(getTaiUtcOffset(0)).toBe(10);
    });

    it('returns 10 at 1972-01-01 exactly', () => {
      expect(getTaiUtcOffset(63072000)).toBe(10);
    });

    it('returns 11 after 1972-07-01', () => {
      expect(getTaiUtcOffset(78796800 + 1)).toBe(11);
    });

    it('returns 32 at J2000.0 epoch (1999-01-01 to 2006-01-01)', () => {
      // J2000.0 = 2000-01-01T12:00:00Z = Unix 946728000
      expect(getTaiUtcOffset(946728000)).toBe(32);
    });

    it('returns 37 after 2017-01-01', () => {
      // 2020-01-01T00:00:00Z = 1577836800
      expect(getTaiUtcOffset(1577836800)).toBe(37);
    });

    it('returns 37 for current time (well after 2017)', () => {
      const now = Date.now() / 1000;
      expect(getTaiUtcOffset(now)).toBe(37);
    });

    it('returns correct offset at each leap second boundary', () => {
      for (const [timestamp, offset] of LEAP_SECOND_TABLE) {
        expect(getTaiUtcOffset(timestamp)).toBe(offset);
      }
    });

    it('returns previous offset just before a leap second', () => {
      // Just before 1972-07-01 (78796800), offset should still be 10
      expect(getTaiUtcOffset(78796800 - 1)).toBe(10);
    });
  });

  // ─── getTaiUtcOffsetAtJ2000 ──────────────────────────────────────────────

  describe('getTaiUtcOffsetAtJ2000', () => {
    it('returns 32', () => {
      expect(getTaiUtcOffsetAtJ2000()).toBe(32);
    });
  });

  // ─── utcToTai ────────────────────────────────────────────────────────────

  describe('utcToTai', () => {
    it('adds the TAI-UTC offset', () => {
      // At 2020-01-01, offset is 37
      const utc = 1577836800;
      expect(utcToTai(utc)).toBe(utc + 37);
    });

    it('TAI is always ahead of UTC', () => {
      const utc = 946728000; // J2000.0
      expect(utcToTai(utc)).toBeGreaterThan(utc);
    });

    it('at J2000.0, TAI = UTC + 32', () => {
      const utc = 946728000;
      expect(utcToTai(utc)).toBe(utc + 32);
    });
  });

  // ─── taiToUtc ────────────────────────────────────────────────────────────

  describe('taiToUtc', () => {
    it('round-trips UTC → TAI → UTC', () => {
      const utc = 1577836800; // 2020-01-01
      expect(taiToUtc(utcToTai(utc))).toBe(utc);
    });

    it('round-trips at J2000.0', () => {
      const utc = 946728000;
      expect(taiToUtc(utcToTai(utc))).toBe(utc);
    });

    it('UTC is always behind TAI', () => {
      const tai = 1577836837; // 2020-01-01 TAI
      expect(taiToUtc(tai)).toBeLessThan(tai);
    });
  });

  // ─── isDuringLeapSecond ──────────────────────────────────────────────────

  describe('isDuringLeapSecond', () => {
    it('returns false for a normal second', () => {
      expect(isDuringLeapSecond(946728000)).toBe(false);
    });

    it('returns true for the second just before a leap second insertion', () => {
      // 1972-01-01 00:00:00 UTC = 63072000
      // The leap second is at 63072000, so 63072000 - 1 = 63071999 is during it
      expect(isDuringLeapSecond(63072000 - 1)).toBe(true);
    });

    it('returns false at the leap second timestamp itself', () => {
      // The leap second occupies [timestamp-1, timestamp)
      expect(isDuringLeapSecond(63072000)).toBe(false);
    });

    it('returns true for the second before 2017-01-01 leap second', () => {
      // 2017-01-01 = 1483228800
      expect(isDuringLeapSecond(1483228800 - 1)).toBe(true);
    });

    it('returns false for a time well after a leap second', () => {
      expect(isDuringLeapSecond(1577836800)).toBe(false);
    });
  });

  // ─── leapSecondsBetween ──────────────────────────────────────────────────

  describe('leapSecondsBetween', () => {
    it('returns 0 for same timestamp', () => {
      expect(leapSecondsBetween(946728000, 946728000)).toBe(0);
    });

    it('returns 0 within the same leap second era', () => {
      // Both in 2020 (offset 37)
      expect(leapSecondsBetween(1577836800, 1609459200)).toBe(0);
    });

    it('returns 5 between 1999 and 2017', () => {
      // 1999-01-01 offset=32, 2017-01-01 offset=37 → 5 leap seconds
      const from = 915148800; // 1999-01-01
      const to = 1483228800; // 2017-01-01
      expect(leapSecondsBetween(from, to)).toBe(5);
    });

    it('returns 27 between 1972 and 2017', () => {
      // 1972-01-01 offset=10, 2017-01-01 offset=37 → 27 leap seconds
      const from = 63072000; // 1972-01-01
      const to = 1483228800; // 2017-01-01
      expect(leapSecondsBetween(from, to)).toBe(27);
    });

    it('is symmetric (absolute difference)', () => {
      const a = 946728000;
      const b = 1483228800;
      expect(leapSecondsBetween(a, b)).toBe(leapSecondsBetween(b, a));
    });
  });
});
