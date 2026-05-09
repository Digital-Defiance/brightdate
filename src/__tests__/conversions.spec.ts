/**
 * Tests for BrightDate conversions.
 */

import { J2000_UNIX_MS_UTC, MS_PER_DAY } from '../constants';
import {
  fromDate,
  fromGPSTime,
  fromISO,
  fromJulianDate,
  fromModifiedJulianDate,
  fromUnixMs,
  fromUnixSeconds,
  normalize,
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
} from '../conversions';

/** Tolerance: 1 millisecond expressed in decimal days */
const MS_TOLERANCE = 1 / MS_PER_DAY;

describe('conversions', () => {
  // ─── Epoch anchor ────────────────────────────────────────────────────────

  describe('epoch anchor', () => {
    it('J2000.0 (2000-01-01T12:00:00Z) maps to value 0', () => {
      const epoch = new Date(J2000_UNIX_MS_UTC);
      expect(fromDate(epoch)).toBe(0);
    });

    it('value 0 maps back to J2000.0', () => {
      const d = toDate(0);
      expect(d.getTime()).toBe(J2000_UNIX_MS_UTC);
    });
  });

  // ─── fromDate / toDate ───────────────────────────────────────────────────

  describe('fromDate / toDate', () => {
    it('round-trips a Date through BrightDate', () => {
      const original = new Date('2025-06-15T10:30:00.000Z');
      const bd = fromDate(original);
      const recovered = toDate(bd);
      expect(recovered.getTime()).toBe(original.getTime());
    });

    it('Unix epoch (1970-01-01T00:00:00Z) ≈ -10957.5', () => {
      const unixEpoch = new Date(0);
      const bd = fromDate(unixEpoch);
      // 1970-01-01T00:00:00Z is 30 years before J2000.0 noon
      // Exact: (0 - 946728000000) / 86400000 = -10957.5
      expect(bd).toBeCloseTo(-10957.5, 6);
    });

    it('Y2K midnight (2000-01-01T00:00:00Z) = -0.5', () => {
      const y2k = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
      expect(fromDate(y2k)).toBeCloseTo(-0.5, 8);
    });

    it('one day after epoch = 1.0', () => {
      const d = new Date(J2000_UNIX_MS_UTC + MS_PER_DAY);
      expect(fromDate(d)).toBeCloseTo(1.0, 8);
    });

    it('one day before epoch = -1.0', () => {
      const d = new Date(J2000_UNIX_MS_UTC - MS_PER_DAY);
      expect(fromDate(d)).toBeCloseTo(-1.0, 8);
    });

    it('noon on 2025-01-01 is positive', () => {
      const d = new Date('2025-01-01T12:00:00.000Z');
      expect(fromDate(d)).toBeGreaterThan(0);
    });
  });

  // ─── fromUnixMs / toUnixMs ───────────────────────────────────────────────

  describe('fromUnixMs / toUnixMs', () => {
    it('round-trips Unix ms', () => {
      const ms = 1_700_000_000_000;
      expect(toUnixMs(fromUnixMs(ms))).toBeCloseTo(ms, 0);
    });

    it('fromUnixMs(J2000_UNIX_MS_UTC) === 0', () => {
      expect(fromUnixMs(J2000_UNIX_MS_UTC)).toBe(0);
    });

    it('toUnixMs(0) === J2000_UNIX_MS_UTC', () => {
      expect(toUnixMs(0)).toBe(J2000_UNIX_MS_UTC);
    });

    it('is consistent with fromDate', () => {
      const ms = 1_609_459_200_000; // 2021-01-01T00:00:00Z
      expect(fromUnixMs(ms)).toBe(fromDate(new Date(ms)));
    });
  });

  // ─── fromUnixSeconds / toUnixSeconds ────────────────────────────────────

  describe('fromUnixSeconds / toUnixSeconds', () => {
    it('round-trips Unix seconds', () => {
      const s = 1_700_000_000;
      expect(toUnixSeconds(fromUnixSeconds(s))).toBeCloseTo(s, 3);
    });

    it('is consistent with fromUnixMs', () => {
      const s = 1_609_459_200;
      expect(fromUnixSeconds(s)).toBeCloseTo(fromUnixMs(s * 1000), 8);
    });
  });

  // ─── fromJulianDate / toJulianDate ───────────────────────────────────────

  describe('fromJulianDate / toJulianDate', () => {
    it('J2000.0 JD = 2451545.0 → BrightDate 0', () => {
      expect(fromJulianDate(2451545.0)).toBe(0);
    });

    it('BrightDate 0 → JD 2451545.0', () => {
      expect(toJulianDate(0)).toBe(2451545.0);
    });

    it('round-trips a Julian Date', () => {
      const jd = 2460000.5;
      expect(toJulianDate(fromJulianDate(jd))).toBeCloseTo(jd, 8);
    });

    it('positive BrightDate → JD > 2451545', () => {
      expect(toJulianDate(100)).toBe(2451645.0);
    });
  });

  // ─── fromModifiedJulianDate / toModifiedJulianDate ───────────────────────

  describe('fromModifiedJulianDate / toModifiedJulianDate', () => {
    it('MJD 51544.5 → BrightDate 0', () => {
      expect(fromModifiedJulianDate(51544.5)).toBe(0);
    });

    it('BrightDate 0 → MJD 51544.5', () => {
      expect(toModifiedJulianDate(0)).toBe(51544.5);
    });

    it('round-trips a Modified Julian Date', () => {
      const mjd = 60000.25;
      expect(toModifiedJulianDate(fromModifiedJulianDate(mjd))).toBeCloseTo(
        mjd,
        8,
      );
    });

    it('MJD = JD - 2400000.5 relationship holds', () => {
      const bd = 500;
      const jd = toJulianDate(bd);
      const mjd = toModifiedJulianDate(bd);
      expect(jd - mjd).toBeCloseTo(2400000.5, 6);
    });
  });

  // ─── fromISO / toISO ─────────────────────────────────────────────────────

  describe('fromISO / toISO', () => {
    it('round-trips an ISO string', () => {
      const iso = '2025-03-15T08:00:00.000Z';
      expect(toISO(fromISO(iso))).toBe(iso);
    });

    it('throws on invalid ISO string', () => {
      expect(() => fromISO('not-a-date')).toThrow('Invalid ISO 8601 date string');
    });

    it('throws on empty string', () => {
      expect(() => fromISO('')).toThrow();
    });

    it('2000-01-01T12:00:00.000Z → 0', () => {
      expect(fromISO('2000-01-01T12:00:00.000Z')).toBe(0);
    });
  });

  // ─── GPS time ────────────────────────────────────────────────────────────

  describe('fromGPSTime / toGPSTime', () => {
    it('GPS epoch (week 0, second 0) is near 1980-01-06', () => {
      const bd = fromGPSTime(0, 0);
      const d = toDate(bd);
      expect(d.getUTCFullYear()).toBe(1980);
      expect(d.getUTCMonth()).toBe(0); // January
      expect(d.getUTCDate()).toBe(6);
    });

    it('round-trips GPS week and seconds', () => {
      const week = 2300;
      const seconds = 345600; // 4 days into the week
      const bd = fromGPSTime(week, seconds);
      const { gpsWeek, gpsSeconds } = toGPSTime(bd);
      expect(gpsWeek).toBe(week);
      expect(gpsSeconds).toBeCloseTo(seconds, 0);
    });

    it('GPS week 0 second 0 has negative BrightDate (before J2000)', () => {
      expect(fromGPSTime(0, 0)).toBeLessThan(0);
    });
  });

  // ─── TAI conversions ─────────────────────────────────────────────────────

  describe('utcToTaiBrightDate / taiToUtcBrightDate', () => {
    it('TAI is ahead of UTC (positive offset)', () => {
      const utcBd = fromISO('2020-01-01T00:00:00Z');
      const taiBd = utcToTaiBrightDate(utcBd);
      // TAI is 37s ahead of UTC → TAI BrightDate is slightly larger
      expect(taiBd).toBeGreaterThan(utcBd);
    });

    it('round-trips UTC → TAI → UTC within 1ms', () => {
      const utcBd = fromISO('2023-06-15T12:00:00Z');
      const taiBd = utcToTaiBrightDate(utcBd);
      const recovered = taiToUtcBrightDate(taiBd);
      expect(recovered).toBeCloseTo(utcBd, 5);
    });

    it('TAI offset at J2000 epoch is 32 seconds', () => {
      // utcToTaiBrightDate re-anchors relative to a TAI-based J2000 epoch
      // (which is 32s ahead of UTC J2000). The numeric difference between
      // a UTC BrightDate and its TAI equivalent equals (currentOffset - 32)
      // seconds expressed in days. For a 2020 date (offset=37): diff = 5s.
      const utcBd = fromISO('2020-06-15T12:00:00Z');
      const taiBd = utcToTaiBrightDate(utcBd);
      const diffSeconds = (taiBd - utcBd) * 86400;
      // 37 (current TAI-UTC) - 32 (TAI-UTC at J2000 anchor) = 5 seconds
      expect(diffSeconds).toBeCloseTo(5, 1);
    });
  });

  // ─── now ─────────────────────────────────────────────────────────────────

  describe('now', () => {
    it('returns a finite number', () => {
      expect(isFinite(now())).toBe(true);
    });

    it('returns a positive value (we are after J2000.0)', () => {
      expect(now()).toBeGreaterThan(0);
    });

    it('returns a value close to the current time', () => {
      const before = fromDate(new Date());
      const n = now();
      const after = fromDate(new Date());
      expect(n).toBeGreaterThanOrEqual(before);
      expect(n).toBeLessThanOrEqual(after + MS_TOLERANCE);
    });

    it('two successive calls are non-decreasing', () => {
      const a = now();
      const b = now();
      expect(b).toBeGreaterThanOrEqual(a);
    });
  });

  // ─── parse ───────────────────────────────────────────────────────────────

  describe('parse', () => {
    it('parses a valid BrightDate string', () => {
      expect(parse('9622.50417')).toBeCloseTo(9622.50417, 5);
    });

    it('parses a negative value', () => {
      expect(parse('-10957.5')).toBeCloseTo(-10957.5, 5);
    });

    it('parses an integer string', () => {
      expect(parse('0')).toBe(0);
    });

    it('throws on non-numeric string', () => {
      expect(() => parse('not-a-number')).toThrow('Invalid BrightDate string');
    });

    it('throws on empty string', () => {
      expect(() => parse('')).toThrow();
    });
  });

  // ─── normalize ───────────────────────────────────────────────────────────

  describe('normalize', () => {
    it('passes through a finite number unchanged', () => {
      expect(normalize(9622.5)).toBe(9622.5);
    });

    it('converts a Date', () => {
      const d = new Date(J2000_UNIX_MS_UTC);
      expect(normalize(d)).toBe(0);
    });

    it('converts an ISO string', () => {
      expect(normalize('2000-01-01T12:00:00.000Z')).toBe(0);
    });

    it('throws TypeError for NaN', () => {
      expect(() => normalize(NaN)).toThrow(TypeError);
    });

    it('throws TypeError for Infinity', () => {
      expect(() => normalize(Infinity)).toThrow(TypeError);
    });

    it('throws TypeError for invalid string', () => {
      expect(() => normalize('not-a-date')).toThrow(TypeError);
    });

    it('throws TypeError for -Infinity', () => {
      expect(() => normalize(-Infinity)).toThrow(TypeError);
    });
  });
});
