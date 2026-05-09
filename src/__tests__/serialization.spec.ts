/**
 * Tests for BrightDate serialization utilities.
 */

import {
  decode,
  deserialize,
  encode,
  fromBinary,
  fromHttpHeader,
  fromSortableString,
  jsonReplacer,
  jsonReviver,
  serialize,
  toBinary,
  toHttpHeader,
  toSortableString,
} from '../serialization';

describe('serialization', () => {
  // ─── serialize / deserialize ─────────────────────────────────────────────

  describe('serialize', () => {
    it('creates a SerializedBrightDate object', () => {
      const result = serialize(9622.50417);
      expect(result.v).toBe(9622.50417);
      expect(result.ts).toBe('utc');
      expect(result.fmt).toBe(1);
    });

    it('stores TAI timescale', () => {
      const result = serialize(9622.50417, 'tai');
      expect(result.ts).toBe('tai');
    });

    it('defaults to UTC timescale', () => {
      expect(serialize(0).ts).toBe('utc');
    });
  });

  describe('deserialize', () => {
    it('round-trips a serialized value', () => {
      const original = 9622.50417;
      const serialized = serialize(original);
      const { value, timescale } = deserialize(serialized);
      expect(value).toBe(original);
      expect(timescale).toBe('utc');
    });

    it('round-trips TAI timescale', () => {
      const serialized = serialize(9622.5, 'tai');
      const { timescale } = deserialize(serialized);
      expect(timescale).toBe('tai');
    });

    it('throws for non-object input', () => {
      expect(() => deserialize('not an object')).toThrow(
        'Invalid serialized BrightDate',
      );
    });

    it('throws for null', () => {
      expect(() => deserialize(null)).toThrow('Invalid serialized BrightDate');
    });

    it('throws for unsupported format version', () => {
      expect(() => deserialize({ v: 0, ts: 'utc', fmt: 2 })).toThrow(
        'Unsupported BrightDate format version',
      );
    });

    it('throws for non-finite v', () => {
      expect(() => deserialize({ v: NaN, ts: 'utc', fmt: 1 })).toThrow(
        'v must be a finite number',
      );
    });

    it('defaults unknown timescale to utc', () => {
      const { timescale } = deserialize({ v: 0, ts: 'unknown', fmt: 1 });
      expect(timescale).toBe('utc');
    });
  });

  // ─── encode / decode ─────────────────────────────────────────────────────

  describe('encode', () => {
    it('starts with "BD1:"', () => {
      expect(encode(9622.50417)).toMatch(/^BD1:/);
    });

    it('encodes UTC without timescale suffix', () => {
      const result = encode(9622.50417, 'utc', 5);
      expect(result).toBe('BD1:9622.50417');
    });

    it('encodes TAI with ":tai" suffix', () => {
      const result = encode(9622.50417, 'tai', 5);
      expect(result).toBe('BD1:9622.50417:tai');
    });

    it('uses specified precision', () => {
      const result = encode(9622.5, 'utc', 2);
      expect(result).toBe('BD1:9622.50');
    });

    it('default precision is 8', () => {
      const result = encode(0);
      expect(result).toBe('BD1:0.00000000');
    });
  });

  describe('decode', () => {
    it('round-trips encode → decode', () => {
      const value = 9622.50417;
      const encoded = encode(value, 'utc', 5);
      const { value: decoded, timescale } = decode(encoded);
      expect(decoded).toBeCloseTo(value, 5);
      expect(timescale).toBe('utc');
    });

    it('round-trips TAI encode → decode', () => {
      const encoded = encode(9622.5, 'tai', 5);
      const { timescale } = decode(encoded);
      expect(timescale).toBe('tai');
    });

    it('throws for string not starting with "BD1:"', () => {
      expect(() => decode('9622.50417')).toThrow('must start with "BD1:"');
    });

    it('throws for invalid value', () => {
      expect(() => decode('BD1:not-a-number')).toThrow('invalid value');
    });

    it('defaults to UTC for missing timescale', () => {
      const { timescale } = decode('BD1:9622.50417');
      expect(timescale).toBe('utc');
    });
  });

  // ─── toBinary / fromBinary ───────────────────────────────────────────────

  describe('toBinary / fromBinary', () => {
    it('produces an 8-byte ArrayBuffer', () => {
      const buf = toBinary(9622.50417);
      expect(buf.byteLength).toBe(8);
    });

    it('round-trips a value', () => {
      const value = 9622.50417;
      const buf = toBinary(value);
      expect(fromBinary(buf)).toBe(value);
    });

    it('round-trips zero', () => {
      expect(fromBinary(toBinary(0))).toBe(0);
    });

    it('round-trips negative value', () => {
      const value = -10957.5;
      expect(fromBinary(toBinary(value))).toBe(value);
    });

    it('fromBinary throws for buffer < 8 bytes', () => {
      const small = new ArrayBuffer(4);
      expect(() => fromBinary(small)).toThrow('Buffer too small');
    });

    it('uses big-endian encoding', () => {
      const buf = toBinary(0);
      const view = new DataView(buf);
      // 0.0 in IEEE 754 big-endian is all zeros
      expect(view.getFloat64(0, false)).toBe(0);
    });
  });

  // ─── toSortableString / fromSortableString ───────────────────────────────

  describe('toSortableString', () => {
    it('starts with "+" for positive values', () => {
      expect(toSortableString(9622.5)).toMatch(/^\+/);
    });

    it('starts with "!" for negative values (v2 nine\'s-complement format)', () => {
      expect(toSortableString(-10957.5)).toMatch(/^!/);
    });

    it('pads integer part to 7 digits', () => {
      const s = toSortableString(100.5);
      expect(s.substring(1, 8)).toBe('0000100');
    });

    it('lexicographic order matches numeric order (positives only)', () => {
      const values = [9622.5, 100.0, 0.0, 9623.0, 50.0];
      const sortable = values.map((v) => toSortableString(v));
      const sortedSortable = [...sortable].sort();
      const sortedValues = [...values].sort((a, b) => a - b);
      const recoveredValues = sortedSortable.map(fromSortableString);
      expect(recoveredValues).toEqual(sortedValues);
    });

    it('lexicographic order matches numeric order (mixed sign)', () => {
      // This is the critical property that the v1 format FAILED.
      // A negative value MUST sort before any positive value and before
      // zero. Within negatives, more-negative MUST sort before less-negative.
      const values = [9622.5, -10957.5, 0, -100.25, 100, -0.5, 1000.0];
      const sortable = values.map((v) => toSortableString(v));
      const sortedSortable = [...sortable].sort();
      const sortedValues = [...values].sort((a, b) => a - b);
      const recoveredValues = sortedSortable.map(fromSortableString);
      expect(recoveredValues).toEqual(sortedValues);
    });

    it('negatives sort strictly before zero', () => {
      expect(toSortableString(-1) < toSortableString(0)).toBe(true);
      expect(toSortableString(-0.0001) < toSortableString(0)).toBe(true);
      expect(toSortableString(-1e-7) < toSortableString(0)).toBe(true);
    });

    it('more-negative values sort before less-negative values', () => {
      expect(toSortableString(-1000) < toSortableString(-100)).toBe(true);
      expect(toSortableString(-10) < toSortableString(-1)).toBe(true);
      expect(toSortableString(-0.5) < toSortableString(-0.1)).toBe(true);
    });

    it('round-trips a value', () => {
      const value = 9622.50417;
      expect(fromSortableString(toSortableString(value, 5))).toBeCloseTo(
        value,
        5,
      );
    });

    it('round-trips a negative value', () => {
      const value = -10957.5;
      expect(fromSortableString(toSortableString(value, 8))).toBeCloseTo(
        value,
        8,
      );
    });
  });

  describe('fromSortableString', () => {
    it('parses a positive sortable string (v2)', () => {
      expect(fromSortableString('+0009622.50417')).toBeCloseTo(9622.50417, 5);
    });

    it('parses a negative sortable string (v2 nine\'s complement)', () => {
      // toSortableString(-10957.5, 5) should produce '!9989042.49999' (nine's complement of '0010957.50000')
      // Actually: 0010957.50000 → digits 0,0,1,0,9,5,7,5,0,0,0,0 → 9,9,8,9,0,4,2,4,9,9,9,9
      // So '!9989042.49999' would decode as -(9989042.49999 → nine's complement 10957.50000) = -10957.5
      const encoded = toSortableString(-10957.5, 5);
      expect(fromSortableString(encoded)).toBeCloseTo(-10957.5, 5);
    });

    it('parses legacy v1 negative format for backward compatibility', () => {
      expect(fromSortableString('-0010957.50000')).toBeCloseTo(-10957.5, 5);
    });
  });

  // ─── jsonReplacer / jsonReviver ──────────────────────────────────────────

  describe('jsonReplacer', () => {
    it('encodes BrightDate-like objects', () => {
      const replacer = jsonReplacer(5);
      const obj = { value: 9622.5, precision: 5, isTAI: false };
      const result = replacer('key', obj);
      expect(typeof result).toBe('string');
      expect(result as string).toMatch(/^BD1:/);
    });

    it('passes through non-BrightDate values unchanged', () => {
      const replacer = jsonReplacer();
      expect(replacer('key', 42)).toBe(42);
      expect(replacer('key', 'hello')).toBe('hello');
      expect(replacer('key', null)).toBeNull();
    });

    it('encodes TAI BrightDate-like objects with :tai suffix', () => {
      const replacer = jsonReplacer(5);
      const obj = { value: 9622.5, precision: 5, isTAI: true };
      const result = replacer('key', obj) as string;
      expect(result).toContain(':tai');
    });
  });

  describe('jsonReviver', () => {
    it('decodes BD1: strings', () => {
      const reviver = jsonReviver();
      const result = reviver('key', 'BD1:9622.50417');
      expect(result).toEqual({ value: expect.closeTo(9622.50417, 5), timescale: 'utc' });
    });

    it('passes through non-BD1 strings unchanged', () => {
      const reviver = jsonReviver();
      expect(reviver('key', 'hello')).toBe('hello');
    });

    it('passes through numbers unchanged', () => {
      const reviver = jsonReviver();
      expect(reviver('key', 42)).toBe(42);
    });

    it('returns original string if decode fails', () => {
      const reviver = jsonReviver();
      // BD1: prefix but invalid value
      const result = reviver('key', 'BD1:not-a-number');
      expect(result).toBe('BD1:not-a-number');
    });
  });

  // ─── toHttpHeader / fromHttpHeader ───────────────────────────────────────

  describe('toHttpHeader / fromHttpHeader', () => {
    it('round-trips a value', () => {
      const value = 9622.50417;
      const header = toHttpHeader(value);
      const { value: decoded } = fromHttpHeader(header);
      expect(decoded).toBeCloseTo(value, 8);
    });

    it('produces a BD1: prefixed string', () => {
      expect(toHttpHeader(0)).toMatch(/^BD1:/);
    });

    it('fromHttpHeader trims whitespace', () => {
      const header = '  BD1:9622.50417000  ';
      const { value } = fromHttpHeader(header);
      expect(value).toBeCloseTo(9622.50417, 5);
    });

    it('round-trips TAI timescale', () => {
      const header = toHttpHeader(9622.5, 'tai');
      const { timescale } = fromHttpHeader(header);
      expect(timescale).toBe('tai');
    });
  });
});
