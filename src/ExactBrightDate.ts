/**
 * ExactBrightDate
 *
 * A bit-exact BigInt-based companion to {@link BrightDate}.
 *
 * Whereas {@link BrightDate} uses IEEE 754 Float64 (decimal days since J2000.0)
 * for ergonomic math and astronomy, `ExactBrightDate` uses a signed BigInt
 * of **picoseconds since J2000.0** to provide bit-for-bit round-trip fidelity
 * with Unix milliseconds, Unix seconds, and other integer-based representations.
 *
 * ## When to use which
 *
 * | Use case                                            | Choose              |
 * | --------------------------------------------------- | ------------------- |
 * | Application timestamps, logs, scheduling, display   | `BrightDate`        |
 * | Astronomy, physics, fractional math                 | `BrightDate`        |
 * | Blockchain consensus on raw Unix-ms values          | `ExactBrightDate`   |
 * | Long-term archival that must survive bit-for-bit    | `ExactBrightDate`   |
 * | Sub-picosecond precision at any magnitude           | `ExactBrightDate`   |
 *
 * ## Precision
 *
 * Internal unit: **picoseconds** (1e-12 s).
 * Range: ±2^63 picoseconds ≈ ±292 years around J2000.0, or much more with
 * BigInt's arbitrary precision. In practice the range is limited only by
 * what the consuming system can store.
 *
 * Resolution: 1 picosecond. One BigInt "tick" = 1 ps.
 *
 * ## Algebraic laws
 *
 * For any integer `unixMs`:
 *   ExactBrightDate.fromUnixMs(unixMs).toUnixMs() === unixMs   (bit-exact)
 *
 * For any `a: ExactBrightDate` and `b: bigint` (nanoseconds):
 *   a.addNanoseconds(b).subtractNanoseconds(b).equals(a)       (bit-exact)
 *
 * ExactBrightDate is immutable. All operations return new instances.
 */

import { J2000_UNIX_MS_UTC, MS_PER_DAY } from './constants';

/** Picoseconds per millisecond */
const PS_PER_MS = 1_000_000_000n;

/** Picoseconds per second */
const PS_PER_S = 1_000_000_000_000n;

/** Picoseconds per nanosecond */
const PS_PER_NS = 1_000n;

/** Picoseconds per microsecond */
const PS_PER_US = 1_000_000n;

/** Picoseconds per day (86_400_000_000_000_000) */
const PS_PER_DAY = BigInt(MS_PER_DAY) * PS_PER_MS;

/** J2000.0 expressed in Unix picoseconds (UTC) */
const J2000_UNIX_PS = BigInt(J2000_UNIX_MS_UTC) * PS_PER_MS;

/**
 * Immutable bit-exact time value, stored as picoseconds since J2000.0.
 *
 * Internal representation: a signed BigInt. Positive values are after
 * 2000-01-01T12:00:00Z; negative before.
 */
export class ExactBrightDate {
  /** The raw picosecond count since J2000.0 */
  public readonly picoseconds: bigint;

  private constructor(picoseconds: bigint) {
    this.picoseconds = picoseconds;
  }

  // ─── Static factories ────────────────────────────────────────────────

  /** Create from raw picoseconds since J2000.0 */
  static fromPicoseconds(picoseconds: bigint): ExactBrightDate {
    return new ExactBrightDate(picoseconds);
  }

  /** Create from Unix milliseconds (bit-exact) */
  static fromUnixMs(unixMs: number | bigint): ExactBrightDate {
    const ms = typeof unixMs === 'bigint' ? unixMs : BigInt(Math.trunc(unixMs));
    return new ExactBrightDate((ms - BigInt(J2000_UNIX_MS_UTC)) * PS_PER_MS);
  }

  /** Create from Unix seconds (integer; bit-exact) */
  static fromUnixSeconds(unixSeconds: number | bigint): ExactBrightDate {
    const s =
      typeof unixSeconds === 'bigint'
        ? unixSeconds
        : BigInt(Math.trunc(unixSeconds));
    return new ExactBrightDate(s * PS_PER_S - J2000_UNIX_PS);
  }

  /**
   * Create from a JavaScript Date (ms precision).
   *
   * Cross-realm safe: uses `Object.prototype.toString.call(date)` rather
   * than `instanceof Date`, so Dates that cross VM realm boundaries
   * (Jest custom environments, vm.runInContext, worker threads) are still
   * accepted.
   */
  static fromDate(date: Date): ExactBrightDate {
    if (
      date === null ||
      typeof date !== 'object' ||
      Object.prototype.toString.call(date) !== '[object Date]'
    ) {
      throw new TypeError(
        `ExactBrightDate.fromDate: expected a Date instance, got ${
          date === null ? 'null' : typeof date
        }`,
      );
    }
    return ExactBrightDate.fromUnixMs(date.getTime());
  }

  /** Create from an ISO 8601 string (ms precision via Date) */
  static fromISO(iso: string): ExactBrightDate {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid ISO 8601 date string: "${iso}"`);
    }
    return ExactBrightDate.fromDate(d);
  }

  /** J2000.0 epoch (picoseconds = 0) */
  static epoch(): ExactBrightDate {
    return new ExactBrightDate(0n);
  }

  /** Current time (ms resolution, exact to that limit) */
  static now(): ExactBrightDate {
    return ExactBrightDate.fromUnixMs(Date.now());
  }

  // ─── Conversion methods (lossy to Number) ────────────────────────────

  /**
   * Convert to Unix milliseconds (bit-exact for values created from integer ms).
   * Truncates any sub-millisecond picoseconds.
   *
   * The returned Number is exact for |unixMs| ≤ Number.MAX_SAFE_INTEGER
   * (covers years ~-285616 through +287396).
   */
  toUnixMs(): number {
    const ms = this.picoseconds / PS_PER_MS + BigInt(J2000_UNIX_MS_UTC);
    return Number(ms);
  }

  /** Convert to Unix milliseconds as BigInt (always exact) */
  toUnixMsBigInt(): bigint {
    return this.picoseconds / PS_PER_MS + BigInt(J2000_UNIX_MS_UTC);
  }

  /**
   * Convert to Unix seconds. Truncates any sub-second picoseconds.
   */
  toUnixSeconds(): number {
    return Number((this.picoseconds + J2000_UNIX_PS) / PS_PER_S);
  }

  /**
   * Convert to a JavaScript Date (millisecond precision; picoseconds truncated).
   */
  toDate(): Date {
    return new Date(this.toUnixMs());
  }

  /**
   * Convert to ISO 8601 string (millisecond precision).
   */
  toISO(): string {
    return this.toDate().toISOString();
  }

  /**
   * Convert to the Float64 BrightDate value (decimal days since J2000.0).
   * This conversion is lossy for sub-microsecond precision at current-era
   * magnitudes; use {@link toBrightDateValueBits} for a bit-preserving bridge
   * only when you need it.
   */
  toBrightDateValue(): number {
    // Split into integer days and remainder to minimize Float64 rounding
    const days = this.picoseconds / PS_PER_DAY;
    const remainderPs = this.picoseconds % PS_PER_DAY;
    return Number(days) + Number(remainderPs) / Number(PS_PER_DAY);
  }

  // ─── Arithmetic (all return new instances) ───────────────────────────

  /** Add an integer number of picoseconds */
  addPicoseconds(ps: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + ps);
  }

  /** Add an integer number of nanoseconds */
  addNanoseconds(ns: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + ns * PS_PER_NS);
  }

  /** Add an integer number of microseconds */
  addMicroseconds(us: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + us * PS_PER_US);
  }

  /** Add an integer number of milliseconds */
  addMilliseconds(ms: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + ms * PS_PER_MS);
  }

  /** Add an integer number of seconds */
  addSeconds(s: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + s * PS_PER_S);
  }

  /** Add an integer number of days */
  addDays(days: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds + days * PS_PER_DAY);
  }

  /** Subtract picoseconds */
  subtractPicoseconds(ps: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds - ps);
  }

  /** Subtract nanoseconds */
  subtractNanoseconds(ns: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds - ns * PS_PER_NS);
  }

  /** Subtract milliseconds */
  subtractMilliseconds(ms: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds - ms * PS_PER_MS);
  }

  /** Subtract days */
  subtractDays(days: bigint): ExactBrightDate {
    return new ExactBrightDate(this.picoseconds - days * PS_PER_DAY);
  }

  /**
   * Difference in picoseconds (this - other), as a signed BigInt.
   */
  differencePicoseconds(other: ExactBrightDate): bigint {
    return this.picoseconds - other.picoseconds;
  }

  /**
   * Difference in nanoseconds (truncated toward zero).
   */
  differenceNanoseconds(other: ExactBrightDate): bigint {
    return (this.picoseconds - other.picoseconds) / PS_PER_NS;
  }

  /**
   * Difference in microseconds (truncated toward zero).
   */
  differenceMicroseconds(other: ExactBrightDate): bigint {
    return (this.picoseconds - other.picoseconds) / PS_PER_US;
  }

  /**
   * Difference in milliseconds (truncated toward zero).
   */
  differenceMilliseconds(other: ExactBrightDate): bigint {
    return (this.picoseconds - other.picoseconds) / PS_PER_MS;
  }

  /**
   * Difference in seconds (truncated toward zero).
   */
  differenceSeconds(other: ExactBrightDate): bigint {
    return (this.picoseconds - other.picoseconds) / PS_PER_S;
  }

  // ─── Comparison ──────────────────────────────────────────────────────

  /** Strict bit-exact equality */
  equals(other: ExactBrightDate): boolean {
    return this.picoseconds === other.picoseconds;
  }

  /** Comparator returning -1, 0, or 1 */
  compareTo(other: ExactBrightDate): -1 | 0 | 1 {
    if (this.picoseconds < other.picoseconds) return -1;
    if (this.picoseconds > other.picoseconds) return 1;
    return 0;
  }

  isBefore(other: ExactBrightDate): boolean {
    return this.picoseconds < other.picoseconds;
  }

  isAfter(other: ExactBrightDate): boolean {
    return this.picoseconds > other.picoseconds;
  }

  // ─── Serialization ───────────────────────────────────────────────────

  /**
   * Encode as a compact string suitable for URLs/headers.
   * Format: "EBD1:<picoseconds>"
   */
  encode(): string {
    return `EBD1:${this.picoseconds.toString()}`;
  }

  /**
   * Decode from the encoded string format.
   */
  static decode(encoded: string): ExactBrightDate {
    if (!encoded.startsWith('EBD1:')) {
      throw new Error(
        `Invalid ExactBrightDate encoding: must start with "EBD1:", got "${encoded}"`,
      );
    }
    const body = encoded.substring(5);
    try {
      return new ExactBrightDate(BigInt(body));
    } catch {
      throw new Error(
        `Invalid ExactBrightDate encoding: "${body}" is not a valid BigInt`,
      );
    }
  }

  /**
   * Convert to a 16-byte big-endian two's-complement binary representation.
   * Signed 128-bit integer; covers ±~5.39e27 picoseconds ≈ ±1.7 billion
   * millennia, well beyond any realistic use.
   */
  toBinary(): ArrayBuffer {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    // Split into high and low 64-bit halves
    const MASK_64 = (1n << 64n) - 1n;
    let v = this.picoseconds;
    // Two's complement for negatives
    if (v < 0n) v += 1n << 128n;
    const high = (v >> 64n) & MASK_64;
    const low = v & MASK_64;
    view.setBigUint64(0, high, false);
    view.setBigUint64(8, low, false);
    return buffer;
  }

  /**
   * Read from a 16-byte big-endian two's-complement binary representation.
   */
  static fromBinary(buffer: ArrayBuffer): ExactBrightDate {
    if (buffer.byteLength < 16) {
      throw new Error('Buffer too small: need at least 16 bytes');
    }
    const view = new DataView(buffer);
    const high = view.getBigUint64(0, false);
    const low = view.getBigUint64(8, false);
    let v = (high << 64n) | low;
    // Interpret as signed 128-bit
    if (v >= 1n << 127n) {
      v -= 1n << 128n;
    }
    return new ExactBrightDate(v);
  }

  // ─── Display ─────────────────────────────────────────────────────────

  /**
   * String representation: the picosecond count, suitable for debugging.
   */
  toString(): string {
    return this.picoseconds.toString();
  }

  /**
   * JSON serialization (picosecond count as a string to preserve precision).
   */
  toJSON(): string {
    return this.picoseconds.toString();
  }

  /** Custom inspection for Node.js console.log */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `ExactBrightDate(${this.picoseconds}ps)`;
  }
}
