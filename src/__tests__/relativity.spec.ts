/**
 * Tests for the relativity module — Minkowski intervals, Lorentz boosts,
 * proper time, and velocity composition.
 */

import {
  addVelocities,
  boost,
  causallyConnected,
  dopplerFactor,
  gamma,
  intervalKind,
  intervalSquared,
  properDistanceBetween,
  properTimeAlong,
  properTimeBetween,
  rapidity,
  speed,
  type SpacetimeEvent,
} from "../relativity";

const origin: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };

describe("relativity", () => {
  describe("intervalSquared & classification", () => {
    it("vanishes between an event and itself", () => {
      expect(intervalSquared(origin, origin)).toBe(0);
    });

    it("is negative for timelike separation (Δt > Δx)", () => {
      const future: SpacetimeEvent = { t: 10, x: 3, y: 0, z: 0 };
      expect(intervalSquared(origin, future)).toBeLessThan(0);
      expect(intervalKind(origin, future)).toBe("timelike");
      expect(causallyConnected(origin, future)).toBe(true);
    });

    it("is positive for spacelike separation (Δx > Δt)", () => {
      const elsewhere: SpacetimeEvent = { t: 1, x: 10, y: 0, z: 0 };
      expect(intervalSquared(origin, elsewhere)).toBeGreaterThan(0);
      expect(intervalKind(origin, elsewhere)).toBe("spacelike");
      expect(causallyConnected(origin, elsewhere)).toBe(false);
    });

    it("vanishes exactly on the light cone", () => {
      const onCone: SpacetimeEvent = { t: 5, x: 3, y: 4, z: 0 };
      expect(intervalSquared(origin, onCone)).toBe(0);
      expect(intervalKind(origin, onCone)).toBe("lightlike");
    });

    it("respects tolerance for near-lightlike events", () => {
      const nearCone: SpacetimeEvent = { t: 5, x: 3, y: 4, z: 1e-9 };
      expect(intervalKind(origin, nearCone)).toBe("spacelike");
      expect(intervalKind(origin, nearCone, 1e-6)).toBe("lightlike");
    });
  });

  describe("proper time and distance", () => {
    it("gives Δt for two events at the same location", () => {
      const a: SpacetimeEvent = { t: 0, x: 5, y: 0, z: 0 };
      const b: SpacetimeEvent = { t: 7, x: 5, y: 0, z: 0 };
      expect(properTimeBetween(a, b)).toBe(7);
    });

    it("gives Δx for two simultaneous events", () => {
      const a: SpacetimeEvent = { t: 2, x: 0, y: 0, z: 0 };
      const b: SpacetimeEvent = { t: 2, x: 10, y: 0, z: 0 };
      expect(properDistanceBetween(a, b)).toBe(10);
    });

    it("returns NaN for spacelike proper time", () => {
      const a: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };
      const b: SpacetimeEvent = { t: 1, x: 10, y: 0, z: 0 };
      expect(properTimeBetween(a, b)).toBeNaN();
    });

    it("returns NaN for timelike proper distance", () => {
      const a: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };
      const b: SpacetimeEvent = { t: 10, x: 1, y: 0, z: 0 };
      expect(properDistanceBetween(a, b)).toBeNaN();
    });

    it("sums proper time along a piecewise-linear worldline", () => {
      // Twin "paradox": one segment out at β=0.6, one segment back.
      // Coordinate time = 2T; proper time = 2T/γ.
      const T = 10;
      const beta = 0.6;
      const out: SpacetimeEvent = { t: T, x: beta * T, y: 0, z: 0 };
      const back: SpacetimeEvent = { t: 2 * T, x: 0, y: 0, z: 0 };
      const traveller = properTimeAlong([origin, out, back]);
      const expected = (2 * T) / gamma(beta);
      expect(traveller).toBeCloseTo(expected, 10);
      // The stay-at-home twin ages 2T = 20.
      expect(traveller).toBeLessThan(2 * T);
    });
  });

  describe("velocity helpers", () => {
    it("speed is Euclidean magnitude", () => {
      expect(speed([0.3, 0.4, 0])).toBeCloseTo(0.5, 12);
    });

    it("gamma = 1 at rest, grows toward Infinity at c", () => {
      expect(gamma(0)).toBe(1);
      expect(gamma(0.5)).toBeCloseTo(1.1547005383792515, 12);
      expect(gamma(1)).toBe(Number.POSITIVE_INFINITY);
      expect(gamma(1.5)).toBeNaN();
    });

    it("rapidity is additive under collinear boosts", () => {
      const u = 0.4;
      const v = 0.3;
      const composed = addVelocities(u, v);
      expect(rapidity(composed)).toBeCloseTo(rapidity(u) + rapidity(v), 12);
    });

    it("addVelocities is closed on (−1, 1)", () => {
      expect(addVelocities(0.9, 0.9)).toBeLessThan(1);
      expect(addVelocities(0.9, 0.9)).toBeGreaterThan(0);
    });
  });

  describe("Lorentz boost", () => {
    it("is the identity at β = 0", () => {
      const e: SpacetimeEvent = { t: 3, x: 5, y: -2, z: 7 };
      const boosted = boost(e, [0, 0, 0]);
      expect(boosted).toEqual(e);
    });

    it("preserves the spacetime interval (the defining property)", () => {
      const a: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };
      const b: SpacetimeEvent = { t: 10, x: 3, y: -2, z: 1 };
      const beta: [number, number, number] = [0.5, 0.2, -0.1];
      const aPrime = boost(a, beta);
      const bPrime = boost(b, beta);
      expect(intervalSquared(aPrime, bPrime)).toBeCloseTo(
        intervalSquared(a, b),
        9,
      );
    });

    it("matches the 1D textbook formula for an x-boost", () => {
      const beta = 0.6;
      const g = gamma(beta);
      const e: SpacetimeEvent = { t: 4, x: 5, y: 0, z: 0 };
      const result = boost(e, [beta, 0, 0]);
      expect(result.t).toBeCloseTo(g * (e.t - beta * e.x), 12);
      expect(result.x).toBeCloseTo(g * (e.x - beta * e.t), 12);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it("two opposite boosts are the identity", () => {
      const e: SpacetimeEvent = { t: 2, x: 1.5, y: -0.5, z: 0.25 };
      const beta: [number, number, number] = [0.4, 0, 0];
      const inverse: [number, number, number] = [-0.4, 0, 0];
      const round = boost(boost(e, beta), inverse);
      expect(round.t).toBeCloseTo(e.t, 12);
      expect(round.x).toBeCloseTo(e.x, 12);
      expect(round.y).toBeCloseTo(e.y, 12);
      expect(round.z).toBeCloseTo(e.z, 12);
    });

    it("throws for superluminal β", () => {
      expect(() => boost(origin, [1.1, 0, 0])).toThrow();
    });
  });

  describe("Doppler factor", () => {
    it("equals 1 at rest", () => {
      expect(dopplerFactor(0)).toBe(1);
    });

    it("redshifts a receding source (β > 0 → factor < 1)", () => {
      expect(dopplerFactor(0.5)).toBeCloseTo(Math.sqrt(1 / 3), 12);
    });

    it("blueshifts an approaching source (β < 0 → factor > 1)", () => {
      expect(dopplerFactor(-0.5)).toBeCloseTo(Math.sqrt(3), 12);
    });

    it("is NaN at and beyond the light cone", () => {
      expect(dopplerFactor(1)).toBeNaN();
      expect(dopplerFactor(-1.2)).toBeNaN();
    });
  });
});
