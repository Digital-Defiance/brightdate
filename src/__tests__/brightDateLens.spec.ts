import {
  ATTOSECONDS_PER_DAY,
  brightDateValueToAttoseconds,
  divEuclid,
  remEuclid,
  splitTicksIntoDayParts,
  ticksToBrightDateValue,
} from '../brightDateLens';

describe('brightDateLens', () => {
  it('divEuclid/remEuclid match negative day boundary', () => {
    const t = -1n;
    expect(divEuclid(t, ATTOSECONDS_PER_DAY)).toBe(-1n);
    expect(remEuclid(t, ATTOSECONDS_PER_DAY)).toBe(ATTOSECONDS_PER_DAY - 1n);
  });

  it('splitTicksIntoDayParts recovers one day + remainder', () => {
    const { daysWhole, remainder } = splitTicksIntoDayParts(
      ATTOSECONDS_PER_DAY + 5n,
      ATTOSECONDS_PER_DAY,
    );
    expect(daysWhole).toBe(1n);
    expect(remainder).toBe(5n);
  });

  it('brightDateValueToAttoseconds round-trips typical v1 values within 1 as', () => {
    const bd = 9622.50417;
    const back = ticksToBrightDateValue(
      brightDateValueToAttoseconds(bd),
      ATTOSECONDS_PER_DAY,
    );
    expect(Math.abs(back - bd)).toBeLessThan(1e-10);
  });
});
