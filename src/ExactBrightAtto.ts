/**
 * ExactBrightAtto
 *
 * Canonical **v2 engine** representation: signed **attoseconds** since J2000.0
 * on the TAI substrate. One tick = one light-attosecond under the Bright
 * Spacetime `c = 1` convention (see Bright Spacetime Standard §2.6).
 *
 * Use {@link ExactBrightDate} (picoseconds) when you prefer that divisor;
 * the class name documents the storage quantum. Convert between them with
 * {@link toExactBrightDate} / {@link ExactBrightDate.toExactBrightAtto}.
 *
 * Presentation as decimal BrightDate days uses integer divmod via
 * {@link brightDateLens} — not float division on the canonical integer.
 *
 * @packageDocumentation
 */

import {
  ATTOSECONDS_PER_DAY,
  ATTOSECONDS_PER_PICOSECOND,
  ATTOSECONDS_PER_SECOND,
  brightDateValueToAttoseconds,
  formatBrightDateFromAttoseconds,
  ticksToBrightDateValue,
} from './brightDateLens';
import { getTaiUtcOffset } from './leapSeconds';
import type { BrightDateValue } from './types';

/** One millisecond is 10^15 attoseconds. */
const AS_PER_MS = ATTOSECONDS_PER_SECOND / 1_000n;
const AS_PER_NS = ATTOSECONDS_PER_SECOND / 1_000_000_000n;
const AS_PER_US = ATTOSECONDS_PER_SECOND / 1_000_000n;

/**
 * J2000.0 as TAI Unix time in attoseconds (946,727,967.816 s). The UTC
 * conversions of BrightSON section 4.4 compute `(s + offset(s)) × 10^18 + f − J`.
 */
const J2000_TAI_UNIX_AS = 946_727_967_816n * AS_PER_MS;

/** Floor division for bigint (rounds toward negative infinity). */
function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}

/**
 * TAI Unix second → UTC Unix second per BrightSON section 4.4: find `s` with
 * `s + offset(s) = t`; otherwise `t` is a leap second and the result is the
 * `23:59:59` second `s` with `t = s + offset(s) + 1`. (BrightDate's
 * `taiToUtcFull` does not flag leap seconds, so the search is done here.)
 */
function taiToUtcSecond(t: number): { utc: number; isLeapSecond: boolean } {
  const lo = getTaiUtcOffset(t - 60);
  const hi = getTaiUtcOffset(t);
  for (let o = lo; o <= hi; o++) {
    if (getTaiUtcOffset(t - o) === o) return { utc: t - o, isLeapSecond: false };
  }
  for (let o = lo; o <= hi; o++) {
    if (getTaiUtcOffset(t - 1 - o) === o) {
      return { utc: t - 1 - o, isLeapSecond: true };
    }
  }
  /* c8 ignore next */
  return { utc: t - hi, isLeapSecond: false };
}

/** UTC Unix second plus a non-negative attosecond fraction → datetime. */
function fromUtcParts(utcSeconds: bigint, fractionAs: bigint): bigint {
  // Applies BrightDate's leap table: pre-1972 offset is 10 s, and after the
  // table's validity the last offset continues (decision S8).
  const offset = BigInt(getTaiUtcOffset(Number(utcSeconds)));
  return (
    (utcSeconds + offset) * ATTOSECONDS_PER_SECOND +
    fractionAs -
    J2000_TAI_UNIX_AS
  );
}

/**
 * Immutable bit-exact time value, stored as attoseconds since J2000.0.
 */
export class ExactBrightAtto {
  /** Raw attosecond count since J2000.0 (canonical storage). */
  public readonly attoseconds: bigint;

  private constructor(attoseconds: bigint) {
    this.attoseconds = attoseconds;
  }

  static fromAttoseconds(attoseconds: bigint): ExactBrightAtto {
    return new ExactBrightAtto(attoseconds);
  }

  static fromUnixMs(unixMs: number | bigint): ExactBrightAtto {
    const ms = typeof unixMs === 'bigint' ? unixMs : BigInt(Math.trunc(unixMs));
    const s = floorDiv(ms, 1000n);
    return new ExactBrightAtto(fromUtcParts(s, (ms - s * 1000n) * AS_PER_MS));
  }

  static fromUnixSeconds(unixSeconds: number | bigint): ExactBrightAtto {
    const s =
      typeof unixSeconds === 'bigint'
        ? unixSeconds
        : BigInt(Math.trunc(unixSeconds));
    return new ExactBrightAtto(fromUtcParts(s, 0n));
  }

  static fromDate(date: Date): ExactBrightAtto {
    if (
      date === null ||
      typeof date !== 'object' ||
      Object.prototype.toString.call(date) !== '[object Date]'
    ) {
      throw new TypeError(
        `ExactBrightAtto.fromDate: expected a Date instance, got ${
          date === null ? 'null' : typeof date
        }`,
      );
    }
    return ExactBrightAtto.fromUnixMs(date.getTime());
  }

  static fromISO(iso: string): ExactBrightAtto {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid ISO 8601 date string: "${iso}"`);
    }
    return ExactBrightAtto.fromDate(d);
  }

  /**
   * Lossy: construct from v1 Float64 decimal days (preserves v1 round-trip
   * semantics for typical widget inputs).
   */
  static fromBrightDateValue(bd: BrightDateValue): ExactBrightAtto {
    return new ExactBrightAtto(brightDateValueToAttoseconds(bd));
  }

  /** Bridge from picosecond engine (`exact.picoseconds`). */
  static fromExactBrightDate(exact: { readonly picoseconds: bigint }): ExactBrightAtto {
    return new ExactBrightAtto(
      exact.picoseconds * ATTOSECONDS_PER_PICOSECOND,
    );
  }

  static epoch(): ExactBrightAtto {
    return new ExactBrightAtto(0n);
  }

  static now(): ExactBrightAtto {
    return ExactBrightAtto.fromUnixMs(Date.now());
  }

  /**
   * TAI second and attosecond fraction → UTC Unix second (leap table applied).
   * A leap-second instant maps to the repeated UTC second (NTP convention,
   * as in {@link BrightInstant}).
   */
  private utcParts(): {
    utcSeconds: bigint;
    fractionAs: bigint;
    isLeapSecond: boolean;
  } {
    const t = this.attoseconds + J2000_TAI_UNIX_AS;
    const taiSeconds = floorDiv(t, ATTOSECONDS_PER_SECOND);
    const conv = taiToUtcSecond(Number(taiSeconds));
    return {
      utcSeconds: BigInt(conv.utc),
      fractionAs: t - taiSeconds * ATTOSECONDS_PER_SECOND,
      isLeapSecond: conv.isLeapSecond,
    };
  }

  toUnixMs(): number {
    return Number(this.toUnixMsBigInt());
  }

  toUnixMsBigInt(): bigint {
    const { utcSeconds, fractionAs } = this.utcParts();
    return utcSeconds * 1000n + fractionAs / AS_PER_MS;
  }

  toUnixSeconds(): number {
    return Number(this.utcParts().utcSeconds);
  }

  toDate(): Date {
    return new Date(this.toUnixMs());
  }

  /** ISO 8601 UTC label with millisecond precision; leap seconds render as `:60`. */
  toISO(): string {
    const { utcSeconds, fractionAs, isLeapSecond } = this.utcParts();
    if (!isLeapSecond) {
      return this.toDate().toISOString();
    }
    const base = new Date(Number(utcSeconds) * 1000).toISOString();
    const ms = (fractionAs / AS_PER_MS).toString().padStart(3, '0');
    return `${base.slice(0, 17)}60.${ms}Z`;
  }

  /** Lossy v1 lens: decimal days via integer divmod on attoseconds. */
  toBrightDateValue(): BrightDateValue {
    return ticksToBrightDateValue(this.attoseconds, ATTOSECONDS_PER_DAY);
  }

  /** Decimal-day string for display (divmod; no float on the canonical integer). */
  toBrightDateString(fractionDigits = 5): string {
    return formatBrightDateFromAttoseconds(this.attoseconds, fractionDigits);
  }

  toExactBrightDate(): import('./ExactBrightDate').ExactBrightDate {
    const { attosecondsToPicoseconds } = require('./brightDateLens') as typeof import('./brightDateLens');
    const { ExactBrightDate } = require('./ExactBrightDate') as typeof import('./ExactBrightDate');
    return ExactBrightDate.fromPicoseconds(
      attosecondsToPicoseconds(this.attoseconds),
    );
  }

  addAttoseconds(as: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + as);
  }

  addNanoseconds(ns: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + ns * AS_PER_NS);
  }

  addMicroseconds(us: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + us * AS_PER_US);
  }

  addMilliseconds(ms: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + ms * AS_PER_MS);
  }

  addSeconds(s: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + s * ATTOSECONDS_PER_SECOND);
  }

  addDays(days: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds + days * ATTOSECONDS_PER_DAY);
  }

  subtractAttoseconds(as: bigint): ExactBrightAtto {
    return new ExactBrightAtto(this.attoseconds - as);
  }

  differenceAttoseconds(other: ExactBrightAtto): bigint {
    return this.attoseconds - other.attoseconds;
  }

  equals(other: ExactBrightAtto): boolean {
    return this.attoseconds === other.attoseconds;
  }

  compareTo(other: ExactBrightAtto): -1 | 0 | 1 {
    if (this.attoseconds < other.attoseconds) return -1;
    if (this.attoseconds > other.attoseconds) return 1;
    return 0;
  }

  isBefore(other: ExactBrightAtto): boolean {
    return this.attoseconds < other.attoseconds;
  }

  isAfter(other: ExactBrightAtto): boolean {
    return this.attoseconds > other.attoseconds;
  }

  /** Wire form: `EBA1:<attoseconds>` */
  encode(): string {
    return `EBA1:${this.attoseconds.toString()}`;
  }

  static decode(encoded: string): ExactBrightAtto {
    if (!encoded.startsWith('EBA1:')) {
      throw new Error(
        `Invalid ExactBrightAtto encoding: must start with "EBA1:", got "${encoded}"`,
      );
    }
    const body = encoded.substring(5);
    try {
      return new ExactBrightAtto(BigInt(body));
    } catch {
      throw new Error(
        `Invalid ExactBrightAtto encoding: "${body}" is not a valid BigInt`,
      );
    }
  }

  /** 16-byte big-endian two's-complement signed i128 (interop with Rust). */
  toBinary(): ArrayBuffer {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    const MASK_64 = (1n << 64n) - 1n;
    let v = this.attoseconds;
    if (v < 0n) v += 1n << 128n;
    const high = (v >> 64n) & MASK_64;
    const low = v & MASK_64;
    view.setBigUint64(0, high, false);
    view.setBigUint64(8, low, false);
    return buffer;
  }

  static fromBinary(buffer: ArrayBuffer): ExactBrightAtto {
    if (buffer.byteLength < 16) {
      throw new Error('Buffer too small: need at least 16 bytes');
    }
    const view = new DataView(buffer);
    const high = view.getBigUint64(0, false);
    const low = view.getBigUint64(8, false);
    let v = (high << 64n) | low;
    if (v >= 1n << 127n) {
      v -= 1n << 128n;
    }
    return new ExactBrightAtto(v);
  }

  toString(): string {
    return `${this.attoseconds.toString()}as`;
  }

  toJSON(): string {
    return this.attoseconds.toString();
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `ExactBrightAtto(${this.attoseconds}as)`;
  }
}

/** Re-export day length in attoseconds for spacetime / wire codecs. */
export const EXACT_BRIGHT_ATTO_SECONDS_PER_DAY = ATTOSECONDS_PER_DAY;
