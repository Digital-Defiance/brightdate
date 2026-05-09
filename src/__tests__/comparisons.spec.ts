/**
 * Tests for BrightDate comparison utilities.
 */

import {
  closest,
  deduplicate,
  gaps,
  groupByDay,
  isMonotonicallyIncreasing,
  isNonDecreasing,
  largestGap,
  partition,
  statistics,
  within,
} from '../comparisons';

describe('comparisons', () => {
  // ─── closest ─────────────────────────────────────────────────────────────

  describe('closest', () => {
    it('returns the closest value', () => {
      expect(closest(5, [1, 4, 7, 10])).toBe(4);
    });

    it('returns the exact value if present', () => {
      expect(closest(5, [1, 5, 10])).toBe(5);
    });

    it('returns undefined for empty array', () => {
      expect(closest(5, [])).toBeUndefined();
    });

    it('returns the only element for single-element array', () => {
      expect(closest(5, [99])).toBe(99);
    });

    it('handles negative values', () => {
      expect(closest(-5, [-10, -3, 0, 5])).toBe(-3);
    });
  });

  // ─── within ──────────────────────────────────────────────────────────────

  describe('within', () => {
    it('returns values within the max distance', () => {
      const result = within(5, [1, 4, 5, 6, 10], 1);
      expect(result).toEqual([4, 5, 6]);
    });

    it('returns empty array when nothing is within range', () => {
      expect(within(5, [1, 2, 3], 0.5)).toEqual([]);
    });

    it('INCLUDES values at exactly the max distance (≤ boundary)', () => {
      // The target is 5, distance 1 → inclusive bounds [4, 6]
      expect(within(5, [4, 6], 1)).toEqual([4, 6]);
    });

    it('EXCLUDES values just outside the max distance', () => {
      // 4 - 1 ULP and 6 + 1 ULP should be excluded
      const justBelow = 4 - Number.EPSILON * 4;
      const justAbove = 6 + Number.EPSILON * 6;
      expect(within(5, [justBelow, justAbove], 1)).toEqual([]);
    });

    it('returns all values when max distance is large', () => {
      const values = [1, 2, 3, 4, 5];
      expect(within(3, values, 100)).toEqual(values);
    });
  });

  // ─── partition ───────────────────────────────────────────────────────────

  describe('partition', () => {
    it('splits values into past and future', () => {
      const { past, future } = partition([1, 2, 3, 4, 5], 3);
      expect(past).toEqual([1, 2]);
      expect(future).toEqual([3, 4, 5]);
    });

    it('reference value goes into future (not past)', () => {
      const { past, future } = partition([3], 3);
      expect(past).toEqual([]);
      expect(future).toEqual([3]);
    });

    it('handles empty array', () => {
      const { past, future } = partition([], 5);
      expect(past).toEqual([]);
      expect(future).toEqual([]);
    });

    it('all past when reference is large', () => {
      const { past, future } = partition([1, 2, 3], 100);
      expect(past).toEqual([1, 2, 3]);
      expect(future).toEqual([]);
    });
  });

  // ─── groupByDay ──────────────────────────────────────────────────────────

  describe('groupByDay', () => {
    it('groups values by integer day', () => {
      const values = [0.1, 0.5, 0.9, 1.1, 1.8, 2.0];
      const groups = groupByDay(values);
      expect(groups.get(0)).toEqual([0.1, 0.5, 0.9]);
      expect(groups.get(1)).toEqual([1.1, 1.8]);
      expect(groups.get(2)).toEqual([2.0]);
    });

    it('handles empty array', () => {
      expect(groupByDay([])).toEqual(new Map());
    });

    it('handles negative values', () => {
      const groups = groupByDay([-0.5, -0.1]);
      expect(groups.get(-1)).toEqual([-0.5, -0.1]);
    });
  });

  // ─── statistics ──────────────────────────────────────────────────────────

  describe('statistics', () => {
    it('computes correct statistics for odd-length array', () => {
      const stats = statistics([3, 1, 4, 1, 5]);
      expect(stats.count).toBe(5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.range).toBe(4);
      expect(stats.mean).toBeCloseTo(2.8, 5);
      expect(stats.median).toBe(3);
    });

    it('computes correct median for even-length array', () => {
      expect(statistics([1, 2, 3, 4]).median).toBe(2.5);
    });

    it('median works with unsorted input (sort is internal)', () => {
      // Unsorted; the median of {1,2,3,4,5,6} is 3.5
      expect(statistics([5, 1, 3, 6, 2, 4]).median).toBe(3.5);
    });

    it('median of unsorted odd-length array', () => {
      expect(statistics([9, 1, 5, 3, 7]).median).toBe(5);
    });

    it('handles single element', () => {
      const stats = statistics([42]);
      expect(stats.count).toBe(1);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.range).toBe(0);
      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
    });

    it('throws for empty array', () => {
      expect(() => statistics([])).toThrow(
        'Cannot compute statistics of empty array',
      );
    });

    it('does not mutate the input array', () => {
      const input = [3, 1, 2];
      statistics(input);
      expect(input).toEqual([3, 1, 2]);
    });
  });

  // ─── gaps ────────────────────────────────────────────────────────────────

  describe('gaps', () => {
    it('returns gaps between consecutive sorted values', () => {
      const result = gaps([1, 3, 6, 10]);
      expect(result).toEqual([2, 3, 4]);
    });

    it('sorts before computing gaps', () => {
      const result = gaps([10, 1, 6, 3]);
      expect(result).toEqual([2, 3, 4]);
    });

    it('returns empty array for fewer than 2 values', () => {
      expect(gaps([])).toEqual([]);
      expect(gaps([5])).toEqual([]);
    });

    it('returns [0] for two equal values', () => {
      expect(gaps([5, 5])).toEqual([0]);
    });
  });

  // ─── largestGap ──────────────────────────────────────────────────────────

  describe('largestGap', () => {
    it('finds the largest gap', () => {
      const result = largestGap([1, 2, 10, 11]);
      expect(result).not.toBeUndefined();
      expect(result!.gap).toBe(8);
      expect(result!.before).toBe(2);
      expect(result!.after).toBe(10);
    });

    it('returns undefined for fewer than 2 values', () => {
      expect(largestGap([])).toBeUndefined();
      expect(largestGap([5])).toBeUndefined();
    });

    it('handles unsorted input', () => {
      const result = largestGap([10, 1, 2, 11]);
      expect(result!.gap).toBe(8);
    });
  });

  // ─── isMonotonicallyIncreasing ───────────────────────────────────────────

  describe('isMonotonicallyIncreasing', () => {
    it('returns true for strictly increasing array', () => {
      expect(isMonotonicallyIncreasing([1, 2, 3, 4])).toBe(true);
    });

    it('returns false for equal consecutive values', () => {
      expect(isMonotonicallyIncreasing([1, 2, 2, 3])).toBe(false);
    });

    it('returns false for decreasing values', () => {
      expect(isMonotonicallyIncreasing([1, 3, 2])).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(isMonotonicallyIncreasing([])).toBe(true);
    });

    it('returns true for single element', () => {
      expect(isMonotonicallyIncreasing([5])).toBe(true);
    });
  });

  // ─── isNonDecreasing ─────────────────────────────────────────────────────

  describe('isNonDecreasing', () => {
    it('returns true for strictly increasing array', () => {
      expect(isNonDecreasing([1, 2, 3])).toBe(true);
    });

    it('returns true for equal consecutive values', () => {
      expect(isNonDecreasing([1, 2, 2, 3])).toBe(true);
    });

    it('returns false for decreasing values', () => {
      expect(isNonDecreasing([1, 3, 2])).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(isNonDecreasing([])).toBe(true);
    });
  });

  // ─── deduplicate ─────────────────────────────────────────────────────────

  describe('deduplicate', () => {
    it('removes exact duplicates', () => {
      expect(deduplicate([1, 1, 2, 3, 3])).toEqual([1, 2, 3]);
    });

    it('removes values within tolerance', () => {
      const result = deduplicate([1, 1.0000000005, 2], 0.000001);
      expect(result).toHaveLength(2);
    });

    it('keeps values separated by EXACTLY the tolerance (strict >, not ≥)', () => {
      // The source uses `diff > tolerance`, so two values separated by
      // exactly the tolerance are treated as DUPLICATES (second is dropped).
      // This test pins that behavior — if it changes to ≥, this test flags it.
      const tol = 0.001;
      const result = deduplicate([1, 1 + tol, 2], tol);
      // Because diff must be STRICTLY GREATER than tol, 1 and 1+tol collapse.
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
    });

    it('keeps values separated by MORE than the tolerance', () => {
      const tol = 0.001;
      const result = deduplicate([1, 1 + tol * 2, 2], tol);
      expect(result).toHaveLength(3);
    });

    it('handles empty array', () => {
      expect(deduplicate([])).toEqual([]);
    });

    it('handles single element', () => {
      expect(deduplicate([5])).toEqual([5]);
    });

    it('sorts before deduplicating', () => {
      expect(deduplicate([3, 1, 2, 1])).toEqual([1, 2, 3]);
    });

    it('does not remove values outside tolerance', () => {
      const result = deduplicate([1, 1.01, 2], 0.001);
      expect(result).toHaveLength(3);
    });
  });
});
