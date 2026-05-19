/**
 * Tests for the BrightSpace geodesy module.
 *
 * Covers WGS84 constants, geodetic ↔ ECEF conversion (incl. round-trip
 * fuzzing), Euclidean chord distance, great-circle surface distance,
 * and the {@link gpsDistance} convenience.
 */

import * as fc from "fast-check";

import {
  BRIGHT_METER_M,
  SPEED_OF_LIGHT_M_PER_S,
} from "../spacetime";
import {
  EARTH_MEAN_RADIUS_M,
  ecefChordBrightMeters,
  ecefChordMetres,
  ecefToGeodetic,
  geodeticToEcef,
  gpsDistance,
  lightTravelTimeSeconds,
  surfaceDistanceMetres,
  WGS84_FIRST_ECCENTRICITY_SQUARED,
  WGS84_FLATTENING,
  WGS84_INVERSE_FLATTENING,
  WGS84_SEMI_MAJOR_AXIS_M,
  WGS84_SEMI_MINOR_AXIS_M,
} from "../geodesy";

// ─── Reference data ─────────────────────────────────────────────────────────

// NASA GSFC / GODE station, ITRF2020 epoch 2015.0, SOLN 5. The ECEF
// vector is the definitive published quantity; geodetic equivalents are
// derived from it via {@link ecefToGeodetic} and checked for round-trip
// stability rather than against an external published lat/lng pair.
const GODE_ECEF_M = {
  x: 1_130_773.5956,
  y: -4_831_253.5718,
  z: 3_994_200.4453,
} as const;

// City pairs for surface distance sanity checks. Distances quoted to
// nearest km from independent published sources.
const DC = { latitude: 38.8951, longitude: -77.0364 } as const;
const NYC = { latitude: 40.7128, longitude: -74.006 } as const;
const DC_NYC_KM_APPROX = 328; // great-circle, ~328 km

const LONDON = { latitude: 51.5074, longitude: -0.1278 } as const;
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 } as const;
const LONDON_SYDNEY_KM_APPROX = 16_993; // great-circle, ~16,993 km

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("geodesy", () => {
  describe("WGS84 constants", () => {
    it("defines the semi-major axis exactly per the WGS84 standard", () => {
      expect(WGS84_SEMI_MAJOR_AXIS_M).toBe(6_378_137);
    });

    it("defines the inverse flattening to its full conventional precision", () => {
      expect(WGS84_INVERSE_FLATTENING).toBe(298.257223563);
      expect(WGS84_FLATTENING).toBeCloseTo(1 / 298.257223563, 15);
    });

    it("derives the semi-minor axis from a · (1 − f)", () => {
      expect(WGS84_SEMI_MINOR_AXIS_M).toBeCloseTo(6_356_752.314_245, 6);
    });

    it("derives e² = f · (2 − f)", () => {
      expect(WGS84_FIRST_ECCENTRICITY_SQUARED).toBeCloseTo(
        0.006_694_379_990_141_316,
        15,
      );
    });

    it("defines the IUGG mean Earth radius distinctly from the WGS84 axis", () => {
      expect(EARTH_MEAN_RADIUS_M).toBe(6_371_008.8);
      expect(EARTH_MEAN_RADIUS_M).not.toBe(WGS84_SEMI_MAJOR_AXIS_M);
    });
  });

  describe("geodeticToEcef", () => {
    it("places (0°, 0°, 0 m) on the +X axis at the equatorial radius", () => {
      const p = geodeticToEcef({ latitude: 0, longitude: 0, altitude: 0 });
      expect(p.x).toBeCloseTo(WGS84_SEMI_MAJOR_AXIS_M, 6);
      expect(p.y).toBeCloseTo(0, 6);
      expect(p.z).toBeCloseTo(0, 6);
    });

    it("places (0°, 90°E, 0 m) on the +Y axis at the equatorial radius", () => {
      const p = geodeticToEcef({ latitude: 0, longitude: 90, altitude: 0 });
      expect(p.x).toBeCloseTo(0, 6);
      expect(p.y).toBeCloseTo(WGS84_SEMI_MAJOR_AXIS_M, 6);
      expect(p.z).toBeCloseTo(0, 6);
    });

    it("places (0°, 180°, 0 m) on the −X axis at the equatorial radius", () => {
      const p = geodeticToEcef({ latitude: 0, longitude: 180, altitude: 0 });
      expect(p.x).toBeCloseTo(-WGS84_SEMI_MAJOR_AXIS_M, 6);
      expect(p.y).toBeCloseTo(0, 6);
      expect(p.z).toBeCloseTo(0, 6);
    });

    it("places the north pole on the +Z axis at the polar radius", () => {
      const p = geodeticToEcef({ latitude: 90, longitude: 0, altitude: 0 });
      expect(p.x).toBeCloseTo(0, 4);
      expect(p.y).toBeCloseTo(0, 4);
      expect(p.z).toBeCloseTo(WGS84_SEMI_MINOR_AXIS_M, 4);
    });

    it("places the south pole on the −Z axis at the polar radius", () => {
      const p = geodeticToEcef({ latitude: -90, longitude: 0, altitude: 0 });
      expect(p.z).toBeCloseTo(-WGS84_SEMI_MINOR_AXIS_M, 4);
    });

    it("defaults altitude to 0 when omitted", () => {
      const withDefault = geodeticToEcef({ latitude: 0, longitude: 0 });
      const explicit = geodeticToEcef({
        latitude: 0,
        longitude: 0,
        altitude: 0,
      });
      expect(withDefault.x).toBe(explicit.x);
      expect(withDefault.y).toBe(explicit.y);
      expect(withDefault.z).toBe(explicit.z);
    });

    it("matches the GODE station ITRF2020 vector when fed the lat/lng derived from it", () => {
      // The ITRF2020 publication gives the ECEF vector definitively;
      // its geodetic equivalent is what *this module* produces. We
      // verify that geodeticToEcef → ecefToGeodetic → geodeticToEcef is
      // self-consistent at GODE to sub-millimetre tolerance, which is
      // the strongest claim we can make without re-publishing IGS
      // geodetic numbers ourselves.
      const g = ecefToGeodetic(GODE_ECEF_M);
      const p = geodeticToEcef(g);
      expect(p.x).toBeCloseTo(GODE_ECEF_M.x, 6);
      expect(p.y).toBeCloseTo(GODE_ECEF_M.y, 6);
      expect(p.z).toBeCloseTo(GODE_ECEF_M.z, 6);
      // And the recovered geodetic lands in Maryland (~39°N, ~77°W) as
      // a coarse sanity floor.
      expect(g.latitude).toBeGreaterThan(38);
      expect(g.latitude).toBeLessThan(40);
      expect(g.longitude).toBeGreaterThan(-78);
      expect(g.longitude).toBeLessThan(-76);
    });

    it("respects altitude additively along the local normal", () => {
      const surface = geodeticToEcef({ latitude: 0, longitude: 0 });
      const aloft = geodeticToEcef({
        latitude: 0,
        longitude: 0,
        altitude: 1000,
      });
      expect(aloft.x - surface.x).toBeCloseTo(1000, 6);
      expect(aloft.y).toBeCloseTo(0, 6);
      expect(aloft.z).toBeCloseTo(0, 6);
    });
  });

  describe("ecefToGeodetic", () => {
    it("recovers (0°, 0°, 0 m) on the +X axis at the equatorial radius", () => {
      const g = ecefToGeodetic({ x: WGS84_SEMI_MAJOR_AXIS_M, y: 0, z: 0 });
      expect(g.latitude).toBeCloseTo(0, 9);
      expect(g.longitude).toBeCloseTo(0, 9);
      expect(g.altitude).toBeCloseTo(0, 6);
    });

    it("recovers the north pole as latitude +90°", () => {
      const g = ecefToGeodetic({ x: 0, y: 0, z: WGS84_SEMI_MINOR_AXIS_M });
      expect(g.latitude).toBeCloseTo(90, 6);
      expect(g.longitude).toBe(0); // pole guard returns 0
      expect(g.altitude).toBeCloseTo(0, 4);
    });

    it("recovers the south pole as latitude −90°", () => {
      const g = ecefToGeodetic({ x: 0, y: 0, z: -WGS84_SEMI_MINOR_AXIS_M });
      expect(g.latitude).toBeCloseTo(-90, 6);
      expect(g.longitude).toBe(0);
    });

    it("round-trips to geodeticToEcef on the GODE station", () => {
      const g = ecefToGeodetic(GODE_ECEF_M);
      const p = geodeticToEcef(g);
      expect(p.x).toBeCloseTo(GODE_ECEF_M.x, 6);
      expect(p.y).toBeCloseTo(GODE_ECEF_M.y, 6);
      expect(p.z).toBeCloseTo(GODE_ECEF_M.z, 6);
    });
  });

  describe("geodetic ↔ ECEF round-trip (property-based)", () => {
    it(
      "round-trips arbitrary geodetic inputs within sub-millimetre tolerance",
      () => {
        fc.assert(
          fc.property(
            fc.double({ min: -89.9, max: 89.9, noNaN: true }),
            fc.double({ min: -180, max: 180, noNaN: true }),
            fc.double({ min: -100, max: 10_000, noNaN: true }),
            (lat, lon, alt) => {
              const ecef = geodeticToEcef({
                latitude: lat,
                longitude: lon,
                altitude: alt,
              });
              const back = ecefToGeodetic(ecef);
              // 1e-6 deg ≈ 11 cm on the surface; we tolerate that and
              // 1e-3 m (1 mm) on altitude. Bowring's method is well
              // within these bounds.
              expect(back.latitude).toBeCloseTo(lat, 5);
              // Longitude wraps; compare cos/sin to dodge ±180° edge.
              const dLon = ((back.longitude - lon + 540) % 360) - 180;
              expect(Math.abs(dLon)).toBeLessThan(1e-5);
              expect(back.altitude).toBeCloseTo(alt, 3);
            },
          ),
          { numRuns: 200 },
        );
      },
    );
  });

  describe("ecefChordMetres", () => {
    it("returns 0 for identical points", () => {
      const p = { x: 1, y: 2, z: 3 };
      expect(ecefChordMetres(p, p)).toBe(0);
    });

    it("is symmetric in its arguments", () => {
      const a = { x: 100, y: 200, z: 300 };
      const b = { x: -50, y: 75, z: 125 };
      expect(ecefChordMetres(a, b)).toBe(ecefChordMetres(b, a));
    });

    it("matches the analytic distance for axis-aligned offsets", () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 3, y: 4, z: 0 };
      expect(ecefChordMetres(a, b)).toBeCloseTo(5, 12);
    });

    it("equals 2 · R_eq for antipodal equatorial points on the surface", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 180 });
      expect(ecefChordMetres(a, b)).toBeCloseTo(
        2 * WGS84_SEMI_MAJOR_AXIS_M,
        4,
      );
    });
  });

  describe("ecefChordBrightMeters", () => {
    it("equals chord-metres divided by c", () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: SPEED_OF_LIGHT_M_PER_S, y: 0, z: 0 }; // exactly 1 bm
      expect(ecefChordBrightMeters(a, b)).toBeCloseTo(1, 12);
    });

    it("is consistent with ecefChordMetres / BRIGHT_METER_M", () => {
      const a = geodeticToEcef({ latitude: 35, longitude: -100, altitude: 0 });
      const b = geodeticToEcef({ latitude: 50, longitude: 20, altitude: 0 });
      expect(ecefChordBrightMeters(a, b)).toBeCloseTo(
        ecefChordMetres(a, b) / BRIGHT_METER_M,
        15,
      );
    });
  });

  describe("surfaceDistanceMetres", () => {
    it("returns 0 for identical points", () => {
      expect(surfaceDistanceMetres(DC, DC)).toBe(0);
    });

    it("is symmetric in its arguments", () => {
      const ab = surfaceDistanceMetres(DC, NYC);
      const ba = surfaceDistanceMetres(NYC, DC);
      expect(ab).toBeCloseTo(ba, 9);
    });

    it("returns ~328 km for DC ↔ NYC", () => {
      const km = surfaceDistanceMetres(DC, NYC) / 1000;
      expect(km).toBeCloseTo(DC_NYC_KM_APPROX, -1);
    });

    it("returns ~16,993 km for London ↔ Sydney", () => {
      const km = surfaceDistanceMetres(LONDON, SYDNEY) / 1000;
      // Spherical haversine differs from WGS84 geodesic by ≤ 0.5%; allow
      // 100 km of slack (≈ 0.6%) on a 17,000 km baseline.
      expect(Math.abs(km - LONDON_SYDNEY_KM_APPROX)).toBeLessThan(100);
    });

    it("returns π · R for antipodal equatorial points", () => {
      const a = { latitude: 0, longitude: 0 };
      const b = { latitude: 0, longitude: 180 };
      expect(surfaceDistanceMetres(a, b)).toBeCloseTo(
        Math.PI * EARTH_MEAN_RADIUS_M,
        6,
      );
    });

    it("ignores altitude (sphere projection)", () => {
      const ground = surfaceDistanceMetres(DC, NYC);
      const aloft = surfaceDistanceMetres(
        { ...DC, altitude: 10_000 },
        { ...NYC, altitude: 10_000 },
      );
      expect(aloft).toBe(ground);
    });
  });

  describe("lightTravelTimeSeconds", () => {
    it("equals chord / c", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 90 });
      const expected = ecefChordMetres(a, b) / SPEED_OF_LIGHT_M_PER_S;
      expect(lightTravelTimeSeconds(a, b)).toBeCloseTo(expected, 15);
    });

    it("returns 0 for identical points", () => {
      const p = geodeticToEcef({ latitude: 12.34, longitude: 56.78 });
      expect(lightTravelTimeSeconds(p, p)).toBe(0);
    });

    it("equals chord-BrightMeters numerically (1 bm = 1 light-second)", () => {
      const a = geodeticToEcef({ latitude: 10, longitude: 20 });
      const b = geodeticToEcef({ latitude: -30, longitude: 100 });
      expect(lightTravelTimeSeconds(a, b)).toBeCloseTo(
        ecefChordBrightMeters(a, b),
        15,
      );
    });
  });

  describe("gpsDistance", () => {
    it("returns identical chord and surface for coincident points", () => {
      const d = gpsDistance(DC, DC);
      expect(d.chordMetres).toBe(0);
      expect(d.surfaceMetres).toBe(0);
      expect(d.surfaceMinusChordMetres).toBe(0);
      expect(d.lightTravelSeconds).toBe(0);
    });

    it("yields surface ≥ chord for any pair", () => {
      const d = gpsDistance(LONDON, SYDNEY);
      expect(d.surfaceMetres).toBeGreaterThanOrEqual(d.chordMetres);
      expect(d.surfaceMinusChordMetres).toBeGreaterThanOrEqual(0);
    });

    it("derives chordBrightMeters and lightTravelSeconds consistently", () => {
      const d = gpsDistance(DC, NYC);
      expect(d.chordBrightMeters).toBeCloseTo(
        d.chordMetres / BRIGHT_METER_M,
        15,
      );
      expect(d.lightTravelSeconds).toBeCloseTo(
        d.chordMetres / SPEED_OF_LIGHT_M_PER_S,
        15,
      );
      expect(d.lightTravelSeconds).toBeCloseTo(d.chordBrightMeters, 15);
    });

    it("matches a hand-checked light-floor for DC ↔ NYC at ~1.1 ms", () => {
      const d = gpsDistance(DC, NYC);
      // ~328 km chord → ~1.09 ms one-way.
      expect(d.lightTravelSeconds * 1000).toBeGreaterThan(1.0);
      expect(d.lightTravelSeconds * 1000).toBeLessThan(1.2);
    });

    it("collapses to surface ≈ π · R, chord ≈ 2 · R for antipodal pair", () => {
      const a = { latitude: 0, longitude: 0 };
      const b = { latitude: 0, longitude: 180 };
      const d = gpsDistance(a, b);
      expect(d.chordMetres).toBeCloseTo(2 * WGS84_SEMI_MAJOR_AXIS_M, 4);
      expect(d.surfaceMetres).toBeCloseTo(
        Math.PI * EARTH_MEAN_RADIUS_M,
        6,
      );
      // The surface arc is roughly π/2 ≈ 1.571× the chord on antipodes.
      expect(d.surfaceMetres / d.chordMetres).toBeGreaterThan(1.55);
      expect(d.surfaceMetres / d.chordMetres).toBeLessThan(1.58);
    });
  });

  describe("chord properties (property-based)", () => {
    const finiteEcef = fc.record({
      x: fc.double({
        min: -2 * WGS84_SEMI_MAJOR_AXIS_M,
        max: 2 * WGS84_SEMI_MAJOR_AXIS_M,
        noNaN: true,
      }),
      y: fc.double({
        min: -2 * WGS84_SEMI_MAJOR_AXIS_M,
        max: 2 * WGS84_SEMI_MAJOR_AXIS_M,
        noNaN: true,
      }),
      z: fc.double({
        min: -2 * WGS84_SEMI_MAJOR_AXIS_M,
        max: 2 * WGS84_SEMI_MAJOR_AXIS_M,
        noNaN: true,
      }),
    });

    it("ecefChordMetres is non-negative and symmetric", () => {
      fc.assert(
        fc.property(finiteEcef, finiteEcef, (a, b) => {
          const ab = ecefChordMetres(a, b);
          const ba = ecefChordMetres(b, a);
          expect(ab).toBeGreaterThanOrEqual(0);
          expect(ab).toBe(ba);
        }),
        { numRuns: 200 },
      );
    });

    it("ecefChordMetres satisfies the triangle inequality", () => {
      fc.assert(
        fc.property(finiteEcef, finiteEcef, finiteEcef, (a, b, c) => {
          const ab = ecefChordMetres(a, b);
          const bc = ecefChordMetres(b, c);
          const ac = ecefChordMetres(a, c);
          // Allow 1 ULP of slack to absorb floating-point cancellation.
          expect(ac).toBeLessThanOrEqual(ab + bc + 1e-6);
        }),
        { numRuns: 200 },
      );
    });
  });
});


// ─── BrightSpace vector primitives ─────────────────────────────────────────

describe("BrightSpace vector primitives", () => {
  // Pull these from the module under test. They were not needed in the
  // earlier blocks, so import them lazily here to keep the original
  // import block stable.
  const {
    brightSpaceDistance,
    ecefArcMetres,
    ecefArcMetresAtRadius,
    ecefCentralAngle,
    ecefMagnitude,
  } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../geodesy") as typeof import("../geodesy");

  describe("ecefMagnitude", () => {
    it("returns 0 for the zero vector", () => {
      expect(ecefMagnitude({ x: 0, y: 0, z: 0 })).toBe(0);
    });

    it("matches Math.sqrt(x² + y² + z²) for axis-aligned inputs", () => {
      expect(ecefMagnitude({ x: 3, y: 4, z: 0 })).toBeCloseTo(5, 12);
      expect(ecefMagnitude({ x: 1, y: 2, z: 2 })).toBeCloseTo(3, 12);
    });

    it("returns the equatorial radius for an equator-on-surface point", () => {
      const p = geodeticToEcef({ latitude: 0, longitude: 0 });
      expect(ecefMagnitude(p)).toBeCloseTo(WGS84_SEMI_MAJOR_AXIS_M, 6);
    });
  });

  describe("ecefCentralAngle", () => {
    it("returns 0 for identical non-zero vectors", () => {
      const v = { x: 1, y: 2, z: 3 };
      expect(ecefCentralAngle(v, v)).toBeCloseTo(0, 12);
    });

    it("returns π for antipodal equatorial vectors", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 180 });
      expect(ecefCentralAngle(a, b)).toBeCloseTo(Math.PI, 6);
    });

    it("returns π/2 for orthogonal equatorial vectors", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 90 });
      expect(ecefCentralAngle(a, b)).toBeCloseTo(Math.PI / 2, 6);
    });

    it("returns π/2 for equator → north pole", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = { x: 0, y: 0, z: WGS84_SEMI_MINOR_AXIS_M };
      expect(ecefCentralAngle(a, b)).toBeCloseTo(Math.PI / 2, 6);
    });

    it("is symmetric in its arguments", () => {
      const a = geodeticToEcef({ latitude: 12, longitude: 34 });
      const b = geodeticToEcef({ latitude: -56, longitude: 78 });
      expect(ecefCentralAngle(a, b)).toBeCloseTo(
        ecefCentralAngle(b, a),
        12,
      );
    });

    it("scales out — angle is invariant under uniform scaling of either vector", () => {
      const a = geodeticToEcef({ latitude: 30, longitude: 40 });
      const b = geodeticToEcef({ latitude: 50, longitude: 60 });
      const aScaled = { x: a.x * 1000, y: a.y * 1000, z: a.z * 1000 };
      expect(ecefCentralAngle(a, b)).toBeCloseTo(
        ecefCentralAngle(aScaled, b),
        10,
      );
    });

    it("returns NaN when either argument is the zero vector", () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 1, y: 0, z: 0 };
      expect(ecefCentralAngle(a, b)).toBeNaN();
      expect(ecefCentralAngle(b, a)).toBeNaN();
    });

    it("is numerically stable for very small angles (atan2 form)", () => {
      // Two points 100 m apart on the equator should give a tiny but
      // non-zero angle, not catastrophically cancel.
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({
        latitude: 0,
        // 100 m / R_eq, in degrees
        longitude: (100 / WGS84_SEMI_MAJOR_AXIS_M) * (180 / Math.PI),
      });
      const angle = ecefCentralAngle(a, b);
      expect(angle).toBeGreaterThan(1e-8);
      expect(angle).toBeLessThan(1e-4);
    });
  });

  describe("ecefArcMetres / ecefArcMetresAtRadius", () => {
    it("matches surfaceDistanceMetres on the WGS84 surface to within ~1%", () => {
      // surfaceDistanceMetres works on lat/lng with the haversine
      // formula (geodetic latitude). ecefArcMetres works on the ECEF
      // vectors (geocentric latitude). The two answers diverge at the
      // sub-percent level due to ellipsoid flattening — see the
      // ecefArcMetres JSDoc and the property tests below.
      const A = { latitude: 38.8951, longitude: -77.0364 };
      const B = { latitude: 40.7128, longitude: -74.006 };
      const fromGps = surfaceDistanceMetres(A, B);
      const fromEcef = ecefArcMetres(geodeticToEcef(A), geodeticToEcef(B));
      const ratio = fromEcef / fromGps;
      expect(ratio).toBeGreaterThan(0.99);
      expect(ratio).toBeLessThan(1.01);
    });

    it("returns π · R_mean for antipodal equatorial points", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 180 });
      expect(ecefArcMetres(a, b)).toBeCloseTo(
        Math.PI * EARTH_MEAN_RADIUS_M,
        4,
      );
    });

    it("returns 0 for identical vectors", () => {
      const v = geodeticToEcef({ latitude: 12, longitude: 34 });
      expect(ecefArcMetres(v, v)).toBeCloseTo(0, 9);
    });

    it("ecefArcMetresAtRadius scales linearly with the sphere radius", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 90 });
      const r1 = ecefArcMetresAtRadius(a, b, 1_000_000);
      const r2 = ecefArcMetresAtRadius(a, b, 2_000_000);
      expect(r2).toBeCloseTo(2 * r1, 6);
    });

    it("ecefArcMetresAtRadius equals ecefArcMetres when given EARTH_MEAN_RADIUS_M", () => {
      const a = geodeticToEcef({ latitude: 10, longitude: 20 });
      const b = geodeticToEcef({ latitude: -30, longitude: 100 });
      expect(
        ecefArcMetresAtRadius(a, b, EARTH_MEAN_RADIUS_M),
      ).toBeCloseTo(ecefArcMetres(a, b), 9);
    });
  });

  describe("brightSpaceDistance", () => {
    const GODE = {
      x: 1_130_773.5956,
      y: -4_831_253.5718,
      z: 3_994_200.4453,
    };
    const OPMT = {
      x: 4_202_777.4115,
      y: 171_368.4135,
      z: 4_778_660.1903,
    };

    it("returns all-zeros for coincident points", () => {
      const d = brightSpaceDistance(GODE, GODE);
      expect(d.chordMetres).toBe(0);
      expect(d.chordBrightMeters).toBe(0);
      expect(d.centralAngleRadians).toBeCloseTo(0, 12);
      expect(d.arcMeanEarthRadiusMetres).toBeCloseTo(0, 6);
      expect(d.arcAverageRadiusMetres).toBeCloseTo(0, 6);
      expect(d.lightTravelSeconds).toBe(0);
    });

    it("derives chordBrightMeters and lightTravelSeconds from chordMetres consistently", () => {
      const d = brightSpaceDistance(GODE, OPMT);
      expect(d.chordBrightMeters).toBeCloseTo(
        d.chordMetres / BRIGHT_METER_M,
        15,
      );
      expect(d.lightTravelSeconds).toBeCloseTo(
        d.chordMetres / SPEED_OF_LIGHT_M_PER_S,
        15,
      );
      expect(d.lightTravelSeconds).toBeCloseTo(d.chordBrightMeters, 15);
    });

    it("yields arc ≥ chord with both arc flavours", () => {
      const d = brightSpaceDistance(GODE, OPMT);
      expect(d.arcMeanEarthRadiusMetres).toBeGreaterThanOrEqual(
        d.chordMetres,
      );
      expect(d.arcAverageRadiusMetres).toBeGreaterThanOrEqual(
        d.chordMetres,
      );
    });

    it("matches surface-distance for two GPS-derived points within ~1%", () => {
      const A = { latitude: 38.8951, longitude: -77.0364 };
      const B = { latitude: 40.7128, longitude: -74.006 };
      const d = brightSpaceDistance(geodeticToEcef(A), geodeticToEcef(B));
      const fromGps = surfaceDistanceMetres(A, B);
      const ratio = d.arcMeanEarthRadiusMetres / fromGps;
      // Geodetic vs geocentric latitude divergence puts these
      // formulae within a ~1% envelope; see the property tests below
      // for the principled bound.
      expect(ratio).toBeGreaterThan(0.99);
      expect(ratio).toBeLessThan(1.01);
    });

    it("arcAverageRadius ≥ arcMeanEarthRadius for points above the surface", () => {
      // Both points lifted to ~400 km (rough ISS altitude). The
      // average-radius arc should be larger than the mean-Earth one
      // for the same central angle, because the radius is larger.
      const liftA = geodeticToEcef({
        latitude: 40,
        longitude: -75,
        altitude: 400_000,
      });
      const liftB = geodeticToEcef({
        latitude: 50,
        longitude: 10,
        altitude: 400_000,
      });
      const d = brightSpaceDistance(liftA, liftB);
      expect(d.arcAverageRadiusMetres).toBeGreaterThan(
        d.arcMeanEarthRadiusMetres,
      );
    });

    it("collapses to π · R for antipodal equatorial pair", () => {
      const a = geodeticToEcef({ latitude: 0, longitude: 0 });
      const b = geodeticToEcef({ latitude: 0, longitude: 180 });
      const d = brightSpaceDistance(a, b);
      expect(d.centralAngleRadians).toBeCloseTo(Math.PI, 6);
      expect(d.chordMetres).toBeCloseTo(2 * WGS84_SEMI_MAJOR_AXIS_M, 4);
      expect(d.arcMeanEarthRadiusMetres).toBeCloseTo(
        Math.PI * EARTH_MEAN_RADIUS_M,
        4,
      );
    });

    it("is symmetric in its arguments", () => {
      const ab = brightSpaceDistance(GODE, OPMT);
      const ba = brightSpaceDistance(OPMT, GODE);
      expect(ab.chordMetres).toBeCloseTo(ba.chordMetres, 9);
      expect(ab.centralAngleRadians).toBeCloseTo(
        ba.centralAngleRadians,
        12,
      );
      expect(ab.arcMeanEarthRadiusMetres).toBeCloseTo(
        ba.arcMeanEarthRadiusMetres,
        9,
      );
      expect(ab.arcAverageRadiusMetres).toBeCloseTo(
        ba.arcAverageRadiusMetres,
        9,
      );
    });
  });

  describe("brightSpaceDistance vs gpsDistance (consistency)", () => {
    it(
      "ecef-arc agrees with haversine-arc on the equator (where geodetic ≡ geocentric latitude)",
      () => {
        // On the equator, geodetic and geocentric latitude coincide,
        // so the two formulae must agree to floating-point tolerance.
        fc.assert(
          fc.property(
            fc.double({ min: -180, max: 180, noNaN: true }),
            fc.double({ min: -180, max: 180, noNaN: true }),
            (lonA, lonB) => {
              const A = { latitude: 0, longitude: lonA };
              const B = { latitude: 0, longitude: lonB };
              const fromGps = surfaceDistanceMetres(A, B);
              const fromEcef = ecefArcMetres(
                geodeticToEcef(A),
                geodeticToEcef(B),
              );
              if (fromGps === 0) {
                expect(fromEcef).toBeCloseTo(0, 6);
                return;
              }
              expect(fromEcef).toBeCloseTo(fromGps, 1); // ≤ 0.1 m
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      "ecef-arc collapses toward the chord in the small-angle limit (close pairs)",
      () => {
        // For points within ~10 km on the surface, arc/chord ratios
        // hover near 1.0; the second-order term is tiny and
        // dominated by floating-point precision of the input
        // magnitudes. We test a deterministic close pair rather than
        // a property because the precision floor `(R · eps) / chord`
        // dominates for sub-mm baselines and shrinkers find them.
        const a = geodeticToEcef({ latitude: 38.8951, longitude: -77.0364 });
        const b = geodeticToEcef({ latitude: 38.9, longitude: -77.0 });
        const chord = ecefChordMetres(a, b);
        const arc = ecefArcMetres(a, b);
        expect(chord).toBeGreaterThan(0);
        expect(arc).toBeGreaterThanOrEqual(chord * (1 - 1e-9));
        expect(arc / chord).toBeLessThan(1.001);
      },
    );

    it(
      "ecef-arc and haversine-arc agree to ~1% for short, mid-latitude pairs",
      () => {
        // For short baselines (≤ ~1°) at any reasonable latitude, the
        // geodetic-vs-geocentric latitude difference produces a
        // sub-percent disagreement (the leading term is f·sin(2φ),
        // which peaks near ~0.7% at 45° latitude). Antipodal pairs
        // amplify the difference, which is the right behaviour — this
        // test only asserts on the regime where both formulae are
        // operating in their sweet spot.
        fc.assert(
          fc.property(
            fc.double({ min: -60, max: 60, noNaN: true }),
            fc.double({ min: -180, max: 180, noNaN: true }),
            fc.double({ min: -1, max: 1, noNaN: true }),
            fc.double({ min: -1, max: 1, noNaN: true }),
            (lat, lon, dLat, dLon) => {
              const A = { latitude: lat, longitude: lon };
              const B = { latitude: lat + dLat, longitude: lon + dLon };
              const fromGps = surfaceDistanceMetres(A, B);
              const fromEcef = ecefArcMetres(
                geodeticToEcef(A),
                geodeticToEcef(B),
              );
              if (fromGps < 1) return; // skip near-coincident
              const ratio = fromEcef / fromGps;
              expect(ratio).toBeGreaterThan(0.99);
              expect(ratio).toBeLessThan(1.01);
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
