import {
  ChangeEvent,
  FC,
  FocusEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fromDate, toDate } from "@brightchain/brightdate";
import { BrightDate } from "./BrightDate";
import "./BrightDatePlayground.css";

// ─── datetime-local <-> Date helpers ─────────────────────────────────────────
// The native `<input type="datetime-local">` is timezone-naive: it always
// represents wall-clock components without a zone. The `useUtc` flag toggles
// whether we interpret/display those components in the user's local zone or
// in UTC.
//
// Native pickers reliably display only years 0001–9999. For dates outside
// that range we present the picker as blank and rely on the dedicated Year
// input and/or the raw BD scalar.

const pad = (n: number) => String(n).padStart(2, "0");

const PICKER_MIN_YEAR = 1;
const PICKER_MAX_YEAR = 9999;

function dateToInputValue(d: Date, useUtc: boolean): string {
  if (Number.isNaN(d.getTime())) return "";
  const year = useUtc ? d.getUTCFullYear() : d.getFullYear();
  if (year < PICKER_MIN_YEAR || year > PICKER_MAX_YEAR) return "";
  const month = (useUtc ? d.getUTCMonth() : d.getMonth()) + 1;
  const day = useUtc ? d.getUTCDate() : d.getDate();
  const hours = useUtc ? d.getUTCHours() : d.getHours();
  const minutes = useUtc ? d.getUTCMinutes() : d.getMinutes();
  const seconds = useUtc ? d.getUTCSeconds() : d.getSeconds();
  return (
    `${year}-${pad(month)}-${pad(day)}` +
    `T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  );
}

function inputValueToDate(value: string, useUtc: boolean): Date | undefined {
  if (!value) return undefined;
  // Browsers may emit "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS(.sss)?".
  const match =
    /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(
      value,
    );
  if (!match) return undefined;
  const [, y, mo, d, h, mi, s = "0", ms = "0"] = match;
  const year = Number(y);
  const month = Number(mo) - 1;
  const day = Number(d);
  const hours = Number(h);
  const minutes = Number(mi);
  const seconds = Number(s);
  const millis = Number((ms + "000").slice(0, 3));
  const built = useUtc
    ? new Date(Date.UTC(year, month, day, hours, minutes, seconds, millis))
    : new Date(year, month, day, hours, minutes, seconds, millis);
  return Number.isNaN(built.getTime()) ? undefined : built;
}

/**
 * Replace the year on `base` with `year`, keeping all other components
 * (month, day, hour, minute, second, ms) intact. `setUTCFullYear` /
 * `setFullYear` correctly accept arbitrary integers — including 0 and
 * negative values — under ISO 8601 astronomical year numbering, where
 * year 0 = 1 BC and year −2999 = 3000 BC.
 */
function dateWithYear(base: Date, year: number, useUtc: boolean): Date {
  const out = new Date(base.getTime());
  if (useUtc) {
    out.setUTCFullYear(year, base.getUTCMonth(), base.getUTCDate());
  } else {
    out.setFullYear(year, base.getMonth(), base.getDate());
  }
  return out;
}

/** Build a Date at midnight UTC of the given (astronomical) calendar day. */
function utcMidnight(year: number, month1: number, day: number): Date {
  const out = new Date(0);
  out.setUTCFullYear(year, month1 - 1, day);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

interface Preset {
  label: string;
  build: () => Date;
}

const PRESETS: ReadonlyArray<Preset> = [
  { label: "J2000.0", build: () => new Date("2000-01-01T11:58:55.816Z") },
  { label: "Y2K (UTC)", build: () => new Date("2000-01-01T00:00:00Z") },
  {
    label: "Apollo 11 landing",
    build: () => new Date("1969-07-20T20:17:40Z"),
  },
  {
    label: "Voyager 1 launch",
    build: () => new Date("1977-09-05T12:56:00Z"),
  },
  { label: "Y2K38 boundary", build: () => new Date("2038-01-19T03:14:07Z") },
  // Deep-history & future anchors — exercise the BCE / extended-year path.
  { label: "Pyramid of Giza (~2560 BC)", build: () => utcMidnight(-2559, 1, 1) },
  { label: "1 AD", build: () => utcMidnight(1, 1, 1) },
  { label: "Year 10,000", build: () => utcMidnight(10000, 1, 1) },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Interactive BrightDate playground. The BrightDate **scalar** (decimal days
 * since J2000.0) is the single source of truth; the datetime picker, the
 * dedicated year input, and the raw-scalar number input are bidirectional
 * views over it.
 *
 * `scalar === undefined` ⇒ live mode (the ticker handles its own clock).
 */
export const BrightDatePlayground: FC = () => {
  /** Frozen scalar, or `undefined` for live mode. */
  const [scalar, setScalar] = useState<number | undefined>(undefined);
  /** Free-text mirror of `scalar` — kept separate so users can type
   *  "-1.83e6" without us aggressively reformatting mid-keystroke. */
  const [scalarText, setScalarText] = useState<string>("");
  /** Free-text mirror of the year — only shown while the field is focused,
   *  so partial input ("-", "-2") doesn't get clobbered by re-render. */
  const [yearText, setYearText] = useState<string>("");
  const [yearFocused, setYearFocused] = useState<boolean>(false);
  const [useUtc, setUseUtc] = useState<boolean>(false);

  const isLive = scalar === undefined;

  // 1-second tick so the wall-clock / picker readout stays fresh in live mode.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const effectiveDate = useMemo<Date>(
    () => (scalar !== undefined ? toDate(scalar) : new Date()),
    [scalar],
  );
  const effectiveScalar =
    scalar !== undefined ? scalar : fromDate(effectiveDate);

  const effectiveYear = useUtc
    ? effectiveDate.getUTCFullYear()
    : effectiveDate.getFullYear();
  const pickerInRange =
    effectiveYear >= PICKER_MIN_YEAR && effectiveYear <= PICKER_MAX_YEAR;
  const pickerValue = pickerInRange
    ? dateToInputValue(effectiveDate, useUtc)
    : "";

  const displayedScalarText = isLive
    ? effectiveScalar.toFixed(8)
    : scalarText;
  const displayedYearText = yearFocused ? yearText : String(effectiveYear);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const commitScalar = (s: number) => {
    setScalar(s);
    setScalarText(s.toString());
  };

  const commitDate = (d: Date) => {
    if (Number.isNaN(d.getTime())) return;
    commitScalar(fromDate(d));
  };

  const goLive = () => {
    setScalar(undefined);
    setScalarText("");
    setYearText("");
  };

  const onPickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      goLive();
      return;
    }
    const d = inputValueToDate(raw, useUtc);
    if (d) commitDate(d);
  };

  const onScalarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setScalarText(raw);
    if (raw.trim() === "") {
      setScalar(undefined);
      return;
    }
    // Allow user-friendly thousands separators.
    const cleaned = raw.replace(/[,_]/g, "");
    const v = Number(cleaned);
    if (Number.isFinite(v)) setScalar(v);
  };

  const onYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setYearText(raw);
    // Mid-typing states we accept silently.
    if (raw === "" || raw === "-" || raw === "+") return;
    const y = Number(raw);
    if (!Number.isFinite(y) || !Number.isInteger(y)) return;
    const next = dateWithYear(effectiveDate, y, useUtc);
    commitDate(next);
  };

  const onYearFocus = (_e: FocusEvent<HTMLInputElement>) => {
    setYearText(String(effectiveYear));
    setYearFocused(true);
  };
  const onYearBlur = (_e: FocusEvent<HTMLInputElement>) => {
    setYearFocused(false);
  };

  const applyPreset = (preset: Preset) => {
    commitDate(preset.build());
  };

  // When live, omit `value`/`interval` so <BrightDate /> uses its own timer.
  const fixedProps = isLive ? {} : { value: effectiveScalar, interval: 0 };

  return (
    <div className="bd-playground">
      <div className="bd-playground-controls">
        <label className="bd-playground-input-wrap bd-playground-input-wrap--wide">
          <span className="bd-playground-input-label">
            Pick any moment{useUtc ? " (UTC)" : ` (${timeZone})`}
          </span>
          <input
            type="datetime-local"
            step={1}
            value={pickerValue}
            onChange={onPickerChange}
            className="bd-playground-input"
            aria-label="Pick a date and time to convert to a BrightDate scalar"
            disabled={!pickerInRange}
          />
          {!pickerInRange && (
            <span className="bd-playground-picker-oor">
              year {effectiveYear} is outside the picker's 0001–9999 range —
              use the Year / BD scalar fields
            </span>
          )}
        </label>

        <label className="bd-playground-input-wrap bd-playground-input-wrap--narrow">
          <span className="bd-playground-input-label">
            Year{" "}
            <span className="bd-playground-input-hint">
              (negative = BCE, e.g. <code>-2999</code> = 3000 BC)
            </span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]+"
            value={displayedYearText}
            onChange={onYearChange}
            onFocus={onYearFocus}
            onBlur={onYearBlur}
            placeholder="e.g. -2999"
            className="bd-playground-input bd-playground-input-mono"
            aria-label="Set the year directly (negative values for BCE)"
            spellCheck={false}
          />
        </label>

        <label className="bd-playground-input-wrap">
          <span className="bd-playground-input-label">
            BD scalar (days since J2000.0)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={displayedScalarText}
            onChange={onScalarChange}
            placeholder="e.g. -1826250 or 9635.123"
            className="bd-playground-input bd-playground-input-mono"
            aria-label="Enter a BrightDate scalar directly (decimal days since J2000.0)"
            spellCheck={false}
          />
        </label>

        <div className="bd-playground-side-controls">
          <label className="bd-playground-utc-toggle">
            <input
              type="checkbox"
              checked={useUtc}
              onChange={(e) => setUseUtc(e.target.checked)}
              aria-label="Interpret the date picker in UTC instead of local time"
            />
            <span>UTC</span>
          </label>
          <button
            type="button"
            className="bd-playground-clear"
            onClick={goLive}
            disabled={isLive}
          >
            {isLive ? "● Live (ticking)" : "← Back to live"}
          </button>
        </div>
      </div>

      <div className="bd-playground-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="bd-playground-preset"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bd-playground-cards">
        <div className="bd-playground-card">
          <span className="bd-playground-precision">full · sub-ms</span>
          <BrightDate {...fixedProps} format="full" />
        </div>
        <div className="bd-playground-card">
          <span className="bd-playground-precision">standard · ~0.86 s</span>
          <BrightDate {...fixedProps} format="standard" />
        </div>
        <div className="bd-playground-card">
          <span className="bd-playground-precision">compact · ~86 s</span>
          <BrightDate {...fixedProps} format="compact" />
        </div>
      </div>

      <div className="bd-playground-wallclock">
        <span className="bd-playground-wallclock-label">Wall clock</span>
        <code className="bd-playground-wallclock-iso">
          {effectiveDate.toISOString()}
        </code>
        <span className="bd-playground-wallclock-zone">
          local zone:&nbsp;<code>{timeZone}</code>
        </span>
      </div>

      <p className="bd-playground-note">
        Type a date, set a Year (negative = BCE under ISO 8601 astronomical
        numbering — year <code>0</code> = 1 BC, <code>-2999</code> = 3000 BC),
        or paste a raw BD scalar. They're all views of the same number.
        Pre-J2000.0 instants auto-flip to{" "}
        <code>
          PBD<em>N</em>
        </code>{" "}
        labeling. Try <strong>Pyramid of Giza</strong>,{" "}
        <strong>Voyager 1</strong>, or <code>-1826250</code> directly.
      </p>
    </div>
  );
};
