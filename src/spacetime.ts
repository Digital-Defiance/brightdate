/**
 * BrightDate Spacetime Standard
 *
 * The Bright Spacetime Standard collapses the distinction between space and
 * time by setting the speed of light *c* equal to **1** (natural units). In
 * this system, a duration *is* a distance: the meters light travels in that
 * duration.
 *
 * Three parallel scalar hierarchies are defined:
 *
 * 1. **Bright-Seconds (bs)** — the canonical light-travel unit. 1 bs = the
 *    distance light travels in one SI second = 299,792,458 m exactly.
 * 2. **BrightMeters (bm)** — an alias of the Bright-Second emphasizing the
 *    spatial interpretation. 1 bm = 1 bs, with SI-style decimal sub-prefixes
 *    (μbm, mbm, bm, Mbm, Gbm).
 * 3. **Light-Days (Ld)** — the day-based hierarchy aligning with BrightDate's
 *    native unit. 1 Ld = c × 86,400 s = 25,902,068,371,200 m exactly.
 *
 * Because the SI second and *c* are both defined to exact integer values,
 * every conversion in this module is **exact in principle** — limited only
 * by JavaScript's IEEE-754 double precision at very large magnitudes. For
 * arbitrary-precision arithmetic, use the BigInt-based helpers below.
 *
 * @packageDocumentation
 */

import { SECONDS_PER_DAY } from "./constants";
import type { BrightDateValue } from "./types";

// ─── Fundamental Constants ──────────────────────────────────────────────────

/**
 * Speed of light in vacuum, in meters per second. This is **exact** by the
 * 2019 SI redefinition: the metre is defined such that *c* = 299,792,458 m/s
 * exactly.
 */
export const SPEED_OF_LIGHT_M_PER_S = 299_792_458;

/**
 * Speed of light as a `bigint` for exact arithmetic.
 */
export const SPEED_OF_LIGHT_M_PER_S_BIGINT = 299_792_458n;

/**
 * One BrightMeter / Bright-Second in metres: the distance light travels in
 * one SI second. Equal to {@link SPEED_OF_LIGHT_M_PER_S}.
 */
export const BRIGHT_METER_M = SPEED_OF_LIGHT_M_PER_S;

/**
 * One Light-Day in metres: c × 86,400 s = 25,902,068,371,200 m exactly.
 */
export const LIGHT_DAY_M = SPEED_OF_LIGHT_M_PER_S * SECONDS_PER_DAY;

/**
 * One Light-Day in metres as a `bigint` (exact).
 */
export const LIGHT_DAY_M_BIGINT =
  SPEED_OF_LIGHT_M_PER_S_BIGINT * BigInt(SECONDS_PER_DAY);

// ─── Bright-Second / BrightMeter Hierarchy ──────────────────────────────────

/**
 * A unit in the Bright-Second / BrightMeter scalar hierarchy. Each unit has
 * a symbol, a basis (its definition as a multiple of seconds of light-travel
 * time), the equivalent physical distance in metres, and an illustrative
 * physical context.
 */
export interface BrightUnit {
  /** Canonical unit name. */
  readonly name: string;
  /** Standard symbol (e.g. `bs`, `bm`, `Ld`). */
  readonly symbol: string;
  /** Definition expressed as seconds of light-travel time. */
  readonly seconds: number;
  /** Equivalent physical distance in metres (= seconds × c). */
  readonly metres: number;
  /** Short human-readable context phrase. */
  readonly context: string;
}

/**
 * BrightMeter hierarchy: SI-prefixed sub- and super-multiples of the
 * BrightMeter (= 1 Bright-Second = c × 1 s).
 */
export const BRIGHT_METER_UNITS: Readonly<Record<string, BrightUnit>> = {
  microBrightMeter: {
    name: "Micro-BrightMeter",
    symbol: "μbm",
    seconds: 1e-6,
    metres: SPEED_OF_LIGHT_M_PER_S * 1e-6,
    context: "≈ 300 m (human scale)",
  },
  milliBrightMeter: {
    name: "Milli-BrightMeter",
    symbol: "mbm",
    seconds: 1e-3,
    metres: SPEED_OF_LIGHT_M_PER_S * 1e-3,
    context: "≈ 300 km (low Earth orbit)",
  },
  brightMeter: {
    name: "BrightMeter",
    symbol: "bm",
    seconds: 1,
    metres: SPEED_OF_LIGHT_M_PER_S,
    context: "≈ 0.75 × distance to the Moon",
  },
  megaBrightMeter: {
    name: "Mega-BrightMeter",
    symbol: "Mbm",
    seconds: 1e6,
    metres: SPEED_OF_LIGHT_M_PER_S * 1e6,
    context: "≈ 2 AU (solar system radius)",
  },
  gigaBrightMeter: {
    name: "Giga-BrightMeter",
    symbol: "Gbm",
    seconds: 1e9,
    metres: SPEED_OF_LIGHT_M_PER_S * 1e9,
    context: "≈ 10 parsecs (local cluster)",
  },
} as const;

/**
 * Bright-Second hierarchy: the same scalar progression as
 * {@link BRIGHT_METER_UNITS} but named from the temporal perspective.
 */
export const BRIGHT_SECOND_UNITS: Readonly<Record<string, BrightUnit>> = {
  brightSecond: {
    name: "Bright-Second",
    symbol: "bs",
    seconds: 1,
    metres: SPEED_OF_LIGHT_M_PER_S,
    context: "Fundamental light-travel unit",
  },
  brightKilosecond: {
    name: "Bright-Kilosecond",
    symbol: "kbs",
    seconds: 1_000,
    metres: SPEED_OF_LIGHT_M_PER_S * 1_000,
    context: "Interplanetary scale (Earth–Sun ≈ 0.5 kbs)",
  },
  brightMegasecond: {
    name: "Bright-Megasecond",
    symbol: "Mbs",
    seconds: 1_000_000,
    metres: SPEED_OF_LIGHT_M_PER_S * 1_000_000,
    context: "System-wide navigation (Mars orbit ≈ 0.77 Mbs)",
  },
  brightGigasecond: {
    name: "Bright-Gigasecond",
    symbol: "Gbs",
    seconds: 1_000_000_000,
    metres: SPEED_OF_LIGHT_M_PER_S * 1_000_000_000,
    context: "Galactic neighborhood (Proxima Centauri ≈ 133 Gbs)",
  },
} as const;

// ─── Light-Day Hierarchy ────────────────────────────────────────────────────

/**
 * Light-Day hierarchy: distances expressed as multiples of the BrightDate
 * native day unit. All values are **absolute** (exact integer or
 * exactly-representable rational metres).
 */
export const LIGHT_DAY_UNITS: Readonly<Record<string, BrightUnit>> = {
  lightMilliday: {
    name: "Light-Milliday",
    symbol: "Lmd",
    seconds: SECONDS_PER_DAY * 1e-3,
    metres: LIGHT_DAY_M * 1e-3,
    context: "c × 86.4 s (= 25,902,068,371.2 m exactly)",
  },
  lightDay: {
    name: "Light-Day",
    symbol: "Ld",
    seconds: SECONDS_PER_DAY,
    metres: LIGHT_DAY_M,
    context: "c × 86,400 s (= 25,902,068,371,200 m exactly)",
  },
  lightKiloday: {
    name: "Light-Kiloday",
    symbol: "Lkd",
    seconds: SECONDS_PER_DAY * 1_000,
    metres: LIGHT_DAY_M * 1_000,
    context: "c × 86,400,000 s (= 25,902,068,371,200,000 m exactly)",
  },
} as const;

// ─── Conversions ────────────────────────────────────────────────────────────

/**
 * Convert a duration in seconds to a distance in metres (light-travel
 * distance). In Bright units, this is the identity: seconds *are* distances.
 *
 * @param seconds - Duration in SI seconds.
 * @returns Distance light travels in that duration, in metres.
 */
export function secondsToMetres(seconds: number): number {
  return seconds * SPEED_OF_LIGHT_M_PER_S;
}

/**
 * Convert a distance in metres to its light-travel time in seconds.
 *
 * @param metres - Distance in metres.
 * @returns Light-travel time in SI seconds.
 */
export function metresToSeconds(metres: number): number {
  return metres / SPEED_OF_LIGHT_M_PER_S;
}

/**
 * Convert a {@link BrightDateValue} duration (in decimal days) to a
 * light-travel distance in metres.
 *
 * @param days - Duration in decimal days.
 * @returns Distance light travels in that duration, in metres.
 */
export function daysToMetres(days: BrightDateValue): number {
  return days * LIGHT_DAY_M;
}

/**
 * Convert a distance in metres to its light-travel time in decimal days
 * (a {@link BrightDateValue} delta).
 *
 * @param metres - Distance in metres.
 * @returns Light-travel time in decimal days.
 */
export function metresToDays(metres: number): BrightDateValue {
  return metres / LIGHT_DAY_M;
}

/**
 * Convert a duration in seconds to BrightMeters (1 bm = 1 s of light-travel
 * time). Numerically the identity, but typed for clarity at API boundaries.
 *
 * @param seconds - Duration in SI seconds.
 * @returns Equivalent count of BrightMeters / Bright-Seconds.
 */
export function secondsToBrightMeters(seconds: number): number {
  return seconds;
}

/**
 * Convert BrightMeters to seconds. Numerically the identity.
 *
 * @param brightMeters - Count of BrightMeters / Bright-Seconds.
 * @returns Equivalent SI seconds.
 */
export function brightMetersToSeconds(brightMeters: number): number {
  return brightMeters;
}

/**
 * Convert a distance in metres to BrightMeters.
 *
 * @param metres - Distance in metres.
 * @returns Equivalent BrightMeters.
 */
export function metresToBrightMeters(metres: number): number {
  return metres / BRIGHT_METER_M;
}

/**
 * Convert BrightMeters to metres.
 *
 * @param brightMeters - Count of BrightMeters.
 * @returns Equivalent metres.
 */
export function brightMetersToMetres(brightMeters: number): number {
  return brightMeters * BRIGHT_METER_M;
}

/**
 * Convert a {@link BrightDateValue} duration (in decimal days) to
 * Bright-Seconds. 1 day = 86,400 bs.
 *
 * @param days - Duration in decimal days.
 * @returns Equivalent Bright-Seconds.
 */
export function daysToBrightSeconds(days: BrightDateValue): number {
  return days * SECONDS_PER_DAY;
}

/**
 * Convert Bright-Seconds to a {@link BrightDateValue} duration in decimal
 * days. 86,400 bs = 1 day.
 *
 * @param brightSeconds - Bright-Seconds.
 * @returns Equivalent decimal days.
 */
export function brightSecondsToDays(brightSeconds: number): BrightDateValue {
  return brightSeconds / SECONDS_PER_DAY;
}

// ─── Exact (BigInt) Conversions ─────────────────────────────────────────────

/**
 * Exact conversion from whole seconds to metres of light-travel distance,
 * using BigInt arithmetic. Exact for all integer inputs.
 *
 * @param seconds - Whole seconds as a `bigint`.
 * @returns Metres as a `bigint`.
 */
export function secondsToMetresExact(seconds: bigint): bigint {
  return seconds * SPEED_OF_LIGHT_M_PER_S_BIGINT;
}

/**
 * Exact conversion from whole metres to whole-second light-travel time,
 * truncating toward zero. Use {@link metresToSeconds} for fractional values.
 *
 * @param metres - Metres as a `bigint`.
 * @returns Whole light-seconds as a `bigint` (truncated).
 */
export function metresToSecondsExact(metres: bigint): bigint {
  return metres / SPEED_OF_LIGHT_M_PER_S_BIGINT;
}

/**
 * Exact conversion from whole days to metres of light-travel distance,
 * using BigInt arithmetic.
 *
 * @param days - Whole days as a `bigint`.
 * @returns Metres as a `bigint`.
 */
export function daysToMetresExact(days: bigint): bigint {
  return days * LIGHT_DAY_M_BIGINT;
}
