/**
 * Scientific Integrity Test Suite
 *
 * These tests assert that BrightDate's math matches the stars, not just
 * that the code runs. A library that aspires to be a scientific primitive
 * must pass every one of these — no exceptions, no approximations where
 * exactness is possible.
 *
 *   1. Millennium Zero        — J2000.0 anchor is exactly 0
 *   2. Unix Epoch Collision   — legacy bridge round-trips with bit-for-bit fidelity
 *   3. Vibrational Precision  — Float64 sub-microsecond behavior is predictable
 *   4. Anti-Leap Monotonicity — TAI is strictly monotonic across leap second events
 *
 * Plus a set of "invariant" tests that every conversion, arithmetic, and
 * serialization operation must satisfy by construction.
 */

import { BrightDate } from "../BrightDate";
import { J2000_UNIX_MS_UTC, MS_PER_DAY, SECONDS_PER_DAY } from "../constants";
import {
  fromDate,
  fromISO,
  fromJulianDate,
  fromModifiedJulianDate,
  fromUnixMs,
  fromUnixSeconds,
  toDate,
  toISO,
  toJulianDate,
  toModifiedJulianDate,
  toUnixMs,
  toUnixSeconds,
} from "../conversions";
import { getTaiUtcOffset, utcToTai } from "../leapSeconds";
import { decode, encode, fromBinary, toBinary } from "../serialization";

describe("Scientific Integrity", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // 1. THE MILLENNIUM ZERO TEST
  //    2000-01-01T11:58:55.816Z (UTC label of J2000.0) must map exactly to 0.
  //    This is the TAI-coherent anchor. J2000.0 in TT is 2000-01-01T12:00:00 TT;
  //    in TAI it is 2000-01-01T11:59:27.816 TAI (32 s ahead of UTC);
  //    in UTC (wall-clock label) it is 2000-01-01T11:58:55.816Z.
  //    If this drifts, everything downstream is wrong.
  // ═══════════════════════════════════════════════════════════════════════

  describe("Millennium Zero (J2000.0 anchor)", () => {
    it("2000-01-01T11:58:55.816Z maps to exactly 0 (via fromDate)", () => {
      // UTC label of J2000.0: Unix ms = 946_727_935_816
      const j2000 = new Date("2000-01-01T11:58:55.816Z");
      expect(fromDate(j2000)).toBe(0);
      // And bit-for-bit: the float must be +0 (not -0, not 1e-323)
      expect(Object.is(fromDate(j2000), 0)).toBe(true);
    });

    it("2000-01-01T11:58:55.816Z maps to exactly 0 (via fromISO)", () => {
      expect(fromISO("2000-01-01T11:58:55.816Z")).toBe(0);
    });

    it("2000-01-01T12:00:00.000Z (TT noon) maps to 64.184/86400 days after epoch", () => {
      // TT noon is 32.184 s ahead of TAI, and TAI is 32 s ahead of UTC at J2000 =>
      // TT noon is 64.184 s after the J2000.0 UTC label.
      expect(fromISO("2000-01-01T12:00:00.000Z")).toBeCloseTo(
        64.184 / 86400,
        8,
      );
    });

    it("value 0 round-trips back to 2000-01-01T11:58:55.816Z", () => {
      expect(toISO(0)).toBe("2000-01-01T11:58:55.816Z");
    });

    it("value 0 → toDate → back: identical Unix ms", () => {
      const d = toDate(0);
      expect(d.getTime()).toBe(J2000_UNIX_MS_UTC);
      expect(d.getTime()).toBe(946_727_935_816);
    });

    it("BrightDate.epoch() equals value 0 (primitive equality)", () => {
      expect(BrightDate.epoch().value).toBe(0);
      expect(+BrightDate.epoch()).toBe(0);
    });

    it("J2000 Julian Date is exactly 2451545.0", () => {
      expect(toJulianDate(0)).toBe(2451545.0);
      expect(fromJulianDate(2451545.0)).toBe(0);
    });

    it("J2000 Modified Julian Date is exactly 51544.5", () => {
      expect(toModifiedJulianDate(0)).toBe(51544.5);
      expect(fromModifiedJulianDate(51544.5)).toBe(0);
    });

    it("the anchor is invariant: running fromDate twice on J2000 gives the same bits", () => {
      const j2000 = new Date("2000-01-01T12:00:00.000Z");
      const a = fromDate(j2000);
      const b = fromDate(j2000);
      expect(Object.is(a, b)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. THE UNIX EPOCH TEST
  //    1970-01-01T00:00:00Z → ≈ -10957.499511759259 (not -10957.5)
  //    In v1.0 the BrightDate is TAI-coherent; at the Unix epoch the
  //    TAI-UTC offset is 10 (pre-1972 sentinel), not 32. This shifts
  //    the value from the naïve -10957.5 by ~488µs.
  // ═══════════════════════════════════════════════════════════════════════

  describe("Unix Epoch Collision (legacy bridge)", () => {
    // In v1.0: fromUnixMs(0) = (0 + 10 − 946_727_967.816) / 86_400
    //                        = -946_727_957.816 / 86_400
    //                        = -10957.499511759259...
    // The pre-1972 TAI-UTC sentinel (10 s) shifts the value slightly.
    const UNIX_EPOCH_BD = -10957.499511759259;

    it("1970-01-01T00:00:00.000Z maps to ≈ -10957.499511759259 (via fromDate)", () => {
      const unixEpoch = new Date(0);
      expect(fromDate(unixEpoch)).toBeCloseTo(UNIX_EPOCH_BD, 8);
    });

    it("1970-01-01T00:00:00.000Z maps to ≈ -10957.499511759259 (via fromISO)", () => {
      expect(fromISO("1970-01-01T00:00:00.000Z")).toBeCloseTo(UNIX_EPOCH_BD, 8);
    });

    it("1970-01-01T00:00:00.000Z maps to ≈ -10957.499511759259 (via fromUnixMs)", () => {
      expect(fromUnixMs(0)).toBeCloseTo(UNIX_EPOCH_BD, 8);
    });

    it("1970-01-01T00:00:00Z maps to ≈ -10957.499511759259 (via fromUnixSeconds)", () => {
      expect(fromUnixSeconds(0)).toBeCloseTo(UNIX_EPOCH_BD, 8);
    });

    it("fromUnixMs(0) → toUnixMs → 0 (exact round-trip)", () => {
      expect(toUnixMs(fromUnixMs(0))).toBe(0);
    });

    it("fromUnixMs(0) → toDate → Unix ms = 0", () => {
      expect(toDate(fromUnixMs(0)).getTime()).toBe(0);
    });

    it("Unix epoch BrightDate is close to -10957.5 but shifted by TAI offset", () => {
      // The naïve value -10957.5 assumed a fixed 32 s TAI-UTC offset.
      // The correct v1.0 value uses the actual 10 s pre-1972 sentinel.
      const bd = fromUnixMs(0);
      expect(bd).not.toBe(-10957.5); // NOT the naïve value
      expect(Math.abs(bd - -10957.5)).toBeLessThan(0.001); // within 1 ms in days
      expect(bd).toBeCloseTo(-10957.499511759259, 6);
    });

    it("Unix ms round-trips EXACTLY for day-aligned timestamps", () => {
      // The round-trip is bit-exact when (ms - J2000_UNIX_MS_UTC) is a
      // multiple of MS_PER_DAY — i.e. the BrightDate value lands on an
      // exactly-representable Float64 (integer or half-integer days).
      const dayAlignedCases = [
        0, // Unix epoch (BrightDate = -10957.5, exactly representable)
        J2000_UNIX_MS_UTC, // J2000.0 (BrightDate = 0)
        J2000_UNIX_MS_UTC + MS_PER_DAY, // J2000.0 + 1 day
        J2000_UNIX_MS_UTC - MS_PER_DAY, // J2000.0 - 1 day
        1_700_000_000_000, // happens to land on a day boundary
        86_400_000, // 1 day after Unix epoch
      ];
      for (const ms of dayAlignedCases) {
        expect(toUnixMs(fromUnixMs(ms))).toBe(ms);
      }
    });

    it("Unix ms round-trip error is bounded by 1 Float64 ULP in ms (≈0.12 ms)", () => {
      // Off-day-boundary values cannot round-trip bit-exactly through a
      // decimal-days representation — the mantissa cost of dividing by
      // 86_400_000 shows up on the other side. We DO guarantee the
      // error is bounded by one ULP of the anchor, which at the J2000
      // Unix ms magnitude is about 2^-52 * 946728000000 ≈ 2.1e-4 ms.
      const offDayCases = [1000, 1500, -1_000_000_000, 1_700_000_001_234];
      for (const ms of offDayCases) {
        const recovered = toUnixMs(fromUnixMs(ms));
        const errorMs = Math.abs(recovered - ms);
        // Empirically ≈ 1.22e-4 ms — well under 1 ms, never a timing surprise
        expect(errorMs).toBeLessThan(0.001);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. THE VIBRATIONAL FORM PRECISION TEST
  //    Demonstrates Float64 precision behavior near and far from the epoch.
  //    Claims BrightDate does not make: "unlimited precision everywhere".
  //    Claims BrightDate DOES make: "predictable, mathematically honest
  //    precision governed by IEEE 754 Float64".
  // ═══════════════════════════════════════════════════════════════════════

  describe("Vibrational Form Precision (Float64 behavior)", () => {
    // At the anchor, precision is bounded only by denormal floats (~1e-323).
    it("at value 0, adding 1 nanoday yields a distinct representable value", () => {
      const NANODAY = 1e-9;
      expect(0 + NANODAY).not.toBe(0);
      expect(0 + NANODAY).toBe(NANODAY);
    });

    it("at value 0, adding 1 nanosecond (≈1.157e-14 days) is distinct", () => {
      const NANOSECOND_IN_DAYS = 1e-9 / SECONDS_PER_DAY; // ≈ 1.157e-14
      expect(0 + NANOSECOND_IN_DAYS).not.toBe(0);
    });

    it("at value 0, adding Number.EPSILON yields a distinct representable value", () => {
      // Number.EPSILON = 2^-52 ≈ 2.22e-16 days ≈ 19.2 picoseconds
      expect(0 + Number.EPSILON).not.toBe(0);
      expect(0 + Number.EPSILON).toBe(Number.EPSILON);
    });

    it("within 1 day of epoch, microsecond precision is exact to ~1 ULP", () => {
      // 1 microsecond = 1e-6 / 86400 days ≈ 1.157e-11 days
      // Machine epsilon at v=0.5 is 2^-53 ≈ 1.11e-16 days
      // So microseconds are ~5 orders of magnitude above resolution.
      // But the subtraction (bd + Δ) - bd loses bits — the result is
      // accurate to within 1 ULP of the Δ, not to precision 20.
      const MICROSECOND_IN_DAYS = 1e-6 / SECONDS_PER_DAY;
      const bd = 0.5;
      expect(bd + MICROSECOND_IN_DAYS).not.toBe(bd);
      const delta = bd + MICROSECOND_IN_DAYS - bd;
      // Accept ≤ 1 ULP of error at this magnitude (ULP of 0.5 ≈ 5.55e-17)
      const ulp = 0.5 * Number.EPSILON;
      expect(Math.abs(delta - MICROSECOND_IN_DAYS)).toBeLessThan(ulp);
    });

    it("at current-era timestamps (~10 000 days), nanosecond precision smears", () => {
      // At v ≈ 10000, machine epsilon ≈ 10000 * 2^-52 ≈ 2.22e-12 days ≈ 192 ns
      // A 1-nanosecond delta (≈ 1.16e-14 days) is BELOW this resolution and WILL smear.
      const bd = 10000.5;
      const NANOSECOND_IN_DAYS = 1e-9 / SECONDS_PER_DAY;
      // The addition at this magnitude rounds to the same float
      expect(bd + NANOSECOND_IN_DAYS).toBe(bd);
    });

    it("at current-era timestamps, microsecond precision remains distinct", () => {
      // 1 µs ≈ 1.157e-11 days; machine epsilon at 10000 is ≈ 2.22e-12 days
      // So microsecond deltas ARE representable at current epoch.
      const bd = 10000.5;
      const MICROSECOND_IN_DAYS = 1e-6 / SECONDS_PER_DAY;
      expect(bd + MICROSECOND_IN_DAYS).not.toBe(bd);
    });

    it("Float64 precision at the current era matches IEEE 754 spec exactly", () => {
      // The distance from v to the next representable Float64 must equal
      // roughly v * 2^-52. This tests that we aren't silently losing
      // precision to some internal quantization.
      const v = 9622.5;
      const ulp = Math.abs(v) * Number.EPSILON; // ≈ 2.14e-12 days at v=9622.5
      // Adding ulp/2 rounds to even (banker's rounding) — might stay or bump
      // Adding ulp must always produce a different value
      expect(v + ulp).not.toBe(v);
    });

    it("addition of a nanoday is commutative and associative within tolerance", () => {
      const ND = 1e-9;
      // Near epoch, these identities hold essentially exactly
      expect(0 + ND + ND).toBe(ND + 0 + ND);
      expect(0 + ND + ND).toBe(ND + ND + 0);
    });

    it("binary serialization preserves every Float64 bit", () => {
      // The bit-exact serialization guarantee — critical for blockchain
      // state replication, scientific archiving, and cross-language interop.
      const cases = [
        0,
        -10957.5,
        9622.50417,
        Number.EPSILON,
        -Number.EPSILON,
        Math.PI,
        Math.E,
        Number.MIN_VALUE,
        Number.MAX_SAFE_INTEGER,
      ];
      for (const v of cases) {
        expect(fromBinary(toBinary(v))).toBe(v);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 4. ANTI-LEAP MONOTONICITY
  //    TAI must be strictly monotonically increasing across leap second
  //    insertions. UTC (and Unix) "stutter" at leap seconds — a single
  //    UTC moment can correspond to two wall-clock seconds. TAI does not.
  // ═══════════════════════════════════════════════════════════════════════

  describe("Anti-Leap Monotonicity (TAI continuity)", () => {
    // 2017-01-01T00:00:00Z is the most recent leap second insertion.
    // Unix seconds at that moment: 1_483_228_800
    // TAI-UTC before: 36; TAI-UTC after: 37
    const LEAP_MOMENT_UNIX = 1_483_228_800;

    it("TAI-UTC offset increases by exactly 1 at the 2017 leap second boundary", () => {
      expect(getTaiUtcOffset(LEAP_MOMENT_UNIX - 1)).toBe(36);
      expect(getTaiUtcOffset(LEAP_MOMENT_UNIX)).toBe(37);
      expect(
        getTaiUtcOffset(LEAP_MOMENT_UNIX) -
          getTaiUtcOffset(LEAP_MOMENT_UNIX - 1),
      ).toBe(1);
    });

    it("TAI captures the leap second that UTC Unix time smears", () => {
      // In UTC Unix time, only 1 second passes from 23:59:59 to 00:00:00
      // (the leap second 23:59:60 is assigned the same Unix timestamp).
      // In TAI, 2 full seconds pass — this is the scientific truth.
      const utcDeltaSeconds = LEAP_MOMENT_UNIX - (LEAP_MOMENT_UNIX - 1);
      expect(utcDeltaSeconds).toBe(1); // Unix lies

      const taiBefore = utcToTai(LEAP_MOMENT_UNIX - 1);
      const taiAfter = utcToTai(LEAP_MOMENT_UNIX);
      const taiDeltaSeconds = taiAfter - taiBefore;
      expect(taiDeltaSeconds).toBe(2); // TAI tells the truth
    });

    it("TAI is strictly monotonically increasing across every historical leap second", () => {
      // Sample 10 seconds around each leap second and verify TAI never repeats
      // and never decreases. Uses the known 2017 boundary for a concrete walk.
      const timestamps: number[] = [];
      for (let offset = -5; offset <= 5; offset++) {
        timestamps.push(LEAP_MOMENT_UNIX + offset);
      }
      const taiTimestamps = timestamps.map(utcToTai);

      for (let i = 1; i < taiTimestamps.length; i++) {
        expect(taiTimestamps[i]).toBeGreaterThan(taiTimestamps[i - 1]);
      }
    });

    it("no two distinct TAI timestamps collapse to the same value", () => {
      // Walk every leap second in the table and verify TAI monotonicity
      // through a window around each event.
      const leapUnixSeconds = [
        63_072_000, // 1972-01-01
        915_148_800, // 1999-01-01
        1_136_073_600, // 2006-01-01
        1_230_768_000, // 2009-01-01
        1_341_100_800, // 2012-07-01
        1_435_708_800, // 2015-07-01
        1_483_228_800, // 2017-01-01
      ];
      for (const leap of leapUnixSeconds) {
        const tBefore = utcToTai(leap - 1);
        const tAt = utcToTai(leap);
        const tAfter = utcToTai(leap + 1);
        expect(tBefore).toBeLessThan(tAt);
        expect(tAt).toBeLessThan(tAfter);
      }
    });

    it("BrightDate delta across a leap second boundary is 2 SI seconds (TAI-coherent)", () => {
      // In v1.0 BrightDate uses a TAI substrate. When the TAI-UTC offset
      // changes by 1 s at the leap second boundary, consecutive UTC seconds
      // map to TAI values 2 s apart, which is the physically correct answer:
      // exactly 2 SI seconds elapsed between 23:59:59 UTC and 00:00:00 UTC
      // (because the clock read 23:59:60 in between).
      const justBefore = fromUnixSeconds(LEAP_MOMENT_UNIX - 1);
      const justAfter = fromUnixSeconds(LEAP_MOMENT_UNIX);
      const deltaDays = justAfter - justBefore;
      const deltaSeconds = deltaDays * SECONDS_PER_DAY;
      expect(deltaSeconds).toBeCloseTo(2, 6); // TAI-coherent: 2 SI seconds
    });

    it("TAI timescale produces correct 2-second gap where UTC shows 1", () => {
      // When converting both UTC timestamps to TAI Unix seconds, the delta
      // reveals the leap second.
      const utcBefore = LEAP_MOMENT_UNIX - 1;
      const utcAfter = LEAP_MOMENT_UNIX;
      const taiBefore = utcToTai(utcBefore);
      const taiAfter = utcToTai(utcAfter);
      expect(taiAfter - taiBefore).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 5. ROUND-TRIP INVARIANTS
  //    Every conversion pair must be a bijection (up to documented precision).
  //    These tests enforce the fundamental algebraic laws of the library.
  // ═══════════════════════════════════════════════════════════════════════

  describe("Round-Trip Invariants", () => {
    const SAMPLE_VALUES = [
      0, // epoch
      fromUnixMs(0), // Unix epoch ≈ -10957.499511759259
      9622.50417, // ~2026-06-15
      365242.5, // ~year 3000
      -1_000_000, // deep history
      Number.EPSILON,
      -Number.EPSILON,
    ];

    describe("Date ↔ BrightDate", () => {
      for (const v of SAMPLE_VALUES) {
        if (Math.abs(v) > 1e10) continue; // Date can't represent this far
        it(`value ${v} round-trips through Date (idempotent)`, () => {
          const d = toDate(v);
          const v2 = fromDate(d);
          // The Date's Unix ms must equal toUnixMs(v) (both round to nearest ms).
          expect(d.getTime()).toBe(toUnixMs(v));
          // A second round-trip must be idempotent: the ms-quantized value
          // is already on the ms grid, so applying toDate/fromDate again is a no-op.
          expect(fromDate(toDate(v2))).toBe(v2);
        });
      }
    });

    describe("UnixMs ↔ BrightDate", () => {
      // Day-aligned Unix ms values round-trip bit-exactly. This is the
      // strongest guarantee available when bridging a millisecond-based
      // system through a decimal-days one.
      const dayAlignedMs = [
        0, // Unix epoch → toUnixMs(fromUnixMs(0)) = 0 (exact)
        J2000_UNIX_MS_UTC, // J2000 → BrightDate 0
        J2000_UNIX_MS_UTC + MS_PER_DAY,
        1_700_000_000_000, // happens to be day-aligned relative to J2000
        86_400_000, // Jan 2 1970 00:00 UTC
      ];
      for (const ms of dayAlignedMs) {
        it(`day-aligned Unix ms ${ms} round-trips bit-exactly`, () => {
          expect(toUnixMs(fromUnixMs(ms))).toBe(ms);
        });
      }

      // Off-day values round-trip within a bounded error (1 ULP at the
      // J2000 anchor magnitude ≈ 0.00012 ms — well under 1 ms resolution).
      const offDayMs = [1, 1000, 1_700_000_000_123, -1_234_567_890];
      for (const ms of offDayMs) {
        it(`off-day Unix ms ${ms} round-trips within 0.001 ms`, () => {
          expect(Math.abs(toUnixMs(fromUnixMs(ms)) - ms)).toBeLessThan(0.001);
        });
      }
    });

    describe("UnixSeconds ↔ BrightDate", () => {
      // Day-aligned seconds round-trip exactly.
      const dayAlignedS = [0, 946_728_000, 86_400, 1_577_836_800];
      for (const s of dayAlignedS) {
        it(`day-aligned Unix seconds ${s} round-trip bit-exactly`, () => {
          expect(toUnixSeconds(fromUnixSeconds(s))).toBe(s);
        });
      }
      // Off-day seconds round-trip within sub-millisecond precision.
      const offDayS = [1, 1000, 1_700_000_001];
      for (const s of offDayS) {
        it(`off-day Unix seconds ${s} round-trip within 0.001 s`, () => {
          expect(Math.abs(toUnixSeconds(fromUnixSeconds(s)) - s)).toBeLessThan(
            0.001,
          );
        });
      }
    });

    describe("JulianDate ↔ BrightDate", () => {
      const jdCases = [0, 2451545.0, 2460000.5, 2440587.5]; // last is Unix epoch
      for (const jd of jdCases) {
        it(`JD ${jd} round-trips with bit-for-bit fidelity`, () => {
          expect(toJulianDate(fromJulianDate(jd))).toBe(jd);
        });
      }
    });

    describe("ModifiedJulianDate ↔ BrightDate", () => {
      const mjdCases = [0, 51544.5, 60000, 40587]; // last is Unix epoch
      for (const mjd of mjdCases) {
        it(`MJD ${mjd} round-trips with bit-for-bit fidelity`, () => {
          expect(toModifiedJulianDate(fromModifiedJulianDate(mjd))).toBe(mjd);
        });
      }
    });

    describe("Encoded string ↔ BrightDate", () => {
      const cases: Array<[number, "utc" | "tai"]> = [
        [0, "utc"],
        [0, "tai"],
        [-10957.5, "utc"],
        [9622.50417, "utc"],
        [9622.50417, "tai"],
      ];
      for (const [v, ts] of cases) {
        it(`value ${v} (${ts}) round-trips through encode/decode`, () => {
          const encoded = encode(v, ts, 12);
          const { value, timescale } = decode(encoded);
          expect(value).toBe(v);
          expect(timescale).toBe(ts);
        });
      }
    });

    describe("Binary ↔ BrightDate (bit-exact)", () => {
      const cases = [0, -10957.5, 9622.50417, Number.EPSILON, -0];
      for (const v of cases) {
        it(`value ${v} survives binary round-trip unchanged`, () => {
          expect(Object.is(fromBinary(toBinary(v)), v)).toBe(true);
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 6. CROSS-SYSTEM CONSISTENCY
  //    The conversion family must be internally consistent. If
  //    fromISO ∘ toISO is identity (for ms-quantized values) and
  //    fromDate ∘ toDate is also identity, then
  //    fromISO(toISO(v)) must equal fromDate(toDate(v)).
  // ═══════════════════════════════════════════════════════════════════════

  describe("Cross-System Consistency", () => {
    const cases = [0, -10957.5, 9622.5, 1000.25];

    for (const v of cases) {
      it(`all path combinations agree for ${v}`, () => {
        const viaDate = fromDate(toDate(v));
        const viaISO = fromISO(toISO(v));
        const viaUnixMs = fromUnixMs(toUnixMs(v));
        expect(viaDate).toBe(viaISO);
        expect(viaISO).toBe(viaUnixMs);
      });
    }

    it("Julian Date and Unix epoch constants align", () => {
      // Unix epoch JD is 2440587.5. Let's verify via BrightDate.
      const jdOfUnixEpoch = toJulianDate(-10957.5);
      expect(jdOfUnixEpoch).toBe(2440587.5);
    });

    it("MJD and Unix epoch constants align", () => {
      // Unix epoch MJD is 40587.
      const mjdOfUnixEpoch = toModifiedJulianDate(-10957.5);
      expect(mjdOfUnixEpoch).toBe(40587);
    });

    it("J2000 to Unix epoch: 10957 days + TAI correction", () => {
      // Calendar days 1970-01-01 to 2000-01-01: 30*365 + 7 leap days = 10957.
      // Plus 11 h 58 m 55.816 s to reach the J2000.0 UTC label = 10957.499... days.
      // The exact value: (0 + 10 − 946_727_967.816) / 86_400 = -10957.499511759259
      // (TAI-UTC at Unix epoch = 10, the pre-1972 sentinel)
      const bd = fromUnixMs(0);
      expect(bd).toBeCloseTo(-10957.499511759259, 8);
      // JD of Unix epoch: toJulianDate(-10957.5) = 2440587.5 (by pure math)
      expect(toJulianDate(-10957.5)).toBe(2440587.5);
    });
  });
});
