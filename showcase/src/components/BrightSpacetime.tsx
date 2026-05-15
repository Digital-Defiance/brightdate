/**
 * BrightSpacetime — Showcase page for the c = 1 Bright unit hierarchy.
 *
 * Visual language matches the home page (Hero/Features/DatePage):
 * CSS variables from index.css, framer-motion + useInView reveals,
 * HeroBadge intro, shared .gradient-text accent.
 */

import {
  BRIGHT_METER_M,
  BRIGHT_SECOND_UNITS,
  LIGHT_DAY_M,
  LIGHT_DAY_UNITS,
  SPEED_OF_LIGHT_M_PER_S,
  gamma,
  intervalKind,
  properTimeBetween,
  type SpacetimeEvent,
} from "@brightchain/brightdate";
import { motion } from "framer-motion";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { HeroBadge } from "./HeroBadge";
import "./BrightSpacetime.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const AU_M = 149_597_870_700; // IAU 2012 (exact)
const LIGHT_YEAR_M = 9_460_730_472_580_800; // IAU: Julian year × c (exact)
const PARSEC_M = 3.085_677_581_491_367e16; // IAU 2015 nominal
const COORDINATE_YEARS_PER_LEG = 10;

const DISTANCE_PRESETS: ReadonlyArray<{ label: string; m: number }> = [
  { label: "Earth → Moon", m: 384_400_000 },
  { label: "1 AU", m: AU_M },
  { label: "Voyager 1 (≈ 2025)", m: 2.4e13 },
  { label: "1 Light-Year", m: LIGHT_YEAR_M },
  { label: "Proxima Centauri", m: 4.2465 * LIGHT_YEAR_M },
];

// Library-backed unit catalog — exact metres come straight from the constants.
const DISTANCE_UNITS = Object.values(BRIGHT_SECOND_UNITS).map((u) => ({
  unit: u.name,
  symbol: u.symbol,
  basis:
    u.seconds === 1
      ? "1 s"
      : u.seconds >= 1e6
        ? `10^${Math.log10(u.seconds).toFixed(0)} s`
        : `${u.seconds.toLocaleString()} s`,
  distance: `${u.metres.toLocaleString()} m`,
  context: u.context,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBright(metres: number): string {
  if (!Number.isFinite(metres)) return "—";
  const bs = metres / BRIGHT_METER_M;
  const abs = Math.abs(bs);
  if (abs === 0) return "0 bs";
  if (abs < 1e-3) return `${(bs * 1e6).toPrecision(4)} μbm`;
  if (abs < 1) return `${(bs * 1e3).toPrecision(4)} mbm`;
  if (abs < 1e3) return `${bs.toPrecision(4)} bs`;
  if (abs < 1e6) return `${(bs / 1e3).toPrecision(4)} kbs`;
  if (abs < 1e9) return `${(bs / 1e6).toPrecision(4)} Mbs`;
  return `${(bs / 1e9).toPrecision(4)} Gbs`;
}

function formatLightTravelTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${seconds.toPrecision(4)} s`;
  if (seconds < 3600) return `${(seconds / 60).toPrecision(4)} min`;
  if (seconds < 86_400) return `${(seconds / 3600).toPrecision(4)} hr`;
  return `${(seconds / 86_400).toPrecision(4)} days`;
}

function safe(value: number, format: (n: number) => string): string {
  return Number.isFinite(value) ? format(value) : "—";
}

// ─── Atomic UI primitives ────────────────────────────────────────────────────

interface PillProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const Pill: FC<PillProps> = ({ label, value, highlight }) => (
  <div className={`spacetime-pill${highlight ? " is-highlight" : ""}`}>
    <div className="spacetime-pill-label">{label}</div>
    <div className="spacetime-pill-value">{value}</div>
  </div>
);

interface DefRowProps {
  term: string;
  defn: ReactNode;
}

const DefRow: FC<DefRowProps> = ({ term, defn }) => (
  <div className="spacetime-defs-row">
    <dt className="spacetime-defs-term">{term}</dt>
    <dd className="spacetime-defs-defn">{defn}</dd>
  </div>
);

/**
 * Wraps a section in a fade-in-on-scroll motion block — matches the home page
 * Features/DatePage idiom (useInView triggers framer-motion).
 */
const RevealSection: FC<{ children: ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });
  return (
    <motion.section
      ref={ref}
      className="spacetime-section"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.section>
  );
};

// ─── Section subcomponents ───────────────────────────────────────────────────

const CHero: FC = () => (
  <div className="spacetime-card">
    <div className="spacetime-c-grid">
      <div>
        <h2 className="spacetime-section-title">c = 1, operationalised</h2>
        <p className="spacetime-c-body">
          Working relativists have set the speed of light to <strong>1</strong>{" "}
          since Minkowski&apos;s 1908 lectures — &ldquo;geometrized&rdquo; or
          &ldquo;natural&rdquo; units. Space and time share a single scale and
          the math gets shorter.
        </p>
        <p className="spacetime-c-body" style={{ marginTop: "1rem" }}>
          The <strong>Bright Standard</strong> takes that convention out of the
          textbook and makes it <em>operational</em>: a decimal SI hierarchy
          (μbm → Gbm), an unambiguous epoch (J2000.0), and a reference
          implementation built on exact-integer constants.
        </p>
      </div>
      <div className="spacetime-c-card">
        <div className="spacetime-c-glyph">c = 1</div>
        <div className="spacetime-c-defn">1 BrightMeter ≝ c · 1 s</div>
        <div className="spacetime-c-note">= 299,792,458 m (exact, SI 2019)</div>
      </div>
    </div>
  </div>
);

const MinkowskiMetric: FC = () => (
  <div className="spacetime-card">
    <h2 className="spacetime-section-title">
      Why c = 1 matters: the Minkowski metric
    </h2>
    <div className="spacetime-metric-grid">
      <div className="spacetime-metric-eq">
        <div className="spacetime-metric-eq-label">In SI units</div>
        <div className="spacetime-metric-eq-si">
          ds² = −c²·dt² + dx² + dy² + dz²
        </div>
        <div className="spacetime-metric-eq-arrow">↓</div>
        <div className="spacetime-metric-eq-label">In Bright units</div>
        <div className="spacetime-metric-eq-bright">
          ds² = −dt² + dx² + dy² + dz²
        </div>
      </div>
      <p className="spacetime-metric-body">
        Spacetime <em>is</em> geometry. With c = 1 the metric loses its factor
        of c, and the Lorentz factor collapses from{" "}
        <code>γ = 1 / √(1 − v²/c²)</code> to{" "}
        <code className="is-bright">γ = 1 / √(1 − β²)</code> — β is
        dimensionless. Every relativistic calculation gets shorter.
      </p>
    </div>
  </div>
);

const UnitsTable: FC = () => (
  <>
    <h2
      className="spacetime-section-title"
      style={{ textAlign: "center", color: "var(--text-primary)" }}
    >
      The <span className="gradient-text">scalar hierarchy</span>
    </h2>
    <div className="spacetime-table-wrap">
      <table className="spacetime-table">
        <thead>
          <tr>
            <th>Standard Unit</th>
            <th>Light-Time Basis</th>
            <th>Physical Distance (SI)</th>
          </tr>
        </thead>
        <tbody>
          {DISTANCE_UNITS.map((u) => (
            <tr key={u.symbol}>
              <td>
                <div className="spacetime-table-unit">
                  {u.unit}{" "}
                  <span className="spacetime-table-symbol">({u.symbol})</span>
                </div>
                <div className="spacetime-table-context">{u.context}</div>
              </td>
              <td className="spacetime-table-basis">{u.basis}</td>
              <td className="spacetime-table-distance">{u.distance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="spacetime-table-caption">
      Every value computed at render time from the library&apos;s exact-integer
      constants.
    </p>
  </>
);

const DistanceConverter: FC = () => {
  const [distanceInput, setDistanceInput] = useState("149597870700"); // 1 AU

  const distanceM = useMemo(() => {
    const n = Number(distanceInput.replace(/[, _]/g, ""));
    return Number.isFinite(n) ? n : Number.NaN;
  }, [distanceInput]);

  const lightSeconds = distanceM / SPEED_OF_LIGHT_M_PER_S;
  const lightDays = distanceM / LIGHT_DAY_M;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDistanceInput(e.target.value),
    [],
  );

  const handlePresetClick = useCallback((m: number) => {
    setDistanceInput(String(m));
  }, []);

  return (
    <div className="spacetime-card">
      <h2 className="spacetime-section-title">Try it: distance converter</h2>
      <label className="spacetime-label" htmlFor="spacetime-distance">
        Distance in metres
      </label>
      <input
        id="spacetime-distance"
        type="text"
        className="spacetime-input"
        value={distanceInput}
        onChange={handleInputChange}
        spellCheck={false}
      />
      <div className="spacetime-pill-grid">
        <Pill label="Bright (auto)" value={formatBright(distanceM)} highlight />
        <Pill
          label="Bright-Seconds"
          value={safe(lightSeconds, (n) => `${n.toPrecision(6)} bs`)}
        />
        <Pill
          label="Light-Days"
          value={safe(lightDays, (n) => `${n.toPrecision(6)} Ld`)}
        />
        <Pill
          label="Astronomical Units"
          value={safe(distanceM, (n) => `${(n / AU_M).toPrecision(6)} AU`)}
        />
        <Pill
          label="Light-Years"
          value={safe(
            distanceM,
            (n) => `${(n / LIGHT_YEAR_M).toPrecision(6)} ly`,
          )}
        />
        <Pill
          label="Parsecs"
          value={safe(distanceM, (n) => `${(n / PARSEC_M).toPrecision(6)} pc`)}
        />
        <Pill
          label="Kilometres"
          value={safe(distanceM, (n) => `${(n / 1000).toLocaleString()} km`)}
        />
        <Pill
          label="Light-travel time"
          value={formatLightTravelTime(lightSeconds)}
        />
      </div>
      <div className="spacetime-presets">
        {DISTANCE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="spacetime-preset"
            onClick={() => handlePresetClick(p.m)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const MarsExample: FC = () => {
  const roundTripMin = useMemo(
    () => ((0.52 * AU_M * 2) / SPEED_OF_LIGHT_M_PER_S / 60).toFixed(2),
    [],
  );

  return (
    <div className="spacetime-card">
      <h2 className="spacetime-section-title">
        Worked example: Mars uplink latency
      </h2>
      <div className="spacetime-mars-grid">
        <div className="spacetime-mars-col">
          <h3>Legacy SI</h3>
          <pre className="spacetime-mars-pre">{`d = 0.52 AU
  = 0.52 × 1.496 × 10⁸ km
  = 7.78 × 10⁷ km

t = d / c
  = 7.78 × 10⁷ / 2.998 × 10⁵
  = 259.3 seconds`}</pre>
        </div>
        <div className="spacetime-mars-col is-bright">
          <h3>Bright</h3>
          <pre className="spacetime-mars-pre">{`d = 0.52 AU
  = 259.3 bs

t = d   (because c = 1)
  = 259.3 bs`}</pre>
        </div>
      </div>
      <p className="spacetime-mars-footnote">
        The coordinate <em>is</em> the latency. Round-trip at 0.52 AU is{" "}
        <span className="spacetime-mars-roundtrip">{roundTripMin} min</span> —
        computed live by <code>@brightchain/brightdate</code> from the same
        constants this page uses everywhere else.
      </p>
    </div>
  );
};

const TimeDilation: FC = () => {
  const [beta, setBeta] = useState(0.6);

  const { g, travellerYears, intervalLabel } = useMemo(() => {
    const T = COORDINATE_YEARS_PER_LEG;
    const origin: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };
    const turn: SpacetimeEvent = { t: T, x: Math.abs(beta) * T, y: 0, z: 0 };
    const back: SpacetimeEvent = { t: 2 * T, x: 0, y: 0, z: 0 };
    const tauOut = properTimeBetween(origin, turn);
    const tauIn = properTimeBetween(turn, back);
    return {
      g: gamma(Math.abs(beta)),
      travellerYears:
        (Number.isFinite(tauOut) ? tauOut : 0) +
        (Number.isFinite(tauIn) ? tauIn : 0),
      intervalLabel: intervalKind(origin, back),
    };
  }, [beta]);

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setBeta(Number(e.target.value)),
    [],
  );

  return (
    <div className="spacetime-card">
      <h2 className="spacetime-section-title">Try it: time dilation</h2>
      <p className="spacetime-section-lead">
        A traveller leaves Earth at β = v/c, flies out for{" "}
        {COORDINATE_YEARS_PER_LEG} coordinate-years, and returns. The library
        computes proper time along their worldline using the (−,+,+,+) Minkowski
        metric.
      </p>
      <label className="spacetime-label" htmlFor="spacetime-beta">
        β = v / c
        <span className="spacetime-beta-readout">{beta.toFixed(3)}</span>
      </label>
      <input
        id="spacetime-beta"
        type="range"
        className="spacetime-slider"
        min={0}
        max={0.999}
        step={0.001}
        value={beta}
        onChange={handleSlider}
      />
      <div className="spacetime-pill-grid" style={{ marginTop: "1.5rem" }}>
        <Pill label="γ (Lorentz factor)" value={g.toFixed(4)} highlight />
        <Pill
          label="Stay-at-home twin"
          value={`${(2 * COORDINATE_YEARS_PER_LEG).toFixed(2)} yr`}
        />
        <Pill
          label="Travelling twin"
          value={`${travellerYears.toFixed(3)} yr`}
        />
        <Pill label="Interval" value={intervalLabel} />
      </div>
      <p className="spacetime-trace">
        properTimeAlong([origin, turnaround, return]) →{" "}
        {travellerYears.toFixed(6)} yr
      </p>
    </div>
  );
};

const WHY_CARDS: ReadonlyArray<{ title: string; body: ReactNode }> = [
  {
    title: "De-anchored from orbits",
    body: (
      <>
        The Astronomical Unit and Light-Year are defined in terms of
        Earth&apos;s orbit and the Julian year. Bright units are defined from{" "}
        <em>c</em> and the SI second alone — the same constants every atomic
        clock on every planet measures.
      </>
    ),
  },
  {
    title: "Dimensionless Lorentz transforms",
    body: (
      <>
        Velocity becomes <em>β</em>, a pure number in (−1, 1). γ, rapidity,
        relativistic velocity addition, and Doppler factors all reduce to
        one-line expressions with no factors of <em>c</em> to track.
      </>
    ),
  },
  {
    title: "Coordinate = latency",
    body: (
      <>
        If a probe is 10 Gbs out, the one-way signal delay is exactly 10 Gbs.
        The position vector tells you the communication budget for free — useful
        from cislunar comms to interstellar mission design.
      </>
    ),
  },
];

const WhyMatters: FC = () => (
  <div className="spacetime-why-grid">
    {WHY_CARDS.map((c) => (
      <div key={c.title} className="spacetime-why-card">
        <h3>{c.title}</h3>
        <p>{c.body}</p>
      </div>
    ))}
  </div>
);

const DefinitionalChain: FC = () => (
  <div className="spacetime-card">
    <h2 className="spacetime-section-title">Definitional chain</h2>
    <dl className="spacetime-defs">
      <DefRow
        term="1 BrightMeter (bm)"
        defn={`≝ c · 1 s = ${SPEED_OF_LIGHT_M_PER_S.toLocaleString()} m  (exact, SI 2019)`}
      />
      <DefRow
        term="1 Bright-Second (bs)"
        defn="≝ 1 BrightMeter (numerically identical; spatial vs temporal framing)"
      />
      <DefRow
        term="1 Light-Day (Ld)"
        defn={`≝ c · 86 400 s = ${LIGHT_DAY_M.toLocaleString()} m  (exact)`}
      />
      <DefRow
        term="Light-Milliday (Lmd)"
        defn={`= ${LIGHT_DAY_UNITS.lightMilliday.metres.toLocaleString()} m`}
      />
      <DefRow term="Epoch" defn="J2000.0 = 2000-01-01T12:00:00 TT  (IAU)" />
      <DefRow
        term="Metric signature"
        defn="(−, +, +, +);  ds² = −dt² + dx² + dy² + dz²"
      />
    </dl>
  </div>
);

// ─── Page composition ───────────────────────────────────────────────────────

const BrightSpacetime: FC = () => (
  <div className="spacetime">
    <div className="spacetime-glow" aria-hidden="true" />
    <div className="spacetime-container">
      <motion.header
        className="spacetime-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Link to="/" className="spacetime-back">
          ← Back to BrightDate
        </Link>
        <HeroBadge text="🛰️ c = 1 · J2000.0 · Decimal SI" />
        <h1 className="spacetime-title">
          The <span className="gradient-text">Bright Spacetime</span> Standard
        </h1>
        <p className="spacetime-subtitle">
          A decimal SI hierarchy for the c = 1 convention physics already uses.
        </p>
      </motion.header>

      <main>
        <RevealSection>
          <CHero />
        </RevealSection>
        <RevealSection>
          <MinkowskiMetric />
        </RevealSection>
        <RevealSection>
          <UnitsTable />
        </RevealSection>
        <RevealSection>
          <DistanceConverter />
        </RevealSection>
        <RevealSection>
          <MarsExample />
        </RevealSection>
        <RevealSection>
          <TimeDilation />
        </RevealSection>
        <RevealSection>
          <WhyMatters />
        </RevealSection>
        <RevealSection>
          <DefinitionalChain />
        </RevealSection>
      </main>

      <footer className="spacetime-footer">
        Standardized via Digital Defiance · Reference implementation:{" "}
        <a
          href="https://www.npmjs.com/package/@brightchain/brightdate"
          target="_blank"
          rel="noopener noreferrer"
        >
          @brightchain/brightdate
        </a>
      </footer>
    </div>
  </div>
);

export default BrightSpacetime;
