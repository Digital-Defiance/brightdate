/**
 * Tests for the PBD (Pre-BrightDate Eras) module.
 *
 * Convention: **PBD labels pre-J2000.0 only.** Non-negative scalars are plain
 * BD, never PBD0 — that contradiction was retired. The unified {@link BrightLabel}
 * union spans both halves of the timeline.
 *
 * Operates on Bright-seconds. One PBD era = one Tera-second (10¹² s).
 */

import { BrightDate } from "../BrightDate";
import { BrightInstant } from "../BrightInstant";
import { SECONDS_PER_DAY } from "../constants";
import { ExactBrightDate } from "../ExactBrightDate";
import {
  brightDateFromPBD,
  brightDateToLabel,
  brightDateToPBD,
  brightInstantFromPBD,
  brightInstantToPBD,
  compareExactPBD,
  comparePBD,
  formatBrightLabel,
  formatPBD,
  fromBrightLabel,
  fromExactPBD,
  fromPBD,
  isPBDLater,
  parseBrightLabel,
  parsePBD,
  pbdEra,
  pbdPage,
  PBD_ERA_PICOSECONDS,
  PBD_ERA_SECONDS,
  toBrightLabel,
  toExactPBD,
  toPBD,
} from "../pbd";
import type { BrightLabel, PBD } from "../pbd";
import { BrightDateError } from "../validation";

// Convenient handle on the page size for readability inside tests.
const T = PBD_ERA_SECONDS; // 1_000_000_000_000

describe("PBD (Pre-BrightDate Eras, Tera-second paging)", () => {
  // ─── Constants ──────────────────────────────────────────────────────────

  describe("constants", () => {
    it("PBD_ERA_SECONDS is exactly one Tera-second (10^12 s)", () => {
      expect(PBD_ERA_SECONDS).toBe(1_000_000_000_000);
    });

    it("PBD_ERA_PICOSECONDS = PBD_ERA_SECONDS × 10^12 ps/s", () => {
      expect(PBD_ERA_PICOSECONDS).toBe(1_000_000_000_000_000_000_000_000n);
    });

    it("SECONDS_PER_DAY is 86_400", () => {
      expect(SECONDS_PER_DAY).toBe(86_400);
    });
  });

  // ─── toPBD / fromPBD (Float64, Bright-seconds) ─────────────────────────

  describe("toPBD", () => {
    it("rejects zero (J2000.0 itself is plain BD, not PBD0)", () => {
      expect(() => toPBD(0)).toThrow(BrightDateError);
    });

    it("rejects any non-negative scalar", () => {
      expect(() => toPBD(1)).toThrow(BrightDateError);
      expect(() => toPBD(86_400)).toThrow(BrightDateError);
      expect(() => toPBD(T)).toThrow(BrightDateError);
    });

    it("pages −1 s into PBD1 at page (T − 1)", () => {
      expect(toPBD(-1)).toEqual({ era: 1, page: T - 1 });
    });

    it("paged exact −T lands at PBD2 page T (closed-upper convention)", () => {
      expect(toPBD(-T)).toEqual({ era: 2, page: T });
    });

    it("just above −T (−T + 1) is still PBD1, near the older end", () => {
      expect(toPBD(-(T - 1))).toEqual({ era: 1, page: 1 });
    });

    it("just below −T (−T − 1) is PBD2 near the younger end", () => {
      expect(toPBD(-(T + 1))).toEqual({ era: 2, page: T - 1 });
    });

    it("paged exact −2T lands at PBD3 page T", () => {
      expect(toPBD(-2 * T)).toEqual({ era: 3, page: T });
    });

    it("matches the 3000 BC benchmark (~5 ky → PBD1, page ≈ 842 Gs)", () => {
      const fiveKy = -5_000 * 365.25 * SECONDS_PER_DAY;
      const pbd = toPBD(fiveKy);
      expect(pbd.era).toBe(1);
      expect(pbd.page).toBeGreaterThan(8.4e11);
      expect(pbd.page).toBeLessThan(8.5e11);
    });

    it("scales to deep Paleolithic depth (~100 ky → PBD4)", () => {
      const hundredKy = -100_000 * 365.25 * SECONDS_PER_DAY;
      const pbd = toPBD(hundredKy);
      expect(pbd.era).toBe(4);
      expect(pbd.page).toBeGreaterThan(0);
      expect(pbd.page).toBeLessThan(T);
    });

    it("rejects non-finite input", () => {
      expect(() => toPBD(Number.NaN)).toThrow(BrightDateError);
      expect(() => toPBD(Number.POSITIVE_INFINITY)).toThrow(BrightDateError);
      expect(() => toPBD(Number.NEGATIVE_INFINITY)).toThrow(BrightDateError);
    });
  });

  describe("fromPBD", () => {
    it("inverts toPBD for representative pre-J2000 values", () => {
      const samples = [
        -1,
        -86_400,
        -(T - 1),
        -T,
        -(T + 1),
        -2 * T,
        -3.156e12, // Paleolithic depth
        -1.578e11, // 3000 BC
      ];
      for (const raw of samples) {
        const round = fromPBD(toPBD(raw));
        expect(Math.abs(round - raw)).toBeLessThan(1e-3);
      }
    });

    it("is lenient with non-canonical (linear-offset) inputs", () => {
      expect(fromPBD({ era: 1, page: 0 })).toBe(-T);
      expect(fromPBD({ era: 1, page: 2 * T })).toBe(T);
      expect(fromPBD({ era: 2, page: T })).toBe(-T);
    });

    it("rejects era 0 — there is no PBD0", () => {
      expect(() => fromPBD({ era: 0, page: 0 })).toThrow(BrightDateError);
    });

    it("rejects non-integer or negative eras", () => {
      expect(() => fromPBD({ era: 1.5, page: 0 })).toThrow(BrightDateError);
      expect(() => fromPBD({ era: -1, page: 0 })).toThrow(BrightDateError);
    });

    it("rejects non-finite page", () => {
      expect(() => fromPBD({ era: 1, page: Number.NaN })).toThrow(
        BrightDateError,
      );
    });
  });

  // ─── Helper accessors ──────────────────────────────────────────────────

  describe("pbdEra / pbdPage", () => {
    it("agree with toPBD for negative samples", () => {
      const samples = [-1, -T, -(T - 1), -(T + 1), -2 * T, -1e13];
      for (const raw of samples) {
        const pbd = toPBD(raw);
        expect(pbdEra(raw)).toBe(pbd.era);
        expect(pbdPage(raw)).toBe(pbd.page);
      }
    });

    it("reject non-negative inputs", () => {
      expect(() => pbdEra(0)).toThrow(BrightDateError);
      expect(() => pbdPage(0)).toThrow(BrightDateError);
      expect(() => pbdEra(1)).toThrow(BrightDateError);
      expect(() => pbdPage(1)).toThrow(BrightDateError);
    });
  });

  // ─── BrightDate (days) ↔ PBD (seconds) ─────────────────────────────────

  describe("brightDateToPBD / brightDateFromPBD", () => {
    it("scales decimal days through SECONDS_PER_DAY", () => {
      const days = -5_000 * 365.25;
      const bd = BrightDate.fromValue(days);
      const pbd = brightDateToPBD(bd);
      expect(pbd.era).toBe(1);
      const expectedPage = toPBD(days * SECONDS_PER_DAY).page;
      expect(pbd.page).toBeCloseTo(expectedPage, 3);
    });

    it("round-trips a pre-J2000 BrightDate instance", () => {
      const original = BrightDate.fromValue(-1_826_250); // ~5000 yr pre-J2000
      const pbd = brightDateToPBD(original);
      const back = brightDateFromPBD(pbd);
      expect(Math.abs(back.value - original.value)).toBeLessThan(1e-6);
    });

    it("rejects current-era BrightDates", () => {
      const now = BrightDate.now();
      expect(() => brightDateToPBD(now)).toThrow(BrightDateError);
    });
  });

  // ─── Format / parse ────────────────────────────────────────────────────

  describe("formatPBD / parsePBD", () => {
    it("formats with the default precision (3)", () => {
      expect(formatPBD({ era: 1, page: 842_000_000_000 })).toBe(
        "PBD1: 842000000000.000",
      );
    });

    it("formats with a custom precision", () => {
      expect(formatPBD({ era: 1, page: 86_400.5 }, 6)).toBe(
        "PBD1: 86400.500000",
      );
      expect(formatPBD({ era: 1, page: 1 }, 0)).toBe("PBD1: 1");
    });

    it("rejects PBD0 in formatPBD", () => {
      expect(() => formatPBD({ era: 0, page: 0 })).toThrow(BrightDateError);
    });

    it("parses canonical output", () => {
      expect(parsePBD("PBD1: 842000000000.000")).toEqual({
        era: 1,
        page: 842_000_000_000,
      });
    });

    it("parses tolerant whitespace / unsigned-plus-era variants", () => {
      expect(parsePBD("  PBD+4  :   158000000000  ")).toEqual({
        era: 4,
        page: 158_000_000_000,
      });
    });

    it("round-trips format → parse for many tuples", () => {
      const samples: PBD[] = [
        { era: 1, page: 1 },
        { era: 1, page: 86_400.5 },
        { era: 1, page: 842_212_000_000 },
        { era: 4, page: 158_000_000_000 },
      ];
      for (const pbd of samples) {
        const parsed = parsePBD(formatPBD(pbd, 6));
        expect(parsed.era).toBe(pbd.era);
        const tol = Math.max(1e-3, Math.abs(pbd.page) * 1e-12);
        expect(Math.abs(parsed.page - pbd.page)).toBeLessThan(tol);
      }
    });

    it("throws on malformed input", () => {
      expect(() => parsePBD("not a pbd")).toThrow(BrightDateError);
      expect(() => parsePBD("PBD-1: 5")).toThrow(BrightDateError);
      expect(() => parsePBD("PBD1 5")).toThrow(BrightDateError);
      expect(() => parsePBD(42 as unknown as string)).toThrow(BrightDateError);
    });

    it("rejects invalid precision in formatPBD", () => {
      expect(() => formatPBD({ era: 1, page: 0 }, -1)).toThrow(BrightDateError);
      expect(() => formatPBD({ era: 1, page: 0 }, 1.5)).toThrow(
        BrightDateError,
      );
      expect(() => formatPBD({ era: 1, page: 0 }, 21)).toThrow(BrightDateError);
    });
  });

  // ─── Comparison ────────────────────────────────────────────────────────

  describe("comparePBD / isPBDLater", () => {
    it("smaller era is later in time", () => {
      const younger = { era: 1, page: T - 1 }; // raw −1 s
      const older = { era: 2, page: 1 }; // raw ≈ −2T + 1
      expect(comparePBD(younger, older)).toBe(1);
      expect(comparePBD(older, younger)).toBe(-1);
      expect(isPBDLater(younger, older)).toBe(true);
      expect(isPBDLater(older, younger)).toBe(false);
    });

    it("within an era, larger page is later", () => {
      const a = { era: 1, page: T - 1 };
      const b = { era: 1, page: 1 };
      expect(comparePBD(a, b)).toBe(1);
      expect(comparePBD(b, a)).toBe(-1);
    });

    it("identical tuples compare equal", () => {
      expect(comparePBD({ era: 3, page: 42 }, { era: 3, page: 42 })).toBe(0);
    });

    it("matches numeric comparison of the underlying scalar", () => {
      const samples = [-2.5 * T, -T, -(T - 1), -1];
      for (let i = 0; i < samples.length; i++) {
        for (let j = 0; j < samples.length; j++) {
          const a = toPBD(samples[i]);
          const b = toPBD(samples[j]);
          const expected =
            samples[i] === samples[j] ? 0 : samples[i] > samples[j] ? 1 : -1;
          expect(comparePBD(a, b)).toBe(expected);
        }
      }
    });
  });

  // ─── Exact (BigInt / picosecond) variants ─────────────────────────────

  describe("toExactPBD / fromExactPBD", () => {
    it("rejects zero", () => {
      expect(() => toExactPBD(ExactBrightDate.fromPicoseconds(0n))).toThrow(
        BrightDateError,
      );
    });

    it("rejects any non-negative exact scalar", () => {
      expect(() =>
        toExactPBD(ExactBrightDate.fromPicoseconds(1_234_567_890n)),
      ).toThrow(BrightDateError);
    });

    it("pages −1 picosecond into PBD1 at page (T_ps − 1)", () => {
      const pbd = toExactPBD(ExactBrightDate.fromPicoseconds(-1n));
      expect(pbd.era).toBe(1);
      expect(pbd.pagePicoseconds).toBe(PBD_ERA_PICOSECONDS - 1n);
    });

    it("paged exact −PBD_ERA_PICOSECONDS lands at PBD2 page T_ps", () => {
      const pbd = toExactPBD(
        ExactBrightDate.fromPicoseconds(-PBD_ERA_PICOSECONDS),
      );
      expect(pbd).toEqual({ era: 2, pagePicoseconds: PBD_ERA_PICOSECONDS });
    });

    it("just above the boundary stays in the earlier era", () => {
      const pbd = toExactPBD(
        ExactBrightDate.fromPicoseconds(-(PBD_ERA_PICOSECONDS - 1n)),
      );
      expect(pbd.era).toBe(1);
      expect(pbd.pagePicoseconds).toBe(1n);
    });

    it("just below the boundary lands in the next era near the young end", () => {
      const pbd = toExactPBD(
        ExactBrightDate.fromPicoseconds(-(PBD_ERA_PICOSECONDS + 1n)),
      );
      expect(pbd.era).toBe(2);
      expect(pbd.pagePicoseconds).toBe(PBD_ERA_PICOSECONDS - 1n);
    });

    it("round-trips bit-exactly for arbitrary negative picosecond samples", () => {
      const samples: bigint[] = [
        -1n,
        -1_234_567_890_123_456n,
        -PBD_ERA_PICOSECONDS,
        -PBD_ERA_PICOSECONDS - 7n,
        -PBD_ERA_PICOSECONDS * 500n - 12_345n,
      ];
      for (const ps of samples) {
        const exact = ExactBrightDate.fromPicoseconds(ps);
        const pbd = toExactPBD(exact);
        const round = fromExactPBD(pbd);
        expect(round.picoseconds).toBe(ps);
        // Canonical-form invariants
        expect(pbd.pagePicoseconds).toBeGreaterThan(0n);
        expect(pbd.pagePicoseconds).toBeLessThanOrEqual(PBD_ERA_PICOSECONDS);
        expect(pbd.era).toBeGreaterThanOrEqual(1);
      }
    });

    it("agrees with the Float64 form on era index", () => {
      const ps = -3_155_760_000_000_000_000_000_000n;
      const exact = ExactBrightDate.fromPicoseconds(ps);
      const exactPbd = toExactPBD(exact);
      const floatPbd = toPBD(Number(ps / 1_000_000_000_000n));
      expect(floatPbd.era).toBe(exactPbd.era);
      expect(exactPbd.era).toBe(4);
    });

    it("rejects non-bigint pagePicoseconds in fromExactPBD", () => {
      expect(() =>
        fromExactPBD({
          era: 1,
          pagePicoseconds: 5 as unknown as bigint,
        }),
      ).toThrow(BrightDateError);
    });

    it("rejects era 0 in fromExactPBD — there is no PBD0", () => {
      expect(() => fromExactPBD({ era: 0, pagePicoseconds: 0n })).toThrow(
        BrightDateError,
      );
    });

    it("rejects non-integer / negative era in fromExactPBD", () => {
      expect(() => fromExactPBD({ era: -1, pagePicoseconds: 0n })).toThrow(
        BrightDateError,
      );
      expect(() => fromExactPBD({ era: 1.5, pagePicoseconds: 0n })).toThrow(
        BrightDateError,
      );
    });
  });

  describe("compareExactPBD", () => {
    it("matches BigInt ordering of the underlying picoseconds (negative samples)", () => {
      const samples: bigint[] = [
        -PBD_ERA_PICOSECONDS * 3n,
        -PBD_ERA_PICOSECONDS,
        -(PBD_ERA_PICOSECONDS - 1n),
        -1n,
      ];
      for (let i = 0; i < samples.length; i++) {
        for (let j = 0; j < samples.length; j++) {
          const a = toExactPBD(ExactBrightDate.fromPicoseconds(samples[i]));
          const b = toExactPBD(ExactBrightDate.fromPicoseconds(samples[j]));
          const expected =
            samples[i] === samples[j] ? 0 : samples[i] > samples[j] ? 1 : -1;
          expect(compareExactPBD(a, b)).toBe(expected);
        }
      }
    });
  });

  // ─── BrightInstant bridge ──────────────────────────────────────────────

  describe("brightInstantToPBD / brightInstantFromPBD", () => {
    it("rejects J2000.0 itself", () => {
      expect(() => brightInstantToPBD(BrightInstant.J2000)).toThrow(
        BrightDateError,
      );
    });

    it("rejects post-J2000 instants", () => {
      const bi = BrightInstant.fromTaiComponents(0n, 123_456_789);
      expect(() => brightInstantToPBD(bi)).toThrow(BrightDateError);
    });

    it("pages a pre-J2000 instant into PBD1 near the young end", () => {
      // 1 ns before J2000.0
      const bi = BrightInstant.fromTaiComponents(-1n, 999_999_999);
      const pbd = brightInstantToPBD(bi);
      expect(pbd.era).toBe(1);
      // raw ps = -1 × 10^12 + 999_999_999 × 1000 = -1000 ps
      // canonical page = -1000 + 10^24 = 10^24 - 1000
      expect(pbd.pagePicoseconds).toBe(PBD_ERA_PICOSECONDS - 1000n);
    });

    it("rounds-trips a pre-J2000 instant bit-exactly", () => {
      const original = BrightInstant.fromTaiComponents(
        -157_788_000_000n,
        250_000_000,
      );
      const round = brightInstantFromPBD(brightInstantToPBD(original));
      expect(round.equals(original)).toBe(true);
    });

    it("rounds-trips a deep-time instant bit-exactly (~100 ky pre-J2000)", () => {
      const original = BrightInstant.fromTaiComponents(
        -3_155_760_000_000n,
        750_000_000,
      );
      const pbd = brightInstantToPBD(original);
      expect(pbd.era).toBe(4);
      const round = brightInstantFromPBD(pbd);
      expect(round.equals(original)).toBe(true);
    });

    it("truncates sub-nanosecond residue toward negative infinity", () => {
      const pbd = {
        era: 1,
        pagePicoseconds: PBD_ERA_PICOSECONDS - 1n,
      };
      const bi = brightInstantFromPBD(pbd);
      expect(bi.taiSecondsSinceJ2000).toBe(-1n);
      expect(bi.taiNanos).toBe(999_999_999);
    });

    it("propagates validation errors from fromExactPBD", () => {
      expect(() =>
        brightInstantFromPBD({ era: -1, pagePicoseconds: 0n }),
      ).toThrow(BrightDateError);
      expect(() =>
        brightInstantFromPBD({
          era: 1,
          pagePicoseconds: 5 as unknown as bigint,
        }),
      ).toThrow(BrightDateError);
    });
  });

  // ─── BrightLabel — unified BD ∪ PBD view ───────────────────────────────

  describe("toBrightLabel / fromBrightLabel", () => {
    it("labels J2000.0 itself as BD (zero seconds)", () => {
      expect(toBrightLabel(0)).toEqual({ kind: "BD", seconds: 0 });
    });

    it("labels any non-negative scalar as BD", () => {
      expect(toBrightLabel(86_400)).toEqual({ kind: "BD", seconds: 86_400 });
      expect(toBrightLabel(T)).toEqual({ kind: "BD", seconds: T });
    });

    it("labels any negative scalar as PBD (era ≥ 1)", () => {
      const a = toBrightLabel(-1);
      expect(a).toEqual({ kind: "PBD", era: 1, page: T - 1 });
      const b = toBrightLabel(-T);
      expect(b).toEqual({ kind: "PBD", era: 2, page: T });
    });

    it("round-trips through fromBrightLabel for representative scalars", () => {
      const samples = [0, 1, 86_400, T, -1, -T, -(T - 1), -(T + 1), -2 * T];
      for (const raw of samples) {
        const round = fromBrightLabel(toBrightLabel(raw));
        expect(Math.abs(round - raw)).toBeLessThan(1e-3);
      }
    });

    it("toBrightLabel rejects non-finite input", () => {
      expect(() => toBrightLabel(Number.NaN)).toThrow(BrightDateError);
      expect(() => toBrightLabel(Number.POSITIVE_INFINITY)).toThrow(
        BrightDateError,
      );
    });

    it("fromBrightLabel rejects a negative BD scalar", () => {
      const bogus: BrightLabel = { kind: "BD", seconds: -1 };
      expect(() => fromBrightLabel(bogus)).toThrow(BrightDateError);
    });

    it("fromBrightLabel rejects a PBD label with era 0", () => {
      const bogus: BrightLabel = { kind: "PBD", era: 0, page: 0 };
      expect(() => fromBrightLabel(bogus)).toThrow(BrightDateError);
    });
  });

  describe("formatBrightLabel / parseBrightLabel", () => {
    it("formats BD with the default precision", () => {
      expect(formatBrightLabel({ kind: "BD", seconds: 0 })).toBe("0.000 BD");
      expect(formatBrightLabel({ kind: "BD", seconds: 86_400.5 })).toBe(
        "86400.500 BD",
      );
    });

    it("formats PBD via formatPBD", () => {
      expect(
        formatBrightLabel({ kind: "PBD", era: 1, page: 842_000_000_000 }),
      ).toBe("PBD1: 842000000000.000");
    });

    it("respects custom precisions per branch", () => {
      expect(formatBrightLabel({ kind: "BD", seconds: 1 }, 6)).toBe(
        "1.000000 BD",
      );
      expect(formatBrightLabel({ kind: "PBD", era: 1, page: 1 }, 3, 0)).toBe(
        "PBD1: 1",
      );
    });

    it("parses canonical BD output", () => {
      expect(parseBrightLabel("0.000 BD")).toEqual({ kind: "BD", seconds: 0 });
      expect(parseBrightLabel("86400.500 BD")).toEqual({
        kind: "BD",
        seconds: 86_400.5,
      });
    });

    it("parses canonical PBD output", () => {
      expect(parseBrightLabel("PBD1: 842000000000.000")).toEqual({
        kind: "PBD",
        era: 1,
        page: 842_000_000_000,
      });
    });

    it("round-trips both branches", () => {
      const samples: BrightLabel[] = [
        { kind: "BD", seconds: 0 },
        { kind: "BD", seconds: 86_400.5 },
        { kind: "PBD", era: 1, page: 1 },
        { kind: "PBD", era: 4, page: 158_000_000_000 },
      ];
      for (const label of samples) {
        const round = parseBrightLabel(formatBrightLabel(label, 6, 6));
        expect(round.kind).toBe(label.kind);
        if (round.kind === "BD" && label.kind === "BD") {
          expect(round.seconds).toBeCloseTo(label.seconds, 3);
        } else if (round.kind === "PBD" && label.kind === "PBD") {
          expect(round.era).toBe(label.era);
          expect(round.page).toBeCloseTo(label.page, 3);
        }
      }
    });

    it("throws on malformed input", () => {
      expect(() => parseBrightLabel("nope")).toThrow(BrightDateError);
      expect(() => parseBrightLabel("123")).toThrow(BrightDateError);
      expect(() => parseBrightLabel(42 as unknown as string)).toThrow(
        BrightDateError,
      );
    });

    it("rejects a negative BD value when parsing", () => {
      expect(() => parseBrightLabel("-1 BD")).toThrow(BrightDateError);
    });
  });

  describe("brightDateToLabel", () => {
    it("labels a current-era BrightDate as BD", () => {
      const bd = BrightDate.fromValue(10);
      const label = brightDateToLabel(bd);
      expect(label.kind).toBe("BD");
      if (label.kind === "BD") {
        expect(label.seconds).toBe(10 * SECONDS_PER_DAY);
      }
    });

    it("labels a pre-J2000 BrightDate as PBD", () => {
      const bd = BrightDate.fromValue(-1_826_250);
      const label = brightDateToLabel(bd);
      expect(label.kind).toBe("PBD");
      if (label.kind === "PBD") {
        expect(label.era).toBe(1);
      }
    });
  });
});
