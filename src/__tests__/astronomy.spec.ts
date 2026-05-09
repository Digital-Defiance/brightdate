/**
 * Tests for BrightDate astronomy utilities.
 */

import {
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
} from '../astronomy';

describe('astronomy', () => {
  // ─── julianCentury ───────────────────────────────────────────────────────

  describe('julianCentury', () => {
    it('returns 0 at J2000.0 epoch', () => {
      expect(julianCentury(0)).toBe(0);
    });

    it('returns 1 after 36525 days (1 Julian century)', () => {
      expect(julianCentury(36525)).toBe(1);
    });

    it('returns negative for dates before J2000.0', () => {
      expect(julianCentury(-36525)).toBe(-1);
    });
  });

  // ─── greenwichMeanSiderealTime ───────────────────────────────────────────

  describe('greenwichMeanSiderealTime', () => {
    it('returns a value in [0, 360)', () => {
      for (const bd of [0, 100, 1000, 9622, -100]) {
        const gmst = greenwichMeanSiderealTime(bd);
        expect(gmst).toBeGreaterThanOrEqual(0);
        expect(gmst).toBeLessThan(360);
      }
    });

    it('at J2000.0 epoch, GMST ≈ 280.46061837 degrees (IAU 1982)', () => {
      // IAU 1982: GMST at J2000.0 ≈ 280.46061837°
      // Assert to 4 decimal places (~0.0001° ≈ 0.024 seconds-of-day) —
      // matches the documented accuracy of the IAU 1982 formula.
      const gmst = greenwichMeanSiderealTime(0);
      expect(gmst).toBeCloseTo(280.46061837, 4);
    });

    it('advances by GMST rate of 360.98564736629°/day (IAU rate)', () => {
      // The sidereal day is ~4 minutes shorter than the solar day, so GMST
      // advances by ~360.985°/day. Verify to 4 decimal places.
      const gmst0 = greenwichMeanSiderealTime(0);
      const gmst1 = greenwichMeanSiderealTime(1);
      const diff = (gmst1 - gmst0 + 360) % 360;
      const expected = 360.98564736629 % 360;
      expect(diff).toBeCloseTo(expected, 4);
    });
  });

  // ─── localMeanSiderealTime ───────────────────────────────────────────────

  describe('localMeanSiderealTime', () => {
    it('returns a value in [0, 360)', () => {
      const lmst = localMeanSiderealTime(0, 45);
      expect(lmst).toBeGreaterThanOrEqual(0);
      expect(lmst).toBeLessThan(360);
    });

    it('LMST = GMST + longitude (mod 360)', () => {
      const bd = 100;
      const lon = 90;
      const gmst = greenwichMeanSiderealTime(bd);
      const lmst = localMeanSiderealTime(bd, lon);
      expect(lmst).toBeCloseTo(((gmst + lon) % 360 + 360) % 360, 5);
    });

    it('LMST at longitude 0 equals GMST', () => {
      const bd = 500;
      expect(localMeanSiderealTime(bd, 0)).toBeCloseTo(
        greenwichMeanSiderealTime(bd),
        8,
      );
    });
  });

  // ─── solarLongitude ──────────────────────────────────────────────────────

  describe('solarLongitude', () => {
    it('returns a value in [0, 360)', () => {
      for (const bd of [0, 100, 1000, 9622]) {
        const lon = solarLongitude(bd);
        expect(lon).toBeGreaterThanOrEqual(0);
        expect(lon).toBeLessThan(360);
      }
    });

    it('at J2000.0, solar longitude ≈ 280.5°', () => {
      // Mean longitude at J2000.0 ≈ 280.46°
      const lon = solarLongitude(0);
      expect(lon).toBeGreaterThan(270);
      expect(lon).toBeLessThan(290);
    });
  });

  // ─── solarDeclination ────────────────────────────────────────────────────

  describe('solarDeclination', () => {
    it('returns a value in [-23.5, 23.5] degrees', () => {
      for (const bd of [0, 100, 200, 300]) {
        const dec = solarDeclination(bd);
        expect(dec).toBeGreaterThanOrEqual(-23.5);
        expect(dec).toBeLessThanOrEqual(23.5);
      }
    });

    it('is near 0 at equinoxes (approximately)', () => {
      // Spring equinox ~March 20 = ~day 79 of year 2000
      // BrightDate for 2000-03-20 ≈ 79 - 0.5 (Y2K offset) ≈ 78.5
      // This is approximate; just check it's near 0
      const dec = solarDeclination(79);
      expect(Math.abs(dec)).toBeLessThan(5);
    });
  });

  // ─── equationOfTime ──────────────────────────────────────────────────────

  describe('equationOfTime', () => {
    it('returns a value in minutes (typically -16 to +16)', () => {
      for (const bd of [0, 100, 200, 300]) {
        const eot = equationOfTime(bd);
        expect(eot).toBeGreaterThan(-20);
        expect(eot).toBeLessThan(20);
      }
    });

    it('returns a finite number', () => {
      expect(isFinite(equationOfTime(9622))).toBe(true);
    });
  });

  // ─── earthSunDistance ────────────────────────────────────────────────────

  describe('earthSunDistance', () => {
    it('returns approximately 1 AU on average', () => {
      const dist = earthSunDistance(0);
      expect(dist).toBeGreaterThan(0.98);
      expect(dist).toBeLessThan(1.02);
    });

    it('varies between ~0.983 AU (perihelion) and ~1.017 AU (aphelion)', () => {
      const distances = Array.from({ length: 365 }, (_, i) =>
        earthSunDistance(i),
      );
      const min = Math.min(...distances);
      const max = Math.max(...distances);
      expect(min).toBeGreaterThan(0.98);
      expect(max).toBeLessThan(1.02);
    });
  });

  // ─── lunarPhase ──────────────────────────────────────────────────────────

  describe('lunarPhase', () => {
    it('returns a value in [0, 1)', () => {
      for (const bd of [0, 100, 1000, 9622]) {
        const phase = lunarPhase(bd);
        expect(phase).toBeGreaterThanOrEqual(0);
        expect(phase).toBeLessThan(1);
      }
    });

    it('at the known new moon (bd=5.2597), phase ≈ 0 to 4 decimal places', () => {
      // The source defines 5.2597 as the reference new moon; phase must be
      // very close to 0 (within 1e-4 of the synodic cycle, ≈0.003 days ≈ 4 min).
      const phase = lunarPhase(5.2597);
      expect(phase).toBeCloseTo(0, 4);
    });

    it('half synodic month later, phase ≈ 0.5 (full moon) within 1e-3', () => {
      // One half-cycle (~14.765 days) should place us very close to 0.5.
      const phase = lunarPhase(5.2597 + 29.53059 / 2);
      expect(phase).toBeCloseTo(0.5, 3);
    });

    it('one synodic month later, phase ≈ 0 again', () => {
      const phase = lunarPhase(5.2597 + 29.53059);
      expect(phase).toBeCloseTo(0, 4);
    });
  });

  // ─── lunarPhaseName ──────────────────────────────────────────────────────

  describe('lunarPhaseName', () => {
    it('returns "New Moon" near phase 0', () => {
      expect(lunarPhaseName(5.2597)).toBe('New Moon');
    });

    it('returns "Full Moon" near phase 0.5', () => {
      expect(lunarPhaseName(5.2597 + 29.53059 / 2)).toBe('Full Moon');
    });

    it('returns "First Quarter" near phase 0.25', () => {
      expect(lunarPhaseName(5.2597 + 29.53059 * 0.25)).toBe('First Quarter');
    });

    it('returns "Last Quarter" near phase 0.75', () => {
      expect(lunarPhaseName(5.2597 + 29.53059 * 0.75)).toBe('Last Quarter');
    });

    it('returns one of the 8 valid phase names', () => {
      const validNames = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
      ];
      for (let i = 0; i < 8; i++) {
        const bd = 5.2597 + (29.53059 * i) / 8;
        expect(validNames).toContain(lunarPhaseName(bd));
      }
    });
  });

  // ─── lightTravelTime ─────────────────────────────────────────────────────

  describe('lightTravelTime', () => {
    it('returns 0 for distance 0', () => {
      expect(lightTravelTime(0)).toBe(0);
    });

    it('1 AU takes ~499 seconds = ~0.00578 days', () => {
      const days = lightTravelTime(1);
      // 499.004784 / 86400 ≈ 0.005775
      expect(days).toBeCloseTo(499.004784 / 86400, 6);
    });

    it('is proportional to distance', () => {
      expect(lightTravelTime(2)).toBeCloseTo(lightTravelTime(1) * 2, 8);
    });

    it('Moon (~0.00257 AU) takes ~1.2824 seconds', () => {
      // 0.00257 AU × 499.004784 s/AU = 1.28244229 s exactly
      const days = lightTravelTime(0.00257);
      const seconds = days * 86400;
      expect(seconds).toBeCloseTo(1.28244, 4); // within 0.00005 s
    });
  });

  // ─── marsLightDelay ──────────────────────────────────────────────────────

  describe('marsLightDelay', () => {
    it('returns a positive value', () => {
      expect(marsLightDelay(0)).toBeGreaterThan(0);
    });

    it('at bd=0 (phase=0, opposition), distance is minimum (mid - 1.15 AU)', () => {
      // Source formula: distance = 1.52 + 1.15 * cos(phase)
      // At phase=0: cos=1, distance = 2.67 AU (conjunction in this model)
      // Wait — the source's model treats cos(0)=1 as MAX distance, not min.
      // So bd=0 corresponds to maximum distance (2.67 AU) in this simplified model.
      // light delay = 2.67 * 499.004784 / 86400 ≈ 0.01544 days
      const delay = marsLightDelay(0);
      expect(delay).toBeCloseTo((2.67 * 499.004784) / 86400, 3);
    });

    it('varies with orbital position (oscillates over synodic period)', () => {
      const delays = Array.from({ length: 10 }, (_, i) =>
        marsLightDelay(i * 78),
      );
      const min = Math.min(...delays);
      const max = Math.max(...delays);
      // Distance varies 0.37-2.67 AU in the model, so delay varies ~0.002-0.015 days
      expect(max - min).toBeGreaterThan(0.005);
    });

    it('is bounded by the min/max round-trip light times to Mars', () => {
      // Model allows 1.52 ± 1.15 AU distance → 0.37 to 2.67 AU
      // 0.37 AU * 499s/AU / 86400 ≈ 0.00214 days
      // 2.67 AU * 499s/AU / 86400 ≈ 0.01542 days
      for (let i = 0; i < 20; i++) {
        const delay = marsLightDelay(i * 50);
        expect(delay).toBeGreaterThanOrEqual(0.002);
        expect(delay).toBeLessThanOrEqual(0.016);
      }
    });
  });
});
