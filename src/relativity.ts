/**
 * BrightDate Relativity Module
 *
 * Special-relativistic spacetime operations expressed in **Bright units**
 * (c = 1). Coordinates are:
 *
 * - `t` — time component in **Bright-Seconds** (numerically equal to SI seconds)
 * - `x`, `y`, `z` — spatial components in **BrightMeters** (numerically equal
 *   to seconds of light-travel time, or equivalently 299,792,458 m each)
 *
 * Because 1 BrightMeter = 1 Bright-Second, every coordinate carries the same
 * numerical units and the Minkowski metric loses its factor of *c*:
 *
 * $$ds^2 = -dt^2 + dx^2 + dy^2 + dz^2$$
 *
 * with the relativist convention (−,+,+,+). Velocities are expressed as
 * dimensionless fractions of the speed of light (β = v/c), so |β| < 1 for
 * any massive particle.
 *
 * To convert SI inputs into Bright coordinates, use the helpers in
 * `./spacetime` (`secondsToBrightMeters`, `metresToBrightMeters`, etc.).
 *
 * @packageDocumentation
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * An event in 4-dimensional Minkowski spacetime, expressed in Bright units.
 * All four components share the same numerical scale (seconds ≡ BrightMeters
 * because c = 1).
 */
export interface SpacetimeEvent {
  /** Time coordinate in Bright-Seconds. */
  readonly t: number;
  /** x-coordinate in BrightMeters. */
  readonly x: number;
  /** y-coordinate in BrightMeters. */
  readonly y: number;
  /** z-coordinate in BrightMeters. */
  readonly z: number;
}

/**
 * A 3-velocity expressed as a dimensionless fraction of the speed of light
 * (β = v/c). The magnitude must be strictly less than 1 for any frame
 * reachable by a Lorentz boost of a massive observer.
 */
export type Velocity = readonly [number, number, number];

/**
 * Causal classification of a spacetime interval under the (−,+,+,+)
 * signature.
 *
 * - `timelike` — ds² < 0: events are causally connected; a massive worldline
 *   can pass through both.
 * - `lightlike` — ds² = 0: events are connected only by a light signal.
 * - `spacelike` — ds² > 0: events are causally disconnected (outside each
 *   other's light cones).
 */
export type IntervalKind = "timelike" | "lightlike" | "spacelike";

// ─── Interval Operations ────────────────────────────────────────────────────

/**
 * Spacetime interval squared between two events, using the (−,+,+,+) metric
 * signature:
 *
 * $$ds^2 = -(\Delta t)^2 + (\Delta x)^2 + (\Delta y)^2 + (\Delta z)^2$$
 *
 * @param a - First event.
 * @param b - Second event.
 * @returns ds² in BrightMeter² (= Bright-Second²). Negative for timelike,
 *   zero for lightlike, positive for spacelike.
 */
export function intervalSquared(a: SpacetimeEvent, b: SpacetimeEvent): number {
  const dt = b.t - a.t;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return -dt * dt + dx * dx + dy * dy + dz * dz;
}

/**
 * Classify the spacetime interval between two events as timelike, lightlike,
 * or spacelike.
 *
 * @param a - First event.
 * @param b - Second event.
 * @param tolerance - Absolute value below which |ds²| is treated as zero
 *   (i.e. lightlike). Defaults to 0 (strict).
 * @returns The causal classification.
 */
export function intervalKind(
  a: SpacetimeEvent,
  b: SpacetimeEvent,
  tolerance = 0,
): IntervalKind {
  const ds2 = intervalSquared(a, b);
  if (Math.abs(ds2) <= tolerance) return "lightlike";
  return ds2 < 0 ? "timelike" : "spacelike";
}

/**
 * True iff the two events are causally connected, i.e. one lies on or inside
 * the other's light cone (timelike or lightlike separation).
 *
 * @param a - First event.
 * @param b - Second event.
 * @param tolerance - Tolerance for lightlike classification.
 * @returns Whether `a` and `b` are causally connected.
 */
export function causallyConnected(
  a: SpacetimeEvent,
  b: SpacetimeEvent,
  tolerance = 0,
): boolean {
  return intervalKind(a, b, tolerance) !== "spacelike";
}

/**
 * Proper time elapsed between two timelike-separated events, measured by an
 * inertial observer whose worldline passes through both.
 *
 * $$\Delta\tau = \sqrt{-ds^2}$$
 *
 * @param a - First event.
 * @param b - Second event.
 * @returns Proper time in Bright-Seconds, or `NaN` if the interval is
 *   spacelike (no observer can be present at both events).
 */
export function properTimeBetween(
  a: SpacetimeEvent,
  b: SpacetimeEvent,
): number {
  const ds2 = intervalSquared(a, b);
  if (ds2 > 0) return Number.NaN;
  return Math.sqrt(-ds2);
}

/**
 * Proper (rest-frame) distance between two spacelike-separated events.
 *
 * $$\Delta s = \sqrt{ds^2}$$
 *
 * @param a - First event.
 * @param b - Second event.
 * @returns Proper distance in BrightMeters, or `NaN` if the interval is
 *   timelike (the events cannot be simultaneous in any frame).
 */
export function properDistanceBetween(
  a: SpacetimeEvent,
  b: SpacetimeEvent,
): number {
  const ds2 = intervalSquared(a, b);
  if (ds2 < 0) return Number.NaN;
  return Math.sqrt(ds2);
}

/**
 * Proper time along a piecewise-linear (inertial-segment) worldline, summing
 * the proper times of each timelike segment.
 *
 * @param worldline - Ordered events on the worldline (length ≥ 2).
 * @returns Total proper time in Bright-Seconds.
 * @throws If any consecutive pair is spacelike-separated.
 */
export function properTimeAlong(worldline: readonly SpacetimeEvent[]): number {
  if (worldline.length < 2) {
    throw new Error("properTimeAlong requires at least two events");
  }
  let total = 0;
  for (let i = 1; i < worldline.length; i++) {
    const tau = properTimeBetween(worldline[i - 1], worldline[i]);
    if (Number.isNaN(tau)) {
      throw new Error(
        `Worldline segment ${i - 1}→${i} is spacelike; not a physical worldline`,
      );
    }
    total += tau;
  }
  return total;
}

// ─── Velocity Helpers ───────────────────────────────────────────────────────

/**
 * Magnitude of a 3-velocity β (dimensionless, fraction of c).
 */
export function speed(beta: Velocity): number {
  const [bx, by, bz] = beta;
  return Math.sqrt(bx * bx + by * by + bz * bz);
}

/**
 * Lorentz factor:
 *
 * $$\gamma = \frac{1}{\sqrt{1 - \beta^2}}$$
 *
 * @param beta - Either a 3-velocity or its magnitude.
 * @returns γ ≥ 1. Returns `Infinity` exactly at |β| = 1, `NaN` for |β| > 1.
 */
export function gamma(beta: Velocity | number): number {
  const b = typeof beta === "number" ? Math.abs(beta) : speed(beta);
  if (b > 1) return Number.NaN;
  if (b === 1) return Number.POSITIVE_INFINITY;
  return 1 / Math.sqrt(1 - b * b);
}

/**
 * Rapidity associated with a (1D) velocity β:
 *
 * $$\varphi = \tanh^{-1}(\beta)$$
 *
 * Rapidities are additive under collinear Lorentz boosts, unlike velocities.
 *
 * @param beta - Velocity fraction in [-1, 1].
 * @returns Rapidity (dimensionless), or ±∞ at the light cone.
 */
export function rapidity(beta: number): number {
  return Math.atanh(beta);
}

/**
 * Relativistic addition of two collinear velocities:
 *
 * $$u \oplus v = \frac{u + v}{1 + uv}$$
 *
 * (with c = 1). Closed on (−1, 1) — you cannot accelerate past light speed.
 *
 * @param u - First velocity fraction.
 * @param v - Second velocity fraction.
 * @returns Composed velocity fraction.
 */
export function addVelocities(u: number, v: number): number {
  return (u + v) / (1 + u * v);
}

// ─── Lorentz Boost ──────────────────────────────────────────────────────────

/**
 * Active Lorentz boost of a {@link SpacetimeEvent} by 3-velocity β.
 *
 * Implements the general (non-collinear) boost. For β along an arbitrary
 * direction with magnitude $|\beta|$, the transformation of $(t, \vec x)$ is:
 *
 * $$t' = \gamma\,(t - \vec\beta \cdot \vec x)$$
 *
 * $$\vec x' = \vec x + \left[(\gamma - 1)\,\frac{\vec\beta \cdot \vec x}{|\beta|^2} - \gamma\,t\right]\vec\beta$$
 *
 * @param event - Event in the original frame.
 * @param beta - 3-velocity of the new frame relative to the original
 *   (dimensionless, |β| < 1).
 * @returns The same event's coordinates in the boosted frame.
 * @throws If |β| ≥ 1.
 */
export function boost(event: SpacetimeEvent, beta: Velocity): SpacetimeEvent {
  const [bx, by, bz] = beta;
  const b2 = bx * bx + by * by + bz * bz;
  if (b2 >= 1) {
    throw new Error(`Lorentz boost requires |β| < 1; received |β|² = ${b2}`);
  }
  if (b2 === 0) return event;

  const g = 1 / Math.sqrt(1 - b2);
  const bDotX = bx * event.x + by * event.y + bz * event.z;
  const k = (g - 1) / b2;

  return {
    t: g * (event.t - bDotX),
    x: event.x + (k * bDotX - g * event.t) * bx,
    y: event.y + (k * bDotX - g * event.t) * by,
    z: event.z + (k * bDotX - g * event.t) * bz,
  };
}

/**
 * Relativistic Doppler factor for a source moving with radial velocity β
 * along the line of sight (β > 0 = recession):
 *
 * $$f_\text{observed} = f_\text{emitted}\,\sqrt{\frac{1 - \beta}{1 + \beta}}$$
 *
 * The returned factor multiplies the emitted frequency to give the observed
 * frequency (so β > 0 yields redshift, factor < 1).
 *
 * @param beta - Radial velocity fraction in (−1, 1). Positive for recession.
 * @returns Frequency multiplier `f_obs / f_emit`.
 */
export function dopplerFactor(beta: number): number {
  if (Math.abs(beta) >= 1) return Number.NaN;
  return Math.sqrt((1 - beta) / (1 + beta));
}
