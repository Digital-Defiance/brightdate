/**
 * Tests for BrightDate scheduling utilities.
 */

import {
  BrightDateTimeline,
  INTERVALS,
  nextOccurrenceAfter,
  nextOccurrences,
  previousOccurrenceBefore,
  recurrences,
  timeUntilDailyEvent,
} from '../scheduling';

describe('scheduling', () => {
  // ─── INTERVALS ───────────────────────────────────────────────────────────

  describe('INTERVALS', () => {
    it('SECOND = 1/86400', () => {
      expect(INTERVALS.SECOND).toBeCloseTo(1 / 86400, 10);
    });

    it('MINUTE = 1/1440', () => {
      expect(INTERVALS.MINUTE).toBeCloseTo(1 / 1440, 10);
    });

    it('HOUR = 1/24', () => {
      expect(INTERVALS.HOUR).toBeCloseTo(1 / 24, 10);
    });

    it('DAY = 1', () => {
      expect(INTERVALS.DAY).toBe(1);
    });

    it('WEEK = 7', () => {
      expect(INTERVALS.WEEK).toBe(7);
    });

    it('HALF_DAY = 0.5', () => {
      expect(INTERVALS.HALF_DAY).toBe(0.5);
    });

    it('60 * MINUTE = 1 HOUR', () => {
      expect(60 * INTERVALS.MINUTE).toBeCloseTo(INTERVALS.HOUR, 10);
    });

    it('24 * HOUR = 1 DAY', () => {
      expect(24 * INTERVALS.HOUR).toBeCloseTo(INTERVALS.DAY, 10);
    });
  });

  // ─── recurrences ─────────────────────────────────────────────────────────

  describe('recurrences', () => {
    it('generates occurrences at the given interval', () => {
      const gen = recurrences({ start: 0, intervalDays: 1 });
      const values = [];
      for (let i = 0; i < 5; i++) {
        values.push(gen.next().value);
      }
      expect(values).toEqual([0, 1, 2, 3, 4]);
    });

    it('respects maxOccurrences', () => {
      const values = [
        ...recurrences({ start: 0, intervalDays: 1, maxOccurrences: 3 }),
      ];
      expect(values).toHaveLength(3);
    });

    it('respects end boundary', () => {
      const values = [
        ...recurrences({ start: 0, intervalDays: 1, end: 2.5 }),
      ];
      expect(values).toEqual([0, 1, 2]);
    });

    it('yields start as first occurrence', () => {
      const gen = recurrences({ start: 100, intervalDays: 7 });
      expect(gen.next().value).toBe(100);
    });

    it('generates fractional intervals', () => {
      const values = [
        ...recurrences({
          start: 0,
          intervalDays: 0.5,
          maxOccurrences: 4,
        }),
      ];
      expect(values).toEqual([0, 0.5, 1, 1.5]);
    });
  });

  // ─── nextOccurrences ─────────────────────────────────────────────────────

  describe('nextOccurrences', () => {
    it('returns the requested number of occurrences', () => {
      const result = nextOccurrences({ start: 0, intervalDays: 1 }, 5);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(0);
      expect(result[4]).toBe(4);
    });

    it('returns empty array for count 0', () => {
      expect(nextOccurrences({ start: 0, intervalDays: 1 }, 0)).toHaveLength(0);
    });
  });

  // ─── nextOccurrenceAfter ─────────────────────────────────────────────────

  describe('nextOccurrenceAfter', () => {
    it('returns the next occurrence after the given time', () => {
      const pattern = { start: 0, intervalDays: 1 };
      expect(nextOccurrenceAfter(pattern, 2.5)).toBeCloseTo(3, 8);
    });

    it('returns start when after is before start', () => {
      const pattern = { start: 10, intervalDays: 1 };
      expect(nextOccurrenceAfter(pattern, 5)).toBe(10);
    });

    it('returns undefined when past end', () => {
      const pattern = { start: 0, intervalDays: 1, end: 5 };
      expect(nextOccurrenceAfter(pattern, 5)).toBeUndefined();
    });

    it('returns undefined when past maxOccurrences', () => {
      const pattern = { start: 0, intervalDays: 1, maxOccurrences: 3 };
      // Occurrences: 0, 1, 2 → next after 2 would be index 3, which exceeds maxOccurrences
      expect(nextOccurrenceAfter(pattern, 2)).toBeUndefined();
    });

    it('throws for non-positive interval', () => {
      expect(() =>
        nextOccurrenceAfter({ start: 0, intervalDays: 0 }, 5),
      ).toThrow('Interval must be positive');
    });

    it('throws for negative interval', () => {
      expect(() =>
        nextOccurrenceAfter({ start: 0, intervalDays: -1 }, 5),
      ).toThrow('Interval must be positive');
    });
  });

  // ─── previousOccurrenceBefore ────────────────────────────────────────────

  describe('previousOccurrenceBefore', () => {
    it('returns the previous occurrence before the given time', () => {
      const pattern = { start: 0, intervalDays: 1 };
      expect(previousOccurrenceBefore(pattern, 2.5)).toBeCloseTo(2, 8);
    });

    it('returns undefined when before start', () => {
      const pattern = { start: 10, intervalDays: 1 };
      expect(previousOccurrenceBefore(pattern, 5)).toBeUndefined();
    });

    it('returns undefined when before equals start', () => {
      const pattern = { start: 5, intervalDays: 1 };
      expect(previousOccurrenceBefore(pattern, 5)).toBeUndefined();
    });

    it('throws for non-positive interval', () => {
      expect(() =>
        previousOccurrenceBefore({ start: 0, intervalDays: 0 }, 5),
      ).toThrow('Interval must be positive');
    });

    it('returns the occurrence just before the given time', () => {
      const pattern = { start: 0, intervalDays: 7 };
      // Before 10: occurrences are 0, 7 → previous is 7
      expect(previousOccurrenceBefore(pattern, 10)).toBeCloseTo(7, 8);
    });
  });

  // ─── timeUntilDailyEvent ─────────────────────────────────────────────────

  describe('timeUntilDailyEvent', () => {
    it('returns positive duration', () => {
      // Target is noon (0.5), current is morning (0.25)
      const result = timeUntilDailyEvent(0.5, 0.25);
      expect(result).toBeCloseTo(0.25, 8);
    });

    it('wraps around midnight when target has passed', () => {
      // Target is 6:00 (0.25), current is 18:00 (0.75)
      // Should wrap: 1 - 0.75 + 0.25 = 0.5
      const result = timeUntilDailyEvent(0.25, 0.75);
      expect(result).toBeCloseTo(0.5, 8);
    });

    it('returns 1 day when target equals current (wraps)', () => {
      // Target = current → wraps to next day
      const result = timeUntilDailyEvent(0.5, 0.5);
      expect(result).toBeCloseTo(1, 8);
    });

    it('result is always in (0, 1]', () => {
      for (let i = 0; i < 10; i++) {
        const target = i / 10;
        const current = (i + 3) / 10;
        const result = timeUntilDailyEvent(target, current % 1);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  // ─── BrightDateTimeline ──────────────────────────────────────────────────

  describe('BrightDateTimeline', () => {
    let timeline: BrightDateTimeline;

    beforeEach(() => {
      timeline = new BrightDateTimeline();
    });

    describe('add / count', () => {
      it('starts empty', () => {
        expect(timeline.count).toBe(0);
      });

      it('adds events and increments count', () => {
        timeline.add({ id: '1', name: 'Event 1', time: 100 });
        expect(timeline.count).toBe(1);
      });

      it('keeps events sorted by time (with multiple inserts)', () => {
        timeline.add({ id: '3', name: 'C', time: 300 });
        timeline.add({ id: '1', name: 'A', time: 100 });
        timeline.add({ id: '4', name: 'D', time: 400 });
        timeline.add({ id: '2', name: 'B', time: 200 });
        const all = timeline.getAll();
        expect(all.map((e) => e.time)).toEqual([100, 200, 300, 400]);
        expect(all.map((e) => e.id)).toEqual(['1', '2', '3', '4']);
      });
    });

    describe('remove', () => {
      it('removes an event by ID', () => {
        timeline.add({ id: '1', name: 'Event', time: 100 });
        expect(timeline.remove('1')).toBe(true);
        expect(timeline.count).toBe(0);
      });

      it('returns false for non-existent ID', () => {
        expect(timeline.remove('nonexistent')).toBe(false);
      });
    });

    describe('getInRange', () => {
      beforeEach(() => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        timeline.add({ id: '2', name: 'B', time: 20 });
        timeline.add({ id: '3', name: 'C', time: 30 });
      });

      it('returns events within the range', () => {
        const result = timeline.getInRange(15, 25);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
      });

      it('includes boundary events', () => {
        const result = timeline.getInRange(10, 20);
        expect(result).toHaveLength(2);
      });

      it('returns empty array when no events in range', () => {
        expect(timeline.getInRange(50, 100)).toHaveLength(0);
      });
    });

    describe('getNext', () => {
      beforeEach(() => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        timeline.add({ id: '2', name: 'B', time: 20 });
      });

      it('returns the next event after the given time', () => {
        const next = timeline.getNext(5);
        expect(next?.id).toBe('1');
      });

      it('returns undefined when no future events', () => {
        expect(timeline.getNext(100)).toBeUndefined();
      });
    });

    describe('getPrevious', () => {
      beforeEach(() => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        timeline.add({ id: '2', name: 'B', time: 20 });
      });

      it('returns the previous event before the given time', () => {
        const prev = timeline.getPrevious(25);
        expect(prev?.id).toBe('2');
      });

      it('returns undefined when no past events', () => {
        expect(timeline.getPrevious(5)).toBeUndefined();
      });
    });

    describe('getSpan', () => {
      it('returns null for empty timeline', () => {
        expect(timeline.getSpan()).toBeNull();
      });

      it('returns interval spanning all events', () => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        timeline.add({ id: '2', name: 'B', time: 50 });
        const span = timeline.getSpan();
        expect(span).not.toBeNull();
        expect(span!.start.value).toBe(10);
        expect(span!.end.value).toBe(50);
      });
    });

    describe('clear', () => {
      it('removes all events', () => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        timeline.clear();
        expect(timeline.count).toBe(0);
      });
    });

    describe('getAll', () => {
      it('returns a readonly array', () => {
        timeline.add({ id: '1', name: 'A', time: 10 });
        const all = timeline.getAll();
        expect(Array.isArray(all)).toBe(true);
      });
    });
  });
});
