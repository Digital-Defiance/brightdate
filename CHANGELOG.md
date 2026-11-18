# Changelog

## 0.38.0

### Fixed

- `ExactBrightAtto`: milliseconds now scale by 10^15 attoseconds (the scale was 10^9).
- `ExactBrightAtto.fromUnixMs`, `fromUnixSeconds`, `fromDate`, `fromISO` and `now` apply the leap-second table. The offset is 10 s before 1972-01-01, and the last known offset continues after the table's validity date. Conversion neither fails nor flags the result as a prediction, so a UTC label past the validity date can shift by one second if a later table adds a leap second.
- `ExactBrightAtto.toUnixMs`, `toUnixMsBigInt`, `toUnixSeconds`, `toDate` and `toISO` apply the same rules in reverse. A leap-second instant maps to the repeated UTC Unix second, and `toISO` renders it with `:60`.
- Values match the table in BrightSON specification section 4.4.

### Note

- `ExactBrightAtto` datetimes created from Unix time with 0.37.0 or earlier used the wrong scale and a fixed offset. Re-create them from the source time.
