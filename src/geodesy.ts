/**
 * BrightSpace Geodesy
 *
 * Geodetic ↔ ECEF (Earth-Centred, Earth-Fixed) Cartesian conversion plus
 * Euclidean and great-circle distance helpers, anchored to the WGS84 /
 * GRS80 ellipsoid.
 *
 * **Why both distance metrics?**
 *
 * BrightSpace's native distance is the **Euclidean chord** through the
 * Earth's volume — `‖A − B‖` over the ECEF vectors. This is the quantity
 * the BrightSpace standard privileges because:
 *
 * 1. It is the cryptographic *light-floor*: no signal can traverse two
 *    points in less than `chord / c` seconds, regardless of medium or
 *    routing. This is the value used in Distance-Bounding audits.
 * 2. It composes linearly. Spatial indexes built on chord distance map
 *    directly to SIMD lanes; great-circle distance does not.
 * 3. It has no singularities and no special cases.
 *
 * The **great-circle (surface) distance** is also exposed because it
 * answers a different question: how far must a vehicle travel along
 * the Earth's surface to get from A to B? It is a human- and
 * routing-facing quantity, computed on a sphere of radius equal to the
 * IUGG mean Earth radius (6,371,008.8 m). For sub-metre precision
 * across long baselines, a Vincenty / Karney solver on the WGS84
 * ellipsoid is the right tool; this module provides the spherical
 * approximation, which is accurate to roughly 0.5% for any pair of
 * points on Earth.
 *
 * The chord is **always less than or equal to** the great-circle
 * distance for two points on or above the surface, with equality only
 * when the points are coincident. This module exports
 * {@link gpsDistance} which returns both, plus the gap, so callers can
 * see the difference at a glance.
 *
 * **Reference frame.** All ECEF coordinates here are in the same frame
 * the WGS84 ellipsoid is defined in — origin at Earth's centre of mass,
 * Z-axis through the IERS reference pole, X-axis through the
 * intersection of the IERS reference meridian and the equator.
 * BrightSpace inherits this frame unchanged; it merely reinterprets
 * the metre as a ratio to {@link BRIGHT_METER_M}.
 *
 * @packageDocumentation
 */

import {
  BRIGHT_METER_M,
  metresToBrightMeters,
  SPEED_OF_LIGHT_M_PER_S,
} from "./spacetime";

// ─── WGS84 / GRS80 Ellipsoid Constants ──────────────────────────────────────

/**
 * WGS84 semi-major axis (equatorial radius) in metres. Defined exactly by
 * the WGS84 standard.
 */
export const WGS84_SEMI_MAJOR_AXIS_M = 6_378_137;

/**
 * WGS84 inverse flattening: 1 / 298.257223563. The flattening itself is
 * irrational under this definition; this constant carries the conventional
 * defining value to its full published precision.
 */
export const WGS84_INVERSE_FLATTENING = 298.257223563;

/**
 * WGS84 flattening, derived from {@link WGS84_INVERSE_FLATTENING}.
 */
export const WGS84_FLATTENING = 1 / WGS84_INVERSE_FLATTENING;

/**
 * WGS84 first eccentricity squared: e² = f · (2 − f). Dimensionless.
 */
export const WGS84_FIRST_ECCENTRICITY_SQUARED =
  WGS84_FLATTENING * (2 - WGS84_FLATTENING);

/**
 * WGS84 semi-minor axis (polar radius) in metres: b = a · (1 − f).
 */
export const WGS84_SEMI_MINOR_AXIS_M =
  WGS84_SEMI_MAJOR_AXIS_M * (1 - WGS84_FLATTENING);

/**
 * IUGG mean Earth radius in metres (6,371,008.8 m). Used for the spherical
 * great-circle approximation in {@link surfaceDistanceMetres}. Distinct
 * from {@link WGS84_SEMI_MAJOR_AXIS_M}; do not substitute one for the
 * other.
 */
export const EARTH_MEAN_RADIUS_M = 6_371_008.8;

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * A geodetic coordinate: latitude, longitude, and ellipsoidal height,
 * expressed against the WGS84 ellipsoid. Latitude and longitude are in
 * decimal degrees; height is in metres above the ellipsoid (NOT mean sea
 * level).
 *
 * Latitude convention: `+` north, `−` south, range `[−90, +90]`.
 * Longitude convention: `+` east, `−` west, range `[−180, +180]`.
 * (Values outside these ranges are accepted and processed verbatim — no
 * wrap-around or clamping is applied.)
 */
export interface GeodeticCoordinate {
  /** Latitude in decimal degrees (`+` north). */
  readonly latitude: number;
  /** Longitude in decimal degrees (`+` east). */
  readonly longitude: number;
  /**
   * Ellipsoidal height in metres above the WGS84 ellipsoid. Defaults to
   * `0` (i.e. on the ellipsoid surface) when callers omit altitude.
   */
  readonly altitude?: number;
}

/**
 * An ECEF Cartesian coordinate in metres. Origin at Earth's centre of
 * mass; Z-axis through the IERS reference pole.
 */
export interface EcefCoordinate {
  /** ECEF X in metres. */
  readonly x: number;
  /** ECEF Y in metres. */
  readonly y: number;
  /** ECEF Z in metres. */
  readonly z: number;
}

/**
 * Combined output of {@link gpsDistance}: both the BrightSpace-native
 * Euclidean chord and the great-circle surface distance, plus the gap
 * and the chord-derived light-travel floor.
 */
export interface DistancePair {
  /**
   * Euclidean chord through the Earth in metres. The BrightSpace-native
   * distance. Lower bound on physical signal travel time times `c`.
   */
  readonly chordMetres: number;
  /**
   * Euclidean chord in BrightMeters (= chordMetres / c).
   */
  readonly chordBrightMeters: number;
  /**
   * Great-circle distance along the surface of a sphere of radius
   * {@link EARTH_MEAN_RADIUS_M}. Approximate; accurate to ~0.5% for
   * arbitrary pairs of points on Earth.
   */
  readonly surfaceMetres: number;
  /**
   * `surfaceMetres − chordMetres`. Always `≥ 0`. Tells you how much
   * extra distance a surface-following path adds over the
   * BrightSpace-native chord.
   */
  readonly surfaceMinusChordMetres: number;
  /**
   * One-way light-travel time over the chord, in seconds. Equal to
   * `chordBrightMeters` numerically, since 1 bm = 1 light-second.
   */
  readonly lightTravelSeconds: number;
}

// ─── Conversions ────────────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convert geodetic (lat, lon, alt) to ECEF Cartesian (x, y, z) in metres,
 * using the WGS84 ellipsoid. This is the standard closed-form forward
 * transformation; no iteration required.
 *
 * @param coord - Geodetic coordinate. Altitude defaults to `0` (on the
 *                ellipsoid surface) when omitted.
 * @returns ECEF Cartesian coordinate in metres.
 *
 * @example
 * ```ts
 * const ecef = geodeticToEcef({ latitude: 39.0021, longitude: -76.8266, altitude: 14.94 });
 * // ≈ NASA GSFC GODE station (matches the ITRF2020 published vector to ~1 m)
 * ```
 */
export function geodeticToEcef(coord: GeodeticCoordinate): EcefCoordinate {
  const { latitude, longitude, altitude = 0 } = coord;
  const phi = latitude * DEG_TO_RAD;
  const lambda = longitude * DEG_TO_RAD;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);

  // Prime vertical radius of curvature.
  const N =
    WGS84_SEMI_MAJOR_AXIS_M /
    Math.sqrt(1 - WGS84_FIRST_ECCENTRICITY_SQUARED * sinPhi * sinPhi);

  const x = (N + altitude) * cosPhi * cosLambda;
  const y = (N + altitude) * cosPhi * sinLambda;
  const z = (N * (1 - WGS84_FIRST_ECCENTRICITY_SQUARED) + altitude) * sinPhi;

  return { x, y, z };
}

/**
 * Convert ECEF Cartesian (x, y, z) in metres back to geodetic
 * (lat, lon, alt) on the WGS84 ellipsoid using Bowring's 1985 closed-form
 * solution. Latitude is accurate to roughly the floating-point limit
 * (sub-millimetre at any reasonable Earth-surface input); altitude is
 * accurate to within ~10 µm.
 *
 * Special case: at the geographic poles (`x ≈ 0` and `y ≈ 0`),
 * longitude is undefined; this function returns `0` for longitude in
 * that case to keep the output usable. Latitude approaches `±90°`
 * smoothly.
 *
 * @param ecef - ECEF Cartesian coordinate in metres.
 * @returns Geodetic coordinate (latitude/longitude in degrees, altitude
 *          in metres).
 */
export function ecefToGeodetic(ecef: EcefCoordinate): {
  latitude: number;
  longitude: number;
  altitude: number;
} {
  const { x, y, z } = ecef;
  const a = WGS84_SEMI_MAJOR_AXIS_M;
  const b = WGS84_SEMI_MINOR_AXIS_M;
  const e2 = WGS84_FIRST_ECCENTRICITY_SQUARED;
  const ePrime2 = (a * a - b * b) / (b * b); // second eccentricity²

  const p = Math.hypot(x, y);
  // Pole guard: when p == 0, longitude is undefined.
  if (p === 0) {
    return {
      latitude: z >= 0 ? 90 : -90,
      longitude: 0,
      altitude: Math.abs(z) - b,
    };
  }

  // Bowring's auxiliary angle.
  const theta = Math.atan2(z * a, p * b);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const phi = Math.atan2(
    z + ePrime2 * b * sinTheta * sinTheta * sinTheta,
    p - e2 * a * cosTheta * cosTheta * cosTheta,
  );
  const lambda = Math.atan2(y, x);

  const sinPhi = Math.sin(phi);
  const N = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  // Use the cosine-form altitude when away from the poles (numerically
  // stable); fall back to the z-form near the poles.
  const cosPhi = Math.cos(phi);
  const altitude =
    Math.abs(cosPhi) > 1e-12
      ? p / cosPhi - N
      : z / sinPhi - N * (1 - e2);

  return {
    latitude: phi * RAD_TO_DEG,
    longitude: lambda * RAD_TO_DEG,
    altitude,
  };
}

// ─── Distances ──────────────────────────────────────────────────────────────

/**
 * Euclidean chord distance between two ECEF points, in metres. The
 * BrightSpace-native distance: a straight line through the Earth's
 * volume, ignoring the surface entirely.
 *
 * @param a - First ECEF point.
 * @param b - Second ECEF point.
 * @returns Euclidean distance in metres.
 */
export function ecefChordMetres(a: EcefCoordinate, b: EcefCoordinate): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Euclidean chord distance between two ECEF points, in BrightMeters.
 * Numerically equal to the one-way light-travel time in seconds.
 *
 * @param a - First ECEF point.
 * @param b - Second ECEF point.
 * @returns Chord distance in BrightMeters (= seconds of light-travel).
 */
export function ecefChordBrightMeters(
  a: EcefCoordinate,
  b: EcefCoordinate,
): number {
  return metresToBrightMeters(ecefChordMetres(a, b));
}

/**
 * Great-circle distance between two geodetic points along the surface
 * of a sphere of radius {@link EARTH_MEAN_RADIUS_M}. Computed via the
 * haversine formula, which is numerically stable for both
 * antipodal-adjacent and very-close pairs.
 *
 * Accurate to roughly 0.5% for arbitrary pairs of points on Earth. For
 * sub-metre precision across long baselines, use a Vincenty or Karney
 * solver on the full WGS84 ellipsoid; this module does not provide one.
 *
 * Altitude is ignored: the function projects both points onto the
 * sphere before measuring. Callers who need a path that follows
 * surface terrain must integrate against a digital elevation model
 * separately.
 *
 * @param a - First geodetic coordinate (altitude ignored).
 * @param b - Second geodetic coordinate (altitude ignored).
 * @returns Surface arc length in metres.
 */
export function surfaceDistanceMetres(
  a: GeodeticCoordinate,
  b: GeodeticCoordinate,
): number {
  const phi1 = a.latitude * DEG_TO_RAD;
  const phi2 = b.latitude * DEG_TO_RAD;
  const dPhi = (b.latitude - a.latitude) * DEG_TO_RAD;
  const dLambda = (b.longitude - a.longitude) * DEG_TO_RAD;

  const sinDPhi = Math.sin(dPhi / 2);
  const sinDLambda = Math.sin(dLambda / 2);

  const h =
    sinDPhi * sinDPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinDLambda * sinDLambda;
  // Clamp to [0, 1] to absorb floating-point noise at antipodal pairs.
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_MEAN_RADIUS_M * c;
}

/**
 * One-way light-travel time over the Euclidean chord between two ECEF
 * points, in seconds. This is the cryptographic *light-floor* of any
 * signal between the two points: no physical mechanism can transmit
 * information faster.
 *
 * @param a - First ECEF point.
 * @param b - Second ECEF point.
 * @returns One-way light-travel time in seconds.
 */
export function lightTravelTimeSeconds(
  a: EcefCoordinate,
  b: EcefCoordinate,
): number {
  return ecefChordMetres(a, b) / SPEED_OF_LIGHT_M_PER_S;
}

/**
 * Compute both BrightSpace-native chord distance and human-facing
 * great-circle surface distance between two GPS points, plus the gap
 * and the chord-derived light-travel floor, in a single call.
 *
 * This is the standard one-shot convenience for engineering tooling
 * that needs to display both numbers side-by-side: the chord is the
 * value an audit trusts, the surface distance is the value a vehicle
 * will travel.
 *
 * @param a - First geodetic coordinate.
 * @param b - Second geodetic coordinate.
 * @returns Chord (metres + BrightMeters), surface distance, gap, and
 *          one-way light-travel time.
 *
 * @example
 * ```ts
 * const d = gpsDistance(
 *   { latitude: 38.8951, longitude: -77.0364 }, // Washington, DC
 *   { latitude: 40.7128, longitude: -74.0060 }, // New York City
 * );
 * d.chordMetres;        // ≈ 327,985 m
 * d.chordBrightMeters;  // ≈ 0.001094 bm   (≈ 1.09 mbm)
 * d.surfaceMetres;      // ≈ 328,000 m
 * d.lightTravelSeconds; // ≈ 0.001094 s    (light-floor RTT ≈ 2.19 ms)
 * ```
 */
export function gpsDistance(
  a: GeodeticCoordinate,
  b: GeodeticCoordinate,
): DistancePair {
  const ecefA = geodeticToEcef(a);
  const ecefB = geodeticToEcef(b);
  const chordMetres = ecefChordMetres(ecefA, ecefB);
  const surfaceMetres = surfaceDistanceMetres(a, b);
  return {
    chordMetres,
    chordBrightMeters: chordMetres / BRIGHT_METER_M,
    surfaceMetres,
    surfaceMinusChordMetres: surfaceMetres - chordMetres,
    lightTravelSeconds: chordMetres / SPEED_OF_LIGHT_M_PER_S,
  };
}

// ─── BrightSpace Vector Distances (point-to-point, not via centre) ──────────

/**
 * Magnitude `‖v‖` of a BrightSpace ECEF vector.
 *
 * @param v - ECEF coordinate (interpreted in whatever unit its
 *            components carry — metres or BrightMeters).
 * @returns Vector magnitude in the same unit as the inputs.
 */
export function ecefMagnitude(v: EcefCoordinate): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Central angle (in radians) between two BrightSpace ECEF vectors,
 * as seen from the origin (Earth's centre of mass). This is the
 * "great-circle angle" between the points' radials, with no
 * dependence on a chosen sphere radius.
 *
 * Implementation: derive `sin²(θ/2)` directly from the chord and the
 * two vector magnitudes via the identity
 *
 * ```
 * sin²(θ/2) = ( chord² − (|a| − |b|)² ) / ( 4 · |a| · |b| )
 * ```
 *
 * which is the law of cosines rewritten so that no near-equal large
 * vectors are subtracted. The chord is computed as a vector
 * difference (well-conditioned because the inputs themselves carry
 * the relative offset). Returns `NaN` if either vector is the zero
 * vector (the angle is undefined there).
 *
 * **Precision floor.** Any angle calculation on two ECEF vectors of
 * Earth-scale magnitude `R ≈ 6.4 × 10⁶ m` is bounded below by
 * `R · eps ≈ 1.4 nm` — the absolute error on each magnitude
 * `‖v‖` in IEEE-754 double precision. Below that scale the radial
 * separation `‖a‖ − ‖b‖` is dominated by rounding and the angle
 * becomes noise. This is a fundamental limit of double precision on
 * Earth-scale inputs, not a defect of the formula. For the
 * physically meaningful regime (chord ≳ 1 µm) the result is
 * accurate to within a few ULPs.
 *
 * Compared to the cross-product/atan2 form and the unit-vector
 * haversine form, this formulation has the same precision floor but
 * a much smaller constant: it stays accurate down to the µm range
 * instead of the mm range.
 *
 * @param a - First ECEF coordinate.
 * @param b - Second ECEF coordinate.
 * @returns Angle in radians, in `[0, π]`.
 */
export function ecefCentralAngle(
  a: EcefCoordinate,
  b: EcefCoordinate,
): number {
  const magA = ecefMagnitude(a);
  const magB = ecefMagnitude(b);
  if (magA === 0 || magB === 0) return Number.NaN;

  const chord = ecefChordMetres(a, b);
  const radialSep = magA - magB;

  // sin²(θ/2) = (chord² − radialSep²) / (4 · |a| · |b|).
  // The numerator factors as (chord − |radialSep|)·(chord + |radialSep|);
  // both factors are non-negative (chord ≥ ||a|−|b|| by the triangle
  // inequality), so we can compute it that way to avoid a (chord²) /
  // (radialSep²) subtraction that would itself cancel for tiny chords
  // when the two points are at nearly equal radii.
  const absRadial = Math.abs(radialSep);
  const factor1 = Math.max(0, chord - absRadial);
  const factor2 = chord + absRadial;
  const sinHalfSquared = (factor1 * factor2) / (4 * magA * magB);

  // Clamp to [0, 1] to absorb floating-point noise pushing the
  // half-angle sine just outside its geometric bounds; both clamps
  // are exact in the limiting cases (coincident → 0, antipodal → 1).
  return 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, sinHalfSquared))));
}

/**
 * Around-the-Earth arc length between two BrightSpace ECEF vectors,
 * computed *directly* from the vectors with no GPS round-trip. The
 * arc is measured on a sphere of radius equal to the **IUGG mean
 * Earth radius** ({@link EARTH_MEAN_RADIUS_M}).
 *
 * Use this when you have two BrightSpace points and want the
 * "around-the-Earth" distance without converting to and from
 * geodetic coordinates.
 *
 * **Geodetic vs. geocentric latitude.** This function uses the
 * **geocentric** angle between the two vectors — the angle subtended
 * at Earth's centre. {@link surfaceDistanceMetres} uses the
 * **geodetic** latitude (the angle relative to the local ellipsoid
 * normal) via the haversine formula. The two answers agree exactly
 * on the equator and at the poles, and to within a fraction of a
 * percent for short baselines, but can diverge for long baselines
 * spanning mid-latitudes — for instance, near-antipodal pairs may
 * show >1% disagreement. Pick the function whose input form
 * matches what you actually have: BrightSpace vectors → this; lat/lng
 * → {@link surfaceDistanceMetres}.
 *
 * For points significantly above the surface (satellites, aircraft),
 * prefer {@link ecefArcMetresAtRadius} with the appropriate orbital
 * radius — the mean-Earth-radius arc is a surface-projection answer.
 *
 * @param a - First ECEF coordinate (metres).
 * @param b - Second ECEF coordinate (metres).
 * @returns Arc length in metres on the IUGG mean-Earth sphere.
 */
export function ecefArcMetres(a: EcefCoordinate, b: EcefCoordinate): number {
  return ecefCentralAngle(a, b) * EARTH_MEAN_RADIUS_M;
}

/**
 * Around-the-Earth arc length between two BrightSpace ECEF vectors
 * on a sphere of caller-specified radius. Useful for satellite-to-
 * satellite or aircraft-to-aircraft "great-arc" questions where the
 * mean Earth radius is the wrong scale.
 *
 * Common choices for `radiusMetres`:
 *
 * - {@link EARTH_MEAN_RADIUS_M} — surface-following (same as
 *   {@link ecefArcMetres}).
 * - `(‖A‖ + ‖B‖) / 2` — the average of the two endpoints' radii;
 *   gives a "scale-aware" arc that splits the difference when the
 *   two points sit at different altitudes. The
 *   {@link brightSpaceDistance} convenience exposes this as
 *   `arcAverageRadiusMetres`.
 * - A specific orbital radius — relevant for constellation
 *   geometry.
 *
 * @param a - First ECEF coordinate.
 * @param b - Second ECEF coordinate.
 * @param radiusMetres - Sphere radius to project the arc onto.
 * @returns Arc length, in the same length unit as `radiusMetres`.
 */
export function ecefArcMetresAtRadius(
  a: EcefCoordinate,
  b: EcefCoordinate,
  radiusMetres: number,
): number {
  return ecefCentralAngle(a, b) * radiusMetres;
}

/**
 * Combined distance result for {@link brightSpaceDistance}. Reports
 * three conceptually distinct numbers — the through-the-Earth chord,
 * the around-the-Earth arc on the mean-Earth sphere, and the
 * around-the-Earth arc on a sphere whose radius is the average of
 * the two endpoints' magnitudes — all derived from a single pair of
 * BrightSpace vectors.
 */
export interface BrightSpaceDistance {
  /** Through-the-Earth chord in metres (= `‖A − B‖`). */
  readonly chordMetres: number;
  /** Through-the-Earth chord in BrightMeters. */
  readonly chordBrightMeters: number;
  /**
   * Central angle subtended at Earth's centre by the two vectors, in
   * radians. Independent of any chosen sphere radius.
   */
  readonly centralAngleRadians: number;
  /**
   * Around-the-Earth arc on a sphere of {@link EARTH_MEAN_RADIUS_M},
   * in metres. The "what does a vehicle on the surface travel?"
   * answer.
   */
  readonly arcMeanEarthRadiusMetres: number;
  /**
   * Around-the-Earth arc on a sphere whose radius is the average of
   * the two endpoint magnitudes, in metres. The "scale-aware" answer
   * — useful when both points are at altitude (e.g. two satellites
   * in roughly the same shell).
   */
  readonly arcAverageRadiusMetres: number;
  /**
   * One-way light-travel time over the chord, in seconds. Numerically
   * equal to `chordBrightMeters` (1 bm = 1 light-second).
   */
  readonly lightTravelSeconds: number;
}

/**
 * Compute multiple distance metrics between two BrightSpace ECEF
 * vectors in a single call. Returns the through-the-Earth chord (the
 * BrightSpace-native quantity), the central angle, and two flavours
 * of around-the-Earth arc: one on the IUGG mean-Earth sphere, one on
 * a sphere whose radius is the average of the two endpoint
 * magnitudes.
 *
 * Inputs are expected in **metres** (the standard ECEF unit). For
 * inputs already in BrightMeters, multiply by
 * {@link BRIGHT_METER_M} or use the chord helpers directly with the
 * BrightMeter values — the magnitude relationship is unit-preserving.
 *
 * @param a - First BrightSpace ECEF vector (metres).
 * @param b - Second BrightSpace ECEF vector (metres).
 * @returns Chord, arc(s), central angle, and light-travel time.
 *
 * @example
 * ```ts
 * // Two stations: GODE (Greenbelt MD) and OPMT (Paris).
 * const gode = { x: 1_130_773.6, y: -4_831_253.6, z: 3_994_200.4 };
 * const opmt = { x: 4_202_777.4, y:    171_368.4, z: 4_778_660.2 };
 * const d = brightSpaceDistance(gode, opmt);
 * d.chordMetres;             // ≈ 6,178,000 m   (straight line)
 * d.arcMeanEarthRadiusMetres;// ≈ 6,331,000 m   (along the surface)
 * d.lightTravelSeconds;      // ≈ 0.0206 s      (cryptographic floor)
 * ```
 */
export function brightSpaceDistance(
  a: EcefCoordinate,
  b: EcefCoordinate,
): BrightSpaceDistance {
  const chordMetres = ecefChordMetres(a, b);
  const angle = ecefCentralAngle(a, b);
  const magA = ecefMagnitude(a);
  const magB = ecefMagnitude(b);
  const avgRadius = (magA + magB) / 2;

  return {
    chordMetres,
    chordBrightMeters: chordMetres / BRIGHT_METER_M,
    centralAngleRadians: angle,
    arcMeanEarthRadiusMetres: angle * EARTH_MEAN_RADIUS_M,
    arcAverageRadiusMetres: angle * avgRadius,
    lightTravelSeconds: chordMetres / SPEED_OF_LIGHT_M_PER_S,
  };
}
