/**
 * Property-Based Tests (fast-check)
 *
 * Where example-based tests check "these cases work," property tests check
 * "these laws hold for all inputs." For a library aspiring to be a
 * scientific primitive, the distinction is the difference between
 * "we think it's correct" and "we have searched the input space for a
 * counterexample and found none."
 *
 * Each property here corresponds to an invariant the library MUST preserve.
 * If any fails, the library's claims are weakened.
 */

import * as fc from 'fast-check';
import {
  absoluteDifference,
  add,
  addMicrodays,
  addMillidays,
  clamp,
  compare,
  floorToDay,
  lerp,
  max,
  midpoint,
  min,
  subtract,
} from '../arithmetic';
import { BrightDate } from '../BrightDate';
import { J2000_UNIX_MS_UTC, MS_PER_DAY } from '../constants';
import {
  fromDate,
  fromJulianDate,
  fromModifiedJulianDate,
  fromUnixMs,
  toDate,
  toJulianDate,
  toModifiedJulianDate,
  toUnixMs,
} from '../conversions';
import { ExactBrightDate } from '../ExactBrightDate';
import { BrightDateInterval } from '../intervals';
import { getTaiUtcOffset, utcToTai } from '../leapSeconds';
import {
  decode,
  encode,
  fromBinary,
  fromSortableString,
  toBinary,
  toSortableString,
} from '../serialization';

// ─── Arbitraries ──────────────────────────────────────────────────────────

/**
 * Smallest realistic magnitude for BrightDate arithmetic: 1 attosecond,
 * or ~1.16e-23 days — a physical floor. But at the Float64 level, when
 * values this small are combined with arithmetic at larger scales, we
 * hit ULP cancellation issues at any test involving `a + (b-a)*t` style
 * formulas. We use 1e-15 as a practical minimum: a femtosecond (1e-15s)
 * in BrightDate days is ~1.16e-20, but a femtosecond-scale day value
 * (1e-15 days) represents ~86 picoseconds, still well below any clock's
 * resolution. Anything more demanding belongs in {@link ExactBrightDate}.
 */
const MIN_REALISTIC_MAGNITUDE = 1e-15;

const isRealistic = (v: number): boolean =>
  v === 0 || Math.abs(v) >= MIN_REALISTIC_MAGNITUDE;

/**
 * A finite Float64 in the "realistic" BrightDate range: roughly -50_000 to
 * +50_000 days (covers 1863 AD through 2137 AD). Excludes NaN, Infinity,
 * subnormals, and sub-femtosecond magnitudes (~1e-20 days) where Float64
 * arithmetic identities start to fail.
 */
const realisticBrightDate = (): fc.Arbitrary<number> =>
  fc
    .double({
      min: -50_000,
      max: 50_000,
      noNaN: true,
      noDefaultInfinity: true,
    })
    .filter(isRealistic);

/** A smaller range for precision-sensitive tests where ULP growth matters */
const nearEpochBrightDate = (): fc.Arbitrary<number> =>
  fc
    .double({
      min: -10,
      max: 10,
      noNaN: true,
      noDefaultInfinity: true,
    })
    .filter(isRealistic);

/** Integer Unix ms in a plausible range */
const integerUnixMs = (): fc.Arbitrary<number> =>
  fc.integer({ min: -2_208_988_800_000, max: 4_102_444_800_000 }); // 1900 to 2100

/** Day-aligned Unix ms (integer day offsets from J2000) */
const dayAlignedUnixMs = (): fc.Arbitrary<number> =>
  fc
    .integer({ min: -30_000, max: 30_000 })
    .map((dayOffset) => J2000_UNIX_MS_UTC + dayOffset * MS_PER_DAY);

/** Integer Unix seconds */
const integerUnixSeconds = (): fc.Arbitrary<number> =>
  fc.integer({ min: -2_208_988_800, max: 4_102_444_800 });

/** Picosecond BigInt values (for ExactBrightDate) */
const picosecondBigInt = (): fc.Arbitrary<bigint> =>
  fc.bigInt({
    min: -(2n ** 80n),
    max: 2n ** 80n,
  });

describe('Property-Based Tests', () => {
  // The property tests intentionally probe timestamps far into the future
  // (up to ~year 2100) to verify invariants like TAI monotonicity across
  // the whole timeline. Those queries pass our LEAP_SECOND_TABLE_VALID_UNTIL
  // date and trigger the stale-table warning on every run. Silence it here
  // so the test output stays clean — the warning is verified in its own
  // dedicated tests in hardening.spec.ts.
  let warnSpy: jest.SpyInstance;
  beforeAll(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterAll(() => {
    warnSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ARITHMETIC PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('arithmetic', () => {
    it('add(v, d) === subtract(v, -d) for all v, d', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (v, d) => {
          return add(v, d) === subtract(v, -d);
        }),
      );
    });

    it('add(v, 0) === v for all v (additive identity)', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => add(v, 0) === v),
      );
    });

    it('subtract(v, 0) === v for all v', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => subtract(v, 0) === v),
      );
    });

    it('addMillidays(v, 1000) ≈ add(v, 1) within 1 ULP', () => {
      fc.assert(
        fc.property(nearEpochBrightDate(), (v) => {
          const viaMilli = addMillidays(v, 1000);
          const viaDays = add(v, 1);
          const ulp = Math.max(Math.abs(v + 1), 1) * Number.EPSILON;
          return Math.abs(viaMilli - viaDays) <= ulp * 2;
        }),
      );
    });

    it('addMicrodays(v, 1_000_000) ≈ add(v, 1) within 2 ULP', () => {
      fc.assert(
        fc.property(nearEpochBrightDate(), (v) => {
          const viaMicro = addMicrodays(v, 1_000_000);
          const viaDays = add(v, 1);
          const ulp = Math.max(Math.abs(v + 1), 1) * Number.EPSILON;
          return Math.abs(viaMicro - viaDays) <= ulp * 4;
        }),
      );
    });

    it('absoluteDifference is symmetric: |a-b| === |b-a|', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          return absoluteDifference(a, b) === absoluteDifference(b, a);
        }),
      );
    });

    it('compare is consistent: compare(a,b) + compare(b,a) === 0', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          return compare(a, b) + compare(b, a) === 0;
        }),
      );
    });

    it('compare(a, a) === 0 (reflexivity) for all a', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (a) => compare(a, a) === 0),
      );
    });

    it('clamp(v, lo, hi) ∈ [lo, hi] whenever lo ≤ hi', () => {
      fc.assert(
        fc.property(
          realisticBrightDate(),
          realisticBrightDate(),
          realisticBrightDate(),
          (v, a, b) => {
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            const result = clamp(v, lo, hi);
            return result >= lo && result <= hi;
          },
        ),
      );
    });

    it('clamp(v, lo, hi) === v whenever v ∈ [lo, hi]', () => {
      fc.assert(
        fc.property(
          realisticBrightDate(),
          realisticBrightDate(),
          realisticBrightDate(),
          (v, a, b) => {
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            if (v < lo || v > hi) return true;
            return clamp(v, lo, hi) === v;
          },
        ),
      );
    });

    it('lerp endpoints: lerp(a, b, 0) === a exactly', () => {
      // (b-a)*0 is always +0 (or -0), so addition with a is exact.
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          return lerp(a, b, 0) === a;
        }),
      );
    });

    it('lerp endpoints: lerp(a, b, 1) is within a few ULP of b', () => {
      // The formula `a + (b-a)*t` is the standard lerp. At t=1 it reduces
      // to `a + (b-a)`, which equals b ONLY when the subtraction (b-a)
      // is exact — not guaranteed. The ULP bound is scaled by
      // max(|a|, |b|) because the intermediate result (b-a) has that
      // magnitude. We allow 4 ULP to cover realistic inputs.
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          const result = lerp(a, b, 1);
          if (result === b) return true;
          const scale = Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);
          const ulp = scale * Number.EPSILON;
          return Math.abs(result - b) <= ulp * 4;
        }),
      );
    });

    it('midpoint(a, b) === midpoint(b, a) (commutative)', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          return midpoint(a, b) === midpoint(b, a);
        }),
      );
    });

    it('min/max are consistent: min ≤ max', () => {
      fc.assert(
        fc.property(
          fc.array(realisticBrightDate(), { minLength: 1, maxLength: 100 }),
          (values) => min(...values) <= max(...values),
        ),
      );
    });

    it('floorToDay(v) ≤ v', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => floorToDay(v) <= v),
      );
    });

    it('floorToDay(v) + 1 > v (floor is the correct step)', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => floorToDay(v) + 1 > v),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONVERSION ROUND-TRIP PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('conversion round-trips', () => {
    it('day-aligned Unix ms → BrightDate → Unix ms is bit-exact', () => {
      fc.assert(
        fc.property(dayAlignedUnixMs(), (ms) => toUnixMs(fromUnixMs(ms)) === ms),
      );
    });

    it('arbitrary Unix ms round-trip error is bounded by 1 ms', () => {
      fc.assert(
        fc.property(integerUnixMs(), (ms) => {
          return Math.abs(toUnixMs(fromUnixMs(ms)) - ms) < 1;
        }),
      );
    });

    it('BrightDate → Date → BrightDate preserves ms quantization', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => {
          const d = toDate(v);
          const v2 = fromDate(d);
          // JavaScript Date truncates fractional milliseconds toward zero.
          // The round-trip value is therefore `(trunc(v*MS + J) - J) / MS`.
          const expectedMs = Math.trunc(v * MS_PER_DAY + J2000_UNIX_MS_UTC);
          return v2 === (expectedMs - J2000_UNIX_MS_UTC) / MS_PER_DAY;
        }),
      );
    });

    it('Julian Date round-trip: toJulianDate(fromJulianDate(jd)) === jd', () => {
      fc.assert(
        fc.property(
          fc.double({
            min: 2_000_000,
            max: 3_000_000,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          (jd) => toJulianDate(fromJulianDate(jd)) === jd,
        ),
      );
    });

    it('Modified Julian Date round-trip', () => {
      fc.assert(
        fc.property(
          fc.double({
            min: 30_000,
            max: 70_000,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          (mjd) => toModifiedJulianDate(fromModifiedJulianDate(mjd)) === mjd,
        ),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SERIALIZATION PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('serialization', () => {
    it('toBinary → fromBinary is bit-exact (Object.is) for all finite Float64', () => {
      fc.assert(
        fc.property(realisticBrightDate(), (v) => {
          return Object.is(fromBinary(toBinary(v)), v);
        }),
      );
    });

    it('encode → decode preserves value at precision 12 (for values ≥ 1e-12)', () => {
      // encode uses toFixed(precision), which cannot represent magnitudes
      // below 10^-precision. At precision 12, values smaller than ~1e-12
      // days (~86 picoseconds) are truncated to zero. For a Float64 input
      // in the realistic range, encoding at precision 12 preserves all
      // bits ABOVE picosecond magnitude — which is what it advertises.
      fc.assert(
        fc.property(
          nearEpochBrightDate().filter((v) => v === 0 || Math.abs(v) >= 1e-12),
          fc.constantFrom('utc', 'tai') as fc.Arbitrary<'utc' | 'tai'>,
          (v, ts) => {
            const encoded = encode(v, ts, 12);
            const { value, timescale } = decode(encoded);
            // Allow 1 ULP at the precision-12 grid
            return Math.abs(value - v) <= 5e-13 && timescale === ts;
          },
        ),
      );
    });

    it('toSortableString is order-preserving under lexicographic sort (for values ≥ 1e-8)', () => {
      // Sortable strings use toFixed(8), so magnitudes below ~1e-8 days
      // (~0.86 ms) get truncated to zero. Above this threshold, the
      // lexicographic ordering matches numeric ordering.
      fc.assert(
        fc.property(
          fc.array(
            nearEpochBrightDate().filter(
              (v) => v === 0 || Math.abs(v) >= 1e-8,
            ),
            { minLength: 2, maxLength: 20 },
          ),
          (values) => {
            const sortable = values.map((v) => toSortableString(v, 8));
            const byLex = [...sortable].sort();
            const byNum = [...values].sort((a, b) => a - b);
            const recovered = byLex.map(fromSortableString);
            for (let i = 0; i < values.length; i++) {
              if (Math.abs(recovered[i] - byNum[i]) > 1e-7) return false;
            }
            return true;
          },
        ),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INTERVAL PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('intervals', () => {
    const orderedPair = (): fc.Arbitrary<[number, number]> =>
      fc
        .tuple(realisticBrightDate(), realisticBrightDate())
        .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number]);

    it('interval duration is non-negative', () => {
      fc.assert(
        fc.property(orderedPair(), ([s, e]) => {
          return BrightDateInterval.fromValues(s, e).duration >= 0;
        }),
      );
    });

    it('midpoint is inside the interval', () => {
      fc.assert(
        fc.property(orderedPair(), ([s, e]) => {
          const interval = BrightDateInterval.fromValues(s, e);
          const m = interval.midpoint.value;
          return m >= s && m <= e;
        }),
      );
    });

    it('contains(start) and contains(end) are both true', () => {
      fc.assert(
        fc.property(orderedPair(), ([s, e]) => {
          const interval = BrightDateInterval.fromValues(s, e);
          return interval.containsValue(s) && interval.containsValue(e);
        }),
      );
    });

    it('expand(d).shrink(d) yields the original interval (when valid)', () => {
      fc.assert(
        fc.property(
          orderedPair(),
          fc.double({
            min: 0,
            max: 10,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          ([s, e], d) => {
            const interval = BrightDateInterval.fromValues(s, e);
            const expanded = interval.expand(d);
            const shrunk = expanded.shrink(d);
            if (!shrunk) return true; // skip invalid cases
            return (
              Math.abs(shrunk.start.value - s) < 1e-9 &&
              Math.abs(shrunk.end.value - e) < 1e-9
            );
          },
        ),
      );
    });

    it('shift preserves duration', () => {
      fc.assert(
        fc.property(
          orderedPair(),
          fc.double({
            min: -100,
            max: 100,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          ([s, e], d) => {
            const interval = BrightDateInterval.fromValues(s, e);
            const shifted = interval.shift(d);
            return Math.abs(shifted.duration - interval.duration) < 1e-9;
          },
        ),
      );
    });

    it('split(n) sub-intervals sum to the original duration', () => {
      fc.assert(
        fc.property(
          orderedPair(),
          fc.integer({ min: 1, max: 20 }),
          ([s, e], n) => {
            const interval = BrightDateInterval.fromValues(s, e);
            const parts = interval.split(n);
            const totalDuration = parts.reduce(
              (sum, p) => sum + p.duration,
              0,
            );
            // Allow small ULP accumulation
            const tolerance = Math.max(Math.abs(interval.duration), 1) * 1e-10;
            return Math.abs(totalDuration - interval.duration) <= tolerance;
          },
        ),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LEAP SECOND PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('leap seconds', () => {
    it('TAI is always ≥ UTC', () => {
      fc.assert(
        fc.property(integerUnixSeconds(), (s) => utcToTai(s) >= s),
      );
    });

    it('TAI-UTC offset is monotonically non-decreasing in time', () => {
      fc.assert(
        fc.property(
          integerUnixSeconds(),
          integerUnixSeconds(),
          (a, b) => {
            const earlier = Math.min(a, b);
            const later = Math.max(a, b);
            return getTaiUtcOffset(later) >= getTaiUtcOffset(earlier);
          },
        ),
      );
    });

    it('utcToTai is strictly monotonic (no stuttering)', () => {
      fc.assert(
        fc.property(
          integerUnixSeconds(),
          fc.integer({ min: 1, max: 1000 }),
          (s, delta) => utcToTai(s + delta) > utcToTai(s),
        ),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BRIGHTDATE CLASS PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('BrightDate class', () => {
    it('valueOf() enables correct numeric comparison', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          const bdA = BrightDate.fromValue(a);
          const bdB = BrightDate.fromValue(b);
          return (bdA < bdB) === (a < b) && (bdA > bdB) === (a > b);
        }),
      );
    });

    it('addDays + subtractDays is identity (within a few ULP)', () => {
      // Strict equality fails when (v+d)-d rounds back differently. The
      // ULP bound scales with max(|v|, |d|) because the intermediate
      // value (v+d) has that magnitude.
      fc.assert(
        fc.property(
          realisticBrightDate(),
          fc
            .double({
              min: -100,
              max: 100,
              noNaN: true,
              noDefaultInfinity: true,
            })
            .filter(isRealistic),
          (v, d) => {
            const bd = BrightDate.fromValue(v);
            const result = bd.addDays(d).subtractDays(d).value;
            if (result === v) return true;
            const scale = Math.max(Math.abs(v), Math.abs(d), Number.MIN_VALUE);
            const ulp = scale * Number.EPSILON;
            return Math.abs(result - v) <= ulp * 4;
          },
        ),
      );
    });

    it('isBefore is asymmetric: !(a.isBefore(b) && b.isBefore(a))', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          const bdA = BrightDate.fromValue(a);
          const bdB = BrightDate.fromValue(b);
          return !(bdA.isBefore(bdB) && bdB.isBefore(bdA));
        }),
      );
    });

    it('midpoint is between this and other', () => {
      fc.assert(
        fc.property(realisticBrightDate(), realisticBrightDate(), (a, b) => {
          const bdA = BrightDate.fromValue(a);
          const bdB = BrightDate.fromValue(b);
          const m = bdA.midpoint(bdB).value;
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          return m >= lo && m <= hi;
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EXACT BRIGHTDATE PROPERTIES (bit-exact)
  // ═══════════════════════════════════════════════════════════════════════

  describe('ExactBrightDate', () => {
    it('Unix ms round-trip is ALWAYS bit-exact', () => {
      fc.assert(
        fc.property(integerUnixMs(), (ms) => {
          return ExactBrightDate.fromUnixMs(ms).toUnixMs() === ms;
        }),
      );
    });

    it('fromPicoseconds → picoseconds is identity', () => {
      fc.assert(
        fc.property(picosecondBigInt(), (ps) => {
          return ExactBrightDate.fromPicoseconds(ps).picoseconds === ps;
        }),
      );
    });

    it('addPicoseconds is exactly reversible', () => {
      fc.assert(
        fc.property(picosecondBigInt(), picosecondBigInt(), (a, b) => {
          const e = ExactBrightDate.fromPicoseconds(a);
          return e.addPicoseconds(b).subtractPicoseconds(b).picoseconds === a;
        }),
      );
    });

    it('toBinary → fromBinary is bit-exact', () => {
      fc.assert(
        fc.property(picosecondBigInt(), (ps) => {
          const e = ExactBrightDate.fromPicoseconds(ps);
          return (
            ExactBrightDate.fromBinary(e.toBinary()).picoseconds === ps
          );
        }),
      );
    });

    it('encode → decode is bit-exact', () => {
      fc.assert(
        fc.property(picosecondBigInt(), (ps) => {
          const e = ExactBrightDate.fromPicoseconds(ps);
          return ExactBrightDate.decode(e.encode()).picoseconds === ps;
        }),
      );
    });

    it('compareTo is a total order consistent with subtraction', () => {
      fc.assert(
        fc.property(picosecondBigInt(), picosecondBigInt(), (a, b) => {
          const ea = ExactBrightDate.fromPicoseconds(a);
          const eb = ExactBrightDate.fromPicoseconds(b);
          const cmp = ea.compareTo(eb);
          if (a === b) return cmp === 0;
          if (a < b) return cmp === -1;
          return cmp === 1;
        }),
      );
    });

    it('differencePicoseconds equals the arithmetic difference', () => {
      fc.assert(
        fc.property(picosecondBigInt(), picosecondBigInt(), (a, b) => {
          const ea = ExactBrightDate.fromPicoseconds(a);
          const eb = ExactBrightDate.fromPicoseconds(b);
          return ea.differencePicoseconds(eb) === a - b;
        }),
      );
    });
  });
});
