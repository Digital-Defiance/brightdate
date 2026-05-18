/**
 * Display Label — `BD` / `PBD` prefix convention for BrightDate scalars.
 *
 * The canonical BrightDate representation is a signed Float64 scalar.
 * Negative scalars are mathematically fine for storage, comparison, and
 * arithmetic, but they read poorly in user-facing displays — leading
 * minus signs invite sign-flip mistakes, and large negative scientific
 * notation (`-4.35e17`) is hostile to skim-reading.
 *
 * The display convention is a **sign-flipping prefix**:
 *
 * | Internal scalar | Label form         |
 * | --------------- | ------------------ |
 * | `bd ≥ 0`        | `BD <bd>`          |
 * | `bd < 0`        | `PBD <abs(bd)>`    |
 *
 * `BD 0` is the canonical label for J2000.0. **There is no `PBD 0`.**
 * Formatters MUST NOT produce `PBD 0`; parsers MUST reject `PBD 0` as
 * invalid input.
 *
 * The internal scalar is unchanged; round-tripping through the label
 * layer is exact (sign-flip is bit-exact in IEEE 754).
 *
 * ## Sort rule for label strings
 *
 * 1. Any `BD` value is later than any `PBD` value.
 * 2. Within `BD`, *larger* number is later.
 * 3. Within `PBD`, *smaller* number is later (closer to J2000.0).
 *
 * When the underlying numeric scalars are available, native numeric
 * comparison is the right tool — it agrees with the label-string rule
 * without needing the prefix at all.
 *
 * ## Deep time
 *
 * `BrightDate` Float64 covers ~287,000 years from J2000.0 with
 * sub-microsecond ULP, in either direction. For deep-time work that
 * needs full precision indefinitely far from the epoch, use
 * `BrightInstant` (BigInt TAI seconds + integer nanoseconds) or
 * `ExactBrightDate` (BigInt picoseconds). The display convention applies
 * identically to those types: their human-facing labels use the same
 * `BD` / `PBD` prefix rule.
 *
 * @packageDocumentation
 */

import { BrightDateError } from "./validation";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Default decimal precision used by {@link formatBD} when no explicit
 * `precision` is supplied.
 */
export const DEFAULT_BD_PRECISION = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Discriminated union for label-only consumers (e.g. UIs that hold the
 * label string after a parse and never need to lift back to a scalar
 * for arithmetic). For arithmetic, use the underlying signed Float64
 * BrightDate value directly.
 *
 * - `kind: 'BD'`  → `value` is non-negative (`≥ 0`).
 * - `kind: 'PBD'` → `value` is strictly positive (`> 0`); the underlying
 *   scalar is `−value`.
 */
export type BrightLabel =
  | { readonly kind: "BD"; readonly value: number }
  | { readonly kind: "PBD"; readonly value: number };

// ─── Format ──────────────────────────────────────────────────────────────────

/**
 * Render a signed Float64 BrightDate as a display label.
 *
 * - `bd ≥ 0` → `"BD <bd>"`.
 * - `bd < 0` → `"PBD <abs(bd)>"`.
 * - `bd === 0` → `"BD 0"`. Never `"PBD 0"`.
 *
 * @param bd        Signed Float64 BrightDate value (in days from J2000.0).
 * @param precision Decimal places after the point (default
 *                  {@link DEFAULT_BD_PRECISION}).
 *
 * @example
 * formatBD(0)             // "BD 0"
 * formatBD(9622.504)      // "BD 9622.504"
 * formatBD(-11125.154)    // "PBD 11125.154"
 * formatBD(-1)            // "PBD 1"
 */
export function formatBD(
  bd: number,
  precision: number = DEFAULT_BD_PRECISION,
): string {
  if (!Number.isFinite(bd)) {
    throw new BrightDateError(
      `formatBD: value must be a finite number, got ${bd}`,
      "INVALID_VALUE",
    );
  }
  if (precision < 0 || !Number.isInteger(precision)) {
    throw new BrightDateError(
      `formatBD: precision must be a non-negative integer, got ${precision}`,
      "INVALID_PRECISION",
    );
  }
  // Treat -0 as 0 so it never falls into the PBD branch.
  const v = bd === 0 ? 0 : bd;
  const prefix = v < 0 ? "PBD" : "BD";
  const magnitude = Math.abs(v);
  return `${prefix} ${formatNumber(magnitude, precision)}`;
}

/**
 * Render a {@link BrightLabel} tuple to its canonical string form.
 *
 * Inverse of {@link parseBDLabel}. Equivalent to applying {@link formatBD}
 * to the lifted scalar.
 */
export function formatBDLabel(
  label: BrightLabel,
  precision: number = DEFAULT_BD_PRECISION,
): string {
  if (label.kind === "PBD" && label.value <= 0) {
    throw new BrightDateError(
      `formatBDLabel: PBD value must be strictly positive, got ${label.value}`,
      "INVALID_VALUE",
    );
  }
  if (label.kind === "BD" && label.value < 0) {
    throw new BrightDateError(
      `formatBDLabel: BD value must be non-negative, got ${label.value}`,
      "INVALID_VALUE",
    );
  }
  return `${label.kind} ${formatNumber(label.value, precision)}`;
}

// ─── Parse ───────────────────────────────────────────────────────────────────

const LABEL_PATTERN = /^\s*(BD|PBD)\s+(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*$/;

/**
 * Parse a display label back to a signed Float64 BrightDate.
 *
 * - `"BD X"`  → `+X` (with `X ≥ 0`).
 * - `"PBD X"` → `−X` (with `X > 0`; `"PBD 0"` is rejected).
 *
 * Whitespace surrounding the prefix and the number is permitted but not
 * required. The number itself accepts standard decimal notation
 * including optional exponent.
 *
 * @example
 * parseBD("BD 9622.504")    // 9622.504
 * parseBD("PBD 11125.154")  // -11125.154
 * parseBD("BD 0")           // 0
 * parseBD("PBD 0")          // throws — PBD 0 is invalid
 */
export function parseBD(label: string): number {
  const match = LABEL_PATTERN.exec(label);
  if (!match) {
    throw new BrightDateError(
      `parseBD: not a recognised label, expected "BD <n>" or "PBD <n>", got ${JSON.stringify(label)}`,
      "PARSE_ERROR",
    );
  }
  const [, prefix, body] = match;
  const value = Number(body);
  if (!Number.isFinite(value)) {
    throw new BrightDateError(
      `parseBD: numeric body did not parse to a finite number, got ${JSON.stringify(body)}`,
      "PARSE_ERROR",
    );
  }
  if (prefix === "BD") {
    if (value < 0) {
      throw new BrightDateError(
        `parseBD: BD value must be non-negative, got ${value}`,
        "INVALID_VALUE",
      );
    }
    return value;
  }
  // PBD branch
  if (value <= 0) {
    throw new BrightDateError(
      `parseBD: PBD value must be strictly positive, got ${value}`,
      "INVALID_VALUE",
    );
  }
  return -value;
}

/**
 * Parse a display label into a {@link BrightLabel} tuple. Inverse of
 * {@link formatBDLabel}.
 */
export function parseBDLabel(label: string): BrightLabel {
  const scalar = parseBD(label);
  if (scalar >= 0) return { kind: "BD", value: scalar };
  return { kind: "PBD", value: -scalar };
}

// ─── Compare ─────────────────────────────────────────────────────────────────

/**
 * Total order on label tuples. Returns `-1` if `a` is earlier than `b`,
 * `+1` if later, `0` if equal.
 *
 * This is provided for consumers that hold only labels (no scalars).
 * When the underlying numeric scalars are available, native numeric
 * comparison is preferred.
 *
 * **Rule.**
 * 1. Any `BD` is later than any `PBD`.
 * 2. Within `BD`, larger value is later.
 * 3. Within `PBD`, smaller value is later (closer to J2000.0).
 */
export function compareBDLabels(a: BrightLabel, b: BrightLabel): -1 | 0 | 1 {
  if (a.kind !== b.kind) return a.kind === "BD" ? 1 : -1;
  if (a.kind === "BD") {
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
  }
  // Both PBD: smaller value is later.
  if (a.value < b.value) return 1;
  if (a.value > b.value) return -1;
  return 0;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function formatNumber(value: number, precision: number): string {
  if (precision === 0) return Math.trunc(value).toString();
  return value.toFixed(precision);
}
