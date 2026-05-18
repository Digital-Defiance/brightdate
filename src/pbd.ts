/**
 * PBD — Pre-BrightDate Eras (Tera-second paging)
 *
 * The "deep-time" naming layer for BrightDate. PBD is *strictly* the
 * historical / pre-epoch view: it labels instants that lie **before**
 * J2000.0. Anything from J2000.0 forward is plain **BD** (a continuous
 * positive scalar) — there is no `PBD0`. Calling the current era "Pre-"
 * anything would be self-contradictory.
 *
 * ```text
 *   t < 0  →  PBDN (paged, N ≥ 1)         "The Archives"
 *   t ≥ 0  →  BD   (scalar, never paged)   "The Era of Light"
 * ```
 *
 * ## Why Tera-seconds?
 *
 * BrightSpacetime is a fully SI-Metric standard. A Tera-second is both a
 * historical era length (10¹² s) **and** a galactic-scale distance
 * (one Tera-light-second ≈ 0.03 ly). Sharing the same SI prefix lineage
 * across time *and* space means a `PBDN` label is also a
 * Giga-light-second volume of history — not a random bucket.
 *
 * The canonical numeric substrate is the **Bright-second (bs)**, where
 * `1 bs = 1 SI second`. BrightDate's `Float64` scalar is decimal *days* for
 * ergonomic math, but PBD works in seconds so the page label aligns with
 * BrightSpacetime, BrightInstant, and the rest of the SI-prefix family.
 *
 * ## Paging model
 *
 * Let `T = 1_000_000_000_000` (one Tera-second).
 *
 * | Domain | Raw-second range          | Label form                            |
 * | ------ | ------------------------- | ------------------------------------- |
 * | BD     | `[0, +∞)`                 | scalar, e.g. `9_635.845 BD`           |
 * | PBD1   | `(−T, 0)`                 | ~31,710 yr; contains recorded history |
 * | PBD2   | `(−2T, −T]`               | Late Paleolithic                      |
 * | PBD*N* | `(−N·T, −(N−1)·T]`        | One Tera-second per page              |
 *
 * **Linear-vector rule.** Page values *always* increase toward J2000.0.
 * In PBD1, page `T − 1` is one second before J2000.0; page near `0` is
 * almost a full Tera-second before J2000.0. Numbers do **not** count
 * backwards in pre-epoch eras (this is the opposite of BC labeling and the
 * reason BC dates break libraries that touch them).
 *
 * **Mapping formula** (only defined for `rawSeconds < 0`):
 *
 * ```ts
 * const abs  = Math.abs(rawSeconds);
 * const era  = Math.floor(abs / T) + 1;     // ≥ 1
 * const page = (rawSeconds % T) + T;        // always in (0, T]
 * ```
 *
 * Non-negative inputs are *rejected*. For the unified label that handles
 * both halves of the timeline, see {@link toBrightLabel} /
 * {@link formatBrightLabel}.
 *
 * ## Worked benchmarks
 *
 * | Anchor                          | Raw seconds        | Label                      |
 * | ------------------------------- | ------------------ | -------------------------- |
 * | J2000.0 (the singularity)       | `0`                | `0.000 BD`                 |
 * | July 2026                       | `≈ 8.3 × 10⁸`     | `831 ... BD` (scalar)      |
 * | 3000 BC (~5 ky ago)             | `≈ −1.578 × 10¹¹`  | `PBD1: 842,000,000,000`    |
 * | Deep Paleolithic (~100 ky ago)  | `≈ −3.156 × 10¹²`  | `PBD4: 158,000,000,000`    |
 *
 * @see {@link toPBD}, {@link toBrightLabel}, {@link formatBrightLabel}
 * @packageDocumentation
 */

import { BrightDate } from "./BrightDate";
import { BrightInstant } from "./BrightInstant";
import { SECONDS_PER_DAY } from "./constants";
import { ExactBrightDate } from "./ExactBrightDate";
import { BrightDateError } from "./validation";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * One Tera-Bright. The PBD page size, expressed in **Bright-seconds**
 * (SI seconds). Exactly 10¹² s ≈ 31,709.79 Julian years.
 */
export const PBD_ERA_SECONDS = 1_000_000_000_000;

/**
 * `PBD_ERA_SECONDS` expressed in picoseconds. Used by the exact
 * (BigInt-based) PBD path against {@link ExactBrightDate}.
 *
 * `PBD_ERA_SECONDS × 10¹² ps/s = 10²⁴ ps`.
 */
export const PBD_ERA_PICOSECONDS = 1_000_000_000_000_000_000_000_000n;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Float64 PBD tuple. **Only valid for pre-J2000.0 instants.**
 *
 * - `era`: positive integer (`≥ 1`). There is no `PBD0` — non-negative
 *   scalars are plain BD, not a PBD page.
 * - `page`: Bright-seconds within the era, in `(0, PBD_ERA_SECONDS]`.
 *   *Larger page = later in real time* (the linear-vector rule).
 */
export interface PBD {
  readonly era: number;
  readonly page: number;
}

/**
 * Bit-exact PBD tuple paired with {@link ExactBrightDate}. **Pre-J2000.0
 * only**, same rules as {@link PBD}.
 *
 * - `era`: positive integer (≥ 1). Even cosmological depth (~4.3×10⁵ eras
 *   at the Big Bang) is well inside `Number.MAX_SAFE_INTEGER`.
 * - `pagePicoseconds`: BigInt picoseconds within the era, in
 *   `(0n, PBD_ERA_PICOSECONDS]`.
 */
export interface ExactPBD {
  readonly era: number;
  readonly pagePicoseconds: bigint;
}

/**
 * Unified label for any instant on the BrightDate timeline.
 *
 * - `kind: "BD"`  — J2000.0 and forward; carries the raw scalar in seconds.
 * - `kind: "PBD"` — strictly before J2000.0; carries the canonical paged
 *   `(era, page)` tuple with `era ≥ 1`.
 */
export type BrightLabel =
  | { readonly kind: "BD"; readonly seconds: number }
  | { readonly kind: "PBD"; readonly era: number; readonly page: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertFiniteNumber(
  value: unknown,
  name: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BrightDateError(
      `${name} must be a finite number, got: ${String(value)}`,
      "INVALID_NUMBER",
    );
  }
}

function assertEra(era: unknown): asserts era is number {
  if (
    typeof era !== "number" ||
    !Number.isInteger(era) ||
    era < 1 ||
    !Number.isFinite(era)
  ) {
    throw new BrightDateError(
      `PBD era must be a positive integer (≥ 1) — there is no PBD0. Got: ${String(era)}`,
      "INVALID_PBD_ERA",
    );
  }
}

function assertNegative(rawSeconds: number): void {
  if (rawSeconds >= 0) {
    throw new BrightDateError(
      `PBD is defined only for t < 0 (pre-J2000.0). For non-negative scalars, use BD directly. Got: ${rawSeconds}`,
      "INVALID_PBD_INPUT",
    );
  }
}

// ─── Float64 conversions (Bright-seconds) ────────────────────────────────────

/**
 * Convert a raw signed Bright-second count to its canonical PBD tuple.
 *
 * **Defined only for `rawSeconds < 0`.** Non-negative inputs are not
 * "PBD0" — they're plain BD scalars and have no paged form. For a
 * timeline-agnostic label that handles both halves, use
 * {@link toBrightLabel}.
 *
 * @throws BrightDateError if `rawSeconds` is not finite, or is `≥ 0`.
 */
export function toPBD(rawSeconds: number): PBD {
  assertFiniteNumber(rawSeconds, "rawSeconds");
  assertNegative(rawSeconds);
  const era = Math.floor(-rawSeconds / PBD_ERA_SECONDS) + 1;
  const page = (rawSeconds % PBD_ERA_SECONDS) + PBD_ERA_SECONDS;
  return { era, page };
}

/**
 * Invert {@link toPBD}: rebuild the signed Bright-second scalar from
 * `(era, page)`. The result is always `< 0`.
 *
 * Lenient on the `page` value — accepts non-canonical `(era, page)` pairs
 * and treats them as a linear offset `rawSeconds = page − era · PBD_ERA_SECONDS`.
 * This lets callers arithmetically combine tuples before round-tripping.
 *
 * @throws BrightDateError if `era` is not a positive integer or `page`
 *         is not finite.
 */
export function fromPBD(pbd: PBD): number {
  assertEra(pbd.era);
  assertFiniteNumber(pbd.page, "PBD page");
  return pbd.page - pbd.era * PBD_ERA_SECONDS;
}

/**
 * Convenience: convert a *pre-J2000.0* {@link BrightDate} to a {@link PBD}
 * tuple. The Bright-second axis is `bd.value × 86_400`.
 *
 * @throws BrightDateError if `bd.value ≥ 0` (use BD directly for those).
 */
export function brightDateToPBD(bd: BrightDate): PBD {
  return toPBD(bd.value * SECONDS_PER_DAY);
}

/**
 * Convenience: build a {@link BrightDate} from a {@link PBD} tuple by
 * inverting the second→day scaling. Result is always pre-J2000.0.
 */
export function brightDateFromPBD(pbd: PBD): BrightDate {
  return BrightDate.fromValue(fromPBD(pbd) / SECONDS_PER_DAY);
}

/**
 * The era index for a pre-J2000.0 raw Bright-second count, without
 * allocating the page value.
 *
 * @throws BrightDateError if `rawSeconds` is not negative.
 */
export function pbdEra(rawSeconds: number): number {
  assertFiniteNumber(rawSeconds, "rawSeconds");
  assertNegative(rawSeconds);
  return Math.floor(-rawSeconds / PBD_ERA_SECONDS) + 1;
}

/**
 * The page value for a pre-J2000.0 raw Bright-second count, without
 * recomputing the era.
 *
 * @throws BrightDateError if `rawSeconds` is not negative.
 */
export function pbdPage(rawSeconds: number): number {
  assertFiniteNumber(rawSeconds, "rawSeconds");
  assertNegative(rawSeconds);
  return (rawSeconds % PBD_ERA_SECONDS) + PBD_ERA_SECONDS;
}

// ─── Comparison ──────────────────────────────────────────────────────────────

/**
 * Sort-order comparator over PBD tuples by the instant they label.
 *
 * Rule: a smaller `era` is later in time. Within an era, a larger `page`
 * is later. Returns `-1` / `0` / `1`.
 */
export function comparePBD(a: PBD, b: PBD): -1 | 0 | 1 {
  if (a.era !== b.era) return a.era < b.era ? 1 : -1;
  if (a.page === b.page) return 0;
  return a.page > b.page ? 1 : -1;
}

/** True iff `a` is strictly later than `b` on the timeline. */
export function isPBDLater(a: PBD, b: PBD): boolean {
  return comparePBD(a, b) === 1;
}

// ─── Formatting / parsing ────────────────────────────────────────────────────

/** Default decimal precision for {@link formatPBD}. */
export const DEFAULT_PBD_PRECISION = 3;

/**
 * Format a PBD tuple as a human-readable label, e.g.
 * `"PBD1: 842000000000.000"`.
 *
 * @param pbd        Tuple to format.
 * @param precision  Number of fractional digits on the page value
 *                   (default {@link DEFAULT_PBD_PRECISION}).
 */
export function formatPBD(
  pbd: PBD,
  precision: number = DEFAULT_PBD_PRECISION,
): string {
  assertEra(pbd.era);
  assertFiniteNumber(pbd.page, "PBD page");
  if (!Number.isInteger(precision) || precision < 0 || precision > 20) {
    throw new BrightDateError(
      `PBD precision must be an integer in [0, 20], got: ${String(precision)}`,
      "INVALID_PBD_PRECISION",
    );
  }
  return `PBD${pbd.era}: ${pbd.page.toFixed(precision)}`;
}

const PBD_PATTERN =
  /^\s*PBD\+?(\d+)\s*:\s*([+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)\s*$/;

/**
 * Parse a PBD label produced by {@link formatPBD}.
 *
 * @throws BrightDateError if the string does not match `PBD<era>: <page>`.
 */
export function parsePBD(label: string): PBD {
  if (typeof label !== "string") {
    throw new BrightDateError(
      `PBD label must be a string, got: ${String(label)}`,
      "INVALID_PBD_LABEL",
    );
  }
  const m = PBD_PATTERN.exec(label);
  if (!m) {
    throw new BrightDateError(
      `Invalid PBD label: ${JSON.stringify(label)}`,
      "INVALID_PBD_LABEL",
    );
  }
  const era = Number.parseInt(m[1], 10);
  const page = Number.parseFloat(m[2]);
  if (!Number.isFinite(page)) {
    throw new BrightDateError(
      `Invalid PBD page in label: ${JSON.stringify(label)}`,
      "INVALID_PBD_LABEL",
    );
  }
  return { era, page };
}

// ─── BigInt (ExactBrightDate) conversions ────────────────────────────────────

/**
 * Convert an {@link ExactBrightDate} to its canonical exact PBD tuple.
 *
 * **Defined only for pre-J2000.0 instants** (`picoseconds < 0n`). Bit-exact:
 * the BigInt picosecond page preserves every picosecond of the underlying
 * instant. For non-negative instants use {@link toBrightLabel} instead.
 *
 * @throws BrightDateError if `value.picoseconds ≥ 0n`.
 */
export function toExactPBD(value: ExactBrightDate): ExactPBD {
  const ps = value.picoseconds;
  if (ps >= 0n) {
    throw new BrightDateError(
      `PBD is defined only for t < 0 (pre-J2000.0). For non-negative instants, use BD directly. Got picoseconds: ${ps}`,
      "INVALID_PBD_INPUT",
    );
  }
  // era = floor(|ps| / T_ps) + 1; with BigInt division truncating toward 0
  // and ps < 0n, -ps > 0n, so the integer division is a true floor.
  const eraBig = -ps / PBD_ERA_PICOSECONDS + 1n;
  // page = (ps mod T_ps) + T_ps. BigInt % preserves the sign of the dividend,
  // matching the Float64 spec.
  const pagePs = (ps % PBD_ERA_PICOSECONDS) + PBD_ERA_PICOSECONDS;
  return { era: Number(eraBig), pagePicoseconds: pagePs };
}

/**
 * Invert {@link toExactPBD}: rebuild an {@link ExactBrightDate}. Result is
 * always pre-J2000.0.
 *
 * @throws BrightDateError if `era` is not a positive integer or if
 *         `pagePicoseconds` is not a BigInt.
 */
export function fromExactPBD(pbd: ExactPBD): ExactBrightDate {
  assertEra(pbd.era);
  if (typeof pbd.pagePicoseconds !== "bigint") {
    throw new BrightDateError(
      `pagePicoseconds must be a bigint, got: ${typeof pbd.pagePicoseconds}`,
      "INVALID_PBD_PAGE",
    );
  }
  const ps = pbd.pagePicoseconds - BigInt(pbd.era) * PBD_ERA_PICOSECONDS;
  return ExactBrightDate.fromPicoseconds(ps);
}

/**
 * Sort-order comparator over {@link ExactPBD} tuples. Returns `-1` / `0` /
 * `1`. Same semantics as {@link comparePBD}.
 */
export function compareExactPBD(a: ExactPBD, b: ExactPBD): -1 | 0 | 1 {
  if (a.era !== b.era) return a.era < b.era ? 1 : -1;
  if (a.pagePicoseconds === b.pagePicoseconds) return 0;
  return a.pagePicoseconds > b.pagePicoseconds ? 1 : -1;
}

// ─── BrightInstant (TAI seconds + nanos) bridge ──────────────────────────────

/** Picoseconds per SI second. */
const PS_PER_SECOND = 1_000_000_000_000n;
/** Picoseconds per nanosecond. */
const PS_PER_NANOSECOND = 1_000n;

/**
 * Convert a *pre-J2000.0* {@link BrightInstant} to its canonical
 * {@link ExactPBD} tuple.
 *
 * `BrightInstant` is anchored on TAI (uniform — no leap seconds), so its
 * `(taiSecondsSinceJ2000, taiNanos)` pair is already a pure SI-second offset
 * from J2000.0. The PBD label drops below `BrightInstant`'s nanosecond
 * resolution into picoseconds (sub-ns digits are zero), so the bridge is
 * lossless in both directions for any negative-TAI instant.
 *
 * @throws BrightDateError if the instant is at or after J2000.0. For those,
 *         use {@link toBrightLabel} (returns `kind: "BD"`).
 */
export function brightInstantToPBD(instant: BrightInstant): ExactPBD {
  const ps =
    instant.taiSecondsSinceJ2000 * PS_PER_SECOND +
    BigInt(instant.taiNanos) * PS_PER_NANOSECOND;
  return toExactPBD(ExactBrightDate.fromPicoseconds(ps));
}

/**
 * Invert {@link brightInstantToPBD}: rebuild a {@link BrightInstant} from
 * an {@link ExactPBD} tuple.
 *
 * Any sub-nanosecond residue on the PBD page is **truncated toward negative
 * infinity** (Euclidean) so the result satisfies
 * `taiNanos ∈ [0, 1_000_000_000)`. Round-trips from a `BrightInstant` (which
 * carries no sub-ns digits) are bit-exact.
 *
 * @throws BrightDateError if `era` is not a non-negative integer or if
 *         `pagePicoseconds` is not a BigInt.
 */
export function brightInstantFromPBD(pbd: ExactPBD): BrightInstant {
  // fromExactPBD does the era/page validation and produces signed picoseconds.
  const ps = fromExactPBD(pbd).picoseconds;
  // Euclidean decomposition into (seconds, sub-second picoseconds in [0, T)).
  let secs = ps / PS_PER_SECOND;
  let subPs = ps % PS_PER_SECOND;
  if (subPs < 0n) {
    secs -= 1n;
    subPs += PS_PER_SECOND;
  }
  // Drop sub-ns digits to honour BrightInstant's nanosecond resolution.
  const taiNanos = Number(subPs / PS_PER_NANOSECOND);
  return BrightInstant.fromTaiComponents(secs, taiNanos);
}

// ─── BrightLabel — unified BD ∪ PBD view ─────────────────────────────────────

/** Default decimal precision for the `BD` branch of {@link formatBrightLabel}. */
export const DEFAULT_BD_PRECISION = 3;

/**
 * Convert a raw signed Bright-second count to the unified {@link BrightLabel}.
 *
 * - `rawSeconds ≥ 0`  →  `{ kind: "BD",  seconds: rawSeconds }`
 * - `rawSeconds < 0`  →  `{ kind: "PBD", era, page }` with `era ≥ 1`
 *
 * J2000.0 itself (`rawSeconds === 0`) is the anchor of the BD half-line, not
 * a PBD page.
 */
export function toBrightLabel(rawSeconds: number): BrightLabel {
  assertFiniteNumber(rawSeconds, "rawSeconds");
  if (rawSeconds >= 0) {
    return { kind: "BD", seconds: rawSeconds };
  }
  const era = Math.floor(-rawSeconds / PBD_ERA_SECONDS) + 1;
  const page = (rawSeconds % PBD_ERA_SECONDS) + PBD_ERA_SECONDS;
  return { kind: "PBD", era, page };
}

/**
 * Invert {@link toBrightLabel}: rebuild the signed Bright-second scalar.
 */
export function fromBrightLabel(label: BrightLabel): number {
  if (label.kind === "BD") {
    assertFiniteNumber(label.seconds, "BD seconds");
    if (label.seconds < 0) {
      throw new BrightDateError(
        `BD scalar must be ≥ 0; negative values are PBD. Got: ${label.seconds}`,
        "INVALID_BD_SCALAR",
      );
    }
    return label.seconds;
  }
  return fromPBD(label);
}

/**
 * Format a {@link BrightLabel} as a human-readable string.
 *
 * - BD branch  →  `"9635.845 BD"`
 * - PBD branch →  `"PBD1: 842000000000.000"`
 *
 * `bdPrecision` controls fractional digits on the BD scalar (default
 * {@link DEFAULT_BD_PRECISION}); `pbdPrecision` controls digits on the PBD
 * page (default {@link DEFAULT_PBD_PRECISION}).
 */
export function formatBrightLabel(
  label: BrightLabel,
  bdPrecision: number = DEFAULT_BD_PRECISION,
  pbdPrecision: number = DEFAULT_PBD_PRECISION,
): string {
  if (label.kind === "BD") {
    if (!Number.isInteger(bdPrecision) || bdPrecision < 0 || bdPrecision > 20) {
      throw new BrightDateError(
        `BD precision must be an integer in [0, 20], got: ${String(bdPrecision)}`,
        "INVALID_PBD_PRECISION",
      );
    }
    assertFiniteNumber(label.seconds, "BD seconds");
    return `${label.seconds.toFixed(bdPrecision)} BD`;
  }
  return formatPBD(label, pbdPrecision);
}

const BD_PATTERN = /^\s*([+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)\s*BD\s*$/;

/**
 * Parse a label produced by {@link formatBrightLabel}. Accepts either form:
 *
 * - `"<seconds> BD"`           →  `{ kind: "BD",  seconds }`
 * - `"PBD<era>: <page>"`       →  `{ kind: "PBD", era, page }`
 *
 * @throws BrightDateError if the string matches neither shape.
 */
export function parseBrightLabel(label: string): BrightLabel {
  if (typeof label !== "string") {
    throw new BrightDateError(
      `Bright label must be a string, got: ${String(label)}`,
      "INVALID_PBD_LABEL",
    );
  }
  const bdMatch = BD_PATTERN.exec(label);
  if (bdMatch) {
    const seconds = Number.parseFloat(bdMatch[1]);
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new BrightDateError(
        `Invalid BD scalar in label: ${JSON.stringify(label)}`,
        "INVALID_PBD_LABEL",
      );
    }
    return { kind: "BD", seconds };
  }
  // Fall through to PBD parser — it throws with a clear message on misses.
  return { kind: "PBD", ...parsePBD(label) };
}

/** Convenience: label a {@link BrightDate} directly. */
export function brightDateToLabel(bd: BrightDate): BrightLabel {
  return toBrightLabel(bd.value * SECONDS_PER_DAY);
}
