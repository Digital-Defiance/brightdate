/**
 * BrightDate Scheduling Utilities
 *
 * Tools for recurring events, cron-like scheduling, and time-based
 * coordination using BrightDate's decimal day system.
 */

import { now } from './conversions';
import { BrightDateInterval } from './intervals';
import type { BrightDateValue } from './types';

/**
 * Recurrence pattern for scheduling.
 */
export interface RecurrencePattern {
  /** Interval between occurrences in decimal days */
  intervalDays: number;
  /** First occurrence */
  start: BrightDateValue;
  /** Optional end (no more occurrences after this) */
  end?: BrightDateValue;
  /** Maximum number of occurrences */
  maxOccurrences?: number;
}

/**
 * Generate occurrences of a recurring event.
 *
 * @param pattern - Recurrence pattern
 * @returns Generator yielding BrightDate values for each occurrence
 */
export function* recurrences(
  pattern: RecurrencePattern,
): Generator<BrightDateValue> {
  let current = pattern.start;
  let count = 0;

  while (true) {
    if (pattern.end !== undefined && current > pattern.end) break;
    if (pattern.maxOccurrences !== undefined && count >= pattern.maxOccurrences)
      break;

    yield current;
    current += pattern.intervalDays;
    count++;
  }
}

/**
 * Get the next N occurrences of a recurring event.
 *
 * @param pattern - Recurrence pattern
 * @param count - Number of occurrences to return
 * @returns Array of BrightDate values
 */
export function nextOccurrences(
  pattern: RecurrencePattern,
  count: number,
): BrightDateValue[] {
  const results: BrightDateValue[] = [];
  for (const occurrence of recurrences({ ...pattern, maxOccurrences: count })) {
    results.push(occurrence);
  }
  return results;
}

/**
 * Get the next occurrence of a recurring event after a given time.
 *
 * @param pattern - Recurrence pattern
 * @param after - Find the next occurrence after this BrightDate
 * @returns Next occurrence, or undefined if none
 */
export function nextOccurrenceAfter(
  pattern: RecurrencePattern,
  after: BrightDateValue,
): BrightDateValue | undefined {
  if (pattern.intervalDays <= 0) {
    throw new Error('Interval must be positive');
  }

  // Calculate how many intervals have passed since start
  const elapsed = after - pattern.start;
  if (elapsed < 0) {
    return pattern.start;
  }

  const intervals = Math.floor(elapsed / pattern.intervalDays) + 1;
  const next = pattern.start + intervals * pattern.intervalDays;

  if (pattern.end !== undefined && next > pattern.end) {
    return undefined;
  }

  if (
    pattern.maxOccurrences !== undefined &&
    intervals >= pattern.maxOccurrences
  ) {
    return undefined;
  }

  return next;
}

/**
 * Get the previous occurrence of a recurring event before a given time.
 *
 * @param pattern - Recurrence pattern
 * @param before - Find the previous occurrence before this BrightDate
 * @returns Previous occurrence, or undefined if none
 */
export function previousOccurrenceBefore(
  pattern: RecurrencePattern,
  before: BrightDateValue,
): BrightDateValue | undefined {
  if (pattern.intervalDays <= 0) {
    throw new Error('Interval must be positive');
  }

  const elapsed = before - pattern.start;
  if (elapsed <= 0) {
    return undefined;
  }

  const intervals = Math.floor(elapsed / pattern.intervalDays);
  const prev = pattern.start + intervals * pattern.intervalDays;

  // If prev equals before, go one step back
  if (prev >= before) {
    const adjusted = pattern.start + (intervals - 1) * pattern.intervalDays;
    return adjusted >= pattern.start ? adjusted : undefined;
  }

  return prev;
}

/**
 * Common scheduling intervals in decimal days.
 */
export const INTERVALS = {
  /** Every second */
  SECOND: 1 / 86400,
  /** Every minute */
  MINUTE: 1 / 1440,
  /** Every 5 minutes */
  FIVE_MINUTES: 5 / 1440,
  /** Every 15 minutes */
  QUARTER_HOUR: 15 / 1440,
  /** Every 30 minutes */
  HALF_HOUR: 30 / 1440,
  /** Every hour */
  HOUR: 1 / 24,
  /** Every 2 hours */
  TWO_HOURS: 2 / 24,
  /** Every 4 hours */
  FOUR_HOURS: 4 / 24,
  /** Every 6 hours */
  SIX_HOURS: 6 / 24,
  /** Every 8 hours */
  EIGHT_HOURS: 8 / 24,
  /** Every 12 hours */
  HALF_DAY: 0.5,
  /** Every day */
  DAY: 1,
  /** Every week */
  WEEK: 7,
  /** Every two weeks */
  FORTNIGHT: 14,
  /** Approximate month (30 days) */
  MONTH_APPROX: 30,
  /** Approximate quarter (91.25 days) */
  QUARTER_APPROX: 91.25,
  /** Approximate year (365.25 days) */
  YEAR_APPROX: 365.25,
} as const;

/**
 * A scheduled event with metadata.
 */
export interface ScheduledEvent {
  /** Unique identifier */
  id: string;
  /** Event name/description */
  name: string;
  /** When the event occurs */
  time: BrightDateValue;
  /** Optional duration in days */
  duration?: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A simple event timeline for managing scheduled events.
 */
export class BrightDateTimeline {
  private events: ScheduledEvent[] = [];

  /**
   * Add an event to the timeline.
   */
  add(event: ScheduledEvent): void {
    this.events.push(event);
    this.events.sort((a, b) => a.time - b.time);
  }

  /**
   * Remove an event by ID.
   */
  remove(id: string): boolean {
    const index = this.events.findIndex((e) => e.id === id);
    if (index >= 0) {
      this.events.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all events in a time range.
   */
  getInRange(start: BrightDateValue, end: BrightDateValue): ScheduledEvent[] {
    return this.events.filter((e) => e.time >= start && e.time <= end);
  }

  /**
   * Get the next event after a given time.
   */
  getNext(after: BrightDateValue = now()): ScheduledEvent | undefined {
    return this.events.find((e) => e.time > after);
  }

  /**
   * Get the previous event before a given time.
   */
  getPrevious(before: BrightDateValue = now()): ScheduledEvent | undefined {
    for (let i = this.events.length - 1; i >= 0; i--) {
      if (this.events[i].time < before) {
        return this.events[i];
      }
    }
    return undefined;
  }

  /**
   * Get all events.
   */
  getAll(): ReadonlyArray<ScheduledEvent> {
    return this.events;
  }

  /**
   * Get the number of events.
   */
  get count(): number {
    return this.events.length;
  }

  /**
   * Get the time span of all events.
   */
  getSpan(): BrightDateInterval | null {
    if (this.events.length === 0) return null;
    return BrightDateInterval.fromValues(
      this.events[0].time,
      this.events[this.events.length - 1].time,
    );
  }

  /**
   * Clear all events.
   */
  clear(): void {
    this.events = [];
  }
}

/**
 * Calculate the time until the next occurrence of a daily event whose target
 * time is expressed as a fraction of a **BrightDate day** (the raw scalar
 * fractional part — not a UTC civil-day fraction).
 *
 * **Important:** because the BD-day boundary is the J2000.0 anchor instant
 * (UTC `2000-01-01T11:58:55.816Z`), `targetFraction = 0.5` is **not** UTC
 * noon — it is "halfway through a BD day", which is offset from UTC noon
 * by the J2000 anchor plus accumulated leap seconds.
 *
 * If you need "next 18:00 UTC" semantics, convert via
 * `bdAtUtcWallClock(now, 18)` and take the difference yourself. BrightDate
 * intentionally does not model local civil time — only UTC.
 *
 * @param targetFraction - Target on the BD-day grid in `[0, 1)`
 * @param currentBrightDate - Current BrightDate (default: now)
 * @returns Duration in days until the next occurrence on the BD-day grid
 */
export function timeUntilDailyEvent(
  targetFraction: number,
  currentBrightDate?: BrightDateValue,
): number {
  const current = currentBrightDate ?? now();
  const currentFraction = current - Math.floor(current);

  if (currentFraction < targetFraction) {
    return targetFraction - currentFraction;
  } else {
    return 1 - currentFraction + targetFraction;
  }
}
