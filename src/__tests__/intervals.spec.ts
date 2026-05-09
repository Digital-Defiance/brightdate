/**
 * Tests for BrightDateInterval.
 */

import { BrightDate } from '../BrightDate';
import { BrightDateInterval } from '../intervals';

function bd(value: number): BrightDate {
  return BrightDate.fromValue(value);
}

describe('BrightDateInterval', () => {
  // ─── Construction ────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates a valid interval', () => {
      const interval = new BrightDateInterval(bd(0), bd(10));
      expect(interval.start.value).toBe(0);
      expect(interval.end.value).toBe(10);
    });

    it('allows start === end (zero-duration interval)', () => {
      expect(() => new BrightDateInterval(bd(5), bd(5))).not.toThrow();
    });

    it('throws when start > end', () => {
      expect(() => new BrightDateInterval(bd(10), bd(5))).toThrow(
        'Invalid interval',
      );
    });
  });

  describe('fromValues', () => {
    it('creates interval from numeric values', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      expect(interval.duration).toBe(10);
    });
  });

  describe('fromDuration', () => {
    it('creates interval from start and duration', () => {
      const start = bd(100);
      const interval = BrightDateInterval.fromDuration(start, 7);
      expect(interval.start.value).toBe(100);
      expect(interval.end.value).toBe(107);
    });
  });

  describe('fromDates', () => {
    it('creates interval from two Dates', () => {
      const start = new Date('2000-01-01T12:00:00Z');
      const end = new Date('2000-01-02T12:00:00Z');
      const interval = BrightDateInterval.fromDates(start, end);
      expect(interval.duration).toBeCloseTo(1, 6);
    });
  });

  describe('fromISO', () => {
    it('creates interval from two ISO strings', () => {
      const interval = BrightDateInterval.fromISO(
        '2000-01-01T12:00:00Z',
        '2000-01-08T12:00:00Z',
      );
      expect(interval.duration).toBeCloseTo(7, 5);
    });
  });

  // ─── duration / midpoint ─────────────────────────────────────────────────

  describe('duration', () => {
    it('returns end - start', () => {
      const interval = BrightDateInterval.fromValues(10, 20);
      expect(interval.duration).toBe(10);
    });

    it('returns 0 for zero-duration interval', () => {
      const interval = BrightDateInterval.fromValues(5, 5);
      expect(interval.duration).toBe(0);
    });
  });

  describe('durationMetric', () => {
    it('returns a BrightDuration', () => {
      const interval = BrightDateInterval.fromValues(0, 1);
      const metric = interval.durationMetric;
      expect(metric.days).toBe(1);
      expect(metric.millidays).toBe(1000);
    });
  });

  describe('midpoint', () => {
    it('returns the midpoint', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      expect(interval.midpoint.value).toBe(5);
    });

    it('midpoint of zero-duration interval is the point itself', () => {
      const interval = BrightDateInterval.fromValues(7, 7);
      expect(interval.midpoint.value).toBe(7);
    });
  });

  // ─── contains ────────────────────────────────────────────────────────────

  describe('contains', () => {
    const interval = BrightDateInterval.fromValues(0, 10);

    it('returns true for value inside', () => {
      expect(interval.contains(bd(5))).toBe(true);
    });

    it('returns true at start boundary', () => {
      expect(interval.contains(bd(0))).toBe(true);
    });

    it('returns true at end boundary', () => {
      expect(interval.contains(bd(10))).toBe(true);
    });

    it('returns false below start', () => {
      expect(interval.contains(bd(-1))).toBe(false);
    });

    it('returns false above end', () => {
      expect(interval.contains(bd(11))).toBe(false);
    });
  });

  describe('containsValue', () => {
    it('works with numeric values', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      expect(interval.containsValue(5)).toBe(true);
      expect(interval.containsValue(15)).toBe(false);
    });
  });

  // ─── overlaps ────────────────────────────────────────────────────────────

  describe('overlaps', () => {
    it('returns true for overlapping intervals', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      const b = BrightDateInterval.fromValues(5, 15);
      expect(a.overlaps(b)).toBe(true);
    });

    it('returns true for touching intervals (shared endpoint)', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      const b = BrightDateInterval.fromValues(10, 20);
      expect(a.overlaps(b)).toBe(true);
    });

    it('returns false for non-overlapping intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(6, 10);
      expect(a.overlaps(b)).toBe(false);
    });

    it('is symmetric', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      const b = BrightDateInterval.fromValues(5, 15);
      expect(a.overlaps(b)).toBe(b.overlaps(a));
    });
  });

  // ─── intersection ────────────────────────────────────────────────────────

  describe('intersection', () => {
    it('returns the overlapping portion', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      const b = BrightDateInterval.fromValues(5, 15);
      const result = a.intersection(b);
      expect(result).not.toBeNull();
      expect(result!.start.value).toBe(5);
      expect(result!.end.value).toBe(10);
    });

    it('returns null for non-overlapping intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(6, 10);
      expect(a.intersection(b)).toBeNull();
    });

    it('returns a point interval for touching intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(5, 10);
      const result = a.intersection(b);
      expect(result).not.toBeNull();
      expect(result!.duration).toBe(0);
    });
  });

  // ─── union ───────────────────────────────────────────────────────────────

  describe('union', () => {
    it('returns the combined interval for overlapping intervals', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      const b = BrightDateInterval.fromValues(5, 15);
      const result = a.union(b);
      expect(result).not.toBeNull();
      expect(result!.start.value).toBe(0);
      expect(result!.end.value).toBe(15);
    });

    it('returns null for non-overlapping, non-adjacent intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(10, 15);
      expect(a.union(b)).toBeNull();
    });

    it('returns combined interval for adjacent intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(5, 10);
      const result = a.union(b);
      expect(result).not.toBeNull();
      expect(result!.duration).toBe(10);
    });
  });

  // ─── adjacentTo ──────────────────────────────────────────────────────────

  describe('adjacentTo', () => {
    it('returns true for touching intervals', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(5, 10);
      expect(a.adjacentTo(b)).toBe(true);
    });

    it('returns false for overlapping intervals', () => {
      const a = BrightDateInterval.fromValues(0, 6);
      const b = BrightDateInterval.fromValues(5, 10);
      expect(a.adjacentTo(b)).toBe(false);
    });

    it('returns false for intervals with a gap', () => {
      const a = BrightDateInterval.fromValues(0, 5);
      const b = BrightDateInterval.fromValues(6, 10);
      expect(a.adjacentTo(b)).toBe(false);
    });
  });

  // ─── encloses ────────────────────────────────────────────────────────────

  describe('encloses', () => {
    it('returns true when outer contains inner', () => {
      const outer = BrightDateInterval.fromValues(0, 20);
      const inner = BrightDateInterval.fromValues(5, 15);
      expect(outer.encloses(inner)).toBe(true);
    });

    it('returns false when inner is larger', () => {
      const a = BrightDateInterval.fromValues(5, 15);
      const b = BrightDateInterval.fromValues(0, 20);
      expect(a.encloses(b)).toBe(false);
    });

    it('returns true for identical intervals', () => {
      const a = BrightDateInterval.fromValues(0, 10);
      expect(a.encloses(a)).toBe(true);
    });
  });

  // ─── split ───────────────────────────────────────────────────────────────

  describe('split', () => {
    it('splits into N equal sub-intervals', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const parts = interval.split(5);
      expect(parts).toHaveLength(5);
      expect(parts[0].duration).toBeCloseTo(2, 8);
    });

    it('split(1) returns the original interval', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const parts = interval.split(1);
      expect(parts).toHaveLength(1);
      expect(parts[0].duration).toBe(10);
    });

    it('throws for count < 1', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      expect(() => interval.split(0)).toThrow('Count must be at least 1');
    });

    it('sub-intervals are contiguous', () => {
      const interval = BrightDateInterval.fromValues(0, 9);
      const parts = interval.split(3);
      expect(parts[0].end.value).toBeCloseTo(parts[1].start.value, 8);
      expect(parts[1].end.value).toBeCloseTo(parts[2].start.value, 8);
    });
  });

  // ─── expand / shrink ─────────────────────────────────────────────────────

  describe('expand', () => {
    it('grows both ends by the given amount', () => {
      const interval = BrightDateInterval.fromValues(5, 15);
      const expanded = interval.expand(2);
      expect(expanded.start.value).toBe(3);
      expect(expanded.end.value).toBe(17);
    });
  });

  describe('shrink', () => {
    it('shrinks both ends by the given amount', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const shrunk = interval.shrink(2);
      expect(shrunk).not.toBeNull();
      expect(shrunk!.start.value).toBe(2);
      expect(shrunk!.end.value).toBe(8);
    });

    it('returns null when shrink would invert the interval', () => {
      const interval = BrightDateInterval.fromValues(0, 4);
      expect(interval.shrink(3)).toBeNull();
    });
  });

  // ─── shift ───────────────────────────────────────────────────────────────

  describe('shift', () => {
    it('shifts both ends forward', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const shifted = interval.shift(5);
      expect(shifted.start.value).toBe(5);
      expect(shifted.end.value).toBe(15);
    });

    it('shifts backward with negative value', () => {
      const interval = BrightDateInterval.fromValues(10, 20);
      const shifted = interval.shift(-5);
      expect(shifted.start.value).toBe(5);
      expect(shifted.end.value).toBe(15);
    });

    it('preserves duration', () => {
      const interval = BrightDateInterval.fromValues(0, 7);
      expect(interval.shift(100).duration).toBe(7);
    });
  });

  // ─── toString / formatDuration ───────────────────────────────────────────

  describe('toString', () => {
    it('returns a range string', () => {
      const interval = BrightDateInterval.fromValues(0, 1);
      expect(interval.toString()).toContain('→');
    });
  });

  describe('formatDuration', () => {
    it('returns a human-readable duration', () => {
      const interval = BrightDateInterval.fromValues(0, 1);
      expect(interval.formatDuration()).toContain('day');
    });
  });

  // ─── iterate ─────────────────────────────────────────────────────────────

  describe('iterate', () => {
    it('yields values at each step', () => {
      const interval = BrightDateInterval.fromValues(0, 3);
      const values = [...interval.iterate(1)];
      expect(values.map((v) => v.value)).toEqual([0, 1, 2, 3]);
    });

    it('includes the end value when it falls on a step', () => {
      const interval = BrightDateInterval.fromValues(0, 2);
      const values = [...interval.iterate(1)];
      expect(values[values.length - 1].value).toBe(2);
    });
  });

  // ─── sample ──────────────────────────────────────────────────────────────

  describe('sample', () => {
    it('returns N evenly spaced samples', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const samples = interval.sample(5);
      expect(samples).toHaveLength(5);
      expect(samples[0].value).toBe(0);
      expect(samples[4].value).toBe(10);
    });

    it('count=1 returns the midpoint', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      const samples = interval.sample(1);
      expect(samples).toHaveLength(1);
      expect(samples[0].value).toBe(5);
    });

    it('count=0 returns empty array', () => {
      const interval = BrightDateInterval.fromValues(0, 10);
      expect(interval.sample(0)).toHaveLength(0);
    });
  });
});
