import { FC, useMemo, useState } from "react";
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

// Library-backed unit catalog — exact metres come straight from the constants.
const distanceUnits = Object.values(BRIGHT_SECOND_UNITS).map((u) => ({
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

// Legacy units, for the converter's interop column.
const AU_M = 149_597_870_700; // IAU 2012 (exact)
const LIGHT_YEAR_M = 9_460_730_472_580_800; // IAU: Julian year × c (exact)
const PARSEC_M = 3.085_677_581_491_367e16; // IAU 2015 nominal

function formatBright(metres: number): string {
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

const BrightSpacetime: FC = () => {
  // Distance converter
  const [distanceInput, setDistanceInput] = useState("149597870700"); // 1 AU
  const distanceM = useMemo(() => {
    const n = Number(distanceInput.replace(/[, _]/g, ""));
    return Number.isFinite(n) ? n : Number.NaN;
  }, [distanceInput]);
  const lightSeconds = distanceM / SPEED_OF_LIGHT_M_PER_S;
  const lightDays = distanceM / LIGHT_DAY_M;

  // Time-dilation / twin-paradox demo
  const [beta, setBeta] = useState(0.6);
  const g = gamma(Math.abs(beta));
  const T = 10; // coordinate-years per leg
  const origin: SpacetimeEvent = { t: 0, x: 0, y: 0, z: 0 };
  const turn: SpacetimeEvent = { t: T, x: Math.abs(beta) * T, y: 0, z: 0 };
  const back: SpacetimeEvent = { t: 2 * T, x: 0, y: 0, z: 0 };
  const tauOut = properTimeBetween(origin, turn);
  const tauIn = properTimeBetween(turn, back);
  const travellerYears =
    (Number.isFinite(tauOut) ? tauOut : 0) +
    (Number.isFinite(tauIn) ? tauIn : 0);
  const intervalLabel = intervalKind(origin, back);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-blue-500">
      <header className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-4">
          The Bright Spacetime Standard
        </h1>
        <p className="text-xl text-gray-400 font-light tracking-wide uppercase">
          A decimal SI hierarchy for the c = 1 convention physics already uses
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-16">
        {/* c = 1, with prior-art honesty */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-y border-gray-800 py-12">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-blue-400">
              c = 1, operationalised
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Working relativists have set the speed of light to{" "}
              <strong>1</strong> since Minkowski's 1908 lectures — "geometrized"
              or "natural" units. Space and time share a single scale and the
              math gets shorter.
              <br />
              <br />
              The <strong>Bright Standard</strong> takes that convention out of
              the textbook and makes it <em>operational</em>: a decimal SI
              hierarchy (μbm → Gbm), an unambiguous epoch (J2000.0), and a
              reference implementation built on exact-integer constants.
            </p>
          </div>
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
            <code className="text-5xl font-mono text-blue-500">c = 1</code>
            <p className="mt-4 text-gray-500 uppercase text-sm tracking-widest">
              1 BrightMeter ≝ c · 1 s
            </p>
            <p className="mt-1 text-gray-600 text-xs font-mono">
              = 299,792,458 m (exact, SI 2019)
            </p>
          </div>
        </section>

        {/* Minkowski metric */}
        <section className="border border-gray-800 rounded-2xl p-8 md:p-12 bg-gradient-to-b from-gray-950 to-black">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">
            Why c = 1 matters: the Minkowski metric
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="font-mono text-center">
              <div className="text-gray-500 text-sm mb-2">In SI units:</div>
              <div className="text-lg md:text-xl text-gray-300">
                ds² = −c²·dt² + dx² + dy² + dz²
              </div>
              <div className="text-gray-600 my-4 text-2xl">↓</div>
              <div className="text-gray-500 text-sm mb-2">In Bright units:</div>
              <div className="text-lg md:text-xl text-blue-300">
                ds² = −dt² + dx² + dy² + dz²
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Spacetime <em>is</em> geometry. With c = 1 the metric loses its
              factor of c, and the Lorentz factor collapses from{" "}
              <span className="font-mono text-gray-300">
                γ = 1 / √(1 − v²/c²)
              </span>{" "}
              to{" "}
              <span className="font-mono text-blue-300">γ = 1 / √(1 − β²)</span>{" "}
              — β is dimensionless. Every relativistic calculation gets shorter.
            </p>
          </div>
        </section>

        {/* Units table — library-backed */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-200">
            The Scalar Hierarchy
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-900 text-blue-400 uppercase text-xs tracking-widest">
                  <th className="p-6">Standard Unit</th>
                  <th className="p-6">Light-Time Basis</th>
                  <th className="p-6 text-right">Physical Distance (SI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {distanceUnits.map((u) => (
                  <tr
                    key={u.symbol}
                    className="hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="font-bold text-lg">
                        {u.unit}{" "}
                        <span className="text-blue-400 font-mono text-sm">
                          ({u.symbol})
                        </span>
                      </div>
                      <div className="text-gray-500 text-sm font-mono tracking-tighter">
                        {u.context}
                      </div>
                    </td>
                    <td className="p-6 font-mono text-blue-300">{u.basis}</td>
                    <td className="p-6 text-right text-gray-400 font-mono">
                      {u.distance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-600 text-xs mt-3 font-mono">
            Every value computed at render time from the library's exact-integer
            constants.
          </p>
        </section>

        {/* Live converter */}
        <section className="border border-gray-800 rounded-2xl p-8 bg-gray-950">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">
            Try it: distance converter
          </h2>
          <label className="block text-sm text-gray-500 uppercase tracking-widest mb-2">
            Distance in metres
          </label>
          <input
            type="text"
            value={distanceInput}
            onChange={(e) => setDistanceInput(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 font-mono text-lg text-blue-300 focus:outline-none focus:border-blue-500"
            spellCheck={false}
            aria-label="Distance in metres"
          />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Pill
              label="Bright (auto)"
              value={Number.isFinite(distanceM) ? formatBright(distanceM) : "—"}
              highlight
            />
            <Pill
              label="Bright-Seconds"
              value={
                Number.isFinite(lightSeconds)
                  ? `${lightSeconds.toPrecision(6)} bs`
                  : "—"
              }
            />
            <Pill
              label="Light-Days"
              value={
                Number.isFinite(lightDays)
                  ? `${lightDays.toPrecision(6)} Ld`
                  : "—"
              }
            />
            <Pill
              label="Astronomical Units"
              value={
                Number.isFinite(distanceM)
                  ? `${(distanceM / AU_M).toPrecision(6)} AU`
                  : "—"
              }
            />
            <Pill
              label="Light-Years"
              value={
                Number.isFinite(distanceM)
                  ? `${(distanceM / LIGHT_YEAR_M).toPrecision(6)} ly`
                  : "—"
              }
            />
            <Pill
              label="Parsecs"
              value={
                Number.isFinite(distanceM)
                  ? `${(distanceM / PARSEC_M).toPrecision(6)} pc`
                  : "—"
              }
            />
            <Pill
              label="Kilometres"
              value={
                Number.isFinite(distanceM)
                  ? `${(distanceM / 1000).toLocaleString()} km`
                  : "—"
              }
            />
            <Pill
              label="Light-travel time"
              value={
                Number.isFinite(lightSeconds)
                  ? lightSeconds < 60
                    ? `${lightSeconds.toPrecision(4)} s`
                    : lightSeconds < 3600
                      ? `${(lightSeconds / 60).toPrecision(4)} min`
                      : lightSeconds < 86400
                        ? `${(lightSeconds / 3600).toPrecision(4)} hr`
                        : `${(lightSeconds / 86400).toPrecision(4)} days`
                  : "—"
              }
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "Earth → Moon", m: 384_400_000 },
              { label: "1 AU", m: AU_M },
              { label: "Voyager 1 (≈ 2025)", m: 2.4e13 },
              { label: "1 Light-Year", m: LIGHT_YEAR_M },
              { label: "Proxima Centauri", m: 4.2465 * LIGHT_YEAR_M },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setDistanceInput(String(p.m))}
                className="px-3 py-1 rounded-full border border-gray-800 hover:border-blue-500 hover:text-blue-300 text-gray-500 text-xs uppercase tracking-widest transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Worked example */}
        <section className="border border-gray-800 rounded-2xl p-8 bg-gray-950">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Worked example: Mars uplink latency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-gray-500 uppercase text-xs tracking-widest mb-3">
                Legacy SI
              </h3>
              <pre className="text-sm text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                {`d = 0.52 AU
  = 0.52 × 1.496 × 10⁸ km
  = 7.78 × 10⁷ km

t = d / c
  = 7.78 × 10⁷ / 2.998 × 10⁵
  = 259.3 seconds`}
              </pre>
            </div>
            <div>
              <h3 className="text-blue-400 uppercase text-xs tracking-widest mb-3">
                Bright
              </h3>
              <pre className="text-sm text-blue-300 font-mono leading-relaxed whitespace-pre-wrap">
                {`d = 0.52 AU
  = 259.3 bs

t = d   (because c = 1)
  = 259.3 bs`}
              </pre>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-6 leading-relaxed">
            The coordinate <em>is</em> the latency. Round-trip at 0.52 AU is{" "}
            <span className="text-blue-300 font-mono">
              {((0.52 * AU_M * 2) / SPEED_OF_LIGHT_M_PER_S / 60).toFixed(2)} min
            </span>{" "}
            — computed live by{" "}
            <code className="text-blue-300">@brightchain/brightdate</code> from
            the same constants this page uses everywhere else.
          </p>
        </section>

        {/* Time dilation */}
        <section className="border border-gray-800 rounded-2xl p-8 bg-gray-950">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Try it: time dilation
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            A traveller leaves Earth at β = v/c, flies out for {T}{" "}
            coordinate-years, and returns. The library computes proper time
            along their worldline using the (−,+,+,+) Minkowski metric.
          </p>
          <label className="block text-sm text-gray-500 uppercase tracking-widest mb-2">
            β = v / c &nbsp;
            <span className="text-blue-300 font-mono">{beta.toFixed(3)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={0.999}
            step={0.001}
            value={beta}
            onChange={(e) => setBeta(Number(e.target.value))}
            className="w-full accent-blue-500"
            aria-label="β = v / c"
          />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Pill label="γ (Lorentz factor)" value={g.toFixed(4)} highlight />
            <Pill
              label="Stay-at-home twin"
              value={`${(2 * T).toFixed(2)} yr`}
            />
            <Pill
              label="Travelling twin"
              value={`${travellerYears.toFixed(3)} yr`}
            />
            <Pill label="Interval" value={intervalLabel} />
          </div>
          <p className="text-gray-600 text-xs mt-4 font-mono">
            properTimeAlong([origin, turnaround, return]) →{" "}
            {travellerYears.toFixed(6)} yr
          </p>
        </section>

        {/* Why this matters — tone-corrected */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">
              De-anchored from orbits
            </h3>
            <p className="text-gray-400 text-sm">
              The Astronomical Unit and Light-Year are defined in terms of
              Earth's orbit and the Julian year. Bright units are defined from{" "}
              <em>c</em> and the SI second alone — the same constants every
              atomic clock on every planet measures.
            </p>
          </div>
          <div className="p-6 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">
              Dimensionless Lorentz transforms
            </h3>
            <p className="text-gray-400 text-sm">
              Velocity becomes <em>β</em>, a pure number in (−1, 1). γ,
              rapidity, relativistic velocity addition, and Doppler factors all
              reduce to one-line expressions with no factors of <em>c</em> to
              track.
            </p>
          </div>
          <div className="p-6 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">
              Coordinate = latency
            </h3>
            <p className="text-gray-400 text-sm">
              If a probe is 10 Gbs out, the one-way signal delay is exactly 10
              Gbs. The position vector tells you the communication budget for
              free — useful from cislunar comms to interstellar mission design.
            </p>
          </div>
        </section>

        {/* Definitional chain */}
        <section className="border-t border-gray-800 pt-12">
          <h2 className="text-xl font-bold mb-6 text-gray-200">
            Definitional chain
          </h2>
          <dl className="space-y-3 font-mono text-sm text-gray-400">
            <Def
              term="1 BrightMeter (bm)"
              defn={`≝ c · 1 s = ${SPEED_OF_LIGHT_M_PER_S.toLocaleString()} m  (exact, SI 2019)`}
            />
            <Def
              term="1 Bright-Second (bs)"
              defn="≝ 1 BrightMeter (numerically identical; spatial vs temporal framing)"
            />
            <Def
              term="1 Light-Day (Ld)"
              defn={`≝ c · 86 400 s = ${LIGHT_DAY_M.toLocaleString()} m  (exact)`}
            />
            <Def
              term="Light-Milliday (Lmd)"
              defn={`= ${LIGHT_DAY_UNITS.lightMilliday.metres.toLocaleString()} m`}
            />
            <Def term="Epoch" defn="J2000.0 = 2000-01-01T12:00:00 TT  (IAU)" />
            <Def
              term="Metric signature"
              defn="(−, +, +, +);  ds² = −dt² + dx² + dy² + dz²"
            />
          </dl>
        </section>
      </main>

      <footer className="mt-24 text-center text-gray-600 text-sm uppercase tracking-[0.2em]">
        Standardized via Digital Defiance · Reference implementation:{" "}
        <a
          href="https://www.npmjs.com/package/@brightchain/brightdate"
          className="text-blue-400 hover:text-blue-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          @brightchain/brightdate
        </a>
      </footer>
    </div>
  );
};

interface PillProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const Pill: FC<PillProps> = ({ label, value, highlight }) => (
  <div
    className={`rounded-lg border p-3 ${
      highlight
        ? "border-blue-500/50 bg-blue-500/10"
        : "border-gray-800 bg-black"
    }`}
  >
    <div className="text-gray-500 uppercase text-[10px] tracking-widest">
      {label}
    </div>
    <div
      className={`font-mono text-sm mt-1 ${
        highlight ? "text-blue-300" : "text-gray-300"
      }`}
    >
      {value}
    </div>
  </div>
);

const Def: FC<{ term: string; defn: string }> = ({ term, defn }) => (
  <>
    <dt className="text-blue-400">{term}</dt>
    <dd className="text-gray-400 mb-2 md:mb-0 md:pl-6 border-b border-gray-900 pb-2">
      {defn}
    </dd>
  </>
);

export default BrightSpacetime;
