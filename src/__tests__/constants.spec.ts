/**
 * Tests for BrightDate constants.
 */

import {
  CURRENT_TAI_UTC_OFFSET,
  DEFAULT_PRECISION,
  J2000_UNIX_MS_UTC,
  LEAP_SECOND_TABLE,
  MAX_PRECISION,
  METRIC_UNITS,
  MS_PER_DAY,
  SECONDS_PER_DAY,
  TAI_UTC_OFFSET_AT_J2000,
  TT_TAI_OFFSET_SECONDS,
} from '../constants';

describe('constants', () => {
  describe('J2000_UNIX_MS_UTC', () => {
    it('equals 2000-01-01T12:00:00.000Z in Unix ms', () => {
      expect(J2000_UNIX_MS_UTC).toBe(946728000000);
    });

    it('corresponds to the correct Date', () => {
      const d = new Date(J2000_UNIX_MS_UTC);
      expect(d.toISOString()).toBe('2000-01-01T12:00:00.000Z');
    });
  });

  describe('MS_PER_DAY', () => {
    it('is 86_400_000', () => {
      expect(MS_PER_DAY).toBe(86_400_000);
    });

    it('equals SECONDS_PER_DAY * 1000', () => {
      expect(MS_PER_DAY).toBe(SECONDS_PER_DAY * 1000);
    });
  });

  describe('SECONDS_PER_DAY', () => {
    it('is 86_400', () => {
      expect(SECONDS_PER_DAY).toBe(86_400);
    });
  });

  describe('TAI_UTC_OFFSET_AT_J2000', () => {
    it('is 32 seconds', () => {
      expect(TAI_UTC_OFFSET_AT_J2000).toBe(32);
    });
  });

  describe('TT_TAI_OFFSET_SECONDS', () => {
    it('is 32.184 seconds', () => {
      expect(TT_TAI_OFFSET_SECONDS).toBe(32.184);
    });
  });

  describe('DEFAULT_PRECISION', () => {
    it('is 5', () => {
      expect(DEFAULT_PRECISION).toBe(5);
    });
  });

  describe('MAX_PRECISION', () => {
    it('is 12', () => {
      expect(MAX_PRECISION).toBe(12);
    });

    it('is greater than DEFAULT_PRECISION', () => {
      expect(MAX_PRECISION).toBeGreaterThan(DEFAULT_PRECISION);
    });
  });

  describe('CURRENT_TAI_UTC_OFFSET', () => {
    it('is 37 seconds (as of 2017-01-01)', () => {
      expect(CURRENT_TAI_UTC_OFFSET).toBe(37);
    });

    it('matches the last entry in LEAP_SECOND_TABLE', () => {
      const lastEntry = LEAP_SECOND_TABLE[LEAP_SECOND_TABLE.length - 1];
      expect(CURRENT_TAI_UTC_OFFSET).toBe(lastEntry[1]);
    });
  });

  describe('LEAP_SECOND_TABLE', () => {
    it('has 28 entries', () => {
      expect(LEAP_SECOND_TABLE.length).toBe(28);
    });

    it('starts at 1972-01-01 with offset 10', () => {
      expect(LEAP_SECOND_TABLE[0]).toEqual([63072000, 10]);
    });

    it('ends at 2017-01-01 with offset 37', () => {
      const last = LEAP_SECOND_TABLE[LEAP_SECOND_TABLE.length - 1];
      expect(last).toEqual([1483228800, 37]);
    });

    it('has monotonically increasing timestamps', () => {
      for (let i = 1; i < LEAP_SECOND_TABLE.length; i++) {
        expect(LEAP_SECOND_TABLE[i][0]).toBeGreaterThan(
          LEAP_SECOND_TABLE[i - 1][0],
        );
      }
    });

    it('has monotonically increasing offsets', () => {
      for (let i = 1; i < LEAP_SECOND_TABLE.length; i++) {
        expect(LEAP_SECOND_TABLE[i][1]).toBeGreaterThan(
          LEAP_SECOND_TABLE[i - 1][1],
        );
      }
    });

    it('each offset increments by exactly 1', () => {
      for (let i = 1; i < LEAP_SECOND_TABLE.length; i++) {
        expect(LEAP_SECOND_TABLE[i][1] - LEAP_SECOND_TABLE[i - 1][1]).toBe(1);
      }
    });
  });

  describe('METRIC_UNITS', () => {
    it('milliday is 0.001', () => {
      expect(METRIC_UNITS.milliday).toBe(0.001);
    });

    it('microday is 0.000001', () => {
      expect(METRIC_UNITS.microday).toBe(0.000_001);
    });

    it('nanoday is 0.000000001', () => {
      expect(METRIC_UNITS.nanoday).toBe(0.000_000_001);
    });

    it('milliday = 1000 microdays', () => {
      expect(METRIC_UNITS.milliday).toBe(METRIC_UNITS.microday * 1000);
    });

    it('microday = 1000 nanodays', () => {
      expect(METRIC_UNITS.microday).toBeCloseTo(METRIC_UNITS.nanoday * 1000, 10);
    });
  });
});
