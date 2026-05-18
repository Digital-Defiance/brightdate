import {
  BrightLabel,
  DEFAULT_BD_PRECISION,
  compareBDLabels,
  formatBD,
  formatBDLabel,
  parseBD,
  parseBDLabel,
} from "../displayLabel";
import { BrightDateError } from "../validation";

describe("displayLabel — BD/PBD prefix convention", () => {
  describe("formatBD", () => {
    it("renders zero as canonical 'BD 0'", () => {
      expect(formatBD(0)).toBe(`BD ${(0).toFixed(DEFAULT_BD_PRECISION)}`);
    });

    it("never produces 'PBD 0'", () => {
      // Negative-zero must collapse to BD 0, not PBD 0.
      expect(formatBD(-0)).toBe(`BD ${(0).toFixed(DEFAULT_BD_PRECISION)}`);
    });

    it("renders positive scalars with BD prefix", () => {
      expect(formatBD(9622.504)).toBe("BD 9622.504");
      expect(formatBD(1)).toBe("BD 1.000");
    });

    it("renders negative scalars with PBD prefix and absolute magnitude", () => {
      expect(formatBD(-11125.154)).toBe("PBD 11125.154");
      expect(formatBD(-1)).toBe("PBD 1.000");
    });

    it("respects custom precision", () => {
      expect(formatBD(9622.504, 6)).toBe("BD 9622.504000");
      expect(formatBD(-1, 0)).toBe("PBD 1");
    });

    it("rejects non-finite input", () => {
      expect(() => formatBD(Number.NaN)).toThrow(BrightDateError);
      expect(() => formatBD(Number.POSITIVE_INFINITY)).toThrow(BrightDateError);
    });

    it("rejects fractional or negative precision", () => {
      expect(() => formatBD(0, -1)).toThrow(BrightDateError);
      expect(() => formatBD(0, 1.5)).toThrow(BrightDateError);
    });
  });

  describe("parseBD", () => {
    it("parses BD labels back to non-negative scalars", () => {
      expect(parseBD("BD 0")).toBe(0);
      expect(parseBD("BD 9622.504")).toBe(9622.504);
      expect(parseBD("BD 1.5e3")).toBe(1500);
    });

    it("parses PBD labels back to negative scalars", () => {
      expect(parseBD("PBD 1")).toBe(-1);
      expect(parseBD("PBD 11125.154")).toBe(-11125.154);
    });

    it("tolerates surrounding whitespace", () => {
      expect(parseBD("  BD 1.0  ")).toBe(1);
      expect(parseBD("PBD  2.5")).toBe(-2.5);
    });

    it("rejects PBD 0", () => {
      expect(() => parseBD("PBD 0")).toThrow(BrightDateError);
      expect(() => parseBD("PBD 0.0")).toThrow(BrightDateError);
    });

    it("rejects BD with negative body", () => {
      expect(() => parseBD("BD -1")).toThrow(BrightDateError);
    });

    it("rejects PBD with negative body (would alias BD)", () => {
      expect(() => parseBD("PBD -1")).toThrow(BrightDateError);
    });

    it("rejects unrecognised input", () => {
      expect(() => parseBD("9622.504")).toThrow(BrightDateError);
      expect(() => parseBD("XBD 1")).toThrow(BrightDateError);
      expect(() => parseBD("")).toThrow(BrightDateError);
    });
  });

  describe("round-trip", () => {
    it("formatBD ∘ parseBD is identity for representative values", () => {
      const cases = [0, 1, 9622.504, -1, -11125.154, 1e6, -1e6];
      for (const v of cases) {
        const round = parseBD(formatBD(v, 9));
        expect(round).toBeCloseTo(v, 9);
      }
    });
  });

  describe("formatBDLabel / parseBDLabel", () => {
    it("round-trips a BD label tuple", () => {
      const label: BrightLabel = { kind: "BD", value: 9622.504 };
      const s = formatBDLabel(label);
      expect(s).toBe("BD 9622.504");
      const back = parseBDLabel(s);
      expect(back).toEqual(label);
    });

    it("round-trips a PBD label tuple", () => {
      const label: BrightLabel = { kind: "PBD", value: 11125.154 };
      const s = formatBDLabel(label);
      expect(s).toBe("PBD 11125.154");
      expect(parseBDLabel(s)).toEqual(label);
    });

    it("rejects PBD tuple with non-positive value", () => {
      expect(() => formatBDLabel({ kind: "PBD", value: 0 })).toThrow(
        BrightDateError,
      );
      expect(() => formatBDLabel({ kind: "PBD", value: -1 })).toThrow(
        BrightDateError,
      );
    });

    it("rejects BD tuple with negative value", () => {
      expect(() => formatBDLabel({ kind: "BD", value: -1 })).toThrow(
        BrightDateError,
      );
    });

    it("parseBDLabel returns BD for zero scalar", () => {
      expect(parseBDLabel("BD 0")).toEqual({ kind: "BD", value: 0 });
    });
  });

  describe("compareBDLabels", () => {
    const bd0: BrightLabel = { kind: "BD", value: 0 };
    const bd9k: BrightLabel = { kind: "BD", value: 9622.504 };
    const pbd1: BrightLabel = { kind: "PBD", value: 1 };
    const pbd11k: BrightLabel = { kind: "PBD", value: 11125.154 };

    it("any BD is later than any PBD", () => {
      expect(compareBDLabels(bd0, pbd1)).toBe(1);
      expect(compareBDLabels(pbd11k, bd0)).toBe(-1);
    });

    it("within BD, larger is later", () => {
      expect(compareBDLabels(bd9k, bd0)).toBe(1);
      expect(compareBDLabels(bd0, bd9k)).toBe(-1);
    });

    it("within PBD, smaller is later", () => {
      // PBD 1 (one day before J2000.0) is later than PBD 11125 (Apollo era).
      expect(compareBDLabels(pbd1, pbd11k)).toBe(1);
      expect(compareBDLabels(pbd11k, pbd1)).toBe(-1);
    });

    it("equality", () => {
      expect(compareBDLabels(bd9k, { kind: "BD", value: 9622.504 })).toBe(0);
      expect(compareBDLabels(pbd1, { kind: "PBD", value: 1 })).toBe(0);
    });

    it("agrees with native numeric comparison on the underlying scalars", () => {
      // For each pair, the label compare should match Math.sign(scalarA -
      // scalarB).
      const labels: ReadonlyArray<{ scalar: number; label: BrightLabel }> = [
        { scalar: 0, label: bd0 },
        { scalar: 9622.504, label: bd9k },
        { scalar: -1, label: pbd1 },
        { scalar: -11125.154, label: pbd11k },
      ];
      for (const a of labels) {
        for (const b of labels) {
          const labelOrd = compareBDLabels(a.label, b.label);
          const scalarOrd = Math.sign(a.scalar - b.scalar) as -1 | 0 | 1;
          expect(labelOrd).toBe(scalarOrd);
        }
      }
    });
  });
});
