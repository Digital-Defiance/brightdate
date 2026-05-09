/**
 * Tests for BrightDate interplanetary utilities.
 */

import {
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
} from '../interplanetary';
import { lightTravelTime } from '../astronomy';

describe('interplanetary', () => {
  // ─── SOLAR_SYSTEM_BODIES ─────────────────────────────────────────────────

  describe('SOLAR_SYSTEM_BODIES', () => {
    it('contains 9 bodies', () => {
      expect(Object.keys(SOLAR_SYSTEM_BODIES)).toHaveLength(9);
    });

    it('Earth has semi-major axis 1.0 AU', () => {
      expect(SOLAR_SYSTEM_BODIES.earth.semiMajorAxisAU).toBe(1.0);
    });

    it('Mars has semi-major axis ~1.524 AU', () => {
      expect(SOLAR_SYSTEM_BODIES.mars.semiMajorAxisAU).toBeCloseTo(1.524, 3);
    });

    it('all bodies have positive orbital periods', () => {
      for (const body of Object.values(SOLAR_SYSTEM_BODIES)) {
        expect(body.orbitalPeriodDays).toBeGreaterThan(0);
      }
    });

    it('all bodies have positive semi-major axes', () => {
      for (const body of Object.values(SOLAR_SYSTEM_BODIES)) {
        expect(body.semiMajorAxisAU).toBeGreaterThan(0);
      }
    });
  });

  // ─── lightDelayTo ────────────────────────────────────────────────────────

  describe('lightDelayTo', () => {
    it('Moon delay is very small (~0.0000149 days = ~1.28s)', () => {
      const delay = lightDelayTo('moon');
      expect(delay).toBeCloseTo(lightTravelTime(0.00257), 5);
    });

    it('Mars delay is larger than Moon delay', () => {
      expect(lightDelayTo('mars')).toBeGreaterThan(lightDelayTo('moon'));
    });

    it('Neptune delay is larger than Mars delay', () => {
      expect(lightDelayTo('neptune')).toBeGreaterThan(lightDelayTo('mars'));
    });

    it('returns a positive value for all bodies', () => {
      const bodies = Object.keys(SOLAR_SYSTEM_BODIES) as Array<
        keyof typeof SOLAR_SYSTEM_BODIES
      >;
      for (const body of bodies) {
        expect(lightDelayTo(body)).toBeGreaterThan(0);
      }
    });
  });

  // ─── roundTripDelay ──────────────────────────────────────────────────────

  describe('roundTripDelay', () => {
    it('is exactly twice the one-way delay', () => {
      expect(roundTripDelay('mars')).toBeCloseTo(lightDelayTo('mars') * 2, 10);
    });

    it('is positive for all bodies', () => {
      const bodies = Object.keys(SOLAR_SYSTEM_BODIES) as Array<
        keyof typeof SOLAR_SYSTEM_BODIES
      >;
      for (const body of bodies) {
        expect(roundTripDelay(body)).toBeGreaterThan(0);
      }
    });
  });

  // ─── signalArrivalTime / signalSendTime ──────────────────────────────────

  describe('signalArrivalTime', () => {
    it('arrival = send + light delay', () => {
      const sendTime = 9622.5;
      const arrival = signalArrivalTime('mars', sendTime);
      expect(arrival).toBeCloseTo(sendTime + lightDelayTo('mars'), 8);
    });

    it('arrival is after send time', () => {
      expect(signalArrivalTime('mars', 0)).toBeGreaterThan(0);
    });
  });

  describe('signalSendTime', () => {
    it('send = receive - light delay', () => {
      const receiveTime = 9622.5;
      const send = signalSendTime('mars', receiveTime);
      expect(send).toBeCloseTo(receiveTime - lightDelayTo('mars'), 8);
    });

    it('round-trips signalArrivalTime → signalSendTime', () => {
      const sendTime = 9622.5;
      const arrival = signalArrivalTime('mars', sendTime);
      const recovered = signalSendTime('mars', arrival);
      expect(recovered).toBeCloseTo(sendTime, 8);
    });
  });

  // ─── earthDaysToMarsSols / marsSolsToEarthDays ───────────────────────────

  describe('earthDaysToMarsSols', () => {
    it('1 Earth day < 1 Mars sol', () => {
      expect(earthDaysToMarsSols(1)).toBeLessThan(1);
    });

    it('1.02749125 Earth days = 1 Mars sol', () => {
      expect(earthDaysToMarsSols(1.02749125)).toBeCloseTo(1, 8);
    });

    it('0 Earth days = 0 Mars sols', () => {
      expect(earthDaysToMarsSols(0)).toBe(0);
    });
  });

  describe('marsSolsToEarthDays', () => {
    it('1 Mars sol > 1 Earth day', () => {
      expect(marsSolsToEarthDays(1)).toBeGreaterThan(1);
    });

    it('1 Mars sol = 1.02749125 Earth days', () => {
      expect(marsSolsToEarthDays(1)).toBeCloseTo(1.02749125, 8);
    });

    it('round-trips earthDaysToMarsSols → marsSolsToEarthDays', () => {
      const days = 100;
      expect(marsSolsToEarthDays(earthDaysToMarsSols(days))).toBeCloseTo(
        days,
        8,
      );
    });
  });

  // ─── toMarsSolDate / fromMarsSolDate ─────────────────────────────────────

  describe('toMarsSolDate', () => {
    it('returns a positive value for current epoch', () => {
      expect(toMarsSolDate(9622)).toBeGreaterThan(0);
    });

    it('is consistent with the JD formula', () => {
      const bd = 0; // J2000.0
      const jd = bd + 2451545.0;
      const expected = (jd - 2405522.0028779) / 1.02749125;
      expect(toMarsSolDate(bd)).toBeCloseTo(expected, 5);
    });
  });

  describe('fromMarsSolDate', () => {
    it('round-trips toMarsSolDate → fromMarsSolDate', () => {
      const bd = 9622.5;
      const msd = toMarsSolDate(bd);
      expect(fromMarsSolDate(msd)).toBeCloseTo(bd, 5);
    });
  });

  // ─── coordinatedMarsTime ─────────────────────────────────────────────────

  describe('coordinatedMarsTime', () => {
    it('returns a value in [0, 1)', () => {
      for (const bd of [0, 100, 1000, 9622]) {
        const mtc = coordinatedMarsTime(bd);
        expect(mtc).toBeGreaterThanOrEqual(0);
        expect(mtc).toBeLessThan(1);
      }
    });

    it('is the fractional part of the Mars Sol Date', () => {
      const bd = 9622.5;
      const msd = toMarsSolDate(bd);
      const expected = ((msd % 1) + 1) % 1;
      expect(coordinatedMarsTime(bd)).toBeCloseTo(expected, 8);
    });
  });

  // ─── formatMarsTime ──────────────────────────────────────────────────────

  describe('formatMarsTime', () => {
    it('returns a string in HH:MM:SS MTC format', () => {
      const result = formatMarsTime(9622.5);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2} MTC$/);
    });

    it('hours are in [00, 23]', () => {
      const result = formatMarsTime(9622.5);
      const hours = parseInt(result.substring(0, 2));
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
    });

    it('minutes are in [00, 59]', () => {
      const result = formatMarsTime(9622.5);
      const minutes = parseInt(result.substring(3, 5));
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
    });
  });

  // ─── approximateDistance ─────────────────────────────────────────────────

  describe('approximateDistance', () => {
    it('Earth-Earth distance is 0', () => {
      expect(approximateDistance('earth', 'earth', 0)).toBeCloseTo(0, 5);
    });

    it('Earth-Mars distance is positive', () => {
      expect(approximateDistance('earth', 'mars', 0)).toBeGreaterThan(0);
    });

    it('is symmetric', () => {
      const bd = 9622;
      expect(approximateDistance('earth', 'mars', bd)).toBeCloseTo(
        approximateDistance('mars', 'earth', bd),
        8,
      );
    });

    it('varies over time (orbital motion)', () => {
      const distances = Array.from({ length: 10 }, (_, i) =>
        approximateDistance('earth', 'mars', i * 100),
      );
      const min = Math.min(...distances);
      const max = Math.max(...distances);
      expect(max).toBeGreaterThan(min);
    });
  });

  // ─── lightDelayBetween ───────────────────────────────────────────────────

  describe('lightDelayBetween', () => {
    it('Earth-Earth delay is 0', () => {
      expect(lightDelayBetween('earth', 'earth', 0)).toBeCloseTo(0, 5);
    });

    it('Earth-Mars delay is positive', () => {
      expect(lightDelayBetween('earth', 'mars', 0)).toBeGreaterThan(0);
    });

    it('is symmetric', () => {
      const bd = 9622;
      expect(lightDelayBetween('earth', 'mars', bd)).toBeCloseTo(
        lightDelayBetween('mars', 'earth', bd),
        8,
      );
    });
  });
});
