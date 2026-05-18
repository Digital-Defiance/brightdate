/**
 * BrightDate Local-Clock Bridge
 *
 * BrightDate has **one** scalar and **one** fraction: the BD-day fraction
 * (`bd - floor(bd)`). It is universal — every observer at the same instant
 * sees the same number. There is no UTC fraction, local fraction, or any
 * per-observer flavor of BrightDate.
 *
 * What this module *does* provide is a single helper to answer one
 * legitimate question:
 *
 *   > At the instant a particular wall clock reads HH:MM:SS today, what
 *   > BD scalar will it produce?
 *
 * The output is still the universal BD scalar; only the *input* (a local
 * wall-clock value plus a UTC offset) is observer-specific. Two callers in
 * different zones asking for "their 11:00" get different BD scalars —
 * because they are different physical instants, not because BrightDate has
 * a localized form.
 *
 * Use this for UI tables that map a user's local hour to its BD scalar.
 * Don't use it (or anything else) to invent a second "fraction".
 */

import type { BrightDateValue } from "./types";
import { fromUnixMs, toUnixMs } from "./conversions";

const MS_PER_DAY = 86_400_000;

/**
 * The BrightDate value at the instant a **local wall clock** reads
 * `hours:minutes:seconds` on the same local civil date as `reference`,
 * given a fixed UTC offset.
 *
 * **No "local fraction" is implied.** BrightDate is timezone-free; the
 * value returned is the universal BD scalar at the matching UTC instant.
 *
 * # DST
 *
 * Assumes a fixed offset for the day. For DST-aware behavior across a
 * transition, compute the correct UTC instant via your platform's calendar
 * API (e.g. `Intl.DateTimeFormat`, `java.time`, `chrono` in Rust) and call
 * {@link fromUnixMs} directly.
 *
 * @param reference  - any BD value on the target local civil date
 * @param hours      - 0–23
 * @param minutes    - 0–59 (default 0)
 * @param seconds    - 0–59.999... (default 0)
 * @param offsetDays - UTC offset in fractional days (positive east of UTC,
 *   negative west). For Pacific Daylight Time use `-7 / 24`.
 *
 * @example
 * ```ts
 * // BD value when a PDT (UTC-7) wall clock reads 11:00 on the same local
 * // civil day as `now`:
 * bdFromLocalClock(now, 11, 0, 0, -7 / 24);
 * ```
 */
export function bdFromLocalClock(
  reference: BrightDateValue,
  hours: number,
  minutes: number = 0,
  seconds: number = 0,
  offsetDays: number = 0,
): BrightDateValue {
  const refMs = toUnixMs(reference);
  const offsetMs = offsetDays * MS_PER_DAY;
  // Shift into local time so floor(localMs / day) lands on the local day.
  const localMs = refMs + offsetMs;
  const localDayStartMs = Math.floor(localMs / MS_PER_DAY) * MS_PER_DAY;
  // Convert the local-day-start back to a UTC instant.
  const utcDayStartMs = localDayStartMs - offsetMs;
  const targetMs =
    utcDayStartMs + (hours * 3600 + minutes * 60 + seconds) * 1000;
  return fromUnixMs(targetMs);
}
