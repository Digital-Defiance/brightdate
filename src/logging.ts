/**
 * BrightDate Logging Utilities
 *
 * Provides logging-oriented functions for using BrightDate as a
 * universal timestamp in application logs, metrics, and traces.
 */

import { DEFAULT_PRECISION } from './constants';
import { now } from './conversions';
import { format, formatDuration } from './formatting';
import type { BrightDateValue, Precision } from './types';

/**
 * Log level for structured logging.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * A structured log entry with BrightDate timestamp.
 */
export interface BrightDateLogEntry {
  /** BrightDate timestamp */
  timestamp: BrightDateValue;
  /** Formatted timestamp string */
  timestampStr: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Optional structured data */
  data?: Record<string, unknown>;
  /** Optional source/module identifier */
  source?: string;
}

/**
 * Create a timestamped log entry.
 *
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional structured data
 * @param source - Optional source identifier
 * @param precision - Timestamp precision (default: 5)
 * @returns Structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  source?: string,
  precision: Precision = DEFAULT_PRECISION as Precision,
): BrightDateLogEntry {
  const timestamp = now();
  return {
    timestamp,
    timestampStr: format(timestamp, precision),
    level,
    message,
    data,
    source,
  };
}

/**
 * Format a log entry as a single-line string.
 * Format: "[9622.50417] INFO source: message"
 *
 * @param entry - Log entry
 * @returns Formatted log line
 */
export function formatLogEntry(entry: BrightDateLogEntry): string {
  const parts = [
    `[${entry.timestampStr}]`,
    entry.level.toUpperCase().padEnd(5),
  ];

  if (entry.source) {
    parts.push(`${entry.source}:`);
  }

  parts.push(entry.message);

  if (entry.data && Object.keys(entry.data).length > 0) {
    parts.push(JSON.stringify(entry.data));
  }

  return parts.join(' ');
}

/**
 * A simple BrightDate-based stopwatch for measuring durations.
 */
export class BrightDateStopwatch {
  private startTime: BrightDateValue | null = null;
  private stopTime: BrightDateValue | null = null;
  private laps: BrightDateValue[] = [];

  /**
   * Start the stopwatch.
   */
  start(): void {
    this.startTime = now();
    this.stopTime = null;
    this.laps = [];
  }

  /**
   * Stop the stopwatch.
   */
  stop(): void {
    if (this.startTime === null) {
      throw new Error('Stopwatch not started');
    }
    this.stopTime = now();
  }

  /**
   * Record a lap time.
   */
  lap(): void {
    if (this.startTime === null) {
      throw new Error('Stopwatch not started');
    }
    this.laps.push(now());
  }

  /**
   * Get the elapsed time in decimal days.
   */
  get elapsed(): number {
    if (this.startTime === null) {
      throw new Error('Stopwatch not started');
    }
    const end = this.stopTime ?? now();
    return end - this.startTime;
  }

  /**
   * Get the elapsed time formatted in the most appropriate metric unit.
   */
  get elapsedFormatted(): string {
    return formatDuration(this.elapsed);
  }

  /**
   * Get lap durations (time between each lap).
   */
  get lapDurations(): number[] {
    if (this.startTime === null) return [];
    const points = [this.startTime, ...this.laps];
    const durations: number[] = [];
    for (let i = 1; i < points.length; i++) {
      durations.push(points[i] - points[i - 1]);
    }
    return durations;
  }

  /**
   * Get formatted lap durations.
   */
  get lapDurationsFormatted(): string[] {
    return this.lapDurations.map(formatDuration);
  }

  /**
   * Reset the stopwatch.
   */
  reset(): void {
    this.startTime = null;
    this.stopTime = null;
    this.laps = [];
  }

  /**
   * Check if the stopwatch is running.
   */
  get isRunning(): boolean {
    return this.startTime !== null && this.stopTime === null;
  }
}

/**
 * Measure the execution time of a synchronous function.
 *
 * @param fn - Function to measure
 * @returns Object with result and duration
 */
export function measure<T>(fn: () => T): {
  result: T;
  duration: number;
  formatted: string;
} {
  const start = now();
  const result = fn();
  const duration = now() - start;
  return { result, duration, formatted: formatDuration(duration) };
}

/**
 * Measure the execution time of an async function.
 *
 * @param fn - Async function to measure
 * @returns Promise resolving to object with result and duration
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number; formatted: string }> {
  const start = now();
  const result = await fn();
  const duration = now() - start;
  return { result, duration, formatted: formatDuration(duration) };
}

/**
 * Create a timestamp generator for sequential log entries.
 * Ensures monotonically increasing timestamps even if called
 * multiple times within the same millisecond.
 *
 * @param minIncrement - Minimum increment between timestamps (default: 1 nanoday)
 * @returns Function that returns the next timestamp
 */
export function createTimestampGenerator(
  minIncrement: number = 0.000_000_001,
): () => BrightDateValue {
  let lastTimestamp = -Infinity;

  return (): BrightDateValue => {
    let current = now();
    if (current <= lastTimestamp) {
      current = lastTimestamp + minIncrement;
    }
    lastTimestamp = current;
    return current;
  };
}

/**
 * Format a BrightDate timestamp for use in filenames.
 * Replaces the decimal point with an underscore for filesystem compatibility.
 * Example: "9622_50417"
 *
 * @param brightDate - BrightDate value (default: now)
 * @param precision - Decimal places (default: 5)
 * @returns Filename-safe timestamp string
 */
export function toFilenameTimestamp(
  brightDate?: BrightDateValue,
  precision: Precision = DEFAULT_PRECISION as Precision,
): string {
  const value = brightDate ?? now();
  return format(value, precision).replace('.', '_');
}
