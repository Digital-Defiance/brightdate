/**
 * BrightDate Serialization
 *
 * Functions for serializing and deserializing BrightDate values
 * in various formats suitable for storage, transmission, and interop.
 */

import { DEFAULT_PRECISION } from './constants';
import type { BrightDateValue } from './types';

/**
 * Serialized BrightDate format for JSON storage.
 */
export interface SerializedBrightDate {
  /** The BrightDate value */
  v: number;
  /** Timescale: 'utc' or 'tai' */
  ts: 'utc' | 'tai';
  /** Version of the serialization format */
  fmt: 1;
}

/**
 * Serialize a BrightDate value to a compact JSON-friendly object.
 *
 * @param value - BrightDate value
 * @param timescale - 'utc' or 'tai'
 * @returns Serialized object
 */
export function serialize(
  value: BrightDateValue,
  timescale: 'utc' | 'tai' = 'utc',
): SerializedBrightDate {
  return {
    v: value,
    ts: timescale,
    fmt: 1,
  };
}

/**
 * Deserialize a BrightDate from a serialized object.
 *
 * @param data - Serialized BrightDate object
 * @returns Object with value and timescale
 * @throws Error if the format is invalid
 */
export function deserialize(data: unknown): {
  value: BrightDateValue;
  timescale: 'utc' | 'tai';
} {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid serialized BrightDate: expected object');
  }

  const obj = data as Record<string, unknown>;

  if (obj['fmt'] !== 1) {
    throw new Error(
      `Unsupported BrightDate format version: ${String(obj['fmt'])}`,
    );
  }

  if (typeof obj['v'] !== 'number' || !isFinite(obj['v'])) {
    throw new Error('Invalid serialized BrightDate: v must be a finite number');
  }

  const timescale = obj['ts'] === 'tai' ? 'tai' : 'utc';

  return { value: obj['v'], timescale };
}

/**
 * Encode a BrightDate value as a compact string for URLs or headers.
 * Format: "BD1:<value>[:<timescale>]"
 *
 * @param value - BrightDate value
 * @param timescale - 'utc' or 'tai' (default: 'utc', omitted in output)
 * @param precision - Decimal places (default: 8 for compact representation)
 * @returns Encoded string
 */
export function encode(
  value: BrightDateValue,
  timescale: 'utc' | 'tai' = 'utc',
  precision: number = 8,
): string {
  const valueStr = value.toFixed(precision);
  if (timescale === 'tai') {
    return `BD1:${valueStr}:tai`;
  }
  return `BD1:${valueStr}`;
}

/**
 * Decode a BrightDate from an encoded string.
 *
 * @param encoded - Encoded BrightDate string
 * @returns Object with value and timescale
 * @throws Error if the format is invalid
 */
export function decode(encoded: string): {
  value: BrightDateValue;
  timescale: 'utc' | 'tai';
} {
  if (!encoded.startsWith('BD1:')) {
    throw new Error(
      `Invalid BrightDate encoding: must start with "BD1:", got "${encoded}"`,
    );
  }

  const parts = encoded.substring(4).split(':');
  const value = parseFloat(parts[0]);

  if (!isFinite(value)) {
    throw new Error(`Invalid BrightDate encoding: invalid value "${parts[0]}"`);
  }

  const timescale = parts[1] === 'tai' ? 'tai' : 'utc';

  return { value, timescale };
}

/**
 * Convert a BrightDate value to a fixed-width binary representation.
 * Uses a Float64 (8 bytes) for maximum precision.
 *
 * @param value - BrightDate value
 * @returns ArrayBuffer containing the 8-byte representation
 */
export function toBinary(value: BrightDateValue): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false); // Big-endian
  return buffer;
}

/**
 * Read a BrightDate value from a binary representation.
 *
 * @param buffer - ArrayBuffer containing 8 bytes
 * @returns BrightDate value
 */
export function fromBinary(buffer: ArrayBuffer): BrightDateValue {
  if (buffer.byteLength < 8) {
    throw new Error('Buffer too small: need at least 8 bytes');
  }
  const view = new DataView(buffer);
  return view.getFloat64(0, false); // Big-endian
}

/**
 * Convert a BrightDate to a sortable string representation.
 * Pads with zeros to ensure lexicographic sorting matches numeric sorting.
 * Format: sign + 7-digit integer + '.' + precision digits
 *
 * @param value - BrightDate value
 * @param precision - Decimal places (default: 8)
 * @returns Sortable string (e.g., "+0009622.50417000")
 */
export function toSortableString(
  value: BrightDateValue,
  precision: number = 8,
): string {
  const sign = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  const intPart = Math.floor(abs).toString().padStart(7, '0');
  const fracPart = (abs - Math.floor(abs)).toFixed(precision).substring(2);
  return `${sign}${intPart}.${fracPart}`;
}

/**
 * Parse a sortable string back to a BrightDate value.
 *
 * @param sortable - Sortable string representation
 * @returns BrightDate value
 */
export function fromSortableString(sortable: string): BrightDateValue {
  const sign = sortable[0] === '-' ? -1 : 1;
  const numStr = sortable.substring(1);
  return sign * parseFloat(numStr);
}

/**
 * Create a BrightDate-aware JSON replacer function.
 * Use with JSON.stringify to automatically serialize BrightDate values.
 *
 * @param precision - Decimal places for string representation
 * @returns JSON replacer function
 */
export function jsonReplacer(
  precision: number = DEFAULT_PRECISION,
): (key: string, value: unknown) => unknown {
  return (_key: string, value: unknown): unknown => {
    if (
      typeof value === 'object' &&
      value !== null &&
      'value' in value &&
      'precision' in value &&
      'isTAI' in value
    ) {
      // Looks like a BrightDate instance
      const bd = value as { value: number; isTAI: boolean };
      return encode(bd.value, bd.isTAI ? 'tai' : 'utc', precision);
    }
    return value;
  };
}

/**
 * Create a BrightDate-aware JSON reviver function.
 * Use with JSON.parse to automatically deserialize BrightDate encoded strings.
 *
 * @returns JSON reviver function
 */
export function jsonReviver(): (key: string, value: unknown) => unknown {
  return (_key: string, value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith('BD1:')) {
      try {
        return decode(value);
      } catch {
        return value;
      }
    }
    return value;
  };
}

/**
 * Format a BrightDate as an HTTP-header-safe string.
 * Uses the encoded format without special characters.
 *
 * @param value - BrightDate value
 * @param timescale - 'utc' or 'tai'
 * @returns Header-safe string
 */
export function toHttpHeader(
  value: BrightDateValue,
  timescale: 'utc' | 'tai' = 'utc',
): string {
  return encode(value, timescale, 8);
}

/**
 * Parse a BrightDate from an HTTP header value.
 *
 * @param header - Header string value
 * @returns Object with value and timescale
 */
export function fromHttpHeader(header: string): {
  value: BrightDateValue;
  timescale: 'utc' | 'tai';
} {
  return decode(header.trim());
}
