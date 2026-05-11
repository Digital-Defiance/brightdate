/**
 * Tests for BrightDate calendar utilities.
 */

import {
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
} from "../calendar";
import { toDate } from "../conversions";

describe("calendar", () => {
  // ─── startOfYear / endOfYear ─────────────────────────────────────────────

  describe("startOfYear", () => {
    it("2000 starts at 2000-01-01T00:00:00Z", () => {
      const bd = startOfYear(2000);
      const d = toDate(bd);
      expect(d.toISOString()).toBe("2000-01-01T00:00:00.000Z");
    });

    it("2025 starts at 2025-01-01T00:00:00Z", () => {
      const bd = startOfYear(2025);
      const d = toDate(bd);
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(0);
      expect(d.getUTCDate()).toBe(1);
    });
  });

  describe("endOfYear", () => {
    it("2000 ends at 2000-12-31T23:59:59.999Z", () => {
      const bd = endOfYear(2000);
      const d = toDate(bd);
      expect(d.getUTCFullYear()).toBe(2000);
      expect(d.getUTCMonth()).toBe(11);
      expect(d.getUTCDate()).toBe(31);
      expect(d.getUTCHours()).toBe(23);
      expect(d.getUTCMinutes()).toBe(59);
    });

    it("end is after start", () => {
      expect(endOfYear(2025)).toBeGreaterThan(startOfYear(2025));
    });
  });

  describe("yearInterval", () => {
    it("returns an interval spanning the year", () => {
      const interval = yearInterval(2025);
      expect(interval.start.value).toBe(startOfYear(2025));
      expect(interval.end.value).toBe(endOfYear(2025));
    });
  });

  // ─── startOfMonth / endOfMonth ───────────────────────────────────────────

  describe("startOfMonth", () => {
    it("January 2025 starts at 2025-01-01T00:00:00Z", () => {
      const bd = startOfMonth(2025, 1);
      const d = toDate(bd);
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(0);
      expect(d.getUTCDate()).toBe(1);
    });

    it("February 2000 starts at 2000-02-01", () => {
      const bd = startOfMonth(2000, 2);
      const d = toDate(bd);
      expect(d.getUTCMonth()).toBe(1);
      expect(d.getUTCDate()).toBe(1);
    });
  });

  describe("endOfMonth", () => {
    it("January 2025 ends on the 31st", () => {
      const bd = endOfMonth(2025, 1);
      const d = toDate(bd);
      expect(d.getUTCDate()).toBe(31);
    });

    it("February 2000 (leap year) ends on the 29th", () => {
      const bd = endOfMonth(2000, 2);
      const d = toDate(bd);
      expect(d.getUTCDate()).toBe(29);
    });

    it("February 2001 (non-leap) ends on the 28th", () => {
      const bd = endOfMonth(2001, 2);
      const d = toDate(bd);
      expect(d.getUTCDate()).toBe(28);
    });
  });

  describe("monthInterval", () => {
    it("returns an interval spanning the month", () => {
      const interval = monthInterval(2025, 3);
      expect(interval.start.value).toBe(startOfMonth(2025, 3));
      expect(interval.end.value).toBe(endOfMonth(2025, 3));
    });
  });

  // ─── getYear / getMonth / getDayOfMonth ──────────────────────────────────

  describe("getYear", () => {
    it("returns the correct year", () => {
      const bd = fromCalendar(2025, 6, 15);
      expect(getYear(bd)).toBe(2025);
    });

    it("returns 2000 for J2000.0 epoch", () => {
      expect(getYear(0)).toBe(2000);
    });
  });

  describe("getMonth", () => {
    it("returns 1-12", () => {
      const bd = fromCalendar(2025, 6, 15);
      expect(getMonth(bd)).toBe(6);
    });

    it("returns 1 for January", () => {
      const bd = fromCalendar(2025, 1, 1);
      expect(getMonth(bd)).toBe(1);
    });
  });

  describe("getDayOfMonth", () => {
    it("returns the correct day", () => {
      const bd = fromCalendar(2025, 6, 15);
      expect(getDayOfMonth(bd)).toBe(15);
    });
  });

  // ─── getDayOfWeek ────────────────────────────────────────────────────────

  describe("getDayOfWeek", () => {
    it("returns 0-6 (Sunday=0)", () => {
      // 2000-01-01 was a Saturday (6)
      const bd = fromCalendar(2000, 1, 1);
      expect(getDayOfWeek(bd)).toBe(6);
    });

    it("2000-01-02 was a Sunday (0)", () => {
      const bd = fromCalendar(2000, 1, 2);
      expect(getDayOfWeek(bd)).toBe(0);
    });
  });

  // ─── getDayOfYear ────────────────────────────────────────────────────────

  describe("getDayOfYear", () => {
    it("January 1 is day 1", () => {
      const bd = fromCalendar(2025, 1, 1);
      expect(getDayOfYear(bd)).toBe(1);
    });

    it("December 31 is day 365 in non-leap year", () => {
      const bd = fromCalendar(2025, 12, 31);
      expect(getDayOfYear(bd)).toBe(365);
    });

    it("December 31 is day 366 in leap year", () => {
      const bd = fromCalendar(2000, 12, 31);
      expect(getDayOfYear(bd)).toBe(366);
    });
  });

  // ─── isLeapYear ──────────────────────────────────────────────────────────

  describe("isLeapYear", () => {
    it("2000 is a leap year (divisible by 400)", () => {
      expect(isLeapYear(fromCalendar(2000, 6, 15))).toBe(true);
    });

    it("1900 is NOT a leap year (divisible by 100 but not 400)", () => {
      expect(isLeapYear(fromCalendar(1900, 6, 15))).toBe(false);
    });

    it("2024 is a leap year (divisible by 4)", () => {
      expect(isLeapYear(fromCalendar(2024, 6, 15))).toBe(true);
    });

    it("2025 is NOT a leap year", () => {
      expect(isLeapYear(fromCalendar(2025, 6, 15))).toBe(false);
    });
  });

  // ─── daysInYear ──────────────────────────────────────────────────────────

  describe("daysInYear", () => {
    it("returns 366 for leap year", () => {
      expect(daysInYear(fromCalendar(2000, 1, 1))).toBe(366);
    });

    it("returns 365 for non-leap year", () => {
      expect(daysInYear(fromCalendar(2025, 1, 1))).toBe(365);
    });
  });

  // ─── daysInMonth ─────────────────────────────────────────────────────────

  describe("daysInMonth", () => {
    it("January has 31 days", () => {
      expect(daysInMonth(fromCalendar(2025, 1, 15))).toBe(31);
    });

    it("February 2000 has 29 days (leap)", () => {
      expect(daysInMonth(fromCalendar(2000, 2, 15))).toBe(29);
    });

    it("February 2001 has 28 days (non-leap)", () => {
      expect(daysInMonth(fromCalendar(2001, 2, 15))).toBe(28);
    });

    it("April has 30 days", () => {
      expect(daysInMonth(fromCalendar(2025, 4, 15))).toBe(30);
    });
  });

  // ─── fromCalendar / toCalendar ───────────────────────────────────────────

  describe("fromCalendar", () => {
    it("creates a BrightDate of ≈ 64.184/86400 for UTC noon on 2000-01-01 (not J2000.0)", () => {
      // fromCalendar(2000,1,1,12,0,0) creates a UTC wall-clock time of noon;
      // that is 2000-01-01T12:00:00Z in UTC, which is 64.184 s after the
      // J2000.0 UTC label (2000-01-01T11:58:55.816Z = BD 0).
      expect(fromCalendar(2000, 1, 1, 12, 0, 0)).toBeCloseTo(64.184 / 86400, 6);
    });

    it("defaults hours/minutes/seconds to 0", () => {
      const bd = fromCalendar(2025, 6, 15);
      const d = toDate(bd);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
      expect(d.getUTCSeconds()).toBe(0);
    });
  });

  describe("toCalendar", () => {
    it("round-trips fromCalendar → toCalendar", () => {
      const bd = fromCalendar(2025, 6, 15, 10, 30, 45);
      const cal = toCalendar(bd);
      expect(cal.year).toBe(2025);
      expect(cal.month).toBe(6);
      expect(cal.day).toBe(15);
      expect(cal.hour).toBe(10);
      expect(cal.minute).toBe(30);
      expect(cal.second).toBe(45);
    });

    it("returns all expected fields", () => {
      const cal = toCalendar(0);
      expect(cal).toHaveProperty("year");
      expect(cal).toHaveProperty("month");
      expect(cal).toHaveProperty("day");
      expect(cal).toHaveProperty("hour");
      expect(cal).toHaveProperty("minute");
      expect(cal).toHaveProperty("second");
      expect(cal).toHaveProperty("millisecond");
    });
  });

  // ─── NOTABLE_EPOCHS ──────────────────────────────────────────────────────

  describe("NOTABLE_EPOCHS", () => {
    it("J2000 is exactly 0", () => {
      expect(NOTABLE_EPOCHS.J2000).toBe(0);
    });

    it("UNIX epoch is ≈ -10957.499511759259 (TAI-coherent, not -10957.5)", () => {
      expect(NOTABLE_EPOCHS.UNIX).toBeCloseTo(-10957.499511759259, 6);
    });

    it("Y2K is ≈ -0.499257 (TAI-coherent midnight before J2000.0 UTC label)", () => {
      expect(NOTABLE_EPOCHS.Y2K).toBeCloseTo(-0.499257129629453, 6);
    });

    it("GPS epoch is ≈ -7300.499407 (TAI-coherent)", () => {
      // GPS epoch is 1980-01-06 00:00:00 UTC; TAI-UTC = 19 s at that time.
      expect(NOTABLE_EPOCHS.GPS).toBeCloseTo(-7300.499407592592, 6);
    });

    it("APOLLO_11 is before J2000.0", () => {
      expect(NOTABLE_EPOCHS.APOLLO_11).toBeLessThan(0);
    });

    it("SPUTNIK is before APOLLO_11", () => {
      expect(NOTABLE_EPOCHS.SPUTNIK).toBeLessThan(NOTABLE_EPOCHS.APOLLO_11);
    });
  });
});
