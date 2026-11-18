import {
  ATTOSECONDS_PER_DAY,
  ATTOSECONDS_PER_PICOSECOND,
  formatBrightDateFromAttoseconds,
  ticksToBrightDateValue,
} from '../brightDateLens';
import { ExactBrightAtto } from '../ExactBrightAtto';
import { ExactBrightDate } from '../ExactBrightDate';
import { J2000_UNIX_MS_UTC } from '../constants';

describe('ExactBrightAtto', () => {
  it('epoch is zero attoseconds', () => {
    expect(ExactBrightAtto.epoch().attoseconds).toBe(0n);
  });

  it('Unix ms round-trips at millisecond resolution', () => {
    const ms = 1_700_000_000_123;
    expect(ExactBrightAtto.fromUnixMs(ms).toUnixMs()).toBe(ms);
  });

  it('J2000 UTC label maps to epoch', () => {
    expect(ExactBrightAtto.fromUnixMs(J2000_UNIX_MS_UTC).attoseconds).toBe(0n);
  });

  it('bridges to ExactBrightDate exactly', () => {
    const ps = ExactBrightDate.fromPicoseconds(42n);
    const atto = ExactBrightAtto.fromExactBrightDate(ps);
    expect(atto.attoseconds).toBe(42n * ATTOSECONDS_PER_PICOSECOND);
    expect(atto.toExactBrightDate().picoseconds).toBe(42n);
  });

  it('toBrightDateValue uses divmod (matches lens)', () => {
    const t = 9622n * ATTOSECONDS_PER_DAY + 43_520_000_000_000_000_000n;
    const atto = ExactBrightAtto.fromAttoseconds(t);
    expect(atto.toBrightDateValue()).toBe(
      ticksToBrightDateValue(t, ATTOSECONDS_PER_DAY),
    );
  });

  it('encode/decode round-trips', () => {
    const a = ExactBrightAtto.fromAttoseconds(-999n);
    expect(ExactBrightAtto.decode(a.encode()).equals(a)).toBe(true);
  });

  it('16-byte binary round-trips', () => {
    const a = ExactBrightAtto.fromAttoseconds(-987_654_321n);
    expect(ExactBrightAtto.fromBinary(a.toBinary()).equals(a)).toBe(true);
  });
});

/** BrightSON section 4.4 table rows: [UTC label, datetime in attoseconds]. */
const BRIGHTSON_4_4_ROWS: ReadonlyArray<readonly [string, bigint]> = [
  ['2000-01-01T11:58:55.816Z', 0n],
  ['2026-01-01T00:00:00.000Z', 820497669184000000000000000n],
  ['2026-01-01T00:00:00.120Z', 820497669304000000000000000n],
  ['2016-12-31T23:59:59.000Z', 536500867184000000000000000n],
  ['2017-01-01T00:00:00.000Z', 536500869184000000000000000n],
  ['1970-01-01T00:00:00.000Z', -946727957816000000000000000n],
];
const LEAP_ROW: readonly [string, bigint] = [
  '2016-12-31T23:59:60.000Z',
  536500868184000000000000000n,
];

describe('ExactBrightAtto UTC conversion (BrightSON section 4.4)', () => {
  it('scales milliseconds by 10^15', () => {
    expect(ExactBrightAtto.epoch().addMilliseconds(1n).attoseconds).toBe(
      10n ** 15n,
    );
  });

  it.each(BRIGHTSON_4_4_ROWS)('fromISO/fromUnixMs/fromDate %s', (iso, atto) => {
    const ms = Date.parse(iso);
    expect(ExactBrightAtto.fromISO(iso).attoseconds).toBe(atto);
    expect(ExactBrightAtto.fromUnixMs(ms).attoseconds).toBe(atto);
    expect(ExactBrightAtto.fromUnixMs(BigInt(ms)).attoseconds).toBe(atto);
    expect(ExactBrightAtto.fromDate(new Date(ms)).attoseconds).toBe(atto);
    if (ms % 1000 === 0) {
      expect(ExactBrightAtto.fromUnixSeconds(ms / 1000).attoseconds).toBe(atto);
    }
  });

  it.each(BRIGHTSON_4_4_ROWS)('toISO/toUnixMs/toDate %s', (iso, atto) => {
    const v = ExactBrightAtto.fromAttoseconds(atto);
    expect(v.toISO()).toBe(iso);
    expect(v.toUnixMs()).toBe(Date.parse(iso));
    expect(v.toUnixMsBigInt()).toBe(BigInt(Date.parse(iso)));
    expect(v.toDate().getTime()).toBe(Date.parse(iso));
    expect(v.toUnixSeconds()).toBe(Math.floor(Date.parse(iso) / 1000));
  });

  it('renders the 2016 leap second as :60 and maps it to the repeated Unix second', () => {
    const v = ExactBrightAtto.fromAttoseconds(LEAP_ROW[1]);
    expect(v.toISO()).toBe(LEAP_ROW[0]);
    expect(v.toUnixMs()).toBe(Date.parse('2016-12-31T23:59:59.000Z'));
  });

  it('uses offset 10 before 1972', () => {
    const a = ExactBrightAtto.fromUnixSeconds(0);
    const b = ExactBrightAtto.fromUnixSeconds(-1);
    expect(a.differenceAttoseconds(b)).toBe(10n ** 18n);
  });

  it('continues with the last offset (37 s) past the table validity', () => {
    const unixS = 1_893_456_000n; // 2030-01-01T00:00:00Z
    const expected =
      (unixS + 37n) * 10n ** 18n - 946_727_967_816n * 10n ** 15n;
    const v = ExactBrightAtto.fromISO('2030-01-01T00:00:00.000Z');
    expect(v.attoseconds).toBe(expected);
    expect(v.toISO()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('now() applies the leap table', () => {
    const ms = Date.parse('2026-01-01T00:00:00.120Z');
    const spy = jest.spyOn(Date, 'now').mockReturnValue(ms);
    try {
      expect(ExactBrightAtto.now().attoseconds).toBe(
        820497669304000000000000000n,
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe('formatBrightDateFromAttoseconds', () => {
  it('formats epoch as 0.00000', () => {
    expect(formatBrightDateFromAttoseconds(0n, 5)).toBe('0.00000');
  });
});
