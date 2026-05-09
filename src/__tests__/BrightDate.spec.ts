/**
 * Tests for the BrightDate class.
 */

import { BrightDate } from '../BrightDate';
import { J2000_UNIX_MS_UTC } from '../constants';
import { fromDate } from '../conversions';

describe('BrightDate class', () => {
  // ─── Static factory methods ──────────────────────────────────────────────

  describe('BrightDate.epoch()', () => {
    it('has value 0', () => {
      expect(BrightDate.epoch().value).toBe(0);
    });

    it('represents J2000.0', () => {
      expect(BrightDate.epoch().toDate().getTime()).toBe(J2000_UNIX_MS_UTC);
    });
  });

  describe('BrightDate.now()', () => {
    it('returns a positive value (we are after J2000.0)', () => {
      expect(BrightDate.now().value).toBeGreaterThan(0);
    });

    it('is close to the current time', () => {
      const before = fromDate(new Date());
      const bd = BrightDate.now();
      const after = fromDate(new Date());
      expect(bd.value).toBeGreaterThanOrEqual(before);
      expect(bd.value).toBeLessThanOrEqual(after + 1 / 86400000);
    });
  });

  describe('BrightDate.fromValue()', () => {
    it('stores the given value', () => {
      expect(BrightDate.fromValue(9622.5).value).toBe(9622.5);
    });

    it('stores negative values', () => {
      expect(BrightDate.fromValue(-10957.5).value).toBe(-10957.5);
    });

    it('stores zero', () => {
      expect(BrightDate.fromValue(0).value).toBe(0);
    });
  });

  describe('BrightDate.fromDate()', () => {
    it('converts a Date to BrightDate', () => {
      const d = new Date(J2000_UNIX_MS_UTC);
      expect(BrightDate.fromDate(d).value).toBe(0);
    });

    it('round-trips a Date', () => {
      const d = new Date('2025-06-15T10:30:00.000Z');
      expect(BrightDate.fromDate(d).toDate().getTime()).toBe(d.getTime());
    });
  });

  describe('BrightDate.fromUnixMs()', () => {
    it('converts Unix ms to BrightDate', () => {
      expect(BrightDate.fromUnixMs(J2000_UNIX_MS_UTC).value).toBe(0);
    });
  });

  describe('BrightDate.fromUnixSeconds()', () => {
    it('converts Unix seconds to BrightDate', () => {
      expect(
        BrightDate.fromUnixSeconds(J2000_UNIX_MS_UTC / 1000).value,
      ).toBe(0);
    });
  });

  describe('BrightDate.fromJulianDate()', () => {
    it('J2000.0 JD = 2451545.0 → value 0', () => {
      expect(BrightDate.fromJulianDate(2451545.0).value).toBe(0);
    });
  });

  describe('BrightDate.fromModifiedJulianDate()', () => {
    it('MJD 51544.5 → value 0', () => {
      expect(BrightDate.fromModifiedJulianDate(51544.5).value).toBe(0);
    });
  });

  describe('BrightDate.fromISO()', () => {
    it('parses an ISO string', () => {
      expect(
        BrightDate.fromISO('2000-01-01T12:00:00.000Z').value,
      ).toBe(0);
    });

    it('throws for invalid ISO string', () => {
      expect(() => BrightDate.fromISO('not-a-date')).toThrow();
    });
  });

  describe('BrightDate.parse()', () => {
    it('parses a BrightDate string', () => {
      expect(BrightDate.parse('9622.50417').value).toBeCloseTo(9622.50417, 5);
    });

    it('throws for invalid string', () => {
      expect(() => BrightDate.parse('abc')).toThrow();
    });
  });

  describe('BrightDate.fromGPSTime()', () => {
    it('GPS epoch (week 0, second 0) is before J2000.0', () => {
      expect(BrightDate.fromGPSTime(0, 0).value).toBeLessThan(0);
    });
  });

  // ─── Options ─────────────────────────────────────────────────────────────

  describe('options', () => {
    it('default precision is 5', () => {
      expect(BrightDate.fromValue(0).precision).toBe(5);
    });

    it('custom precision is stored', () => {
      expect(BrightDate.fromValue(0, { precision: 8 }).precision).toBe(8);
    });

    it('default isTAI is false', () => {
      expect(BrightDate.fromValue(0).isTAI).toBe(false);
    });

    it('useTAI option is stored', () => {
      expect(BrightDate.fromValue(0, { useTAI: true }).isTAI).toBe(true);
    });
  });

  // ─── Immutability ────────────────────────────────────────────────────────

  describe('immutability', () => {
    it('addDays returns a new instance', () => {
      const bd = BrightDate.fromValue(100);
      const bd2 = bd.addDays(1);
      expect(bd2).not.toBe(bd);
      expect(bd.value).toBe(100); // original unchanged
    });

    it('subtractDays returns a new instance', () => {
      const bd = BrightDate.fromValue(100);
      const bd2 = bd.subtractDays(1);
      expect(bd2).not.toBe(bd);
      expect(bd.value).toBe(100);
    });
  });

  // ─── Conversion methods ──────────────────────────────────────────────────

  describe('toDate()', () => {
    it('converts to a JavaScript Date', () => {
      const bd = BrightDate.epoch();
      expect(bd.toDate().getTime()).toBe(J2000_UNIX_MS_UTC);
    });
  });

  describe('toUnixMs()', () => {
    it('returns J2000_UNIX_MS_UTC for epoch', () => {
      expect(BrightDate.epoch().toUnixMs()).toBe(J2000_UNIX_MS_UTC);
    });
  });

  describe('toUnixSeconds()', () => {
    it('returns J2000_UNIX_MS_UTC/1000 for epoch', () => {
      expect(BrightDate.epoch().toUnixSeconds()).toBe(J2000_UNIX_MS_UTC / 1000);
    });
  });

  describe('toJulianDate()', () => {
    it('returns 2451545.0 for epoch', () => {
      expect(BrightDate.epoch().toJulianDate()).toBe(2451545.0);
    });
  });

  describe('toModifiedJulianDate()', () => {
    it('returns 51544.5 for epoch', () => {
      expect(BrightDate.epoch().toModifiedJulianDate()).toBe(51544.5);
    });
  });

  describe('toISO()', () => {
    it('returns ISO string for epoch', () => {
      expect(BrightDate.epoch().toISO()).toBe('2000-01-01T12:00:00.000Z');
    });
  });

  describe('toGPSTime()', () => {
    it('returns an object with gpsWeek and gpsSeconds', () => {
      const gps = BrightDate.now().toGPSTime();
      expect(gps).toHaveProperty('gpsWeek');
      expect(gps).toHaveProperty('gpsSeconds');
    });
  });

  // ─── TAI conversion ──────────────────────────────────────────────────────

  describe('toTAI() / toUTC()', () => {
    it('toTAI() sets isTAI to true', () => {
      const bd = BrightDate.fromValue(9622.5);
      expect(bd.toTAI().isTAI).toBe(true);
    });

    it('toUTC() sets isTAI to false', () => {
      const bd = BrightDate.fromValue(9622.5, { useTAI: true });
      expect(bd.toUTC().isTAI).toBe(false);
    });

    it('toTAI() on already-TAI returns same instance', () => {
      const bd = BrightDate.fromValue(9622.5, { useTAI: true });
      expect(bd.toTAI()).toBe(bd);
    });

    it('toUTC() on already-UTC returns same instance', () => {
      const bd = BrightDate.fromValue(9622.5);
      expect(bd.toUTC()).toBe(bd);
    });

    it('round-trips UTC → TAI → UTC', () => {
      const bd = BrightDate.fromISO('2023-06-15T12:00:00Z');
      const recovered = bd.toTAI().toUTC();
      expect(recovered.value).toBeCloseTo(bd.value, 5);
    });
  });

  // ─── Formatting methods ──────────────────────────────────────────────────

  describe('toString()', () => {
    it('formats with default precision 5', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(bd.toString()).toBe('9622.50417');
    });

    it('formats with custom precision', () => {
      const bd = BrightDate.fromValue(9622.50417, { precision: 2 });
      expect(bd.toString()).toBe('9622.50');
    });
  });

  describe('toLogString()', () => {
    it('wraps in brackets', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(bd.toLogString()).toBe('[9622.50417]');
    });
  });

  describe('toPrefixedString()', () => {
    it('uses default prefix "BD:"', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(bd.toPrefixedString()).toBe('BD:9622.50417');
    });

    it('uses custom prefix', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(bd.toPrefixedString('T:')).toBe('T:9622.50417');
    });
  });

  describe('toFormattedObject()', () => {
    it('returns full, day, fraction, friendly', () => {
      const bd = BrightDate.fromValue(9622.50417);
      const obj = bd.toFormattedObject();
      expect(obj.full).toBe('9622.50417');
      expect(obj.day).toBe('9622');
      expect(obj.fraction).toBe('50417');
    });
  });

  describe('decompose()', () => {
    it('returns day and fraction', () => {
      const bd = BrightDate.fromValue(9622.75);
      const comp = bd.decompose();
      expect(comp.day).toBe(9622);
      expect(comp.fraction).toBeCloseTo(0.75, 8);
    });
  });

  // ─── Getters ─────────────────────────────────────────────────────────────

  describe('day getter', () => {
    it('returns the integer part', () => {
      expect(BrightDate.fromValue(9622.75).day).toBe(9622);
    });

    it('works for negative values', () => {
      expect(BrightDate.fromValue(-0.5).day).toBe(-1);
    });
  });

  describe('fraction getter', () => {
    it('returns the fractional part', () => {
      expect(BrightDate.fromValue(9622.75).fraction).toBeCloseTo(0.75, 8);
    });

    it('is always in [0, 1)', () => {
      for (const v of [0, 0.5, 9622.75, -0.5, -10957.5]) {
        const f = BrightDate.fromValue(v).fraction;
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThan(1);
      }
    });
  });

  describe('timescale getter', () => {
    it('returns "UTC" for UTC-based instance', () => {
      expect(BrightDate.fromValue(0).timescale).toBe('UTC');
    });

    it('returns "TAI" for TAI-based instance', () => {
      expect(BrightDate.fromValue(0, { useTAI: true }).timescale).toBe('TAI');
    });
  });

  // ─── valueOf / toJSON ────────────────────────────────────────────────────

  describe('valueOf()', () => {
    it('returns the numeric value', () => {
      const bd = BrightDate.fromValue(9622.5);
      expect(bd.valueOf()).toBe(9622.5);
    });

    it('enables numeric comparison', () => {
      const a = BrightDate.fromValue(100);
      const b = BrightDate.fromValue(200);
      expect(a < b).toBe(true);
      expect(b > a).toBe(true);
    });

    it('enables arithmetic', () => {
      const bd = BrightDate.fromValue(100);
      expect(+bd + 5).toBe(105);
    });
  });

  describe('toJSON()', () => {
    it('returns the string representation', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(bd.toJSON()).toBe('9622.50417');
    });

    it('is used by JSON.stringify', () => {
      const bd = BrightDate.fromValue(9622.50417);
      expect(JSON.stringify({ time: bd })).toBe('{"time":"9622.50417"}');
    });
  });

  // ─── Arithmetic methods ──────────────────────────────────────────────────

  describe('addDays()', () => {
    it('adds days', () => {
      expect(BrightDate.fromValue(100).addDays(5).value).toBe(105);
    });

    it('preserves precision', () => {
      const bd = BrightDate.fromValue(100, { precision: 8 });
      expect(bd.addDays(1).precision).toBe(8);
    });
  });

  describe('subtractDays()', () => {
    it('subtracts days', () => {
      expect(BrightDate.fromValue(100).subtractDays(5).value).toBe(95);
    });
  });

  describe('addMillidays()', () => {
    it('adds millidays', () => {
      expect(BrightDate.fromValue(0).addMillidays(500).value).toBeCloseTo(
        0.5,
        8,
      );
    });
  });

  describe('addMicrodays()', () => {
    it('adds microdays', () => {
      expect(
        BrightDate.fromValue(0).addMicrodays(500_000).value,
      ).toBeCloseTo(0.5, 6);
    });
  });

  describe('addHours()', () => {
    it('adds hours', () => {
      expect(BrightDate.fromValue(0).addHours(12).value).toBeCloseTo(0.5, 8);
    });
  });

  describe('addMinutes()', () => {
    it('adds minutes', () => {
      expect(BrightDate.fromValue(0).addMinutes(720).value).toBeCloseTo(
        0.5,
        8,
      );
    });
  });

  describe('addSeconds()', () => {
    it('adds seconds', () => {
      expect(BrightDate.fromValue(0).addSeconds(43200).value).toBeCloseTo(
        0.5,
        8,
      );
    });
  });

  describe('difference()', () => {
    it('returns this.value - other.value', () => {
      const a = BrightDate.fromValue(10);
      const b = BrightDate.fromValue(3);
      expect(a.difference(b)).toBe(7);
    });
  });

  describe('absoluteDifference()', () => {
    it('returns |this.value - other.value|', () => {
      const a = BrightDate.fromValue(3);
      const b = BrightDate.fromValue(10);
      expect(a.absoluteDifference(b)).toBe(7);
    });
  });

  describe('durationTo()', () => {
    it('returns a BrightDuration', () => {
      const a = BrightDate.fromValue(0);
      const b = BrightDate.fromValue(1);
      const dur = a.durationTo(b);
      expect(dur.days).toBe(1);
      expect(dur.millidays).toBe(1000);
    });
  });

  describe('formatDurationTo()', () => {
    it('returns a human-readable string', () => {
      const a = BrightDate.fromValue(0);
      const b = BrightDate.fromValue(1);
      expect(a.formatDurationTo(b)).toContain('day');
    });
  });

  // ─── Comparison methods ──────────────────────────────────────────────────

  describe('compareTo()', () => {
    it('returns -1 when this < other', () => {
      expect(BrightDate.fromValue(1).compareTo(BrightDate.fromValue(2))).toBe(-1);
    });

    it('returns 1 when this > other', () => {
      expect(BrightDate.fromValue(2).compareTo(BrightDate.fromValue(1))).toBe(1);
    });

    it('returns 0 when equal', () => {
      expect(BrightDate.fromValue(5).compareTo(BrightDate.fromValue(5))).toBe(0);
    });
  });

  describe('equals()', () => {
    it('returns true for equal values', () => {
      expect(
        BrightDate.fromValue(5).equals(BrightDate.fromValue(5)),
      ).toBe(true);
    });

    it('returns true within default tolerance', () => {
      expect(
        BrightDate.fromValue(5).equals(BrightDate.fromValue(5 + 0.0000005)),
      ).toBe(true);
    });

    it('returns false outside tolerance', () => {
      expect(
        BrightDate.fromValue(5).equals(BrightDate.fromValue(5 + 0.01)),
      ).toBe(false);
    });
  });

  describe('isBefore() / isAfter()', () => {
    it('isBefore returns true when this < other', () => {
      expect(
        BrightDate.fromValue(1).isBefore(BrightDate.fromValue(2)),
      ).toBe(true);
    });

    it('isAfter returns true when this > other', () => {
      expect(
        BrightDate.fromValue(2).isAfter(BrightDate.fromValue(1)),
      ).toBe(true);
    });

    it('isBefore returns false when equal', () => {
      expect(
        BrightDate.fromValue(5).isBefore(BrightDate.fromValue(5)),
      ).toBe(false);
    });
  });

  describe('isInRange()', () => {
    it('returns true when within range', () => {
      const bd = BrightDate.fromValue(5);
      expect(
        bd.isInRange(BrightDate.fromValue(1), BrightDate.fromValue(10)),
      ).toBe(true);
    });

    it('returns false when outside range', () => {
      const bd = BrightDate.fromValue(15);
      expect(
        bd.isInRange(BrightDate.fromValue(1), BrightDate.fromValue(10)),
      ).toBe(false);
    });
  });

  // ─── Rounding methods ────────────────────────────────────────────────────

  describe('floorToDay()', () => {
    it('floors to integer day', () => {
      expect(BrightDate.fromValue(9622.75).floorToDay().value).toBe(9622);
    });
  });

  describe('ceilToDay()', () => {
    it('ceils to next integer day', () => {
      expect(BrightDate.fromValue(9622.25).ceilToDay().value).toBe(9623);
    });
  });

  describe('roundToMilliday()', () => {
    it('rounds to nearest milliday', () => {
      expect(
        BrightDate.fromValue(9622.5004).roundToMilliday().value,
      ).toBeCloseTo(9622.5, 3);
    });
  });

  describe('roundToMicroday()', () => {
    it('rounds to nearest microday', () => {
      expect(
        BrightDate.fromValue(9622.5000004).roundToMicroday().value,
      ).toBeCloseTo(9622.5, 6);
    });
  });

  // ─── Utility methods ─────────────────────────────────────────────────────

  describe('withOptions()', () => {
    it('creates a copy with new precision', () => {
      const bd = BrightDate.fromValue(9622.5);
      const bd2 = bd.withOptions({ precision: 8 });
      expect(bd2.precision).toBe(8);
      expect(bd2.value).toBe(bd.value);
    });

    it('preserves existing options when not overridden', () => {
      const bd = BrightDate.fromValue(9622.5, { precision: 8, useTAI: true });
      const bd2 = bd.withOptions({ precision: 3 });
      expect(bd2.isTAI).toBe(true);
    });
  });

  describe('withPrecision()', () => {
    it('creates a copy with new precision', () => {
      const bd = BrightDate.fromValue(9622.5);
      expect(bd.withPrecision(8).precision).toBe(8);
    });

    it('preserves the value', () => {
      const bd = BrightDate.fromValue(9622.5);
      expect(bd.withPrecision(8).value).toBe(9622.5);
    });
  });

  describe('midpoint()', () => {
    it('returns the midpoint between two BrightDates', () => {
      const a = BrightDate.fromValue(0);
      const b = BrightDate.fromValue(10);
      expect(a.midpoint(b).value).toBe(5);
    });
  });

  describe('lerp()', () => {
    it('t=0 returns this', () => {
      const a = BrightDate.fromValue(10);
      const b = BrightDate.fromValue(20);
      expect(a.lerp(b, 0).value).toBe(10);
    });

    it('t=1 returns other', () => {
      const a = BrightDate.fromValue(10);
      const b = BrightDate.fromValue(20);
      expect(a.lerp(b, 1).value).toBe(20);
    });

    it('t=0.5 returns midpoint', () => {
      const a = BrightDate.fromValue(10);
      const b = BrightDate.fromValue(20);
      expect(a.lerp(b, 0.5).value).toBe(15);
    });
  });

  describe('formatRangeTo()', () => {
    it('returns a range string', () => {
      const a = BrightDate.fromValue(0);
      const b = BrightDate.fromValue(1);
      expect(a.formatRangeTo(b)).toContain('→');
    });
  });

  describe('isFuture() / isPast()', () => {
    it('epoch is in the past', () => {
      expect(BrightDate.epoch().isPast()).toBe(true);
      expect(BrightDate.epoch().isFuture()).toBe(false);
    });

    it('a far-future date is in the future', () => {
      const future = BrightDate.fromValue(999999);
      expect(future.isFuture()).toBe(true);
      expect(future.isPast()).toBe(false);
    });
  });

  // ─── Symbol.for('nodejs.util.inspect.custom') ────────────────────────────

  describe('inspect symbol', () => {
    it('returns a descriptive string', () => {
      const bd = BrightDate.fromValue(9622.50417);
      // Access via util.inspect to trigger the custom inspector
      const { inspect } = require('util');
      const result = inspect(bd);
      expect(result).toContain('BrightDate(');
      expect(result).toContain('9622.50417');
    });

    it('includes TAI label for TAI instances', () => {
      const bd = BrightDate.fromValue(9622.5, { useTAI: true });
      const { inspect } = require('util');
      const result = inspect(bd);
      expect(result).toContain('TAI');
    });
  });
});
