# BrightDate

**A Universal Decimal Time System for Software Engineers and Scientists**

BrightDate is a scientifically grounded, timezone-free time representation that combines the best of astronomical timekeeping with modern software engineering needs. Think of it as "UTC with benefits" — a single scalar value that's trivially sortable, diffable, and storable.

## Core Concept

```
Format: DDDDD.ddddd
         ↑          ↑
         |          Fractional day (decimal time-of-day)
         Integer days since J2000.0 epoch
```

- **Epoch:** J2000.0 (January 1, 2000, 12:00:00 UTC)
- **Unit:** Decimal days
- **Timescale:** UTC (default) or TAI (monotonic, no leap seconds)

## Why BrightDate?

| Problem | BrightDate Solution |
|---------|-------------------|
| Timezone confusion | Single universal value, no zones |
| Leap second ambiguity | TAI mode for monotonic time |
| Complex date arithmetic | Simple subtraction: `b - a = elapsed_days` |
| Sort/compare complexity | Single float64, lexicographic sorting |
| 2038 problem | Float64 handles billions of years |
| Interplanetary coordination | Naturally works across the solar system |

## Installation

```bash
npm install @digitaldefiance/brightdate
# or
yarn add @digitaldefiance/brightdate
```

## Quick Start

```typescript
import { BrightDate } from '@digitaldefiance/brightdate';

// Current time
const now = BrightDate.now();
console.log(now.toString()); // "9622.50417"
console.log(now.toLogString()); // "[9622.50417]"

// From JavaScript Date
const bd = BrightDate.fromDate(new Date('2025-06-15T10:30:00Z'));

// From ISO string
const bd2 = BrightDate.fromISO('2025-01-01T00:00:00Z');

// Arithmetic
const tomorrow = now.addDays(1);
const nextHour = now.addMillidays(41.667); // ~1 hour
const elapsed = tomorrow.difference(now); // 1.0

// Duration formatting
console.log(now.formatDurationTo(tomorrow)); // "1.000 days"

// Comparisons
console.log(now.isBefore(tomorrow)); // true
console.log(now.isFuture()); // false
```

## Metric Sub-Units

| Unit | Value | Real-World Equivalent |
|------|-------|----------------------|
| 1 day | 1.0 | 24 hours |
| 1 milliday (md) | 0.001 | 1 minute 26.4 seconds |
| 1 microday (μd) | 0.000001 | 86.4 milliseconds |
| 1 nanoday (nd) | 0.000000001 | 86.4 microseconds |

```typescript
import { formatDuration } from '@digitaldefiance/brightdate';

formatDuration(0.5);       // "500.000 millidays"
formatDuration(0.00035);   // "350.000 microdays"
formatDuration(2.5);       // "2.500 days"
```

## Conversions

```typescript
import { BrightDate } from '@digitaldefiance/brightdate';

const bd = BrightDate.now();

// To/from standard formats
bd.toDate();              // JavaScript Date
bd.toUnixMs();            // Unix milliseconds
bd.toUnixSeconds();       // Unix seconds
bd.toJulianDate();        // Julian Date (JD = value + 2451545.0)
bd.toModifiedJulianDate(); // MJD
bd.toISO();               // ISO 8601 string
bd.toGPSTime();           // { gpsWeek, gpsSeconds }

// TAI (monotonic, no leap seconds)
const tai = bd.toTAI();
const backToUtc = tai.toUTC();
```

## Intervals

```typescript
import { BrightDateInterval, BrightDate } from '@digitaldefiance/brightdate';

const meeting = BrightDateInterval.fromDuration(
  BrightDate.now(),
  0.5 / 24 // 30 minutes in days
);

console.log(meeting.duration);        // 0.02083...
console.log(meeting.formatDuration()); // "20.833 millidays"
console.log(meeting.contains(BrightDate.now())); // true

// Split, expand, shift
const quarters = meeting.split(4);
const padded = meeting.expand(0.01); // 10 millidays padding each side
```

## Logging

```typescript
import { BrightDateStopwatch, createLogEntry, formatLogEntry } from '@digitaldefiance/brightdate';

// Structured logging
const entry = createLogEntry('info', 'Service started', { port: 3000 });
console.log(formatLogEntry(entry));
// [9622.50417] INFO  Service started {"port":3000}

// Performance measurement
const sw = new BrightDateStopwatch();
sw.start();
// ... do work ...
sw.stop();
console.log(sw.elapsedFormatted); // "2.314 millidays"
```

## Scheduling

```typescript
import { nextOccurrences, INTERVALS, BrightDate } from '@digitaldefiance/brightdate';

// Every hour starting now
const hourly = nextOccurrences({
  start: BrightDate.now().value,
  intervalDays: INTERVALS.HOUR,
  maxOccurrences: 5,
}, 5);
```

## Astronomy & Interplanetary

```typescript
import {
  greenwichMeanSiderealTime,
  lunarPhaseName,
  lightDelayTo,
  formatMarsTime,
  BrightDate,
} from '@digitaldefiance/brightdate';

const now = BrightDate.now();

// Sidereal time
const gmst = greenwichMeanSiderealTime(now.value); // degrees

// Moon phase
console.log(lunarPhaseName(now.value)); // "Waxing Gibbous"

// Mars communication
console.log(lightDelayTo('mars')); // ~0.00882 days (~12.7 minutes)
console.log(formatMarsTime(now.value)); // "14:23:07 MTC"
```

## Serialization

```typescript
import { encode, decode, toSortableString, toBinary } from '@digitaldefiance/brightdate';

// Compact string encoding
const encoded = encode(9622.50417); // "BD1:9622.50417000"
const decoded = decode(encoded);     // { value: 9622.50417, timescale: 'utc' }

// Sortable strings (for databases)
toSortableString(9622.50417); // "+0009622.50417000"

// Binary (8 bytes, Float64)
const buffer = toBinary(9622.50417);
```

## Reference Dates

| Event | BrightDate |
|-------|-----------|
| J2000.0 Epoch | 0.00000 |
| Unix Epoch (1970-01-01) | -10957.50000 |
| Apollo 11 Landing | -11099.15417 |
| GPS Epoch (1980-01-06) | -7300.50000 |
| Y2K (2000-01-01) | -0.50000 |
| Today (approx) | ~9622 |

## Design Philosophy

1. **One number, one timeline** — No zones, no formats, no ambiguity
2. **Scientifically grounded** — Based on J2000.0 (astronomical standard) and TAI (atomic time)
3. **Engineer-friendly** — Arithmetic is just addition/subtraction
4. **Future-proof** — Works for interplanetary coordination
5. **Backward-compatible** — Trivial conversion to/from all existing formats

## License

MIT © Digital Defiance
