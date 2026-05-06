/**
 * BrightDate Astronomy Utilities
 *
 * Functions for astronomical time calculations, including
 * sidereal time, Earth rotation, and basic orbital mechanics helpers.
 * These demonstrate the natural fit of BrightDate with astronomical computation.
 */

import type { BrightDateValue } from './types';

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) for a given BrightDate.
 *
 * Uses the IAU 1982 formula (accurate to ~0.1 seconds over centuries).
 * GMST is the hour angle of the vernal equinox at Greenwich.
 *
 * @param brightDate - BrightDate value
 * @returns GMST in degrees [0, 360)
 */
export function greenwichMeanSiderealTime(brightDate: BrightDateValue): number {
  // Julian centuries since J2000.0
  const T = brightDate / 36525.0;

  // GMST at 0h UT1 in seconds (IAU 1982 model)
  // θ = 280.46061837 + 360.98564736629 * d + 0.000387933 * T² - T³/38710000
  // where d = days since J2000.0
  let gmst =
    280.46061837 +
    360.98564736629 * brightDate +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;

  // Normalize to [0, 360)
  gmst = ((gmst % 360) + 360) % 360;
  return gmst;
}

/**
 * Calculate Local Mean Sidereal Time (LMST) for a given BrightDate and longitude.
 *
 * @param brightDate - BrightDate value
 * @param longitudeDeg - Observer's longitude in degrees (East positive)
 * @returns LMST in degrees [0, 360)
 */
export function localMeanSiderealTime(
  brightDate: BrightDateValue,
  longitudeDeg: number,
): number {
  const gmst = greenwichMeanSiderealTime(brightDate);
  let lmst = gmst + longitudeDeg;
  lmst = ((lmst % 360) + 360) % 360;
  return lmst;
}

/**
 * Calculate the Julian Century value (T) for a BrightDate.
 * This is the fundamental time argument for many astronomical formulae.
 *
 * @param brightDate - BrightDate value
 * @returns Julian centuries since J2000.0
 */
export function julianCentury(brightDate: BrightDateValue): number {
  return brightDate / 36525.0;
}

/**
 * Calculate the approximate position of the Sun (ecliptic longitude).
 * Low-accuracy formula suitable for general purposes (~1° accuracy).
 *
 * @param brightDate - BrightDate value
 * @returns Sun's ecliptic longitude in degrees [0, 360)
 */
export function solarLongitude(brightDate: BrightDateValue): number {
  const n = brightDate; // days since J2000.0

  // Mean longitude (degrees)
  const L = (280.46 + 0.9856474 * n) % 360;

  // Mean anomaly (degrees)
  const g = (357.528 + 0.9856003 * n) % 360;
  const gRad = (g * Math.PI) / 180;

  // Ecliptic longitude
  let lambda = L + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad);
  lambda = ((lambda % 360) + 360) % 360;

  return lambda;
}

/**
 * Calculate the approximate solar declination.
 *
 * @param brightDate - BrightDate value
 * @returns Solar declination in degrees
 */
export function solarDeclination(brightDate: BrightDateValue): number {
  const lambda = solarLongitude(brightDate);
  const lambdaRad = (lambda * Math.PI) / 180;

  // Obliquity of the ecliptic (approximate)
  const epsilon = 23.439 - 0.0000004 * brightDate;
  const epsilonRad = (epsilon * Math.PI) / 180;

  const declination = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad));
  return (declination * 180) / Math.PI;
}

/**
 * Calculate the equation of time (difference between apparent and mean solar time).
 *
 * @param brightDate - BrightDate value
 * @returns Equation of time in minutes
 */
export function equationOfTime(brightDate: BrightDateValue): number {
  const n = brightDate;

  // Mean longitude
  const L = ((280.46 + 0.9856474 * n) % 360) * (Math.PI / 180);

  // Equation of time in minutes (approximate)
  const eot = -7.655 * Math.sin(L) + 9.873 * Math.sin(2 * L + 3.5932);

  return eot;
}

/**
 * Calculate the approximate Earth-Sun distance in AU.
 *
 * @param brightDate - BrightDate value
 * @returns Distance in Astronomical Units
 */
export function earthSunDistance(brightDate: BrightDateValue): number {
  const n = brightDate;
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);

  // Distance in AU (approximate)
  return 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
}

/**
 * Calculate the approximate Moon phase (0 = new, 0.5 = full).
 * Uses a simplified synodic month calculation.
 *
 * @param brightDate - BrightDate value
 * @returns Phase value [0, 1) where 0 = new moon, 0.5 = full moon
 */
export function lunarPhase(brightDate: BrightDateValue): number {
  // Known new moon: January 6, 2000, 18:14 UTC
  // BrightDate for that: (Jan 6 18:14 UTC - Jan 1 12:00 UTC) / 86400 = 5.2597...
  const knownNewMoon = 5.2597;
  const synodicMonth = 29.53059; // days

  const daysSinceKnownNew = brightDate - knownNewMoon;
  const phase =
    ((daysSinceKnownNew % synodicMonth) + synodicMonth) % synodicMonth;
  return phase / synodicMonth;
}

/**
 * Get a human-readable lunar phase name.
 *
 * @param brightDate - BrightDate value
 * @returns Phase name string
 */
export function lunarPhaseName(brightDate: BrightDateValue): string {
  const phase = lunarPhase(brightDate);

  if (phase < 0.0625) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  if (phase < 0.9375) return 'Waning Crescent';
  return 'New Moon';
}

/**
 * Calculate light-travel time between two distances.
 * Useful for interplanetary communication delay calculations.
 *
 * @param distanceAU - Distance in Astronomical Units
 * @returns Light-travel time in decimal days
 */
export function lightTravelTime(distanceAU: number): number {
  // Speed of light: 1 AU in ~499.004784 seconds
  const LIGHT_SECONDS_PER_AU = 499.004784;
  return (distanceAU * LIGHT_SECONDS_PER_AU) / 86400;
}

/**
 * Approximate one-way light time to Mars (varies with orbital positions).
 * Uses a simplified model based on synodic period.
 *
 * @param brightDate - BrightDate value
 * @returns Approximate light-travel time to Mars in decimal days
 */
export function marsLightDelay(brightDate: BrightDateValue): number {
  // Mars synodic period ≈ 779.94 days
  // Distance varies from ~0.37 AU (opposition) to ~2.68 AU (conjunction)
  // Simplified sinusoidal model
  const synodicPeriod = 779.94;
  const phase = ((brightDate % synodicPeriod) + synodicPeriod) % synodicPeriod;
  const phaseAngle = (phase / synodicPeriod) * 2 * Math.PI;

  // Average distance ~1.52 AU, varies ±1.15 AU approximately
  const distance = 1.52 + 1.15 * Math.cos(phaseAngle);
  return lightTravelTime(Math.abs(distance));
}
