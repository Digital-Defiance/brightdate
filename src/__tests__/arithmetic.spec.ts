/**
 * Tests for BrightDate arithmetic operations.
 */

import {
  absoluteDifference,
  add,
  addMicrodays,
  addMillidays,
  ceilToDay,
  clamp,
  compare,
  difference,
  equals,
  floorToDay,
  isInRange,
  lerp,
  linspace,
  max,
  midpoint,
  min,
  roundToMicroday,
  roundToMilliday,
  sort,
  sortComparator,
  subtract,
  wholeDaysBetween,
} from '../arithmetic';

describe('arithmetic', () => {
  // ─── add / subtract ──────────────────────────────────────────────────────

  describe('add', () => {
    it('adds positive days', () => {
      expect(add(100, 5)).toBe(105);
    });

    it('adds negative days (subtraction)', () => {
      expect(add(100, -5)).toBe(95);
    });

    it('adding zero is identity', () => {
      expect(add(9622.5, 0)).toBe(9622.5);
    });

    it('works with fractional days', () => {
      expect(add(0, 0.5)).toBeCloseTo(0.5, 10);
    });
  });

  describe('subtract', () => {
    it('subtracts positive days', () => {
      expect(subtract(100, 5)).toBe(95);
    });

    it('subtracting zero is identity', () => {
      expect(subtract(9622.5, 0)).toBe(9622.5);
    });

    it('subtract is inverse of add', () => {
      const v = 9622.50417;
      expect(subtract(add(v, 3), 3)).toBeCloseTo(v, 10);
    });
  });

  // ─── addMillidays / addMicrodays ─────────────────────────────────────────

  describe('addMillidays', () => {
    it('adds 1 milliday = 0.001 days', () => {
      expect(addMillidays(0, 1)).toBeCloseTo(0.001, 10);
    });

    it('adds 1000 millidays = 1 day', () => {
      expect(addMillidays(0, 1000)).toBeCloseTo(1.0, 8);
    });

    it('subtracts millidays with negative value', () => {
      expect(addMillidays(1, -500)).toBeCloseTo(0.5, 8);
    });
  });

  describe('addMicrodays', () => {
    it('adds 1 microday = 0.000001 days', () => {
      expect(addMicrodays(0, 1)).toBeCloseTo(0.000_001, 12);
    });

    it('adds 1_000_000 microdays = 1 day', () => {
      expect(addMicrodays(0, 1_000_000)).toBeCloseTo(1.0, 6);
    });
  });

  // ─── difference / absoluteDifference ────────────────────────────────────

  describe('difference', () => {
    it('returns a - b (signed)', () => {
      expect(difference(10, 3)).toBe(7);
    });

    it('returns negative when a < b', () => {
      expect(difference(3, 10)).toBe(-7);
    });

    it('returns 0 for equal values', () => {
      expect(difference(5, 5)).toBe(0);
    });
  });

  describe('absoluteDifference', () => {
    it('is always non-negative', () => {
      expect(absoluteDifference(3, 10)).toBe(7);
      expect(absoluteDifference(10, 3)).toBe(7);
    });

    it('is 0 for equal values', () => {
      expect(absoluteDifference(5, 5)).toBe(0);
    });
  });

  // ─── compare ─────────────────────────────────────────────────────────────

  describe('compare', () => {
    it('returns -1 when a < b', () => {
      expect(compare(1, 2)).toBe(-1);
    });

    it('returns 1 when a > b', () => {
      expect(compare(2, 1)).toBe(1);
    });

    it('returns 0 when a === b', () => {
      expect(compare(5, 5)).toBe(0);
    });

    it('works with negative values', () => {
      expect(compare(-10, -5)).toBe(-1);
    });
  });

  // ─── sortComparator ──────────────────────────────────────────────────────

  describe('sortComparator', () => {
    it('returns negative when a < b', () => {
      expect(sortComparator(1, 2)).toBeLessThan(0);
    });

    it('returns positive when a > b', () => {
      expect(sortComparator(2, 1)).toBeGreaterThan(0);
    });

    it('returns 0 when equal', () => {
      expect(sortComparator(5, 5)).toBe(0);
    });

    it('sorts an array correctly', () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      expect(arr.sort(sortComparator)).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });
  });

  // ─── equals ──────────────────────────────────────────────────────────────

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(equals(5, 5)).toBe(true);
    });

    it('returns true within default tolerance (1 microday)', () => {
      expect(equals(5, 5 + 0.0000005)).toBe(true);
    });

    it('returns false outside default tolerance', () => {
      expect(equals(5, 5 + 0.000002)).toBe(false);
    });

    it('respects custom tolerance', () => {
      expect(equals(5, 5 + 0.01, 0.1)).toBe(true);
      expect(equals(5, 5 + 0.2, 0.1)).toBe(false);
    });
  });

  // ─── isInRange ───────────────────────────────────────────────────────────

  describe('isInRange', () => {
    it('returns true for value within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
    });

    it('returns true at start boundary (inclusive)', () => {
      expect(isInRange(1, 1, 10)).toBe(true);
    });

    it('returns true at end boundary (inclusive)', () => {
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('returns false below range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
    });

    it('returns false above range', () => {
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  // ─── min / max ───────────────────────────────────────────────────────────

  describe('min', () => {
    it('returns the smallest value', () => {
      expect(min(3, 1, 4, 1, 5)).toBe(1);
    });

    it('works with a single value', () => {
      expect(min(42)).toBe(42);
    });

    it('throws on empty array', () => {
      expect(() => min()).toThrow('Cannot find minimum of empty array');
    });

    it('works with negative values', () => {
      expect(min(-5, -1, -10)).toBe(-10);
    });
  });

  describe('max', () => {
    it('returns the largest value', () => {
      expect(max(3, 1, 4, 1, 5)).toBe(5);
    });

    it('works with a single value', () => {
      expect(max(42)).toBe(42);
    });

    it('throws on empty array', () => {
      expect(() => max()).toThrow('Cannot find maximum of empty array');
    });
  });

  // ─── clamp ───────────────────────────────────────────────────────────────

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    it('clamps to lower bound', () => {
      expect(clamp(-5, 1, 10)).toBe(1);
    });

    it('clamps to upper bound', () => {
      expect(clamp(15, 1, 10)).toBe(10);
    });

    it('returns lower when value equals lower', () => {
      expect(clamp(1, 1, 10)).toBe(1);
    });

    it('returns upper when value equals upper', () => {
      expect(clamp(10, 1, 10)).toBe(10);
    });
  });

  // ─── lerp ────────────────────────────────────────────────────────────────

  describe('lerp', () => {
    it('t=0 returns start', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('t=1 returns end', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('t=0.5 returns midpoint', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it('t=0.25 returns quarter point', () => {
      expect(lerp(0, 100, 0.25)).toBe(25);
    });

    it('works with negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  // ─── midpoint ────────────────────────────────────────────────────────────

  describe('midpoint', () => {
    it('returns the average of two values', () => {
      expect(midpoint(10, 20)).toBe(15);
    });

    it('works with equal values', () => {
      expect(midpoint(5, 5)).toBe(5);
    });

    it('works with negative values', () => {
      expect(midpoint(-10, 10)).toBe(0);
    });

    it('is commutative', () => {
      expect(midpoint(3, 7)).toBe(midpoint(7, 3));
    });
  });

  // ─── linspace ────────────────────────────────────────────────────────────

  describe('linspace', () => {
    it('generates N evenly spaced values', () => {
      const result = linspace(0, 1, 5);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(0);
      expect(result[4]).toBe(1);
      expect(result[2]).toBeCloseTo(0.5, 10);
    });

    it('count < 2 returns [start]', () => {
      expect(linspace(5, 10, 1)).toEqual([5]);
    });

    it('count = 2 returns [start, end]', () => {
      expect(linspace(0, 10, 2)).toEqual([0, 10]);
    });

    it('generates correct step size', () => {
      const result = linspace(0, 3, 4);
      expect(result[1]).toBeCloseTo(1, 10);
      expect(result[2]).toBeCloseTo(2, 10);
    });
  });

  // ─── sort ────────────────────────────────────────────────────────────────

  describe('sort', () => {
    it('sorts values in ascending order', () => {
      expect(sort([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
    });

    it('does not mutate the original array', () => {
      const original = [3, 1, 2];
      sort(original);
      expect(original).toEqual([3, 1, 2]);
    });

    it('handles empty array', () => {
      expect(sort([])).toEqual([]);
    });

    it('handles single element', () => {
      expect(sort([42])).toEqual([42]);
    });
  });

  // ─── floorToDay / ceilToDay ──────────────────────────────────────────────

  describe('floorToDay', () => {
    it('floors to integer day', () => {
      expect(floorToDay(9622.75)).toBe(9622);
    });

    it('integer value is unchanged', () => {
      expect(floorToDay(100)).toBe(100);
    });

    it('works with negative values', () => {
      expect(floorToDay(-0.5)).toBe(-1);
    });
  });

  describe('ceilToDay', () => {
    it('ceils to next integer day', () => {
      expect(ceilToDay(9622.25)).toBe(9623);
    });

    it('integer value is unchanged', () => {
      expect(ceilToDay(100)).toBe(100);
    });

    it('works with negative values', () => {
      expect(ceilToDay(-0.5)).toBeCloseTo(0, 10);
    });
  });

  // ─── roundToMilliday / roundToMicroday ───────────────────────────────────

  describe('roundToMilliday', () => {
    it('rounds to nearest milliday', () => {
      expect(roundToMilliday(9622.5004)).toBeCloseTo(9622.5, 3);
    });

    it('rounds up at midpoint', () => {
      expect(roundToMilliday(0.0005)).toBeCloseTo(0.001, 3);
    });

    it('integer value is unchanged', () => {
      expect(roundToMilliday(100)).toBe(100);
    });
  });

  describe('roundToMicroday', () => {
    it('rounds to nearest microday', () => {
      expect(roundToMicroday(9622.5000004)).toBeCloseTo(9622.5, 6);
    });

    it('integer value is unchanged', () => {
      expect(roundToMicroday(100)).toBe(100);
    });
  });

  // ─── wholeDaysBetween ────────────────────────────────────────────────────

  describe('wholeDaysBetween', () => {
    it('returns 0 for same day', () => {
      expect(wholeDaysBetween(9622.1, 9622.9)).toBe(0);
    });

    it('returns 1 for values 1.5 days apart', () => {
      expect(wholeDaysBetween(0, 1.5)).toBe(1);
    });

    it('is symmetric', () => {
      expect(wholeDaysBetween(10, 5)).toBe(wholeDaysBetween(5, 10));
    });

    it('returns exact integer days', () => {
      expect(wholeDaysBetween(0, 7)).toBe(7);
    });
  });
});
