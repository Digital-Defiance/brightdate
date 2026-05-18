import {
  BrightDate,
  formatBD,
  fromDate,
} from "@brightchain/brightdate";
import { FC, useMemo, useState } from "react";
import type React from "react";
import "./PBD.css";

/**
 * BrightDate / Display-Label demonstrator.
 *
 * The convention this component visualises:
 *
 * - `bd ≥ 0` renders as `BD <bd>`.
 * - `bd < 0` renders as `PBD <abs(bd)>`.
 * - `BD 0` is the canonical label for J2000.0; there is no `PBD 0`.
 *
 * The internal scalar never changes — `PBD` is a sign-flipping cosmetic
 * for negative values. The slider walks the BrightDate timeline on a
 * signed log scale so you can see the label flip at J2000.0.
 */

export interface PBDProps {
  /**
   * A {@link BrightDate} to label. Takes precedence over `date` and `value`.
   * If none of `brightDate` / `value` / `date` are supplied, the component
   * renders an interactive slider over deep time.
   */
  brightDate?: BrightDate;
  /** A JavaScript `Date` to label. */
  date?: Date;
  /** A raw BrightDate scalar (decimal days since J2000.0). */
  value?: number;
  /** Decimal places on the displayed value. Defaults to `0`. */
  precision?: number;
  /** Hide the metadata grid. */
  compact?: boolean;
}

const SECONDS_PER_JULIAN_YEAR = 31_557_600; // 365.25 d × 86_400 s
const SECONDS_PER_DAY = 86_400;

// ─── Time-scale helpers ──────────────────────────────────────────────────────

/**
 * The slider is signed-log, indexed by `t ∈ [-1, +1]`. `t = 0` is J2000.0
 * itself; positive sweeps into the future, negative sweeps into the past.
 *
 * `MAX_LOG10_SECONDS` governs the magnitude of |seconds| at the extremes.
 * 17.65 covers the age of the universe (~4.35 × 10¹⁷ s ≈ 13.8 Gyr).
 */
const MAX_LOG10_SECONDS = 17.65;

function sliderToSeconds(t: number): number {
  if (t === 0) return 0;
  const sign = t < 0 ? -1 : 1;
  const mag = Math.abs(t);
  // Linear in log10|seconds| from 10⁻¹ s up to MAX_LOG10.
  const log10Secs = -1 + mag * (MAX_LOG10_SECONDS + 1);
  return sign * Math.pow(10, log10Secs);
}

function secondsToSlider(seconds: number): number {
  const abs = Math.abs(seconds);
  if (abs === 0) return 0;
  const log10Secs = Math.log10(abs);
  const t = Math.min(1, Math.max(0, (log10Secs + 1) / (MAX_LOG10_SECONDS + 1)));
  return seconds < 0 ? -t : t;
}

/** Human-friendly summary of a signed second offset relative to J2000.0. */
function describeOffset(seconds: number): string {
  if (seconds === 0) return "J2000.0 — the anchor itself";
  const abs = Math.abs(seconds);
  const direction = seconds < 0 ? "before J2000.0" : "after J2000.0";

  if (abs < 60) return `≈ ${abs.toFixed(2)} s ${direction}`;
  if (abs < 3600) return `≈ ${(abs / 60).toFixed(1)} min ${direction}`;
  if (abs < SECONDS_PER_DAY)
    return `≈ ${(abs / 3600).toFixed(1)} hr ${direction}`;
  const years = abs / SECONDS_PER_JULIAN_YEAR;
  if (years < 1)
    return `≈ ${(abs / SECONDS_PER_DAY).toFixed(1)} days ${direction}`;
  if (years < 1_000) return `≈ ${years.toFixed(0)} yr ${direction}`;
  if (years < 1_000_000)
    return `≈ ${(years / 1_000).toFixed(2)} kyr ${direction}`;
  if (years < 1_000_000_000)
    return `≈ ${(years / 1_000_000).toFixed(2)} Myr ${direction}`;
  return `≈ ${(years / 1_000_000_000).toFixed(2)} Gyr ${direction}`;
}

/** Coarse calendar / geological-era hint for past offsets. */
function eraHint(seconds: number): string | undefined {
  if (seconds > 0) return undefined;
  const yearsAgo = -seconds / SECONDS_PER_JULIAN_YEAR;
  if (yearsAgo < 1) return undefined;
  if (yearsAgo < 100) return "within a human lifetime";
  if (yearsAgo < 600) return "post-Renaissance";
  if (yearsAgo < 2_300) return "Classical Antiquity → Middle Ages";
  if (yearsAgo < 5_500) return "Recorded history (Bronze Age, Sumer, Egypt)";
  if (yearsAgo < 12_000) return "Neolithic / start of agriculture";
  if (yearsAgo < 50_000)
    return "Upper Paleolithic — anatomically modern humans";
  if (yearsAgo < 300_000) return "Homo sapiens emerging";
  if (yearsAgo < 2_500_000) return "Homo lineage diverges";
  if (yearsAgo < 66_000_000) return "Cenozoic — age of mammals";
  if (yearsAgo < 252_000_000) return "Mesozoic — age of dinosaurs";
  if (yearsAgo < 541_000_000) return "Paleozoic — Cambrian explosion onward";
  if (yearsAgo < 2_500_000_000) return "Proterozoic — single-celled life";
  if (yearsAgo < 4_540_000_000)
    return "Archean — early Earth, Hadean abiogenesis";
  if (yearsAgo < 13_000_000_000)
    return "Stelliferous era — formation of galaxies";
  return "near the Big Bang (~13.8 Gyr)";
}

interface Preset {
  label: string;
  /** Special-cased; resolved to wall-clock seconds when the user clicks. */
  isToday?: boolean;
  seconds: number;
}

const PRESETS: ReadonlyArray<Preset> = [
  { label: "Today", isToday: true, seconds: 0 },
  { label: "J2000.0", seconds: 0 },
  { label: "Apollo 11 (1969)", seconds: -30.5 * SECONDS_PER_JULIAN_YEAR },
  { label: "Year 0", seconds: -2_000 * SECONDS_PER_JULIAN_YEAR },
  { label: "3000 BC", seconds: -5_000 * SECONDS_PER_JULIAN_YEAR },
  {
    label: "Last Ice Age (12 kyr)",
    seconds: -12_000 * SECONDS_PER_JULIAN_YEAR,
  },
  {
    label: "K–Pg (66 Myr)",
    seconds: -66_000_000 * SECONDS_PER_JULIAN_YEAR,
  },
  {
    label: "Earth formed (4.54 Gyr)",
    seconds: -4_540_000_000 * SECONDS_PER_JULIAN_YEAR,
  },
  {
    label: "Big Bang (13.8 Gyr)",
    seconds: -13_800_000_000 * SECONDS_PER_JULIAN_YEAR,
  },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

interface DisplayProps {
  rawSeconds: number;
  precision: number;
  compact: boolean;
}

const LabelDisplay: FC<DisplayProps> = ({ rawSeconds, precision, compact }) => {
  const days = rawSeconds / SECONDS_PER_DAY;
  const isBD = days >= 0;
  const headline = formatBD(days, precision);

  const offsetText =
    rawSeconds === 0 ? "J2000.0 — the anchor itself" : describeOffset(rawSeconds);

  // Horizontal progress strip: fraction of the way across one Tera-second
  // window, used as a visual cadence indicator. For BD, fills toward the
  // next Tera-second hence; for negatives, fills toward J2000.0.
  const TERA_SECOND = 1_000_000_000_000;
  const fillPct = isBD
    ? ((rawSeconds % TERA_SECOND) / TERA_SECOND) * 100
    : (1 - (Math.abs(rawSeconds) % TERA_SECOND) / TERA_SECOND) * 100;
  const fillClamped = Math.max(0, Math.min(100, fillPct));

  const hint = eraHint(rawSeconds);

  return (
    <div
      className={`pbd ${isBD ? "is-bd" : "is-pbd"}`}
      data-testid="pbd"
      data-kind={isBD ? "BD" : "PBD"}
    >
      <span className="pbd-label">{headline}</span>
      {!compact && (
        <>
          <dl className="pbd-meta">
            <dt>Kind</dt>
            <dd>
              {isBD ? "BD (post-J2000.0)" : "PBD (pre-J2000.0)"}
              {hint ? ` — ${hint}` : ""}
            </dd>
            <dt>Offset</dt>
            <dd>{offsetText}</dd>
            <dt>Raw</dt>
            <dd>
              {rawSeconds.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              bs since J2000.0
            </dd>
          </dl>
          <div>
            <div
              className="pbd-progress"
              aria-label={`Tera-second progress: ${fillClamped.toFixed(1)} percent`}
            >
              <div
                className="pbd-progress-fill"
                style={
                  { "--pbd-fill": `${fillClamped}%` } as React.CSSProperties
                }
              />
            </div>
            <div className="pbd-progress-caption">
              <span>{isBD ? "J2000.0" : "−1 Tbs"}</span>
              <span>{fillClamped.toFixed(2)}%</span>
              <span>{isBD ? "+1 Tbs" : "J2000.0"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * BrightDate display-label demonstrator.
 *
 * - When given `brightDate` / `value` / `date`, renders a single label card.
 * - Otherwise, drops into **slider mode** so visitors can walk the timeline
 *   from the Big Bang to ~13.8 Gyr in the future and watch the BD ↔ PBD
 *   prefix flip across J2000.0.
 */
export const PBD: FC<PBDProps> = ({
  brightDate,
  date,
  value,
  precision = 0,
  compact = false,
}) => {
  // Priority: brightDate > value > date. Otherwise → interactive mode.
  const fixed: BrightDate | undefined =
    brightDate ??
    (value !== undefined ? BrightDate.fromValue(value) : undefined) ??
    (date ? BrightDate.fromValue(fromDate(date)) : undefined);

  // Captured once on mount so the "Today" preset keeps a stable reference.
  const initialNowSeconds = useMemo(
    () => fromDate(new Date()) * SECONDS_PER_DAY,
    [],
  );

  const [sliderT, setSliderT] = useState<number>(() =>
    secondsToSlider(initialNowSeconds),
  );

  if (fixed !== undefined) {
    const rawSeconds = fixed.value * SECONDS_PER_DAY;
    return (
      <LabelDisplay
        rawSeconds={rawSeconds}
        precision={precision}
        compact={compact}
      />
    );
  }

  const rawSeconds = sliderToSeconds(sliderT);

  const applyPreset = (preset: Preset) => {
    const seconds = preset.isToday ? initialNowSeconds : preset.seconds;
    setSliderT(secondsToSlider(seconds));
  };

  return (
    <div className="pbd-interactive">
      <LabelDisplay
        rawSeconds={rawSeconds}
        precision={precision}
        compact={compact}
      />
      <div className="pbd-slider-wrap">
        <input
          className="pbd-slider"
          type="range"
          min={-1}
          max={1}
          step={0.001}
          value={sliderT}
          onChange={(e) => setSliderT(Number(e.target.value))}
          aria-label="Walk the BrightDate timeline (log scale, J2000.0 centered)"
        />
        <div className="pbd-slider-scale" aria-hidden="true">
          <span>13.8 Gyr ago</span>
          <span>1 Myr ago</span>
          <span>J2000.0</span>
          <span>1 Myr hence</span>
          <span>13.8 Gyr hence</span>
        </div>
      </div>
      <div className="pbd-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="pbd-preset"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
