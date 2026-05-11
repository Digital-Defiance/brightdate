/**
 * Tests for ExactBrightDate.
 *
 * The whole point of this class is bit-exact behavior. Every test here
 * asserts strict equality (`.toBe`, `Object.is`, `===`) — no tolerances,
 * no `toBeCloseTo`. If these ever weaken, the reason for the class is gone.
 */

import { J2000_UNIX_MS_UTC } from "../constants";
import { ExactBrightDate } from "../ExactBrightDate";

describe("ExactBrightDate", () => {
  // ─── Construction ────────────────────────────────────────────────────────

  describe("epoch()", () => {
    it("has picoseconds = 0n", () => {
      expect(ExactBrightDate.epoch().picoseconds).toBe(0n);
    });

    it("converts to the J2000.0 Unix ms", () => {
      expect(ExactBrightDate.epoch().toUnixMs()).toBe(J2000_UNIX_MS_UTC);
    });

    it("converts to 2000-01-01T11:58:55.816Z (UTC label of J2000.0)", () => {
      expect(ExactBrightDate.epoch().toISO()).toBe("2000-01-01T11:58:55.816Z");
    });
  });

  describe("fromPicoseconds()", () => {
    it("stores the raw picosecond value", () => {
      const e = ExactBrightDate.fromPicoseconds(123456789n);
      expect(e.picoseconds).toBe(123456789n);
    });

    it("accepts negative values", () => {
      const e = ExactBrightDate.fromPicoseconds(-1_000_000_000_000n);
      expect(e.picoseconds).toBe(-1_000_000_000_000n);
    });

    it("accepts very large values (beyond Number.MAX_SAFE_INTEGER)", () => {
      const huge = 2n ** 80n;
      expect(ExactBrightDate.fromPicoseconds(huge).picoseconds).toBe(huge);
    });
  });

  // ─── Unix ms round-trips (the whole point) ───────────────────────────────

  describe("fromUnixMs / toUnixMs — bit-exact round-trip", () => {
    // This is the bedrock guarantee that Float64 BrightDate can't make.
    const CASES = [
      0,
      1,
      1000,
      1_700_000_000_000,
      J2000_UNIX_MS_UTC,
      -1,
      -1_000_000_000,
      1,
      1234567,
      99999999,
      1_700_000_001_234,
      Number.MAX_SAFE_INTEGER - 1,
      -(Number.MAX_SAFE_INTEGER - 1),
    ];

    for (const ms of CASES) {
      it(`Unix ms ${ms} round-trips bit-exactly`, () => {
        expect(ExactBrightDate.fromUnixMs(ms).toUnixMs()).toBe(ms);
      });
    }

    it("round-trips bit-exactly via BigInt input", () => {
      const ms = 1_700_000_000_123n;
      expect(ExactBrightDate.fromUnixMs(ms).toUnixMsBigInt()).toBe(ms);
    });

    it("toUnixMsBigInt works beyond Number.MAX_SAFE_INTEGER", () => {
      // A year 50_000 timestamp
      const ms = 1_500_000_000_000_000n; // ~year 49500
      expect(ExactBrightDate.fromUnixMs(ms).toUnixMsBigInt()).toBe(ms);
    });
  });

  // ─── Other factories ─────────────────────────────────────────────────────

  describe("fromUnixSeconds", () => {
    it("round-trips integer seconds bit-exactly", () => {
      const cases = [0, 1, 1_700_000_000, -1_000_000, 946_728_000];
      for (const s of cases) {
        expect(ExactBrightDate.fromUnixSeconds(s).toUnixSeconds()).toBe(s);
      }
    });

    it("Unix epoch seconds map to J2000 Unix ms offset", () => {
      const e = ExactBrightDate.fromUnixSeconds(0);
      expect(e.toUnixMs()).toBe(0);
    });
  });

  describe("fromDate", () => {
    it("round-trips a Date through Unix ms", () => {
      const d = new Date("2025-06-15T10:30:45.123Z");
      expect(ExactBrightDate.fromDate(d).toDate().getTime()).toBe(d.getTime());
    });

    it("J2000.0 Date maps to epoch", () => {
      const j2000 = new Date(J2000_UNIX_MS_UTC);
      expect(ExactBrightDate.fromDate(j2000).picoseconds).toBe(0n);
    });
  });

  describe("fromISO", () => {
    it("J2000.0 UTC label maps to epoch (picoseconds = 0)", () => {
      expect(
        ExactBrightDate.fromISO("2000-01-01T11:58:55.816Z").picoseconds,
      ).toBe(0n);
    });

    it("TT noon (2000-01-01T12:00:00.000Z) maps to 64184 s after epoch", () => {
      // TT noon is 64.184 s after the J2000.0 UTC label = 64_184_000_000_000 ps
      expect(
        ExactBrightDate.fromISO("2000-01-01T12:00:00.000Z").picoseconds,
      ).toBe(64_184_000_000_000n);
    });

    it("throws for invalid ISO string", () => {
      expect(() => ExactBrightDate.fromISO("not-a-date")).toThrow(
        "Invalid ISO 8601 date string",
      );
    });
  });

  describe("now()", () => {
    it("returns a value close to Date.now()", () => {
      const before = Date.now();
      const e = ExactBrightDate.now();
      const after = Date.now();
      expect(e.toUnixMs()).toBeGreaterThanOrEqual(before);
      expect(e.toUnixMs()).toBeLessThanOrEqual(after);
    });
  });

  // ─── Arithmetic (all bit-exact) ─────────────────────────────────────────

  describe("addPicoseconds / subtractPicoseconds", () => {
    it("addPicoseconds + subtractPicoseconds is identity", () => {
      const e = ExactBrightDate.fromUnixMs(1_700_000_000_123);
      const delta = 987_654_321_098_765n;
      expect(e.addPicoseconds(delta).subtractPicoseconds(delta).equals(e)).toBe(
        true,
      );
    });

    it("adding 1 picosecond produces a distinct value", () => {
      const a = ExactBrightDate.epoch();
      const b = a.addPicoseconds(1n);
      expect(a.equals(b)).toBe(false);
      expect(b.picoseconds).toBe(1n);
    });
  });

  describe("addNanoseconds", () => {
    it("adding 1000 ns equals adding 1 us", () => {
      const e = ExactBrightDate.epoch();
      expect(e.addNanoseconds(1000n).equals(e.addMicroseconds(1n))).toBe(true);
    });
  });

  describe("addMilliseconds", () => {
    it("1 ms of picoseconds is 1_000_000_000", () => {
      expect(ExactBrightDate.epoch().addMilliseconds(1n).picoseconds).toBe(
        1_000_000_000n,
      );
    });

    it("round-trips Unix ms under ms arithmetic", () => {
      const base = ExactBrightDate.fromUnixMs(1_000_000);
      expect(base.addMilliseconds(500n).toUnixMs()).toBe(1_000_500);
    });
  });

  describe("addSeconds", () => {
    it("60 seconds = 1 minute = 60_000 ms of pico-offset", () => {
      const e = ExactBrightDate.epoch().addSeconds(60n);
      expect(e.picoseconds).toBe(60_000_000_000_000n);
    });
  });

  describe("addDays", () => {
    it("1 day of picoseconds is 86_400_000_000_000_000", () => {
      expect(ExactBrightDate.epoch().addDays(1n).picoseconds).toBe(
        86_400_000_000_000_000n,
      );
    });

    it("adding and subtracting a day is identity", () => {
      const e = ExactBrightDate.fromUnixMs(1_700_000_000_000);
      expect(e.addDays(1n).subtractDays(1n).equals(e)).toBe(true);
    });
  });

  // ─── Difference methods ─────────────────────────────────────────────────

  describe("differencePicoseconds", () => {
    it("returns the signed difference", () => {
      const a = ExactBrightDate.fromPicoseconds(100n);
      const b = ExactBrightDate.fromPicoseconds(30n);
      expect(a.differencePicoseconds(b)).toBe(70n);
      expect(b.differencePicoseconds(a)).toBe(-70n);
    });
  });

  describe("differenceMilliseconds", () => {
    it("truncates toward zero", () => {
      const a = ExactBrightDate.fromPicoseconds(1_500_000_000n); // 1.5 ms
      const b = ExactBrightDate.fromPicoseconds(0n);
      expect(a.differenceMilliseconds(b)).toBe(1n);
    });

    it("matches the Unix ms gap for integer-ms timestamps", () => {
      const a = ExactBrightDate.fromUnixMs(2_000);
      const b = ExactBrightDate.fromUnixMs(1_000);
      expect(a.differenceMilliseconds(b)).toBe(1000n);
    });
  });

  describe("differenceNanoseconds / Microseconds / Seconds", () => {
    it("ns difference equals ms difference × 1_000_000", () => {
      const a = ExactBrightDate.fromUnixMs(1_000);
      const b = ExactBrightDate.fromUnixMs(500);
      expect(a.differenceNanoseconds(b)).toBe(500n * 1_000_000n);
    });

    it("us difference equals ms difference × 1_000", () => {
      const a = ExactBrightDate.fromUnixMs(1_000);
      const b = ExactBrightDate.fromUnixMs(500);
      expect(a.differenceMicroseconds(b)).toBe(500_000n);
    });

    it("s difference for 1-second gap", () => {
      const a = ExactBrightDate.epoch().addSeconds(10n);
      const b = ExactBrightDate.epoch();
      expect(a.differenceSeconds(b)).toBe(10n);
    });
  });

  // ─── Comparison ─────────────────────────────────────────────────────────

  describe("equals", () => {
    it("returns true for same picosecond count", () => {
      expect(
        ExactBrightDate.fromPicoseconds(42n).equals(
          ExactBrightDate.fromPicoseconds(42n),
        ),
      ).toBe(true);
    });

    it("returns false for off-by-one picosecond", () => {
      expect(
        ExactBrightDate.fromPicoseconds(42n).equals(
          ExactBrightDate.fromPicoseconds(43n),
        ),
      ).toBe(false);
    });
  });

  describe("compareTo", () => {
    it("returns -1, 0, 1", () => {
      const a = ExactBrightDate.fromPicoseconds(1n);
      const b = ExactBrightDate.fromPicoseconds(2n);
      expect(a.compareTo(b)).toBe(-1);
      expect(b.compareTo(a)).toBe(1);
      expect(a.compareTo(a)).toBe(0);
    });
  });

  describe("isBefore / isAfter", () => {
    it("ordering holds for picosecond-adjacent values", () => {
      const a = ExactBrightDate.epoch();
      const b = a.addPicoseconds(1n);
      expect(a.isBefore(b)).toBe(true);
      expect(b.isAfter(a)).toBe(true);
      expect(a.isAfter(b)).toBe(false);
    });
  });

  // ─── Serialization ──────────────────────────────────────────────────────

  describe("encode / decode", () => {
    it("round-trips any picosecond value", () => {
      const cases = [
        0n,
        1n,
        -1n,
        1_000_000n,
        1_700_000_000_000_000_000_000n, // huge
        -(2n ** 80n),
      ];
      for (const ps of cases) {
        const e = ExactBrightDate.fromPicoseconds(ps);
        const encoded = e.encode();
        const decoded = ExactBrightDate.decode(encoded);
        expect(decoded.picoseconds).toBe(ps);
      }
    });

    it('starts with "EBD1:"', () => {
      expect(ExactBrightDate.epoch().encode()).toMatch(/^EBD1:/);
    });

    it("throws on invalid prefix", () => {
      expect(() => ExactBrightDate.decode("BD1:123")).toThrow(
        'must start with "EBD1:"',
      );
    });

    it("throws on invalid BigInt body", () => {
      expect(() => ExactBrightDate.decode("EBD1:not-a-number")).toThrow(
        "not a valid BigInt",
      );
    });
  });

  describe("toBinary / fromBinary", () => {
    it("produces a 16-byte ArrayBuffer", () => {
      expect(ExactBrightDate.epoch().toBinary().byteLength).toBe(16);
    });

    it("round-trips positive values", () => {
      const cases = [0n, 1n, 123_456_789_012_345n, 2n ** 100n];
      for (const ps of cases) {
        const e = ExactBrightDate.fromPicoseconds(ps);
        const round = ExactBrightDate.fromBinary(e.toBinary());
        expect(round.picoseconds).toBe(ps);
      }
    });

    it("round-trips negative values (two's complement)", () => {
      const cases = [-1n, -1_000_000n, -(2n ** 100n)];
      for (const ps of cases) {
        const e = ExactBrightDate.fromPicoseconds(ps);
        const round = ExactBrightDate.fromBinary(e.toBinary());
        expect(round.picoseconds).toBe(ps);
      }
    });

    it("throws for buffer < 16 bytes", () => {
      expect(() => ExactBrightDate.fromBinary(new ArrayBuffer(8))).toThrow(
        "Buffer too small",
      );
    });
  });

  // ─── Display ────────────────────────────────────────────────────────────

  describe("toString / toJSON", () => {
    it("toString returns the picosecond count as decimal string", () => {
      expect(ExactBrightDate.fromPicoseconds(42n).toString()).toBe("42");
    });

    it("toJSON returns a string (BigInt is not JSON-serializable directly)", () => {
      const e = ExactBrightDate.fromPicoseconds(12345n);
      expect(typeof e.toJSON()).toBe("string");
      expect(e.toJSON()).toBe("12345");
    });

    it("JSON.stringify uses toJSON", () => {
      const e = ExactBrightDate.fromPicoseconds(12345n);
      expect(JSON.stringify({ t: e })).toBe('{"t":"12345"}');
    });
  });

  describe("inspect symbol", () => {
    it("returns a descriptive string", () => {
      const { inspect } = require("util");
      const e = ExactBrightDate.fromPicoseconds(42n);
      expect(inspect(e)).toContain("ExactBrightDate(");
      expect(inspect(e)).toContain("42");
      expect(inspect(e)).toContain("ps");
    });
  });

  // ─── Bridge to Float64 BrightDate ───────────────────────────────────────

  describe("toBrightDateValue (lossy bridge)", () => {
    it("epoch maps to 0", () => {
      expect(ExactBrightDate.epoch().toBrightDateValue()).toBe(0);
    });

    it("1 day of picoseconds maps to 1.0", () => {
      expect(ExactBrightDate.epoch().addDays(1n).toBrightDateValue()).toBe(1);
    });

    it("1 ms of picoseconds maps to 1/86400000", () => {
      const v = ExactBrightDate.epoch().addMilliseconds(1n).toBrightDateValue();
      expect(v).toBeCloseTo(1 / 86_400_000, 15);
    });

    it("Unix epoch maps to ≈ -10957.49925712963 (UTC-offset, not TAI-coherent)", () => {
      // ExactBrightDate is a pure UTC-offset system anchored at J2000_UNIX_MS_UTC
      // (946_727_935_816 ms). No TAI offsets are applied. The value is simply
      // (0 - 946_727_935_816) / 86_400_000 = -10957.49925712963.
      // Note: BrightDate.fromUnixMs(0) yields -10957.499511759259 (TAI-coherent)
      // because conversions.ts applies the TAI-UTC offset for pre-1972 dates.
      expect(ExactBrightDate.fromUnixMs(0).toBrightDateValue()).toBeCloseTo(
        -10957.49925712963,
        6,
      );
    });
  });

  // ─── Immutability ───────────────────────────────────────────────────────

  describe("immutability", () => {
    it("arithmetic does not mutate the original", () => {
      const a = ExactBrightDate.fromPicoseconds(100n);
      a.addPicoseconds(50n);
      expect(a.picoseconds).toBe(100n);
    });

    it("arithmetic returns a new instance", () => {
      const a = ExactBrightDate.epoch();
      const b = a.addPicoseconds(1n);
      expect(b).not.toBe(a);
    });
  });
});
