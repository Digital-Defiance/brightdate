/**
 * Hardening Tests
 *
 * Covers hardening work added post-audit:
 *  - `taiUtcOffsetSecondsAt` — unambiguous TAI-UTC offset API
 *  - Leap second table metadata constants
 *  - Runtime warning when leap-second table is stale
 *  - Input validation: invalid Dates, NaN/Infinity in Unix conversions
 *  - Invalid-ISO handling
 */

import {
  LEAP_SECOND_TABLE,
  LEAP_SECOND_TABLE_REVIEWED_AT,
  LEAP_SECOND_TABLE_SOURCE,
  LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S,
} from '../constants';
import {
  fromDate,
  fromISO,
  fromUnixMs,
  fromUnixSeconds,
  taiUtcOffsetSecondsAt,
} from '../conversions';
import { __resetLeapTableWarning, getTaiUtcOffset } from '../leapSeconds';

describe('hardening', () => {
  // ═══════════════════════════════════════════════════════════════════════
  // H1. taiUtcOffsetSecondsAt — unambiguous TAI-UTC offset API
  // ═══════════════════════════════════════════════════════════════════════

  describe('taiUtcOffsetSecondsAt', () => {
    it('returns 32 at J2000.0 (the offset that caused the re-anchoring confusion)', () => {
      expect(taiUtcOffsetSecondsAt(0)).toBe(32);
    });

    it('returns 37 at a post-2017 UTC timestamp', () => {
      expect(taiUtcOffsetSecondsAt(fromISO('2020-06-15T00:00:00Z'))).toBe(37);
    });

    it('returns 19 at 1980-01-06 (GPS epoch)', () => {
      expect(taiUtcOffsetSecondsAt(fromISO('1980-01-06T00:00:00Z'))).toBe(19);
    });

    it('returns 10 for pre-1972 dates', () => {
      expect(taiUtcOffsetSecondsAt(fromISO('1971-06-30T00:00:00Z'))).toBe(10);
    });

    it('monotonically non-decreases across the whole timeline', () => {
      const samples = [
        fromISO('1971-01-01T00:00:00Z'),
        fromISO('1975-06-01T00:00:00Z'),
        0, // J2000
        fromISO('2010-01-01T00:00:00Z'),
        fromISO('2020-01-01T00:00:00Z'),
      ];
      for (let i = 1; i < samples.length; i++) {
        expect(taiUtcOffsetSecondsAt(samples[i])).toBeGreaterThanOrEqual(
          taiUtcOffsetSecondsAt(samples[i - 1]),
        );
      }
    });

    it('equals getTaiUtcOffset of the Unix-seconds equivalent', () => {
      const bd = fromISO('2023-06-15T12:00:00Z');
      const unixS = (bd + 10957.5) * 86400; // simplified conversion
      // Cross-check via the BrightDate ↔ Unix path
      expect(taiUtcOffsetSecondsAt(bd)).toBe(37);
      // And via direct call
      expect(getTaiUtcOffset(Math.floor(unixS))).toBe(37);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // H2. Leap second table metadata
  // ═══════════════════════════════════════════════════════════════════════

  describe('leap second table metadata', () => {
    it('LEAP_SECOND_TABLE_SOURCE is a non-empty string', () => {
      expect(typeof LEAP_SECOND_TABLE_SOURCE).toBe('string');
      expect(LEAP_SECOND_TABLE_SOURCE.length).toBeGreaterThan(0);
    });

    it('LEAP_SECOND_TABLE_REVIEWED_AT is a parseable ISO date', () => {
      expect(new Date(LEAP_SECOND_TABLE_REVIEWED_AT).getTime()).not.toBeNaN();
    });

    it('LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S is a positive Unix seconds value', () => {
      expect(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S).toBeGreaterThan(0);
    });

    it('validity window is AFTER the last leap-second boundary', () => {
      const lastLeapBoundary =
        LEAP_SECOND_TABLE[LEAP_SECOND_TABLE.length - 1][0];
      expect(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S).toBeGreaterThan(
        lastLeapBoundary,
      );
    });

    it('validity window is AFTER reviewed-at date', () => {
      const reviewedAtUnix =
        new Date(LEAP_SECOND_TABLE_REVIEWED_AT).getTime() / 1000;
      // Actually the valid-until date can be equal to or AFTER reviewed-at.
      // It should not be BEFORE it.
      expect(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S).toBeGreaterThanOrEqual(
        reviewedAtUnix,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // H3. Runtime warning for stale leap-second table
  // ═══════════════════════════════════════════════════════════════════════

  describe('stale-table warning', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      __resetLeapTableWarning();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('does NOT warn when called within the validity window', () => {
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S - 86400);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does NOT warn exactly AT the validity boundary', () => {
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('WARNS when called past the validity window', () => {
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S + 86400);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const msg = warnSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[brightdate]');
      expect(msg).toContain('Leap-second table');
    });

    it('warns AT MOST ONCE per process (no spam)', () => {
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S + 86400);
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S + 1_000_000);
      getTaiUtcOffset(LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S + 99_999_999);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warning includes the queried Unix timestamp for debuggability', () => {
      const t = LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S + 3600;
      getTaiUtcOffset(t);
      const msg = warnSpy.mock.calls[0][0] as string;
      expect(msg).toContain(String(t));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // H4. Invalid-Date / NaN / Infinity guards
  // ═══════════════════════════════════════════════════════════════════════

  describe('fromDate validation', () => {
    it('returns NaN for an invalid Date (NaN time), matching Date.getTime() convention', () => {
      // We deliberately do NOT throw for Invalid Date; we propagate NaN
      // so that property-test generators (like fc.date() without
      // noInvalidDate) and similar callers aren't broken. NaN is loud
      // enough at any downstream comparison boundary.
      expect(fromDate(new Date('not-a-date'))).toBeNaN();
    });

    it('throws TypeError for a non-Date input (runtime type check)', () => {
      expect(() => fromDate('2000-01-01' as unknown as Date)).toThrow(
        TypeError,
      );
    });

    it('throws TypeError for null', () => {
      expect(() => fromDate(null as unknown as Date)).toThrow(TypeError);
    });

    it('throws TypeError for undefined', () => {
      expect(() => fromDate(undefined as unknown as Date)).toThrow(TypeError);
    });

    it('accepts a valid Date (no regression)', () => {
      expect(() => fromDate(new Date('2025-01-01'))).not.toThrow();
    });

    it('accepts a cross-realm-like Date object (toString tag duck-type)', () => {
      // Simulate a Date from another VM realm: an object that has
      // [[Class]] === 'Date' but isn't `instanceof` the current realm's Date.
      // This is what Jest custom environments, vm.runInContext, and worker
      // threads produce. We verify our cross-realm-safe check accepts it.
      const fakeDate = Object.create(Date.prototype);
      Object.defineProperty(fakeDate, Symbol.toStringTag, { value: 'Date' });
      // Give it a real getTime
      fakeDate.getTime = () => 946_728_000_000; // J2000.0
      // Force Object.prototype.toString.call(fakeDate) === '[object Date]'
      // by making this a true Date subclass-like object. The cleanest way
      // to test cross-realm safety without spinning up a vm context is to
      // set the internal [[Class]] via Symbol.toStringTag. But the
      // Date-specific slot is not spoofable that way — we'll construct a
      // real Date and simulate instanceof failure by checking the branch
      // directly via a vm.runInNewContext Date.
      const vm = require('vm');
      const crossRealmDate: Date = vm.runInNewContext(
        'new Date(946728000000)',
      );
      expect(crossRealmDate instanceof Date).toBe(false); // cross-realm!
      expect(Object.prototype.toString.call(crossRealmDate)).toBe(
        '[object Date]',
      );
      // The whole point: our fromDate must accept this
      expect(fromDate(crossRealmDate)).toBe(0); // J2000.0 BrightDate
    });
  });

  describe('fromUnixMs validation', () => {
    it('throws TypeError for NaN', () => {
      expect(() => fromUnixMs(NaN)).toThrow(TypeError);
    });

    it('throws TypeError for Infinity', () => {
      expect(() => fromUnixMs(Infinity)).toThrow(TypeError);
    });

    it('throws TypeError for -Infinity', () => {
      expect(() => fromUnixMs(-Infinity)).toThrow(TypeError);
    });

    it('throws TypeError for non-number', () => {
      expect(() => fromUnixMs('1000' as unknown as number)).toThrow(TypeError);
    });

    it('accepts 0 (Unix epoch)', () => {
      expect(fromUnixMs(0)).toBe(-10957.5);
    });
  });

  describe('fromUnixSeconds validation', () => {
    it('throws TypeError for NaN', () => {
      expect(() => fromUnixSeconds(NaN)).toThrow(TypeError);
    });

    it('throws TypeError for Infinity', () => {
      expect(() => fromUnixSeconds(Infinity)).toThrow(TypeError);
    });

    it('accepts 0', () => {
      expect(fromUnixSeconds(0)).toBe(-10957.5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // H5. Year-edge & ISO 8601 edge cases
  // ═══════════════════════════════════════════════════════════════════════

  describe('year-edge and ISO handling', () => {
    it('parses year 1 correctly', () => {
      // JS Date accepts years 1-99 as 1901-1999 in some forms, but the
      // extended ISO format (+YYYYY or YYYY) is unambiguous.
      const iso = '0001-01-01T00:00:00.000Z';
      const bd = fromISO(iso);
      expect(isFinite(bd)).toBe(true);
      // Year 1 is way before J2000.0
      expect(bd).toBeLessThan(-700_000);
    });

    it('parses year 9999', () => {
      const bd = fromISO('9999-12-31T23:59:59.999Z');
      expect(isFinite(bd)).toBe(true);
      // Year 9999 is far after J2000.0
      expect(bd).toBeGreaterThan(2_900_000);
    });

    it('parses ISO with +HH:MM offset (not just Z)', () => {
      // UTC+5 means the local time 00:00 is actually 19:00 UTC the previous day
      const withOffset = fromISO('2000-01-02T00:00:00+05:00');
      const withUtc = fromISO('2000-01-01T19:00:00Z');
      expect(withOffset).toBe(withUtc);
    });

    it('parses ISO with -HH:MM offset', () => {
      const withOffset = fromISO('1999-12-31T19:00:00-05:00');
      const withUtc = fromISO('2000-01-01T00:00:00Z');
      expect(withOffset).toBe(withUtc);
    });

    it('rejects clearly malformed ISO strings', () => {
      expect(() => fromISO('')).toThrow();
      expect(() => fromISO('not-a-date')).toThrow();
      expect(() => fromISO('2000-13-01T00:00:00Z')).toThrow(); // month 13
      expect(() => fromISO('2000-01-32T00:00:00Z')).toThrow(); // day 32
    });
  });
});
