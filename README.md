![npm](https://img.shields.io/npm/v/@brightchain/brightdate.svg) [![Tests](https://img.shields.io/badge/tests-1035%20passing-brightgreen)](https://github.com/Digital-Defiance/brightdate)

# [BrightDate](https://brightdate.org)

**A Universal Decimal Time System for Software Engineers and Scientists**

> *Named in homage to Star Trek's **[Stardate](https://memory-alpha.fandom.com/wiki/Stardate)** and reference to [BrightChain](https://github.brightchain.org) — a single scalar that resolves the chaos of planetary timezones into one universal quantity. BrightDate does the same for Earth.*

BrightDate is a scientifically grounded, timezone-free time representation anchored at **J2000.0** — the standard astronomical epoch used by every modern observatory, space agency, and ephemeris. One scalar value. Trivially sortable, diffable, and storable.

Ships with three companion types:

- `BrightDate` — Float64 decimal days. Ergonomic, fast, great for math and astronomy. This is what most code should use.
- `BrightInstant` — BigInt TAI seconds + integer nanos. **1-nanosecond precision at any magnitude**, with no Float64 drift. The rigorous form for distributed systems, GPS engineering, and interplanetary timing.
- `ExactBrightDate` — BigInt picoseconds. Bit-exact for every integer-ms input. Use at storage boundaries where lossless round-trips matter.

---

## Why BrightDate?

| Problem | BrightDate Solution |
|---------|-------------------|
| Timezone confusion | Single universal value, no zones |
| Leap second ambiguity | TAI mode for monotonic time (no stutters) |
| Complex date arithmetic | Simple subtraction: `b - a = elapsed_days` |
| Sort/compare complexity | Float64 sorts natively; v2 sortable-string encoding handles mixed-sign indexes correctly |
| 2038 problem | Float64 covers 287,000+ years with sub-µs resolution |
| Blockchain/archival fidelity | `ExactBrightDate` (BigInt picoseconds) for bit-exact Unix-ms round-trip |
| Interplanetary coordination | Naturally works across the solar system |
| Deep history / pre-epoch dates | `PBD-N` paging — **Tera-second eras** (10¹² s ≈ 31,710 Julian years), always positive, infinitely scalable |

---

## Core Concept

```
Format: DDDDD.ddddd
         ↑          ↑
         |          Fractional day (decimal time-of-day)
         Integer days since J2000.0 epoch
```

BrightDate is a count of **SI days** elapsed since J2000.0.

### The J2000.0 Epoch — Astronomically Correct

J2000.0 is defined in **Terrestrial Time (TT)**: the moment `2000-01-01T12:00:00 TT`.
Converted to the timescales you actually encounter in software:

| Timescale | Representation | Value |
|-----------|---------------|-------|
| TT (definition) | `2000-01-01T12:00:00.000` (no zone) | Unix s `946_728_000` |
| TAI | `2000-01-01T11:59:27.816` (no zone) | Unix s `946_727_967.816` |
| **UTC label** | **`2000-01-01T11:58:55.816Z`** | **Unix ms `946_727_935_816`** |

The UTC label (`2000-01-01T11:58:55.816Z`) is what you see when you call `new Date(946_727_935_816)` in JavaScript. It is **not** UTC noon; the 64.184-second gap is caused by the TT–TAI offset (32.184 s) plus the 32-second TAI–UTC offset at J2000.

`BrightDate = 0` at `2000-01-01T11:58:55.816Z`. This is the only astronomically correct choice.

### TAI Substrate

All BrightDate values are computed on a **TAI substrate**:

```
bd = (taiUnixSeconds − J2000_TAI_UNIX_S) / 86400
```

where `J2000_TAI_UNIX_S = 946_727_967.816`.

This means:

- BrightDate ticks in **exact SI seconds**, with no discontinuities.
- Leap seconds exist only at UTC boundary conversions (`toISO`, `fromISO`, `toUnixMs`, `fromDate`, etc.). Internally, they are invisible.
- Two consecutive UTC wall-clock seconds that straddle a leap second boundary correspond to **2 SI seconds** in BrightDate, because TAI advances by 2 during that transition. This is the correct physical behavior.

---

## PBD — Pre-BrightDate Eras (deep-time paging)

BrightDate is anchored at J2000.0, so any moment before `2000-01-01T11:58:55.816Z` would naturally be a negative scalar. Negatives are mathematically fine, but they are a usability footgun: sign-flips, off-by-one bugs in formatters, and "is `-2.5×10¹²` before or after `-1.4×10¹²`?" confusion at deep-time scales.

Instead of an unbounded negative line, BrightDate **pages** the pre-epoch timeline into **Tera-second blocks** called **PBD eras** (*Pre-BrightDate, era N*). Think of it as "Long-Count for software" — every block is a fixed-width page, the high bit is the era index, and the low bit is a clean positive decimal.

### SI-Metric alignment — the Tera-Bright

PBD math is done in **Bright-seconds (bs)**, where `1 bs = 1 SI second`. This is the canonical unit shared with `BrightSpacetime`, `BrightInstant`, and every other SI-prefix layer in the family.

One **Tera-Bright** (`1 Ts`) is:

- **Time:** `10¹² s ≈ 31,710 Julian years` — one PBD page.
- **Distance:** `1 Tera-light-second ≈ 0.0317 light-years` — the volume of space light fills in one Tera-second.

Because the same SI prefix lineage governs both axes, a "PBD*N*" label is not a random bucket — it is a *Giga-light-second volume of history*: 10¹² seconds long, 10¹² light-seconds wide, anchored to the same `J2000.0` zero point used by BrightSpacetime.

> The BrightDate scalar itself stays in *decimal days* for ergonomic math, but PBD multiplies through by `86_400` so the page numbers speak SI. `brightDateToPBD(bd)` / `brightDateFromPBD(pbd)` handle the conversion transparently.

### Dual-mode standard — scalar is canonical, PBD is the human label

Like latitude — always a signed float at the machine level (`-122.23`), always a directional suffix in print (`122.23° W`) — BrightDate keeps two interoperable views of the same instant:

| Mode | Format | Use case | Math impact |
|------|--------|----------|-------------|
| **Scalar** (canonical) | `-1_826_250 BD` (days) | APIs, databases, physics, logic, sort keys, deltas | **Native.** Plain subtraction works. |
| **Label** (BD / PBD) | `9_635 BD` or `PBD1: 842000000000.000` (bs) | UI, history books, conversation, labels, indexes | **Abstract.** Library unfolds to scalar before doing math. |

If you only need the math: keep using the signed scalar. Negative BrightDate values are first-class and will remain so forever. PBD is purely a presentation/indexing layer; the scalar is what hits the wire, the disk, and the comparator.

If a downstream system has never heard of PBD, it still gets a perfectly valid signed Float64 — **graceful degradation by construction**.

### The paging model

Let `T = 1_000_000_000_000 s` (one Tera-Bright, ~31,710 years).

| Era    | Raw second range          | Page value (era-local) | Approx. Gregorian window  |
|--------|---------------------------|------------------------|---------------------------|
| BD     | `[0, +∞)`                 | `raw` (plain scalar)   | J2000.0 → forever         |
| PBD1   | `(−T, 0)`                 | `raw + T`              | ~29,710 BC → J2000.0      |
| PBD2   | `(−2T, −T]`               | `raw + 2T`             | ~61,420 BC → ~29,710 BC   |
| PBD*N* | `(−N·T, −(N−1)·T]`        | `raw + N·T`            | ~31,710 Julian years per page |

**There is no `PBD0`.** The current era — J2000.0 and everything after — is plain BD, unpaged. PBD*N* is reserved for `N ≥ 1` and labels the pre-epoch timeline only; calling J2000.0+ "Pre-" anything would be a contradiction.

**Rules**

- Each era is exactly **one Tera-second** (10¹² SI seconds, ~31,710 Julian years).
- PBD*N* page value is always positive and never exceeds `T`: `pageValue = rawSeconds + N·T`, where `N = ⌊|rawSeconds| / T⌋ + 1` for `rawSeconds < 0`. Non-negative `rawSeconds` is plain BD and has no page.
- The pair `(N, pageValue)` is a lossless representation of any pre-epoch instant.
- Conversion back to a single scalar is trivial: `rawSeconds = pageValue − N·T`.
- **Most of recorded human history fits in PBD1.** Civilization (~3000 BC onward) is ~5,000 years deep; PBD1 spans ~31,710 years.

### Linear-vector semantics — the Zero-Point Handshake

**PBD is a display label, not a number system.** The canonical representation is always the signed scalar; the `(era, page)` pair is generated at format time and parsed at input time. This is the same discipline Unix timestamps use — the integer is the truth, the human-readable string is decoration.

Three rules keep the math pure:

1. **One timeline, always increasing toward the future.** Within *any* era, a larger page value is *later*. In PBD1, page `999_999_999_999` is one second before J2000.0; page `1` is almost a full Tera-second before J2000.0. Numbers do **not** count backwards in pre-epoch eras. (This is the opposite of BC labeling — and the reason BC dates break every library that touches them.)
2. **Boundaries are half-open with closed upper.** `BD = [0, +∞)`, `PBD1 = (−T, 0)`, `PBD2 = (−2T, −T]`, `PBD*N* = (−N·T, −(N−1)·T]`. The exact boundary `−k·T` is the *last instant* of PBD(*k* + 1) (page `T`). There is exactly one canonical label for every scalar — no "Year Zero" ambiguity.
3. **Deltas use the scalar, not the page.** `Δt = raw_a − raw_b`. Never `pageA − pageB`. Subtracting page values across an era boundary silently drops a Tera-second jump.

**Comparisons across the BD/PBD divide** (when you only have label tuples and don't want to reconstruct the scalar):

```ts
// later-than: higher real time wins
function isLater(a: BrightLabel, b: BrightLabel): boolean {
  if (a.kind !== b.kind) return a.kind === "BD";    // any BD > any PBD
  if (a.kind === "BD") return a.seconds > b.seconds;
  if (a.era !== b.era) return a.era < b.era;        // smaller era = closer to J2000.0
  return a.page > b.page;                           // within an era, larger page = later
}
```

The corollary the user has to be okay with: **PBD*N* values are "lower on the timeline" than BD values**, even though their page numbers may look enormous. Comparing `PBD1: 999_999_999_999` to `1 BD` is `PBD1 < BD` — because `-1 < 1`. Sort ascending by time = BD first, then PBD by era *descending*, then page *ascending*.

### Why pages instead of negatives?

| Property            | Single negative line  | PBD-N paging                          |
|---------------------|-----------------------|---------------------------------------|
| Sign confusion      | Constant hazard       | Eliminated — every page is positive   |
| Sort order          | Native (numeric)      | Native (sort by `N` desc, then page)  |
| Labeling deep time  | `-4.35×10¹⁷ s` ish    | `PBD435000` + decimal — scale is obvious |
| Floating-point drift| Worsens with magnitude| Stays inside one Tera-second window   |
| Storage             | One Float64           | One small int + one Float64 (or tuple)|
| Cosmological reach  | Saturates Float64     | Big Bang ≈ `PBD435_000` (well inside `Number.MAX_SAFE_INTEGER`) |

### Worked benchmarks

| Anchor                          | Raw seconds         | PBD label                  |
| ------------------------------- | ------------------- | -------------------------- |
| J2000.0 (the singularity)       | `0`                 | `BD 0.000`                 |
| 3000 BC (~5 ky ago)             | `≈ −1.578 × 10¹¹`   | `PBD1: ~842,212,000,000`   |
| Deep Paleolithic (~100 ky ago)  | `≈ −3.156 × 10¹²`   | `PBD4: ~844,240,000,000`   |
| Big Bang (~13.8 Gyr ago)        | `≈ −4.35 × 10¹⁷`    | `PBD~435,000: <page>`      |

### Representations

```jsonc
// JSON tuple form — indexable, deterministic
{ "pbd": [1, 842000000000.000] }   // PBD1, ~842 Gs into the era → raw ≈ -158 Gs

// String label form — human-readable
"PBD1: 842000000000.000"

// Scalar (legacy) — still valid, automatically paged when displayed
-157788000000
```

A negative raw BrightDate scalar always round-trips through `(era, pageValue)` without loss; the paging is a presentation/indexing layer, not a different number system.

### Quick example

```ts
import {
  toPBD,
  fromPBD,
  brightDateToPBD,
  brightDateFromPBD,
  PBD_ERA_SECONDS,        // 1_000_000_000_000
  SECONDS_PER_DAY,        // 86_400
} from "@brightchain/brightdate";

// Tera-second axis (Bright-seconds)
toPBD(0);                  // { era: 0, page: 0 }
toPBD(1);                  // { era: 0, page: 1 }
toPBD(-1);                 // { era: 1, page: 999_999_999_999 }
toPBD(-PBD_ERA_SECONDS);   // { era: 2, page: 1_000_000_000_000 }   (boundary)

// 3000 BC ≈ -5000 Julian years × 31_557_600 s
toPBD(-157_788_000_000);   // { era: 1, page: ≈ 842_212_000_000 }

fromPBD({ era: 1, page: 999_999_999_999 }); // -1

// BrightDate (days) → PBD (seconds) handled automatically
brightDateToPBD(BrightDate.fromValue(-1_826_250)); // { era: 1, page: ≈ 842_212_000_000 }
```

> **Status:** PBD-N is shipping in the next minor release alongside `ExactBrightDate` BigInt support (see `toExactPBD` / `fromExactPBD`). Existing positive- and negative-scalar BrightDate values remain canonical; PBD is an additional view, not a replacement.

---

## Installation

### TypeScript / JavaScript (npm)

```bash
npm install @brightchain/brightdate
# or
yarn add @brightchain/brightdate
```

### Rust (crates.io)

A Rust port of BrightDate is published as the [`brightdate`](https://crates.io/crates/brightdate) crate, with the same J2000.0 / TAI semantics as this library:

```toml
# Cargo.toml
[dependencies]
brightdate = "0.1"
```

```rust
use brightdate::BrightDate;
let now = BrightDate::now();
println!("{:.5}", now);
```

Source: [Digital-Defiance/brightdate-rust](https://github.com/Digital-Defiance/brightdate-rust).

### CLI utilities (Homebrew + cargo)

The Rust workspace also ships five drop-in replacements for the classic Unix date/time utilities — `bdate`, `btime`, `buptime`, `bcal`, `bwatch` — that emit BrightDate values.

```bash
# Homebrew (macOS / Linux)
brew tap digital-defiance/tap
brew install digital-defiance/tap/bdate
brew install digital-defiance/tap/btime
brew install digital-defiance/tap/buptime
brew install digital-defiance/tap/bcal
brew install digital-defiance/tap/bwatch

# Or via cargo
cargo install bdate btime buptime bcal bwatch
```

---

## Quick Start

```typescript
import { BrightDate } from '@brightchain/brightdate';

const now = BrightDate.now();
console.log(now.toString());       // "9622.50417"
console.log(now.toLogString());    // "[9622.50417]"

const bd = BrightDate.fromDate(new Date('2025-06-15T10:30:00Z'));
const bd2 = BrightDate.fromISO('2025-01-01T00:00:00Z');

const tomorrow = now.addDays(1);
const elapsed = tomorrow.difference(now);            // 1.0
console.log(now.formatDurationTo(tomorrow));         // "1.000 days"
console.log(now.isBefore(tomorrow));                 // true
```

---

## Precision & Trade-offs

BrightDate is honest about what it does and doesn't preserve. This section is the important part — read it before choosing between `BrightDate` and `ExactBrightDate`.

### Summary matrix

| Operation | `BrightDate` (Float64) | `ExactBrightDate` (BigInt ps) |
|-----------|------------------------|-------------------------------|
| `fromDate(d).toDate().getTime()` ≡ `d.getTime()` | ✅ Always bit-exact (Date has ms resolution; `fromDate` is lossless in that direction) | ✅ Always bit-exact |
| `fromUnixMs(ms).toUnixMs()` ≡ `ms` (day-aligned ms) | ✅ Bit-exact | ✅ Bit-exact |
| `fromUnixMs(ms).toUnixMs()` ≡ `ms` (arbitrary ms) | ⚠️ Error ≤ 0.00012 ms (~120 ns) | ✅ Bit-exact |
| `toBinary` / `fromBinary` round-trip | ✅ Bit-exact Float64 | ✅ Bit-exact 128-bit integer |
| `encode(v, 'utc', 12)` / `decode` | ✅ Preserves to 12 decimal places (~86 ps) | ✅ Bit-exact (stores full BigInt) |
| Arithmetic | Standard IEEE 754 (1-2 ULP max on composite ops) | Bit-exact integer math |
| Astronomy (GMST, lunar phase, etc.) | ✅ Native fit | ❌ Not provided (use `toBrightDateValue()`) |
| Cross-node determinism (same V8 version) | ✅ IEEE 754 is deterministic | ✅ BigInt is deterministic |
| Speed | Native Float64 ops (~0.5 ns) | BigInt ops (~30-300 ns) |

### What Float64 gives you at different magnitudes

A `BrightDate` value is a Float64, so the distance to the next representable value (one ULP) grows with the magnitude:

| At magnitude | ULP in days | ULP in seconds | What this means |
|--------------|-------------|----------------|-----------------|
| 0 (J2000.0) | 5e-324 | sub-yoctosecond | Full Float64 precision |
| 0.5 (noon boundary) | 1.1e-16 | ~9.6 ps | Picosecond-clean |
| 1 (one day) | 2.2e-16 | ~19 ps | Picosecond-clean |
| 10,000 (current era, ~2027) | 2.2e-12 | ~190 ns | Sub-microsecond |
| 100,000 (year 2273) | 2.2e-11 | ~1.9 µs | Sub-10-microsecond |
| 1,000,000 (year 4737) | 2.2e-10 | ~19 µs | Still far better than any NTP jitter |

**Takeaway:** for the current era (BrightDate values around 9,000-11,000), `BrightDate` holds about 190-nanosecond resolution. That's above mechanical clock jitter, CPU cache latency, and well above NTP synchronization accuracy.

### When the 0.00012 ms round-trip tax appears

```typescript
// Day-aligned inputs (multiples of 86_400_000 from J2000 anchor) round-trip exactly:
fromUnixMs(0).toUnixMs()                === 0;              // Unix epoch: ✅
fromUnixMs(946_728_000_000).toUnixMs() === 946_728_000_000; // J2000:     ✅

// Off-day inputs gain a bounded error (~2^-52 × 946 728 000 000 ≈ 0.00012 ms):
const ms = 1_700_000_000_123;
Math.abs(fromUnixMs(ms).toUnixMs() - ms) < 0.001;           // true (≈1.2e-4)
```

If your system can tolerate sub-microsecond error at the Unix-ms boundary, use `BrightDate`. If it cannot — e.g., a blockchain that stores user-supplied Unix ms and must return them byte-identical — use `ExactBrightDate`.

### Float64 algebraic identities — limits

Most identities hold with bit-exactness for realistic inputs. A few don't, because IEEE 754 has well-known limits:

- `lerp(a, b, 0) === a` — ✅ always (the term `(b-a)*0` is always `±0`, addition with `a` is exact).
- `lerp(a, b, 1) === b` — ✅ usually, but can differ by 1-2 ULP when `|b-a|` is comparable to `|a|` (catastrophic cancellation).
- `(v + d) - d === v` — ✅ usually, but can differ by 1-2 ULP in the same cancellation regime.

These are properties of IEEE 754 arithmetic, not BrightDate bugs. The library's property-based tests assert the honest bounds (≤ 2-4 ULP at realistic magnitudes). For workloads that cannot tolerate any ULP drift, use `ExactBrightDate` and integer picosecond math.

### Choosing between `BrightDate` and `ExactBrightDate`

Pick `BrightDate` (Float64) when:

- You're doing astronomy, scheduling, analytics, logging, display, or interval math.
- You need fast operator-friendly arithmetic (`a - b`, `a < b`, `Math.abs(a - b)`).
- You're storing a timestamp that will be *compared* and *diffed*, not exactly *reconstructed* later.

Pick `ExactBrightDate` (BigInt picoseconds) when:

- You must round-trip arbitrary Unix milliseconds bit-for-bit.
- You need blockchain consensus on exact user-supplied timestamps.
- You're archiving timestamps for century-scale retention and cannot risk any drift.
- You need sub-picosecond precision at any magnitude.

You can mix them: store `ExactBrightDate` at boundaries, convert to `BrightDate` for computation, convert back if needed.

---

## Metric Sub-Units

| Unit | Value | Real-World Equivalent |
|------|-------|----------------------|
| 1 day | 1.0 | 24 hours |
| 1 milliday (md) | 0.001 | 1 min 26.4 s |
| 1 microday (μd) | 0.000001 | 86.4 ms |
| 1 nanoday (nd) | 0.000000001 | 86.4 µs |

```typescript
import { formatDuration } from '@brightchain/brightdate';

formatDuration(0.5);     // "500.000 millidays"
formatDuration(0.00035); // "350.000 microdays"
formatDuration(2.5);     // "2.500 days"
```

---

## Conversions

```typescript
const bd = BrightDate.now();

bd.toDate();               // JavaScript Date (ms resolution)
bd.toUnixMs();             // Unix milliseconds (integer; Math.round applied)
bd.toUnixSeconds();        // Unix seconds (Number)
bd.toJulianDate();         // JD = value + 2_451_545.0
bd.toModifiedJulianDate(); // MJD = value + 51_544.5
bd.toISO();                // ISO 8601 string; renders :60 seconds during leap second
bd.toGPSTime();            // { gpsWeek, gpsSeconds }

// TAI — monotonic, no leap-second discontinuities
const tai = bd.toTAI();
const backToUtc = tai.toUTC();
```

> ### Leap second boundary behavior
>
> Because BrightDate uses a TAI substrate, a UTC timestamp immediately after a leap second is 2 SI seconds later in BrightDate than the timestamp immediately before. The leap second itself is rendered as `:60` in `toISO()`. This is physically correct: during a positive leap second, the TAI clock advances by 2 while the UTC clock repeats `:59`. Callers who compute BrightDate differences see the correct SI elapsed time.

---

## BrightInstant (TAI seconds + nanos)

`BrightInstant` is the rigorous, lossless companion to `BrightDate`. It stores `BigInt` TAI seconds + integer nanoseconds since J2000.0 — so you get **exact 1-nanosecond precision at any magnitude**, with no Float64 drift. Use it when nanosecond fidelity matters indefinitely far from the epoch (distributed systems, GPS, interplanetary mission timing).

```typescript
import { BrightInstant } from '@brightchain/brightdate';

// J2000.0 itself
const epoch = BrightInstant.J2000;
epoch.taiSecondsSinceJ2000; // 0n
epoch.taiNanos;             // 0

// One SI day later, plus one nanosecond
const later = BrightInstant.fromTaiComponents(86_400n, 1);

// Round-trip the f64 form
const bd = BrightDate.now();
const inst = BrightInstant.fromBrightDate(bd);
const back = inst.toBrightDate(); // lossy to f64 resolution; lossless within range

// UTC / ISO / Unix-ms round-trips honor the leap-second table
BrightInstant.fromUnixMs(Date.now()).toUnixMs();
```

---

## ExactBrightDate (BigInt picoseconds)

```typescript
import { ExactBrightDate } from '@brightchain/brightdate';

// Bit-exact Unix ms round-trip (unconditionally, for any integer ms)
const ms = 1_700_000_000_123;
ExactBrightDate.fromUnixMs(ms).toUnixMs() === ms; // true, always

// Integer-unit arithmetic
const e = ExactBrightDate.epoch();
e.addNanoseconds(1n).addMilliseconds(500n).addDays(7n);

// Bit-exact binary / encoded forms
const bin = e.toBinary();           // 16-byte big-endian two's complement
ExactBrightDate.fromBinary(bin);    // bit-exact round-trip

const s = e.encode();               // "EBD1:<picoseconds>"
ExactBrightDate.decode(s);          // bit-exact round-trip

// Differences in any unit
const later = ExactBrightDate.now();
later.differencePicoseconds(e);    // bigint
later.differenceMilliseconds(e);   // bigint
```

Convert between the two when needed:

```typescript
const e = ExactBrightDate.fromUnixMs(Date.now());
const bd = BrightDate.fromValue(e.toBrightDateValue()); // lossy to Float64 resolution
```

---

## Intervals

```typescript
import { BrightDateInterval, BrightDate } from '@brightchain/brightdate';

const meeting = BrightDateInterval.fromDuration(BrightDate.now(), 0.5 / 24);

meeting.duration;                       // 0.02083...
meeting.formatDuration();               // "20.833 millidays"
meeting.contains(BrightDate.now());     // true

const quarters = meeting.split(4);
const padded = meeting.expand(0.01);
```

---

## Logging

```typescript
import {
  BrightDateStopwatch,
  createLogEntry,
  formatLogEntry,
} from '@brightchain/brightdate';

const entry = createLogEntry('info', 'Service started', { port: 3000 });
console.log(formatLogEntry(entry));
// [9622.50417] INFO  Service started {"port":3000}

const sw = new BrightDateStopwatch();
sw.start();
// ... work ...
sw.stop();
console.log(sw.elapsedFormatted); // "2.314 millidays"
```

---

## Scheduling

```typescript
import { nextOccurrences, INTERVALS, BrightDate } from '@brightchain/brightdate';

const hourly = nextOccurrences(
  {
    start: BrightDate.now().value,
    intervalDays: INTERVALS.HOUR,
    maxOccurrences: 5,
  },
  5,
);
```

---

## Astronomy & Interplanetary

```typescript
import {
  greenwichMeanSiderealTime,
  lunarPhaseName,
  lightDelayTo,
  formatMarsTime,
  BrightDate,
} from '@brightchain/brightdate';

const now = BrightDate.now();

greenwichMeanSiderealTime(now.value); // degrees
lunarPhaseName(now.value);            // "Waxing Gibbous"
lightDelayTo('mars');                 // ~0.00882 days (~12.7 min)
formatMarsTime(now.value);            // "14:23:07 MTC"
```

These formulae are intentionally lower-precision than the core time math — they use standard approximations (IAU 1982 for GMST, simplified sinusoidal orbits). For high-precision astronomy, use a dedicated ephemeris library and feed it BrightDate values.

---

## Serialization

```typescript
import {
  encode, decode,
  toSortableString, fromSortableString,
  toBinary, fromBinary,
} from '@brightchain/brightdate';

// Compact string: "BD1:9622.50417000" (or "BD1:9622.50417:tai")
encode(9622.50417);
decode('BD1:9622.50417000'); // { value: 9622.50417, timescale: 'utc' }

// Sortable string for databases (v2 nine's-complement format):
// lexicographic order MATCHES numeric order across positive and negative values
toSortableString(9622.50417);  // "+0009622.50417000"
toSortableString(-10957.5);    // "!9989042.49999999" (nine's complement)

// Binary — bit-exact Float64
toBinary(9622.50417);          // 8-byte ArrayBuffer (big-endian)
fromBinary(buf);               // 9622.50417 (Object.is bit-exact)
```

> ### Database index note
>
> The sortable string format uses nine's complement for negative values and a `!` prefix (instead of `-`). This is necessary because the ASCII character `'+'` (0x2B) sorts **before** `'-'` (0x2D), which would invert the expected ordering of mixed-sign timestamps. Both `!` (0x21) and the nine's-complement scheme ensure that lexicographic ordering of the strings exactly matches numeric ordering of the values — including the negative-to-positive transition. The older (v1) `-N` format is still readable by `fromSortableString` for backward compatibility, but new writes use v2.

---

## Reference Dates

| Event | ISO 8601 (UTC) | BrightDate |
|-------|---------------|-----------|
| **J2000.0 (TAI substrate anchor)** | `2000-01-01T11:58:55.816Z` | **0.000000000** |
| TT noon (definition moment) | `2000-01-01T12:00:00.000Z` | ≈ 0.000742870 |
| Y2K midnight | `2000-01-01T00:00:00Z` | ≈ −0.499257130 |
| Unix epoch | `1970-01-01T00:00:00Z` | ≈ −10957.499512 |
| GPS epoch | `1980-01-06T00:00:00Z` | ≈ −7300.499408 |
| Apollo 11 landing | `1969-07-20T20:17:40Z` | ≈ −11125.154 |
| Current era (~2027) | — | ≈ 10,000 |

---

## Key Constants

```typescript
import {
  J2000_UTC_UNIX_MS,       // 946_727_935_816  — UTC label of J2000.0 in Unix ms
  J2000_TAI_UNIX_S,        // 946_727_967.816  — TAI Unix seconds at J2000.0
  J2000_TT_UNIX_S,         // 946_728_000      — TT (definition) Unix seconds
  J2000_JD,                // 2_451_545.0      — Julian Date at J2000.0
  J2000_MJD,               // 51_544.5         — Modified Julian Date at J2000.0
  TAI_UTC_OFFSET_AT_J2000, // 32               — TAI − UTC at J2000.0 (seconds)
  TT_TAI_OFFSET_SECONDS,   // 32.184           — TT − TAI (seconds, fixed by definition)
  CURRENT_TAI_UTC_OFFSET,  // 37               — current TAI − UTC (seconds, as of 2017)
  GPS_EPOCH_UNIX_TAI,      // 315_964_819      — GPS epoch as TAI Unix seconds
} from '@brightchain/brightdate';
```

---

## Leap Seconds

Leap seconds are an afterthought in UTC, not a physical phenomenon. BrightDate embraces this:

- **Internally:** leap seconds don't exist. BrightDate ticks in strict SI days on a TAI substrate.
- **At UTC boundaries:** the leap second table (`LEAP_SECOND_TABLE`) maps TAI seconds to UTC seconds. The table is valid through `LEAP_SECOND_TABLE_VALID_UNTIL_UNIX_S` and was last reviewed on `LEAP_SECOND_TABLE_REVIEWED_AT`.
- **`toISO()` during a leap second:** renders the leap-second moment as `:60`, e.g. `1998-12-31T23:59:60.000Z`.
- **If the table expires:** `getTaiUtcOffset()` throws a `LeapSecondTableExpiredError`. Update the library to continue.

---

## Design Philosophy

1. **One number, one timeline** — no zones, no formats, no ambiguity.
2. **Astronomically correct** — TAI substrate, J2000.0 anchor, SI days throughout.
3. **Engineer-friendly** — arithmetic is just addition and subtraction.
4. **Honest about precision** — documented Float64 bounds; exact BigInt companion for when you need it.
5. **Future-proof** — works through at least year 287,000 without losing sub-microsecond precision.
6. **In homage to Stardate** — one universal scalar to rule them all.

---

## License

MIT © Digital Defiance
