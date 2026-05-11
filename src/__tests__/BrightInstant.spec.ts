/**
 * BrightInstant test suite.
 *
 * Mirrors the Rust `instant.rs` test module and adds TS-specific coverage.
 * All tests use the TAI-coherent J2000.0 anchor:
 *   UTC label  2000-01-01T11:58:55.816Z  = Unix ms 946_727_935_816
 *   TAI Unix s 946_727_967.816           (= int 946_727_967 + 816_000_000 ns)
 */

import { BrightInstant } from "../BrightInstant";
import { J2000_JD, J2000_MJD, J2000_UTC_UNIX_MS } from "../constants";

const J2000_UNIX_MS = 946_727_935_816;

// ── Construction ─────────────────────────────────────────────────────────────

describe("BrightInstant — J2000 constant", () => {
  it("J2000 has taiSecondsSinceJ2000 = 0n", () => {
    expect(BrightInstant.J2000.taiSecondsSinceJ2000).toBe(0n);
  });
  it("J2000 has taiNanos = 0", () => {
    expect(BrightInstant.J2000.taiNanos).toBe(0);
  });
});

describe("BrightInstant.fromUnixMs", () => {
  it("fromUnixMs at J2000 UTC label yields J2000", () => {
    const i = BrightInstant.fromUnixMs(J2000_UNIX_MS);
    expect(i.taiSecondsSinceJ2000).toBe(0n);
    expect(i.taiNanos).toBe(0);
  });

  it("fromUnixMs at J2000 via exported constant yields J2000", () => {
    const i = BrightInstant.fromUnixMs(J2000_UTC_UNIX_MS);
    expect(i.taiSecondsSinceJ2000).toBe(0n);
    expect(i.taiNanos).toBe(0);
  });

  it("fromUnixMs at Unix epoch (ms=0)", () => {
    const i = BrightInstant.fromUnixMs(0);
    // Should be before J2000; taiSeconds negative
    expect(i.taiSecondsSinceJ2000).toBeLessThan(0n);
    // Round-trip must recover ms=0 exactly
    expect(i.toUnixMs()).toBe(0);
  });

  it("fromUnixMs at modern timestamp", () => {
    const ms = 1_700_000_000_000; // 2023-11-14
    const i = BrightInstant.fromUnixMs(ms);
    expect(i.toUnixMs()).toBe(ms);
  });

  it("fromUnixMs with sub-second component", () => {
    const ms = 1_700_000_000_123;
    const i = BrightInstant.fromUnixMs(ms);
    expect(i.toUnixMs()).toBe(ms);
    // taiNanos is relative to J2000's 816ms anchor:
    //   rawNanos = 123_000_000 − 816_000_000 = −693_000_000 → borrow 1s → 307_000_000
    expect(i.taiNanos).toBe(307_000_000);
  });

  it("fromUnixMs pre-Unix epoch (negative ms)", () => {
    const ms = -1_000_000_000_000; // 1938
    const i = BrightInstant.fromUnixMs(ms);
    expect(i.toUnixMs()).toBe(ms);
  });

  it("fromUnixMs with negative ms but positive sub-second part", () => {
    const ms = -999; // -1s + 1ms
    const i = BrightInstant.fromUnixMs(ms);
    expect(i.toUnixMs()).toBe(ms);
  });
});

describe("BrightInstant.fromTaiComponents", () => {
  it("round-trips taiSeconds and taiNanos", () => {
    const i = BrightInstant.fromTaiComponents(86_400n, 1);
    expect(i.taiSecondsSinceJ2000).toBe(86_400n);
    expect(i.taiNanos).toBe(1);
  });

  it("throws on taiNanos >= 1_000_000_000", () => {
    expect(() => BrightInstant.fromTaiComponents(0n, 1_000_000_000)).toThrow(
      RangeError,
    );
  });

  it("throws on negative taiNanos", () => {
    expect(() => BrightInstant.fromTaiComponents(0n, -1)).toThrow(RangeError);
  });
});

describe("BrightInstant.fromBrightDate", () => {
  it("fromBrightDate(0) is J2000", () => {
    const i = BrightInstant.fromBrightDate(0);
    expect(i.taiSecondsSinceJ2000).toBe(0n);
    expect(i.taiNanos).toBe(0);
  });

  it("fromBrightDate(1) is exactly 86400 TAI seconds later", () => {
    const i = BrightInstant.fromBrightDate(1);
    expect(i.taiSecondsSinceJ2000).toBe(86_400n);
    expect(i.taiNanos).toBe(0);
  });

  it("round-trips a modern value with sub-µs drift", () => {
    const bd = 9628.5;
    const i = BrightInstant.fromBrightDate(bd);
    const back = i.toBrightDate();
    expect(Math.abs(back - bd)).toBeLessThan(1e-9);
  });

  it("throws on NaN", () => {
    expect(() => BrightInstant.fromBrightDate(NaN)).toThrow(RangeError);
  });

  it("throws on Infinity", () => {
    expect(() => BrightInstant.fromBrightDate(Infinity)).toThrow(RangeError);
  });
});

// ── Julian dates ─────────────────────────────────────────────────────────────

describe("BrightInstant Julian Date", () => {
  it("J2000 toJulianDate() = 2_451_545.0", () => {
    expect(BrightInstant.J2000.toJulianDate()).toBe(J2000_JD);
  });

  it("fromJulianDate(J2000_JD) is J2000", () => {
    const i = BrightInstant.fromJulianDate(J2000_JD);
    expect(i.taiSecondsSinceJ2000).toBe(0n);
    expect(i.taiNanos).toBe(0);
  });

  it("J2000 toModifiedJulianDate() = 51_544.5", () => {
    expect(BrightInstant.J2000.toModifiedJulianDate()).toBe(J2000_MJD);
  });

  it("fromModifiedJulianDate(J2000_MJD) is J2000", () => {
    const i = BrightInstant.fromModifiedJulianDate(J2000_MJD);
    expect(i.taiSecondsSinceJ2000).toBe(0n);
    expect(i.taiNanos).toBe(0);
  });
});

// ── toISO ─────────────────────────────────────────────────────────────────────

describe("BrightInstant.toISO", () => {
  it("J2000 toISO() = 2000-01-01T11:58:55.816Z", () => {
    expect(BrightInstant.J2000.toISO()).toBe("2000-01-01T11:58:55.816Z");
  });

  it("Unix epoch toISO() = 1970-01-01T00:00:00.000Z", () => {
    const i = BrightInstant.fromUnixMs(0);
    expect(i.toISO()).toBe("1970-01-01T00:00:00.000Z");
  });

  it("toISO round-trips through fromUnixMs", () => {
    const ms = 1_700_000_000_456;
    const i = BrightInstant.fromUnixMs(ms);
    const parsed = new Date(i.toISO()).getTime();
    expect(parsed).toBe(ms);
  });

  it("toISO: TAI seconds around the 1998-12-31 leap second both render to 1998-12-31T23:59:59.000Z", () => {
    // TAI 915148830 = last normal second before leap second (UTC 23:59:59Z, offset=31)
    const beforeLeap = BrightInstant.fromUnixMs(915_148_799_000);
    // TAI 915148831 = the leap second itself; taiToUtcFull maps it to the same UTC
    // second without flagging isLeapSecond (known TS limitation — no :60 rendering)
    const atLeap = BrightInstant.fromUnixMs(915_148_800_000).addSeconds(-1n);
    expect(beforeLeap.toISO()).toBe("1998-12-31T23:59:59.000Z");
    expect(atLeap.toISO()).toBe("1998-12-31T23:59:59.000Z");
  });
});

// ── toDate ────────────────────────────────────────────────────────────────────

describe("BrightInstant.toDate", () => {
  it("J2000 toDate() yields correct UTC ms", () => {
    expect(BrightInstant.J2000.toDate().getTime()).toBe(J2000_UNIX_MS);
  });

  it("fromUnixMs(ms).toDate().getTime() === ms", () => {
    const ms = 1_700_000_000_789;
    expect(BrightInstant.fromUnixMs(ms).toDate().getTime()).toBe(ms);
  });
});

// ── Arithmetic ────────────────────────────────────────────────────────────────

describe("BrightInstant.addNanos", () => {
  it("addNanos carries into next second", () => {
    const i = BrightInstant.fromTaiComponents(0n, 1).addNanos(999_999_999n);
    expect(i.taiSecondsSinceJ2000).toBe(1n);
    expect(i.taiNanos).toBe(0);
  });

  it("addNanos(1_500_000_000) gives 1s + 500ms", () => {
    const i = BrightInstant.J2000.addNanos(1_500_000_000n);
    expect(i.taiSecondsSinceJ2000).toBe(1n);
    expect(i.taiNanos).toBe(500_000_000);
  });

  it("addNanos(-1) wraps into previous second", () => {
    const i = BrightInstant.J2000.addNanos(-1n);
    expect(i.taiSecondsSinceJ2000).toBe(-1n);
    expect(i.taiNanos).toBe(999_999_999);
  });

  it("addNanos is self-inverse", () => {
    const orig = BrightInstant.fromTaiComponents(12345n, 678_000_000);
    const after = orig.addNanos(1_234_567_890n).addNanos(-1_234_567_890n);
    expect(after.equals(orig)).toBe(true);
  });
});

describe("BrightInstant.addSeconds", () => {
  it("addSeconds(86_400) advances by one day", () => {
    const i = BrightInstant.J2000.addSeconds(86_400n);
    expect(i.taiSecondsSinceJ2000).toBe(86_400n);
    expect(i.taiNanos).toBe(0);
  });

  it("addSeconds(-1) goes before J2000", () => {
    const i = BrightInstant.J2000.addSeconds(-1n);
    expect(i.taiSecondsSinceJ2000).toBe(-1n);
  });
});

// ── Difference ────────────────────────────────────────────────────────────────

describe("BrightInstant.nanosSince", () => {
  it("1.5 s later yields 1_500_000_000n", () => {
    const a = BrightInstant.J2000;
    const b = a.addNanos(1_500_000_000n);
    expect(b.nanosSince(a)).toBe(1_500_000_000n);
  });

  it("is antisymmetric", () => {
    const a = BrightInstant.J2000;
    const b = a.addNanos(1_500_000_000n);
    expect(a.nanosSince(b)).toBe(-1_500_000_000n);
  });

  it("nanosSince self = 0", () => {
    expect(BrightInstant.J2000.nanosSince(BrightInstant.J2000)).toBe(0n);
  });
});

describe("BrightInstant.secondsSince", () => {
  it("one day later = 86400 seconds", () => {
    const a = BrightInstant.J2000;
    const b = a.addSeconds(86_400n);
    expect(b.secondsSince(a)).toBeCloseTo(86_400, 9);
  });

  it("is signed", () => {
    const a = BrightInstant.J2000;
    const b = a.addSeconds(1n);
    expect(a.secondsSince(b)).toBeCloseTo(-1, 9);
  });
});

// ── Comparison ────────────────────────────────────────────────────────────────

describe("BrightInstant comparison", () => {
  const earlier = BrightInstant.J2000;
  const later = BrightInstant.J2000.addSeconds(1n);
  const sameAsEarlier = BrightInstant.fromTaiComponents(0n, 0);

  it("isBefore", () => {
    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isBefore(earlier)).toBe(false);
    expect(earlier.isBefore(sameAsEarlier)).toBe(false);
  });

  it("isAfter", () => {
    expect(later.isAfter(earlier)).toBe(true);
    expect(earlier.isAfter(later)).toBe(false);
    expect(earlier.isAfter(sameAsEarlier)).toBe(false);
  });

  it("equals", () => {
    expect(earlier.equals(sameAsEarlier)).toBe(true);
    expect(earlier.equals(later)).toBe(false);
  });

  it("nano-level ordering", () => {
    const a = BrightInstant.fromTaiComponents(0n, 0);
    const b = BrightInstant.fromTaiComponents(0n, 1);
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
  });
});

// ── Round-trip precision ──────────────────────────────────────────────────────

describe("BrightInstant round-trip precision", () => {
  it("BrightDate round-trip at modern value holds sub-µs", () => {
    const bd = 9628.5;
    const i = BrightInstant.fromBrightDate(bd);
    const back = i.toBrightDate();
    const driftUs = Math.abs(back - bd) * 86_400 * 1_000_000;
    expect(driftUs).toBeLessThan(1.0);
  });

  it("nanosecond precision preserved across addNanos", () => {
    const i = BrightInstant.fromTaiComponents(0n, 999_999_999);
    const next = i.addNanos(1n);
    expect(next.taiSecondsSinceJ2000).toBe(1n);
    expect(next.taiNanos).toBe(0);
  });

  it("toUnixMs round-trips for 1000 consecutive milliseconds", () => {
    const base = 1_700_000_000_000;
    for (let offset = 0; offset < 1000; offset++) {
      const ms = base + offset;
      expect(BrightInstant.fromUnixMs(ms).toUnixMs()).toBe(ms);
    }
  });
});

// ── Static metadata ───────────────────────────────────────────────────────────

describe("BrightInstant.J2000_TAI_FRACT_NS", () => {
  it("is 816_000_000 (816 ms)", () => {
    expect(BrightInstant.J2000_TAI_FRACT_NS).toBe(816_000_000);
  });
});
