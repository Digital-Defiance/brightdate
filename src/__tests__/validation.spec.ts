/**
 * Tests for BrightDate validation utilities.
 */

import {
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
} from '../validation';

describe('validation', () => {
  // ─── BrightDateError ─────────────────────────────────────────────────────

  describe('BrightDateError', () => {
    it('is an instance of Error', () => {
      const err = new BrightDateError('test', 'TEST_CODE');
      expect(err).toBeInstanceOf(Error);
    });

    it('has the correct name', () => {
      const err = new BrightDateError('test', 'TEST_CODE');
      expect(err.name).toBe('BrightDateError');
    });

    it('stores the code', () => {
      const err = new BrightDateError('test message', 'MY_CODE');
      expect(err.code).toBe('MY_CODE');
    });

    it('stores the message', () => {
      const err = new BrightDateError('test message', 'CODE');
      expect(err.message).toBe('test message');
    });
  });

  // ─── validateFiniteNumber ────────────────────────────────────────────────

  describe('validateFiniteNumber', () => {
    it('does not throw for a finite number', () => {
      expect(() => validateFiniteNumber(42, 'x')).not.toThrow();
    });

    it('does not throw for 0', () => {
      expect(() => validateFiniteNumber(0, 'x')).not.toThrow();
    });

    it('does not throw for negative finite number', () => {
      expect(() => validateFiniteNumber(-100, 'x')).not.toThrow();
    });

    it('throws BrightDateError for NaN', () => {
      expect(() => validateFiniteNumber(NaN, 'x')).toThrow(BrightDateError);
    });

    it('throws with INVALID_NUMBER code for NaN', () => {
      expect.assertions(2);
      try {
        validateFiniteNumber(NaN, 'myParam');
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('INVALID_NUMBER');
      }
    });

    it('throws for Infinity', () => {
      expect(() => validateFiniteNumber(Infinity, 'x')).toThrow(BrightDateError);
    });

    it('throws for -Infinity', () => {
      expect(() => validateFiniteNumber(-Infinity, 'x')).toThrow(BrightDateError);
    });

    it('throws for non-number', () => {
      expect(() => validateFiniteNumber('hello' as unknown as number, 'x')).toThrow(
        BrightDateError,
      );
    });

    it('includes parameter name in error message', () => {
      expect.assertions(2);
      try {
        validateFiniteNumber(NaN, 'mySpecialParam');
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).message).toContain('mySpecialParam');
      }
    });
  });

  // ─── validateBrightDateValue ─────────────────────────────────────────────

  describe('validateBrightDateValue', () => {
    it('does not throw for valid BrightDate value', () => {
      expect(() => validateBrightDateValue(9622.5)).not.toThrow();
    });

    it('throws for NaN', () => {
      expect(() => validateBrightDateValue(NaN)).toThrow(BrightDateError);
    });

    it('throws for Infinity', () => {
      expect(() => validateBrightDateValue(Infinity)).toThrow(BrightDateError);
    });
  });

  // ─── validatePrecision ───────────────────────────────────────────────────

  describe('validatePrecision', () => {
    it('does not throw for valid precision 1', () => {
      expect(() => validatePrecision(1)).not.toThrow();
    });

    it('does not throw for valid precision 12', () => {
      expect(() => validatePrecision(12)).not.toThrow();
    });

    it('does not throw for precision 5', () => {
      expect(() => validatePrecision(5)).not.toThrow();
    });

    it('throws for precision 0', () => {
      expect(() => validatePrecision(0)).toThrow(BrightDateError);
    });

    it('throws for precision 13', () => {
      expect(() => validatePrecision(13)).toThrow(BrightDateError);
    });

    it('throws for non-integer precision', () => {
      expect(() => validatePrecision(2.5)).toThrow(BrightDateError);
    });

    it('throws with INVALID_PRECISION code', () => {
      expect.assertions(2);
      try {
        validatePrecision(0);
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('INVALID_PRECISION');
      }
    });

    it('throws for negative precision', () => {
      expect(() => validatePrecision(-1)).toThrow(BrightDateError);
    });
  });

  // ─── isValidBrightDateString ─────────────────────────────────────────────

  describe('isValidBrightDateString', () => {
    it('returns true for "9622.50417"', () => {
      expect(isValidBrightDateString('9622.50417')).toBe(true);
    });

    it('returns true for "0"', () => {
      expect(isValidBrightDateString('0')).toBe(true);
    });

    it('returns true for "-10957.5"', () => {
      expect(isValidBrightDateString('-10957.5')).toBe(true);
    });

    it('returns true for integer string "100"', () => {
      expect(isValidBrightDateString('100')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidBrightDateString('')).toBe(false);
    });

    it('returns false for "abc"', () => {
      expect(isValidBrightDateString('abc')).toBe(false);
    });

    it('returns false for "1.2.3"', () => {
      expect(isValidBrightDateString('1.2.3')).toBe(false);
    });

    it('returns false for whitespace only', () => {
      expect(isValidBrightDateString('   ')).toBe(false);
    });

    it('returns false for "1e5" (scientific notation)', () => {
      // The regex requires digits only, no 'e'
      expect(isValidBrightDateString('1e5')).toBe(false);
    });
  });

  // ─── validateUnixMs ──────────────────────────────────────────────────────

  describe('validateUnixMs', () => {
    it('does not throw for a valid Unix ms timestamp', () => {
      expect(() => validateUnixMs(1_700_000_000_000)).not.toThrow();
    });

    it('does not throw for 0', () => {
      expect(() => validateUnixMs(0)).not.toThrow();
    });

    it('accepts the exact lower boundary (-30_610_224_000_000 ms ≈ year 1000)', () => {
      expect(() => validateUnixMs(-30_610_224_000_000)).not.toThrow();
    });

    it('rejects 1 ms below the lower boundary', () => {
      expect(() => validateUnixMs(-30_610_224_000_001)).toThrow(
        BrightDateError,
      );
    });

    it('accepts the exact upper boundary (253_402_300_800_000 ms ≈ year 9999)', () => {
      expect(() => validateUnixMs(253_402_300_800_000)).not.toThrow();
    });

    it('rejects 1 ms above the upper boundary', () => {
      expect(() => validateUnixMs(253_402_300_800_001)).toThrow(
        BrightDateError,
      );
    });

    it('throws for value too far in the past', () => {
      expect(() => validateUnixMs(-40_000_000_000_000)).toThrow(BrightDateError);
    });

    it('throws for value too far in the future', () => {
      expect(() => validateUnixMs(300_000_000_000_000)).toThrow(BrightDateError);
    });

    it('throws with OUT_OF_RANGE code', () => {
      expect.assertions(2);
      try {
        validateUnixMs(300_000_000_000_000);
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('OUT_OF_RANGE');
      }
    });
  });

  // ─── validateJulianDate ──────────────────────────────────────────────────

  describe('validateJulianDate', () => {
    it('does not throw for JD 2451545 (J2000.0)', () => {
      expect(() => validateJulianDate(2451545)).not.toThrow();
    });

    it('does not throw for JD 0', () => {
      expect(() => validateJulianDate(0)).not.toThrow();
    });

    it('throws for negative JD', () => {
      expect(() => validateJulianDate(-1)).toThrow(BrightDateError);
    });

    it('throws for JD > 5373484', () => {
      expect(() => validateJulianDate(6_000_000)).toThrow(BrightDateError);
    });

    it('throws with OUT_OF_RANGE code', () => {
      expect.assertions(2);
      try {
        validateJulianDate(-1);
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('OUT_OF_RANGE');
      }
    });
  });

  // ─── validateGPSWeek ─────────────────────────────────────────────────────

  describe('validateGPSWeek', () => {
    it('does not throw for week 0', () => {
      expect(() => validateGPSWeek(0)).not.toThrow();
    });

    it('does not throw for week 2300', () => {
      expect(() => validateGPSWeek(2300)).not.toThrow();
    });

    it('throws for negative week', () => {
      expect(() => validateGPSWeek(-1)).toThrow(BrightDateError);
    });

    it('throws for week > 9999', () => {
      expect(() => validateGPSWeek(10000)).toThrow(BrightDateError);
    });

    it('throws for non-integer week', () => {
      expect(() => validateGPSWeek(1.5)).toThrow(BrightDateError);
    });

    it('throws with INVALID_GPS_WEEK code', () => {
      expect.assertions(2);
      try {
        validateGPSWeek(-1);
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('INVALID_GPS_WEEK');
      }
    });
  });

  // ─── validateGPSSeconds ──────────────────────────────────────────────────

  describe('validateGPSSeconds', () => {
    it('does not throw for 0', () => {
      expect(() => validateGPSSeconds(0)).not.toThrow();
    });

    it('does not throw for 604799', () => {
      expect(() => validateGPSSeconds(604799)).not.toThrow();
    });

    it('throws for negative seconds', () => {
      expect(() => validateGPSSeconds(-1)).toThrow(BrightDateError);
    });

    it('throws for 604800 (exactly one week)', () => {
      expect(() => validateGPSSeconds(604800)).toThrow(BrightDateError);
    });

    it('throws with INVALID_GPS_SECONDS code', () => {
      expect.assertions(2);
      try {
        validateGPSSeconds(-1);
      } catch (e) {
        expect(e).toBeInstanceOf(BrightDateError);
        expect((e as BrightDateError).code).toBe('INVALID_GPS_SECONDS');
      }
    });
  });

  // ─── isBrightDateValue ───────────────────────────────────────────────────

  describe('isBrightDateValue', () => {
    it('returns true for a finite number', () => {
      expect(isBrightDateValue(9622.5)).toBe(true);
    });

    it('returns true for 0', () => {
      expect(isBrightDateValue(0)).toBe(true);
    });

    it('returns true for negative finite number', () => {
      expect(isBrightDateValue(-10957.5)).toBe(true);
    });

    it('returns false for NaN', () => {
      expect(isBrightDateValue(NaN)).toBe(false);
    });

    it('returns false for Infinity', () => {
      expect(isBrightDateValue(Infinity)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isBrightDateValue('9622.5')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isBrightDateValue(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isBrightDateValue(undefined)).toBe(false);
    });
  });
});
