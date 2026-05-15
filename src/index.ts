/**
 * BrightDate - A Universal Decimal Time System
 *
 * A scientifically grounded, engineer-friendly time system based on:
 * - Epoch: J2000.0 (January 1, 2000, 12:00:00 TT / ~11:58:55.816 UTC)
 * - Unit: Decimal days (fractional days since epoch)
 * - Timescale: UTC (default) or TAI (monotonic, no leap seconds)
 *
 * Format: DDDDD.ddddd where integer part = days since epoch,
 * fractional part = fraction of the current day.
 *
 * @example
 * ```typescript
 * import { BrightDate } from '@brightchain/brightdate';
 *
 * // Current time as a BrightDate
 * const now = BrightDate.now();
 * console.log(now.toString()); // e.g., "9622.50417"
 *
 * // From a JavaScript Date
 * const bd = BrightDate.fromDate(new Date('2025-06-15T10:30:00Z'));
 *
 * // Arithmetic
 * const tomorrow = now.addDays(1);
 * const elapsed = tomorrow.difference(now); // 1.0
 *
 * // Duration formatting
 * console.log(now.formatDurationTo(tomorrow)); // "1.000 days"
 *
 * // Log-friendly
 * console.log(now.toLogString()); // "[9622.50417]"
 * ```
 *
 * @packageDocumentation
 */

// ─── Core Class ────────────────────────────────────────────────────────────────
export { BrightDate } from "./BrightDate";

// ─── Exact (BigInt-based) Companion ────────────────────────────────────────────
export { ExactBrightDate } from "./ExactBrightDate";
export { BrightInstant } from "./BrightInstant";

// ─── Intervals ─────────────────────────────────────────────────────────────────
export { BrightDateInterval } from "./intervals";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type {
  BrightDateComponents,
  BrightDateOptions,
  BrightDateValue,
  BrightDuration,
  FormattedBrightDate,
  Precision,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────────
export {
  CURRENT_TAI_UTC_OFFSET,
  DEFAULT_PRECISION,
  GPS_EPOCH_UNIX_TAI,
  J2000_JD,
  J2000_MJD,
  J2000_TAI_UNIX_S,
  J2000_TT_UNIX_S,
  J2000_UNIX_MS_UTC,
  J2000_UTC_UNIX_MS,
  LEAP_SECOND_TABLE,
  LEAP_SECOND_TABLE_REVIEWED_AT,
  LEAP_SECOND_TABLE_SOURCE,
  LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S,
  MAX_PRECISION,
  METRIC_UNITS,
  MS_PER_DAY,
  SECONDS_PER_DAY,
  TAI_UTC_OFFSET_AT_J2000,
  TT_TAI_OFFSET_SECONDS,
} from "./constants";

// ─── Conversions ───────────────────────────────────────────────────────────────
export {
  fromDate,
  fromGPSTime,
  fromISO,
  fromJulianDate,
  fromModifiedJulianDate,
  fromUnixMs,
  fromUnixSeconds,
  normalize,
  now,
  parse,
  taiToUtcBrightDate,
  taiUtcOffsetSecondsAt,
  toDate,
  toGPSTime,
  toISO,
  toJulianDate,
  toModifiedJulianDate,
  toUnixMs,
  toUnixSeconds,
  utcToTaiBrightDate,
} from "./conversions";

// ─── Formatting ────────────────────────────────────────────────────────────────
export {
  dayFractionToHms,
  decompose,
  format,
  formatDuration,
  formatFull,
  formatLog,
  formatPrefixed,
  formatRange,
  hmsToDayFraction,
  toDuration,
} from "./formatting";

// ─── Arithmetic ────────────────────────────────────────────────────────────────
export {
  absoluteDifference,
  add,
  addMicrodays,
  addMillidays,
  ceilToDay,
  clamp,
  compare,
  difference,
  equals,
  floorToDay,
  isInRange,
  lerp,
  linspace,
  max,
  midpoint,
  min,
  roundToMicroday,
  roundToMilliday,
  sort,
  sortComparator,
  subtract,
  wholeDaysBetween,
} from "./arithmetic";

// ─── Leap Seconds ──────────────────────────────────────────────────────────────
export {
  getTaiUtcOffset,
  getTaiUtcOffsetAtJ2000,
  isDuringLeapSecond,
  leapSecondsBetween,
  taiToUtc,
  taiToUtcFull,
  utcToTai,
} from "./leapSeconds";
export type { TaiToUtcResult } from "./leapSeconds";

// ─── Validation ────────────────────────────────────────────────────────────────
export {
  BrightDateError,
  isBrightDateValue,
  isValidBrightDateString,
  validateBrightDateValue,
  validateFiniteNumber,
  validateGPSSeconds,
  validateGPSWeek,
  validateJulianDate,
  validatePrecision,
  validateUnixMs,
} from "./validation";

// ─── Serialization ─────────────────────────────────────────────────────────────
export {
  decode,
  deserialize,
  encode,
  fromBinary,
  fromHttpHeader,
  fromSortableString,
  jsonReplacer,
  jsonReviver,
  serialize,
  toBinary,
  toHttpHeader,
  toSortableString,
} from "./serialization";
export type { SerializedBrightDate } from "./serialization";

// ─── Timezones ─────────────────────────────────────────────────────────────────
export {
  TIMEZONE_OFFSETS,
  formatWithTimezone,
  fractionalDaysToHours,
  fromLocalValue,
  getSystemTimezoneOffset,
  getTimezoneOffset,
  hoursToFractionalDays,
  isDaytime,
  localTimeOfDay,
  toLocalValue,
  toSystemLocal,
} from "./timezones";

// ─── Calendar ──────────────────────────────────────────────────────────────────
export {
  NOTABLE_EPOCHS,
  daysInMonth,
  daysInYear,
  endOfMonth,
  endOfYear,
  fromCalendar,
  getDayOfMonth,
  getDayOfWeek,
  getDayOfYear,
  getMonth,
  getYear,
  isLeapYear,
  monthInterval,
  startOfMonth,
  startOfYear,
  toCalendar,
  yearInterval,
} from "./calendar";

// ─── Astronomy ─────────────────────────────────────────────────────────────────
export {
  earthSunDistance,
  equationOfTime,
  greenwichMeanSiderealTime,
  julianCentury,
  lightTravelTime,
  localMeanSiderealTime,
  lunarPhase,
  lunarPhaseName,
  marsLightDelay,
  solarDeclination,
  solarLongitude,
} from "./astronomy";

// ─── Interplanetary ────────────────────────────────────────────────────────────
export {
  SOLAR_SYSTEM_BODIES,
  approximateDistance,
  coordinatedMarsTime,
  earthDaysToMarsSols,
  formatMarsTime,
  fromMarsSolDate,
  lightDelayBetween,
  lightDelayTo,
  marsSolsToEarthDays,
  roundTripDelay,
  signalArrivalTime,
  signalSendTime,
  toMarsSolDate,
} from "./interplanetary";
export type { SolarSystemBody } from "./interplanetary";

// ─── Spacetime (Bright Spacetime Standard) ────────────────────────────────────
export {
  BRIGHT_METER_M,
  BRIGHT_METER_UNITS,
  BRIGHT_SECOND_UNITS,
  LIGHT_DAY_M,
  LIGHT_DAY_M_BIGINT,
  LIGHT_DAY_UNITS,
  SPEED_OF_LIGHT_M_PER_S,
  SPEED_OF_LIGHT_M_PER_S_BIGINT,
  brightMetersToMetres,
  brightMetersToSeconds,
  brightSecondsToDays,
  daysToBrightSeconds,
  daysToMetres,
  daysToMetresExact,
  metresToBrightMeters,
  metresToDays,
  metresToSeconds,
  metresToSecondsExact,
  secondsToBrightMeters,
  secondsToMetres,
  secondsToMetresExact,
} from "./spacetime";
export type { BrightUnit } from "./spacetime";

// ─── Relativity (Minkowski / Lorentz) ─────────────────────────────────────────
export {
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
} from "./relativity";
export type { IntervalKind, SpacetimeEvent, Velocity } from "./relativity";

// ─── Logging ───────────────────────────────────────────────────────────────────
export {
  BrightDateStopwatch,
  createLogEntry,
  createTimestampGenerator,
  formatLogEntry,
  measure,
  measureAsync,
  toFilenameTimestamp,
} from "./logging";
export type { BrightDateLogEntry, LogLevel } from "./logging";

// ─── Scheduling ────────────────────────────────────────────────────────────────
export {
  BrightDateTimeline,
  INTERVALS,
  nextOccurrenceAfter,
  nextOccurrences,
  previousOccurrenceBefore,
  recurrences,
  timeUntilDailyEvent,
} from "./scheduling";
export type { RecurrencePattern, ScheduledEvent } from "./scheduling";

// ─── Comparisons ───────────────────────────────────────────────────────────────
export {
  closest,
  deduplicate,
  gaps,
  groupByDay,
  isMonotonicallyIncreasing,
  isNonDecreasing,
  largestGap,
  partition,
  statistics,
  within,
} from "./comparisons";
