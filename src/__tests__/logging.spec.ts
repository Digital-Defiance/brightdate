/**
 * Tests for BrightDate logging utilities.
 */

import {
  BrightDateStopwatch,
  createLogEntry,
  createTimestampGenerator,
  formatLogEntry,
  measure,
  measureAsync,
  toFilenameTimestamp,
} from '../logging';

describe('logging', () => {
  // ─── createLogEntry ──────────────────────────────────────────────────────

  describe('createLogEntry', () => {
    it('creates a log entry with the correct level', () => {
      const entry = createLogEntry('info', 'test message');
      expect(entry.level).toBe('info');
    });

    it('creates a log entry with the correct message', () => {
      const entry = createLogEntry('warn', 'something happened');
      expect(entry.message).toBe('something happened');
    });

    it('timestamp is a finite number', () => {
      const entry = createLogEntry('debug', 'test');
      expect(isFinite(entry.timestamp)).toBe(true);
    });

    it('timestampStr is a formatted string', () => {
      const entry = createLogEntry('error', 'test');
      expect(typeof entry.timestampStr).toBe('string');
      expect(entry.timestampStr).toContain('.');
    });

    it('includes optional data', () => {
      const data = { key: 'value', count: 42 };
      const entry = createLogEntry('info', 'test', data);
      expect(entry.data).toEqual(data);
    });

    it('includes optional source', () => {
      const entry = createLogEntry('info', 'test', undefined, 'my-module');
      expect(entry.source).toBe('my-module');
    });

    it('data and source are undefined when not provided', () => {
      const entry = createLogEntry('info', 'test');
      expect(entry.data).toBeUndefined();
      expect(entry.source).toBeUndefined();
    });

    it('supports all log levels', () => {
      const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
      for (const level of levels) {
        const entry = createLogEntry(level, 'test');
        expect(entry.level).toBe(level);
      }
    });
  });

  // ─── formatLogEntry ──────────────────────────────────────────────────────

  describe('formatLogEntry', () => {
    it('includes the timestamp in brackets', () => {
      const entry = createLogEntry('info', 'test');
      const formatted = formatLogEntry(entry);
      expect(formatted).toMatch(/^\[[\d.]+\]/);
    });

    it('includes the log level in uppercase', () => {
      const entry = createLogEntry('warn', 'test');
      const formatted = formatLogEntry(entry);
      expect(formatted).toContain('WARN');
    });

    it('includes the message', () => {
      const entry = createLogEntry('info', 'my message');
      const formatted = formatLogEntry(entry);
      expect(formatted).toContain('my message');
    });

    it('includes the source when present', () => {
      const entry = createLogEntry('info', 'test', undefined, 'my-module');
      const formatted = formatLogEntry(entry);
      expect(formatted).toContain('my-module:');
    });

    it('includes JSON data when present', () => {
      const entry = createLogEntry('info', 'test', { count: 42 });
      const formatted = formatLogEntry(entry);
      expect(formatted).toContain('"count":42');
    });

    it('does not append JSON data section when data is empty', () => {
      const withData = formatLogEntry(
        createLogEntry('info', 'test', { key: 'value' }),
      );
      const withoutData = formatLogEntry(createLogEntry('info', 'test', {}));
      const noDataAtAll = formatLogEntry(createLogEntry('info', 'test'));
      // withData contains a JSON object; the other two do not
      expect(withData).toContain('"key":"value"');
      // Neither an empty data object nor undefined data appends JSON
      expect(withoutData).not.toContain('"');
      expect(noDataAtAll).not.toContain('"');
    });
  });

  // ─── BrightDateStopwatch ─────────────────────────────────────────────────

  describe('BrightDateStopwatch', () => {
    let sw: BrightDateStopwatch;

    beforeEach(() => {
      sw = new BrightDateStopwatch();
    });

    describe('start / stop / elapsed', () => {
      it('is not running before start', () => {
        expect(sw.isRunning).toBe(false);
      });

      it('is running after start', () => {
        sw.start();
        expect(sw.isRunning).toBe(true);
        sw.stop();
      });

      it('is not running after stop', () => {
        sw.start();
        sw.stop();
        expect(sw.isRunning).toBe(false);
      });

      it('elapsed is non-negative after stop', () => {
        sw.start();
        sw.stop();
        expect(sw.elapsed).toBeGreaterThanOrEqual(0);
      });

      it('elapsed increases over time', async () => {
        sw.start();
        const e1 = sw.elapsed;
        await new Promise((r) => setTimeout(r, 10));
        const e2 = sw.elapsed;
        expect(e2).toBeGreaterThan(e1);
        sw.stop();
      });
    });

    describe('stop errors', () => {
      it('throws when stop called without start', () => {
        expect(() => sw.stop()).toThrow('Stopwatch not started');
      });
    });

    describe('lap', () => {
      it('throws when lap called without start', () => {
        expect(() => sw.lap()).toThrow('Stopwatch not started');
      });

      it('records lap durations', () => {
        sw.start();
        sw.lap();
        sw.lap();
        sw.stop();
        expect(sw.lapDurations).toHaveLength(2);
      });

      it('lap durations are non-negative', () => {
        sw.start();
        sw.lap();
        sw.stop();
        for (const d of sw.lapDurations) {
          expect(d).toBeGreaterThanOrEqual(0);
        }
      });

      it('lapDurationsFormatted returns strings', () => {
        sw.start();
        sw.lap();
        sw.stop();
        for (const s of sw.lapDurationsFormatted) {
          expect(typeof s).toBe('string');
        }
      });
    });

    describe('reset', () => {
      it('resets to initial state', () => {
        sw.start();
        sw.stop();
        sw.reset();
        expect(sw.isRunning).toBe(false);
        expect(() => sw.elapsed).toThrow('Stopwatch not started');
      });
    });

    describe('elapsedFormatted', () => {
      it('returns a string', () => {
        sw.start();
        sw.stop();
        expect(typeof sw.elapsedFormatted).toBe('string');
      });
    });
  });

  // ─── measure ─────────────────────────────────────────────────────────────

  describe('measure', () => {
    it('returns the function result', () => {
      const { result } = measure(() => 42);
      expect(result).toBe(42);
    });

    it('returns a non-negative duration', () => {
      const { duration } = measure(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('returns a formatted string', () => {
      const { formatted } = measure(() => null);
      expect(typeof formatted).toBe('string');
    });
  });

  // ─── measureAsync ────────────────────────────────────────────────────────

  describe('measureAsync', () => {
    it('returns the async function result', async () => {
      const { result } = await measureAsync(async () => 'hello');
      expect(result).toBe('hello');
    });

    it('returns a non-negative duration', async () => {
      const { duration } = await measureAsync(
        () => new Promise((r) => setTimeout(r, 5)),
      );
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('returns a formatted string', async () => {
      const { formatted } = await measureAsync(async () => null);
      expect(typeof formatted).toBe('string');
    });
  });

  // ─── createTimestampGenerator ────────────────────────────────────────────

  describe('createTimestampGenerator', () => {
    it('returns a function', () => {
      expect(typeof createTimestampGenerator()).toBe('function');
    });

    it('generates monotonically increasing timestamps', () => {
      const gen = createTimestampGenerator();
      const timestamps = Array.from({ length: 100 }, () => gen());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });

    it('each timestamp is a finite number', () => {
      const gen = createTimestampGenerator();
      for (let i = 0; i < 10; i++) {
        expect(isFinite(gen())).toBe(true);
      }
    });

    it('respects custom minimum increment', () => {
      // Use a LARGE increment (1 day) that exceeds real wall-clock advance
      // between successive now() calls. This forces the generator to fall
      // back to `lastTimestamp + minIncrement` rather than wall-clock time,
      // which is the only way to actually verify the custom increment.
      const minIncrement = 1; // 1 day
      const gen = createTimestampGenerator(minIncrement);
      const t1 = gen();
      const t2 = gen();
      const t3 = gen();
      // Successive calls happen within microseconds of wall-clock time, so
      // each must be at least `minIncrement` ahead of the previous.
      expect(t2 - t1).toBeGreaterThanOrEqual(minIncrement);
      expect(t3 - t2).toBeGreaterThanOrEqual(minIncrement);
    });
  });

  // ─── toFilenameTimestamp ─────────────────────────────────────────────────

  describe('toFilenameTimestamp', () => {
    it('replaces decimal point with underscore', () => {
      const result = toFilenameTimestamp(9622.50417);
      expect(result).toContain('_');
      expect(result).not.toContain('.');
    });

    it('produces a filesystem-safe string', () => {
      const result = toFilenameTimestamp(9622.50417);
      expect(result).toMatch(/^[\d_-]+$/);
    });

    it('uses current time when no value provided', () => {
      const result = toFilenameTimestamp();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('uses specified precision', () => {
      const result = toFilenameTimestamp(9622.50417, 3);
      // "9622.504" → "9622_504"
      expect(result).toBe('9622_504');
    });
  });
});
