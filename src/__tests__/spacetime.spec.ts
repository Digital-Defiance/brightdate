/**
 * Tests for the Bright Spacetime Standard module.
 */

import { SECONDS_PER_DAY } from "../constants";
import {
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
} from "../spacetime";

describe("spacetime", () => {
  describe("fundamental constants", () => {
    it("defines the speed of light exactly per SI 2019", () => {
      expect(SPEED_OF_LIGHT_M_PER_S).toBe(299_792_458);
      expect(SPEED_OF_LIGHT_M_PER_S_BIGINT).toBe(299_792_458n);
    });

    it("defines BrightMeter as one second of light-travel", () => {
      expect(BRIGHT_METER_M).toBe(SPEED_OF_LIGHT_M_PER_S);
    });

    it("defines Light-Day = c × 86,400 s exactly", () => {
      expect(LIGHT_DAY_M).toBe(25_902_068_371_200);
      expect(LIGHT_DAY_M_BIGINT).toBe(25_902_068_371_200n);
      expect(LIGHT_DAY_M).toBe(SPEED_OF_LIGHT_M_PER_S * SECONDS_PER_DAY);
    });
  });

  describe("unit hierarchies", () => {
    it("BrightMeter units span μbm to Gbm with consistent metres = seconds × c", () => {
      for (const u of Object.values(BRIGHT_METER_UNITS)) {
        expect(u.metres).toBeCloseTo(u.seconds * SPEED_OF_LIGHT_M_PER_S, 6);
      }
      expect(BRIGHT_METER_UNITS.brightMeter.metres).toBe(
        SPEED_OF_LIGHT_M_PER_S,
      );
      expect(BRIGHT_METER_UNITS.gigaBrightMeter.seconds).toBe(1e9);
    });

    it("Bright-Second units form a decimal cascade", () => {
      expect(BRIGHT_SECOND_UNITS.brightSecond.seconds).toBe(1);
      expect(BRIGHT_SECOND_UNITS.brightKilosecond.seconds).toBe(1_000);
      expect(BRIGHT_SECOND_UNITS.brightMegasecond.seconds).toBe(1_000_000);
      expect(BRIGHT_SECOND_UNITS.brightGigasecond.seconds).toBe(1_000_000_000);
    });

    it("Light-Day units are exact integer metres", () => {
      expect(LIGHT_DAY_UNITS.lightMilliday.metres).toBe(25_902_068_371.2);
      expect(LIGHT_DAY_UNITS.lightDay.metres).toBe(25_902_068_371_200);
      expect(LIGHT_DAY_UNITS.lightKiloday.metres).toBe(25_902_068_371_200_000);
    });
  });

  describe("conversions: seconds ↔ metres", () => {
    it("round-trips exactly for one second", () => {
      expect(secondsToMetres(1)).toBe(SPEED_OF_LIGHT_M_PER_S);
      expect(metresToSeconds(SPEED_OF_LIGHT_M_PER_S)).toBe(1);
    });

    it("handles zero and negatives", () => {
      expect(secondsToMetres(0)).toBe(0);
      expect(secondsToMetres(-1)).toBe(-SPEED_OF_LIGHT_M_PER_S);
    });
  });

  describe("conversions: days ↔ metres", () => {
    it("1 day of light-travel = 1 Light-Day exactly", () => {
      expect(daysToMetres(1)).toBe(LIGHT_DAY_M);
      expect(metresToDays(LIGHT_DAY_M)).toBe(1);
    });

    it("round-trips with high precision for fractional days", () => {
      const days = 9622.50417;
      expect(metresToDays(daysToMetres(days))).toBeCloseTo(days, 10);
    });
  });

  describe("conversions: BrightMeters ↔ seconds ↔ metres", () => {
    it("BrightMeters and seconds are numerically identical", () => {
      expect(secondsToBrightMeters(42)).toBe(42);
      expect(brightMetersToSeconds(42)).toBe(42);
    });

    it("BrightMeters convert to metres via c", () => {
      expect(brightMetersToMetres(1)).toBe(SPEED_OF_LIGHT_M_PER_S);
      expect(metresToBrightMeters(SPEED_OF_LIGHT_M_PER_S)).toBe(1);
    });
  });

  describe("conversions: days ↔ Bright-Seconds", () => {
    it("1 day = 86,400 Bright-Seconds", () => {
      expect(daysToBrightSeconds(1)).toBe(SECONDS_PER_DAY);
      expect(brightSecondsToDays(SECONDS_PER_DAY)).toBe(1);
    });
  });

  describe("exact (BigInt) conversions", () => {
    it("secondsToMetresExact is exact for large integers", () => {
      expect(secondsToMetresExact(1n)).toBe(SPEED_OF_LIGHT_M_PER_S_BIGINT);
      expect(secondsToMetresExact(86_400n)).toBe(LIGHT_DAY_M_BIGINT);
    });

    it("metresToSecondsExact truncates toward zero", () => {
      expect(metresToSecondsExact(LIGHT_DAY_M_BIGINT)).toBe(86_400n);
      // 1 m is less than 1 light-second → truncates to 0
      expect(metresToSecondsExact(1n)).toBe(0n);
    });

    it("daysToMetresExact matches the integer Light-Day value", () => {
      expect(daysToMetresExact(1n)).toBe(LIGHT_DAY_M_BIGINT);
      expect(daysToMetresExact(1_000n)).toBe(LIGHT_DAY_M_BIGINT * 1_000n);
    });
  });
});
