/**
 * Tests for the local-clock bridge.
 *
 * BrightDate has one fraction: the BD-day fraction. This module exposes a
 * single helper that maps a local wall-clock instant to the universal BD
 * scalar that instant produces. There is no "local fraction" or any other
 * flavor of BrightDate.
 */

import { bdFromLocalClock } from '../civilTime';
import { fromUnixMs, toUnixMs } from '../conversions';

describe('civilTime', () => {
  // ─── bdFromLocalClock ──────────────────────────────────────────────────────

  describe('bdFromLocalClock', () => {
    it('with offset 0 lands on the requested UTC wall-clock instant', () => {
      // 14:30:00 UTC on the same UTC civil date as the J2000 anchor.
      const bd = bdFromLocalClock(0, 14, 30, 0, 0);
      const ms = toUnixMs(bd);
      const date = new Date(ms);
      expect(date.getUTCHours()).toBe(14);
      expect(date.getUTCMinutes()).toBe(30);
      expect(date.getUTCSeconds()).toBe(0);
    });

    it('PDT (UTC-7) 11:00 lands on UTC 18:00 same date', () => {
      // Pick a reference on 2024-06-15 UTC.
      const reference = fromUnixMs(Date.UTC(2024, 5, 15, 18, 0, 0));
      const bd = bdFromLocalClock(reference, 11, 0, 0, -7 / 24);
      const ms = toUnixMs(bd);
      const date = new Date(ms);
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(5);
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(18);
      expect(date.getUTCMinutes()).toBe(0);
    });

    it('JST (UTC+9) 22:00 lands on UTC 13:00 same local date', () => {
      // 12:00 UTC on 2024-06-15 → 21:00 JST same day → asking for "22:00 JST
      // on the local day containing the reference" lands on UTC 13:00.
      const reference = fromUnixMs(Date.UTC(2024, 5, 15, 12, 0, 0));
      const bd = bdFromLocalClock(reference, 22, 0, 0, 9 / 24);
      const ms = toUnixMs(bd);
      const date = new Date(ms);
      expect(date.getUTCHours()).toBe(13);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCDate()).toBe(15);
    });

    it('IST (UTC+5:30) preserves the half-hour offset', () => {
      const reference = fromUnixMs(Date.UTC(2024, 5, 15, 12, 0, 0));
      // 09:00 IST = 03:30 UTC same day.
      const bd = bdFromLocalClock(reference, 9, 0, 0, 5.5 / 24);
      const ms = toUnixMs(bd);
      const date = new Date(ms);
      expect(date.getUTCHours()).toBe(3);
      expect(date.getUTCMinutes()).toBe(30);
    });

    it('round-trips via the BD-day fraction', () => {
      const reference = 9_634.25666;
      const offset = -7 / 24; // PDT
      const bd = bdFromLocalClock(reference, 11, 0, 0, offset);
      // The resulting BD scalar's UTC instant should match: 11:00 PDT today
      // = 18:00 UTC today.
      const ms = toUnixMs(bd);
      const date = new Date(ms);
      expect(date.getUTCHours()).toBe(18);
      expect(date.getUTCMinutes()).toBe(0);
    });

    it('default minutes/seconds/offset are 0', () => {
      const a = bdFromLocalClock(0, 14);
      const b = bdFromLocalClock(0, 14, 0, 0, 0);
      expect(a).toBe(b);
    });
  });
});
