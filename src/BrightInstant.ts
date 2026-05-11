/**
 * `BrightInstant` — an *exact*, lossless time representation.
 *
 * A {@link BrightDate} value is a `number` (f64) count of SI days since
 * J2000.0. That's beautifully simple — and beautifully imprecise far from the
 * epoch. By year ~2300 the f64 mantissa cannot resolve milliseconds. For
 * applications that need **nanosecond precision indefinitely** — distributed
 * systems, GPS engineering, interplanetary mission timing — `BrightInstant` is
 * the rigorous foundation.
 *
 * ## Representation
 *
 * A `BrightInstant` stores two integers:
 * ```
 *   taiSeconds : bigint   seconds since J2000.0 on the TAI timescale
 *   taiNanos   : number   nanoseconds within that second, [0, 1_000_000_000)
 * ```
 *
 * Because the substrate is TAI (uniform), arithmetic is trivially
 * associative — there are no leap seconds to hop over. Leap seconds appear
 * only when converting to/from UTC labels (`toUnixMs`, `toISO`).
 *
 * ## Range and precision
 * - **Range:** BigInt seconds → effectively unlimited.
 * - **Precision:** 1 nanosecond, exactly, everywhere. No f64 drift.
 *
 * ## Relationship to `BrightDate`
 * `BrightInstant` is the rigorous form; `BrightDate` (number) is the ergonomic
 * form. Both anchor on the same instant (J2000.0). Conversion is lossy in one
 * direction (Instant → BrightDate loses nanos past the f64 mantissa) and
 * lossless in the other for the supported f64 range.
 */

import {
  J2000_JD,
  J2000_MJD,
  J2000_TAI_UNIX_S,
  SECONDS_PER_DAY,
} from "./constants";
import { getTaiUtcOffset, taiToUtcFull } from "./leapSeconds";

const NANOS_PER_SEC = 1_000_000_000;
const NANOS_PER_SEC_BIG = BigInt(NANOS_PER_SEC);

/**
 * J2000.0 expressed as integer TAI Unix seconds + nanoseconds.
 * J2000_TAI_UNIX_S = 946_727_967.816 s exactly (816 ms = 816_000_000 ns).
 */
const J2000_TAI_UNIX_S_INT = 946_727_967n;
const J2000_TAI_UNIX_NS = 816_000_000; // number, [0, 1e9)

/**
 * An exact instant on the TAI timescale, anchored at J2000.0.
 *
 * @example
 * ```ts
 * import { BrightInstant } from '@brightchain/brightdate';
 *
 * // J2000.0 itself
 * const epoch = BrightInstant.J2000;
 * epoch.taiSecondsSinceJ2000; // 0n
 * epoch.taiNanos;              // 0
 *
 * // One SI day later, with a 1-ns sub-second component
 * const later = BrightInstant.fromTaiComponents(86_400n, 1);
 * later.taiSecondsSinceJ2000; // 86_400n
 * later.taiNanos;              // 1
 * ```
 */
export class BrightInstant {
  /** TAI seconds since J2000.0. Negative for instants before J2000.0. */
  readonly taiSecondsSinceJ2000: bigint;
  /** Nanoseconds within the current TAI second. Always in [0, 1_000_000_000). */
  readonly taiNanos: number;

  private constructor(taiSeconds: bigint, taiNanos: number) {
    this.taiSecondsSinceJ2000 = taiSeconds;
    this.taiNanos = taiNanos;
  }

  // ── Static epoch ───────────────────────────────────────────────────────

  /** The J2000.0 epoch itself: BrightInstant = 0. */
  static readonly J2000 = new BrightInstant(0n, 0);

  // ── Constructors ──────────────────────────────────────────────────────

  /**
   * Construct from TAI seconds and nanoseconds since J2000.0.
   * @throws if `taiNanos` is outside [0, 1_000_000_000).
   */
  static fromTaiComponents(
    taiSeconds: bigint,
    taiNanos: number,
  ): BrightInstant {
    if (
      !Number.isInteger(taiNanos) ||
      taiNanos < 0 ||
      taiNanos >= NANOS_PER_SEC
    ) {
      throw new RangeError(
        `taiNanos must be an integer in [0, 1_000_000_000), got ${taiNanos}`,
      );
    }
    return new BrightInstant(taiSeconds, taiNanos);
  }

  /**
   * Construct from a BrightDate value (number, decimal days since J2000.0).
   * Precision is bounded by f64.
   * @throws if `bd` is not finite.
   */
  static fromBrightDate(bd: number): BrightInstant {
    if (!Number.isFinite(bd)) {
      throw new RangeError(`expected finite BrightDate, got ${bd}`);
    }
    const totalSeconds = bd * SECONDS_PER_DAY;
    const secsFloor = Math.floor(totalSeconds);
    const frac = totalSeconds - secsFloor;
    // Round nanos to keep round-trips faithful.
    let nanos = Math.round(frac * NANOS_PER_SEC);
    let secs = BigInt(secsFloor);
    // Carry: rounding can push nanos to exactly 1e9.
    if (nanos >= NANOS_PER_SEC) {
      nanos -= NANOS_PER_SEC;
      secs += 1n;
    } else if (nanos < 0) {
      nanos += NANOS_PER_SEC;
      secs -= 1n;
    }
    return new BrightInstant(secs, nanos);
  }

  /**
   * Construct from a Unix millisecond timestamp (UTC label).
   * Applies the leap-second table to obtain the TAI instant.
   */
  static fromUnixMs(ms: number): BrightInstant {
    // Decompose into UTC seconds + ms-within-second (Euclidean, handles negatives).
    const utcSeconds = Math.floor(ms / 1000);
    const utcMsWithin = ((ms % 1000) + 1000) % 1000; // always [0, 1000)
    const offset = getTaiUtcOffset(utcSeconds);
    const taiUnixS = BigInt(utcSeconds + offset);
    // Anchor at J2000.0
    let secs = taiUnixS - J2000_TAI_UNIX_S_INT;
    // Sub-second: input ms-within-second minus J2000.0's 816ms nano offset
    let nanosRaw = utcMsWithin * 1_000_000 - J2000_TAI_UNIX_NS;
    if (nanosRaw < 0) {
      secs -= 1n;
      nanosRaw += NANOS_PER_SEC;
    }
    return new BrightInstant(secs, nanosRaw);
  }

  /**
   * Construct from a Julian Date (TT). Exact up to f64 mantissa.
   */
  static fromJulianDate(jd: number): BrightInstant {
    return BrightInstant.fromBrightDate(jd - J2000_JD);
  }

  /**
   * Construct from a Modified Julian Date (TT). Exact up to f64 mantissa.
   */
  static fromModifiedJulianDate(mjd: number): BrightInstant {
    return BrightInstant.fromBrightDate(mjd - J2000_MJD);
  }

  // ── Conversions out ───────────────────────────────────────────────────

  /**
   * Lossy projection to f64 BrightDate (decimal days since J2000.0).
   */
  toBrightDate(): number {
    return (
      (Number(this.taiSecondsSinceJ2000) + this.taiNanos / NANOS_PER_SEC) /
      SECONDS_PER_DAY
    );
  }

  /**
   * Convert to Unix milliseconds (UTC label). Applies the leap-second table.
   * Leap-second instants map to the repeated UTC second (NTP convention).
   */
  toUnixMs(): number {
    // TAI Unix s = J2000_TAI_UNIX_S_INT + taiSeconds (plus carry from nanos)
    let taiUnixS = J2000_TAI_UNIX_S_INT + this.taiSecondsSinceJ2000;
    let taiNs = this.taiNanos + J2000_TAI_UNIX_NS;
    if (taiNs >= NANOS_PER_SEC) {
      taiNs -= NANOS_PER_SEC;
      taiUnixS += 1n;
    }
    const conv = taiToUtcFull(Number(taiUnixS));
    // Sub-second part is unaffected by the leap-second offset.
    return conv.utcUnixSeconds * 1000 + Math.floor(taiNs / 1_000_000);
  }

  /**
   * Convert to a JavaScript `Date` (millisecond precision).
   */
  toDate(): Date {
    return new Date(this.toUnixMs());
  }

  /**
   * Convert to a Julian Date (TT). Exact up to f64 mantissa.
   */
  toJulianDate(): number {
    return this.toBrightDate() + J2000_JD;
  }

  /**
   * Convert to a Modified Julian Date (TT). Exact up to f64 mantissa.
   */
  toModifiedJulianDate(): number {
    return this.toBrightDate() + J2000_MJD;
  }

  /**
   * Render as ISO 8601 with millisecond precision.
   * Leap seconds emit `:60`, e.g. `1998-12-31T23:59:60.000Z`.
   */
  toISO(): string {
    let taiUnixS = J2000_TAI_UNIX_S_INT + this.taiSecondsSinceJ2000;
    let taiNs = this.taiNanos + J2000_TAI_UNIX_NS;
    if (taiNs >= NANOS_PER_SEC) {
      taiNs -= NANOS_PER_SEC;
      taiUnixS += 1n;
    }
    const conv = taiToUtcFull(Number(taiUnixS));
    const millis = Math.floor(taiNs / 1_000_000);

    if (conv.isLeapSecond) {
      // Render the repeated second with :60 notation.
      const d = new Date(conv.utcUnixSeconds * 1000);
      const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
      const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
      const dd = d.getUTCDate().toString().padStart(2, "0");
      const hh = d.getUTCHours().toString().padStart(2, "0");
      const mn = d.getUTCMinutes().toString().padStart(2, "0");
      const ms = Math.min(millis, 999).toString().padStart(3, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${mn}:60.${ms}Z`;
    }

    const d = new Date(conv.utcUnixSeconds * 1000 + millis);
    return d.toISOString();
  }

  // ── Arithmetic ────────────────────────────────────────────────────────

  /**
   * Add a duration in nanoseconds (bigint) to this instant.
   */
  addNanos(nanos: bigint): BrightInstant {
    const totalNanos = BigInt(this.taiNanos) + nanos;
    // Euclidean division to keep taiNanos in [0, NANOS_PER_SEC).
    const extraSecs =
      totalNanos / NANOS_PER_SEC_BIG -
      (totalNanos % NANOS_PER_SEC_BIG < 0n ? 1n : 0n);
    // Use proper Euclidean remainder (always non-negative).
    let newNanos = Number(totalNanos % NANOS_PER_SEC_BIG);
    if (newNanos < 0) newNanos += NANOS_PER_SEC;
    return new BrightInstant(this.taiSecondsSinceJ2000 + extraSecs, newNanos);
  }

  /**
   * Add whole SI seconds (TAI) to this instant.
   */
  addSeconds(seconds: bigint): BrightInstant {
    return new BrightInstant(
      this.taiSecondsSinceJ2000 + seconds,
      this.taiNanos,
    );
  }

  /**
   * Signed difference between this instant and `earlier`, in nanoseconds (bigint).
   * Positive when `this` is later.
   */
  nanosSince(earlier: BrightInstant): bigint {
    const ds = this.taiSecondsSinceJ2000 - earlier.taiSecondsSinceJ2000;
    const dn = BigInt(this.taiNanos) - BigInt(earlier.taiNanos);
    return ds * NANOS_PER_SEC_BIG + dn;
  }

  /**
   * Signed difference between this instant and `earlier`, in SI seconds (number).
   * Positive when `this` is later.
   */
  secondsSince(earlier: BrightInstant): number {
    const ds = Number(this.taiSecondsSinceJ2000 - earlier.taiSecondsSinceJ2000);
    const dn = (this.taiNanos - earlier.taiNanos) / NANOS_PER_SEC;
    return ds + dn;
  }

  // ── Comparison ────────────────────────────────────────────────────────

  /** Returns true if this instant is strictly before `other`. */
  isBefore(other: BrightInstant): boolean {
    return (
      this.taiSecondsSinceJ2000 < other.taiSecondsSinceJ2000 ||
      (this.taiSecondsSinceJ2000 === other.taiSecondsSinceJ2000 &&
        this.taiNanos < other.taiNanos)
    );
  }

  /** Returns true if this instant is strictly after `other`. */
  isAfter(other: BrightInstant): boolean {
    return other.isBefore(this);
  }

  /** Returns true if this instant represents the same point in time as `other`. */
  equals(other: BrightInstant): boolean {
    return (
      this.taiSecondsSinceJ2000 === other.taiSecondsSinceJ2000 &&
      this.taiNanos === other.taiNanos
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /**
   * The sub-second nano offset of the J2000.0 TAI anchor.
   * Equal to 816_000_000 (i.e. 0.816 s — the 816-ms fractional part of
   * `J2000_TAI_UNIX_S = 946_727_967.816`).
   */
  static readonly J2000_TAI_FRACT_NS = J2000_TAI_UNIX_NS;
}

// Sanity-check the integer/fractional split of J2000_TAI_UNIX_S.
// 946_727_967.816 = 946_727_967 + 816_000_000 * 1e-9  ✓
const _J2000_SANITY = Math.abs(
  J2000_TAI_UNIX_S - (946_727_967 + 816_000_000 / NANOS_PER_SEC),
);
if (_J2000_SANITY > 1e-9) {
  throw new Error(
    `BrightInstant: J2000_TAI_UNIX_S constant mismatch (delta=${_J2000_SANITY})`,
  );
}
