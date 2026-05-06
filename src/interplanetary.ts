/**
 * BrightDate Interplanetary Utilities
 *
 * Functions for working with time across the solar system.
 * Demonstrates BrightDate's natural fit for space applications
 * where timezone-free, continuous time is essential.
 */

import { lightTravelTime } from './astronomy';
import type { BrightDateValue } from './types';

/**
 * Known solar system bodies with their approximate orbital parameters.
 * Semi-major axis in AU, orbital period in days.
 */
export const SOLAR_SYSTEM_BODIES = {
  mercury: {
    semiMajorAxisAU: 0.387,
    orbitalPeriodDays: 87.97,
    name: 'Mercury',
  },
  venus: { semiMajorAxisAU: 0.723, orbitalPeriodDays: 224.7, name: 'Venus' },
  earth: { semiMajorAxisAU: 1.0, orbitalPeriodDays: 365.25, name: 'Earth' },
  mars: { semiMajorAxisAU: 1.524, orbitalPeriodDays: 687.0, name: 'Mars' },
  jupiter: {
    semiMajorAxisAU: 5.203,
    orbitalPeriodDays: 4332.59,
    name: 'Jupiter',
  },
  saturn: {
    semiMajorAxisAU: 9.537,
    orbitalPeriodDays: 10759.22,
    name: 'Saturn',
  },
  uranus: {
    semiMajorAxisAU: 19.191,
    orbitalPeriodDays: 30688.5,
    name: 'Uranus',
  },
  neptune: {
    semiMajorAxisAU: 30.069,
    orbitalPeriodDays: 60182.0,
    name: 'Neptune',
  },
  moon: { semiMajorAxisAU: 0.00257, orbitalPeriodDays: 27.32, name: 'Moon' },
} as const;

export type SolarSystemBody = keyof typeof SOLAR_SYSTEM_BODIES;

/**
 * Calculate the approximate one-way light delay to a solar system body.
 * Uses the semi-major axis as an average distance (simplified).
 *
 * @param body - Solar system body name
 * @returns Light delay in decimal days
 */
export function lightDelayTo(body: SolarSystemBody): number {
  const info = SOLAR_SYSTEM_BODIES[body];
  return lightTravelTime(info.semiMajorAxisAU);
}

/**
 * Calculate the round-trip communication delay to a body.
 *
 * @param body - Solar system body name
 * @returns Round-trip delay in decimal days
 */
export function roundTripDelay(body: SolarSystemBody): number {
  return lightDelayTo(body) * 2;
}

/**
 * Calculate when a signal sent now would arrive at a body.
 *
 * @param body - Solar system body name
 * @param sendTime - BrightDate when signal is sent
 * @returns BrightDate when signal arrives
 */
export function signalArrivalTime(
  body: SolarSystemBody,
  sendTime: BrightDateValue,
): BrightDateValue {
  return sendTime + lightDelayTo(body);
}

/**
 * Calculate when a signal received now was sent from a body.
 *
 * @param body - Solar system body name
 * @param receiveTime - BrightDate when signal is received
 * @returns BrightDate when signal was sent
 */
export function signalSendTime(
  body: SolarSystemBody,
  receiveTime: BrightDateValue,
): BrightDateValue {
  return receiveTime - lightDelayTo(body);
}

/**
 * A "Mars Sol" is a Martian solar day (24h 39m 35.244s = 1.02749125 Earth days).
 * Convert a BrightDate duration to Mars sols.
 *
 * @param earthDays - Duration in Earth decimal days
 * @returns Duration in Mars sols
 */
export function earthDaysToMarsSols(earthDays: number): number {
  const MARS_SOL_IN_EARTH_DAYS = 1.02749125;
  return earthDays / MARS_SOL_IN_EARTH_DAYS;
}

/**
 * Convert Mars sols to Earth decimal days.
 *
 * @param sols - Duration in Mars sols
 * @returns Duration in Earth decimal days
 */
export function marsSolsToEarthDays(sols: number): number {
  const MARS_SOL_IN_EARTH_DAYS = 1.02749125;
  return sols * MARS_SOL_IN_EARTH_DAYS;
}

/**
 * Calculate the approximate Mars Sol Date (MSD).
 * MSD is a continuous count of Mars solar days since a reference epoch.
 * Reference: December 29, 1873, at approximately Greenwich noon.
 *
 * @param brightDate - BrightDate value
 * @returns Mars Sol Date
 */
export function toMarsSolDate(brightDate: BrightDateValue): number {
  // Julian Date at J2000.0 = 2451545.0
  const jd = brightDate + 2451545.0;
  // MSD formula: (JD - 2405522.0028779) / 1.02749125
  return (jd - 2405522.0028779) / 1.02749125;
}

/**
 * Convert a Mars Sol Date back to a BrightDate.
 *
 * @param msd - Mars Sol Date
 * @returns BrightDate value
 */
export function fromMarsSolDate(msd: number): BrightDateValue {
  const jd = msd * 1.02749125 + 2405522.0028779;
  return jd - 2451545.0;
}

/**
 * Calculate the Coordinated Mars Time (MTC) for a given BrightDate.
 * MTC is the Mars equivalent of UTC — the mean solar time at Mars prime meridian.
 *
 * @param brightDate - BrightDate value
 * @returns MTC as fractional sol [0, 1)
 */
export function coordinatedMarsTime(brightDate: BrightDateValue): number {
  const msd = toMarsSolDate(brightDate);
  const mtc = ((msd % 1) + 1) % 1;
  return mtc;
}

/**
 * Format Coordinated Mars Time as HH:MM:SS (Mars hours, 24.66 Earth hours per sol).
 *
 * @param brightDate - BrightDate value
 * @returns Formatted MTC string
 */
export function formatMarsTime(brightDate: BrightDateValue): string {
  const mtc = coordinatedMarsTime(brightDate);
  // Mars uses 24 "Mars hours" per sol, each slightly longer than Earth hours
  const marsHours = Math.floor(mtc * 24);
  const marsMinutes = Math.floor((mtc * 24 - marsHours) * 60);
  const marsSeconds = Math.floor(
    ((mtc * 24 - marsHours) * 60 - marsMinutes) * 60,
  );

  return `${marsHours.toString().padStart(2, '0')}:${marsMinutes.toString().padStart(2, '0')}:${marsSeconds.toString().padStart(2, '0')} MTC`;
}

/**
 * Calculate the approximate distance between two bodies at a given time.
 * Uses simplified circular orbit model (not accounting for eccentricity or inclination).
 *
 * @param body1 - First body
 * @param body2 - Second body
 * @param brightDate - BrightDate value
 * @returns Approximate distance in AU
 */
export function approximateDistance(
  body1: SolarSystemBody,
  body2: SolarSystemBody,
  brightDate: BrightDateValue,
): number {
  const info1 = SOLAR_SYSTEM_BODIES[body1];
  const info2 = SOLAR_SYSTEM_BODIES[body2];

  // Angular positions (simplified circular orbits)
  const angle1 =
    ((brightDate / info1.orbitalPeriodDays) * 2 * Math.PI) % (2 * Math.PI);
  const angle2 =
    ((brightDate / info2.orbitalPeriodDays) * 2 * Math.PI) % (2 * Math.PI);

  // Positions in 2D
  const x1 = info1.semiMajorAxisAU * Math.cos(angle1);
  const y1 = info1.semiMajorAxisAU * Math.sin(angle1);
  const x2 = info2.semiMajorAxisAU * Math.cos(angle2);
  const y2 = info2.semiMajorAxisAU * Math.sin(angle2);

  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate the light delay between two bodies at a given time.
 *
 * @param body1 - First body
 * @param body2 - Second body
 * @param brightDate - BrightDate value
 * @returns Light delay in decimal days
 */
export function lightDelayBetween(
  body1: SolarSystemBody,
  body2: SolarSystemBody,
  brightDate: BrightDateValue,
): number {
  const distance = approximateDistance(body1, body2, brightDate);
  return lightTravelTime(distance);
}
