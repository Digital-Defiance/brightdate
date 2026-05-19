/**
 * BrightSpace — Showcase page for the BrightSpace Geocentric Reference Frame.
 *
 * Companion to /spacetime, focused on the spatial half of the c = 1
 * convention: ECEF Cartesian coordinates in BrightMeters, anchored to
 * ITRF2020. Visual language matches BrightSpacetime.tsx so the two pages
 * read as a pair.
 */

import {
  BRIGHT_METER_M,
  EARTH_MEAN_RADIUS_M,
  SPEED_OF_LIGHT_M_PER_S,
  ecefToGeodetic,
  fromDate,
  geodeticToEcef,
  gpsDistance,
} from "@brightchain/brightdate";
import { motion } from "framer-motion";
import { FC, ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { HeroBadge } from "./HeroBadge";
import "./BrightSpace.css";

// ─── Constants ───────────────────────────────────────────────────────────────

// ITRF2020 GODE station (NASA GSFC, Greenbelt MD), reference epoch 2015.0,
// SOLN 5. Source: ITRF2020_GNSS.SSC.txt, IGN ITRF Product Centre.
// See bright-space-standard.md §5 for full citation.
const GODE_ITRF2020 = {
  epoch: 2015.0,
  positionM: { x: 1_130_773.5956, y: -4_831_253.5718, z: 3_994_200.4453 },
  velocityMPerYr: { x: -0.01521, y: 0.00026, z: 0.00226 },
  sigmaM: { x: 0.0007, y: 0.0009, z: 0.0008 },
} as const;

// GRS80/WGS84 semi-major axis (6,378,137 m) is no longer referenced
// directly in this module — altitude is computed via the library's
// `ecefToGeodetic`, which uses the full WGS84 ellipsoid.
const ITRF_PRESETS: ReadonlyArray<{
  label: string;
  m: { x: number; y: number; z: number };
}> = [
  // ITRF2020 station coordinates at epoch 2015.0
  {
    label: "GODE (NASA GSFC)",
    m: GODE_ITRF2020.positionM,
  },
  {
    label: "OPMT (Paris Observatory)",
    m: { x: 4_202_777.4115, y: 171_368.4135, z: 4_778_660.1903 },
  },
  {
    label: "WTZR (Wettzell, DE)",
    m: { x: 4_075_580.5051, y: 931_853.8139, z: 4_801_568.1410 },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function metresToBm(metres: number): number {
  return metres / BRIGHT_METER_M;
}

/**
 * Auto-scale a BrightMeter value into the most-readable SI prefix.
 * Mirrors the bright-space-standard.md scale-of-things terminology.
 */
function formatBmAuto(metres: number): string {
  if (!Number.isFinite(metres)) return "—";
  const bm = metres / BRIGHT_METER_M;
  const abs = Math.abs(bm);
  if (abs === 0) return "0 bm";
  if (abs < 1e-9) return `${(bm * 1e12).toPrecision(4)} pbm`;
  if (abs < 1e-6) return `${(bm * 1e9).toPrecision(4)} nbm`;
  if (abs < 1e-3) return `${(bm * 1e6).toPrecision(4)} μbm`;
  if (abs < 1) return `${(bm * 1e3).toPrecision(4)} mbm`;
  return `${bm.toPrecision(6)} bm`;
}

function formatSignedM(metres: number, fractionDigits = 4): string {
  if (!Number.isFinite(metres)) return "—";
  const sign = metres >= 0 ? "+" : "−";
  return `${sign}${Math.abs(metres).toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
  })}`;
}

function formatBmSigned(metres: number): string {
  if (!Number.isFinite(metres)) return "—";
  const bm = metres / BRIGHT_METER_M;
  const sign = bm >= 0 ? "+" : "−";
  return `${sign}${Math.abs(bm).toFixed(9)} bm`;
}

// ─── Atomic UI primitives ────────────────────────────────────────────────────

interface PillProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const Pill: FC<PillProps> = ({ label, value, highlight }) => (
  <div className={`space-pill${highlight ? " is-highlight" : ""}`}>
    <div className="space-pill-label">{label}</div>
    <div className="space-pill-value">{value}</div>
  </div>
);

const RevealSection: FC<{ children: ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });
  return (
    <motion.section
      ref={ref}
      className="space-section"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.section>
  );
};

// ─── Section subcomponents ───────────────────────────────────────────────────

const SpaceHero: FC = () => (
  <div className="space-card">
    <div className="space-hero-grid">
      <div>
        <h2 className="space-section-title">Earth as a volume of coordinates</h2>
        <p className="space-hero-body">
          Latitude and longitude are <strong>angular</strong>: a degree near the
          equator is ~111 km, and at the poles it collapses to zero. The math
          is non-linear, the poles are singularities, and every great-circle
          calculation drags trigonometric units across the &ldquo;hot path&rdquo;.
        </p>
        <p className="space-hero-body" style={{ marginTop: "1rem" }}>
          <strong>BrightSpace</strong> replaces the angular map with a 3-D
          ECEF Cartesian volume measured in <em>BrightMeters</em>. Same origin
          and orientation as ITRF/GRS80/WGS84 — but no ellipsoid, no
          singularities, and one consistent unit shared with{" "}
          <Link to="/spacetime" className="gradient-text">
            BrightSpacetime
          </Link>
          .
        </p>
      </div>
      <div className="space-hero-card">
        <div className="space-hero-glyph">ECEF · ITRF2020</div>
        <div className="space-hero-defn">
          (x, y, z) in BrightMeters
        </div>
        <div className="space-hero-note">
          1 bm = 299,792,458 m  (exact)
        </div>
      </div>
    </div>
  </div>
);

const ComparisonTable: FC = () => (
  <>
    <h2
      className="space-section-title"
      style={{ textAlign: "center", color: "var(--text-primary)" }}
    >
      <span className="gradient-text">BrightSpace</span> vs. GRS80 / WGS84
    </h2>
    <div className="space-table-wrap">
      <table className="space-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>GRS80 / WGS84</th>
            <th>BrightSpace</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Geometric model</td>
            <td className="is-legacy">Oblate ellipsoid of revolution</td>
            <td className="is-bright">None — pure 3-D Cartesian volume</td>
          </tr>
          <tr>
            <td>Native coordinates</td>
            <td className="is-legacy">Geodetic (φ, λ, h)</td>
            <td className="is-bright">ECEF (x, y, z) in BrightMeters</td>
          </tr>
          <tr>
            <td>Distance metric</td>
            <td className="is-legacy">Geodesic on ellipsoid (Vincenty)</td>
            <td className="is-bright">Euclidean chord through the volume</td>
          </tr>
          <tr>
            <td>Pole singularities</td>
            <td className="is-legacy">Yes (longitude undefined at φ = ±90°)</td>
            <td className="is-bright">None — every direction is a unit vector</td>
          </tr>
          <tr>
            <td>Unit hierarchy</td>
            <td className="is-legacy">Degrees + metres (mixed units)</td>
            <td className="is-bright">Pure SI length, ratio to c · 1 s</td>
          </tr>
          <tr>
            <td>SIMD-friendly</td>
            <td className="is-legacy">Trig units only</td>
            <td className="is-bright">Vectorised (A − B)² across NEON / AMX</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p className="space-table-caption">
      Same origin, same orientation, same survey data — different math.
    </p>
  </>
);

const SCALE_CARDS: ReadonlyArray<{
  symbol: string;
  name: string;
  metres: number;
  tag: string;
  body: ReactNode;
}> = [
  {
    symbol: "nbm",
    name: "Nano-BrightMeter",
    metres: BRIGHT_METER_M * 1e-9,
    tag: "Hardware handshake",
    body: (
      <>
        ≈ 29.98 cm — close enough to a 12-inch ruler that a coordinate of{" "}
        <em>1 nbm</em> reads as <em>~one foot</em> at a glance. Useful for
        sanity-checking, not for engineering drawings.
      </>
    ),
  },
  {
    symbol: "μbm",
    name: "Micro-BrightMeter",
    metres: BRIGHT_METER_M * 1e-6,
    tag: "City heartbeat",
    body: (
      <>
        ≈ 299.8 m — the &ldquo;signal horizon&rdquo;, ~3 city blocks. A
        BrightChain peer within <strong>1 μbm</strong> is in high-speed mesh
        range, full stop.
      </>
    ),
  },
  {
    symbol: "mbm",
    name: "Milli-BrightMeter",
    metres: BRIGHT_METER_M * 1e-3,
    tag: "Global backbone",
    body: (
      <>
        ≈ 299.8 km — the light-millisecond. Washington D.C. → New York City is
        ~1.1 mbm, which is also the <em>physical</em> ping floor: ~1.1 ms.
      </>
    ),
  },
];

const ScaleOfThings: FC = () => (
  <>
    <h2
      className="space-section-title"
      style={{ textAlign: "center", color: "var(--text-primary)" }}
    >
      Where the numbers <span className="gradient-text">shine</span>
    </h2>
    <p
      className="space-section-lead"
      style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 2rem" }}
    >
      SI prefixes on the BrightMeter line up with human and hardware scales.
      Every prefix below is computed live from{" "}
      <code>BRIGHT_METER_M = {BRIGHT_METER_M.toLocaleString()} m</code>.
    </p>
    <div className="space-scale-grid">
      {SCALE_CARDS.map((c) => (
        <div key={c.symbol} className="space-scale-card">
          <div className="space-scale-symbol">{c.symbol}</div>
          <div className="space-scale-name">{c.name}</div>
          <div className="space-scale-value">
            ≈ {c.metres.toLocaleString(undefined, { maximumFractionDigits: 4 })} m
          </div>
          <div className="space-scale-tag">{c.tag}</div>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  </>
);

// ─── GPS-pair presets for the geodesic converter ────────────────────────────

const GPS_PAIR_PRESETS: ReadonlyArray<{
  label: string;
  a: { name: string; latitude: number; longitude: number };
  b: { name: string; latitude: number; longitude: number };
}> = [
  {
    label: "DC ↔ NYC",
    a: { name: "Washington, DC", latitude: 38.8951, longitude: -77.0364 },
    b: { name: "New York City", latitude: 40.7128, longitude: -74.006 },
  },
  {
    label: "London ↔ Tokyo",
    a: { name: "London", latitude: 51.5074, longitude: -0.1278 },
    b: { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
  },
  {
    label: "Cape Town ↔ Sydney",
    a: { name: "Cape Town", latitude: -33.9249, longitude: 18.4241 },
    b: { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
  },
  {
    label: "Equatorial antipodes",
    a: { name: "0°, 0°", latitude: 0, longitude: 0 },
    b: { name: "0°, 180°", latitude: 0, longitude: 180 },
  },
];

// ─── Equatorial-plane projection: looking down Earth's Z axis ──────────────

interface EquatorialPlaneViewProps {
  aLat: number;
  aLon: number;
  bLat: number;
  bLon: number;
  onChangeA: (lat: number, lon: number) => void;
  onChangeB: (lat: number, lon: number) => void;
}

/**
 * Top-down view of Earth's equatorial plane (the BrightSpace native view —
 * looking straight down the Z axis). Each point is plotted at polar
 * coordinates `(longitude, cos(latitude))`: the equator is the rim, the
 * poles are the centre. Drag either marker to update its lat/lng.
 *
 * The dashed line between the markers is the *projected* through-Earth
 * chord — its on-screen length is the chord's projection onto the
 * equatorial plane, exact when both points are on the equator and an
 * underestimate as the points climb to higher latitudes. The numerical
 * chord/arc cards below are the authoritative quantities.
 */
const EquatorialPlaneView: FC<EquatorialPlaneViewProps> = ({
  aLat,
  aLon,
  bLat,
  bLon,
  onChangeA,
  onChangeB,
}) => {
  const VIEW = 320;
  const CENTER = VIEW / 2;
  const RADIUS = 130;
  const [dragging, setDragging] = useState<"A" | "B" | null>(null);

  const project = useCallback(
    (lat: number, lon: number): { x: number; y: number } => {
      // Latitude collapses radius (cos(lat)); longitude is the angle.
      // SVG y-axis points down, so flip the sin component.
      const r = RADIUS * Math.cos((lat * Math.PI) / 180);
      const theta = (lon * Math.PI) / 180;
      return {
        x: CENTER + r * Math.cos(theta),
        y: CENTER - r * Math.sin(theta),
      };
    },
    [CENTER, RADIUS],
  );

  const unproject = useCallback(
    (x: number, y: number): { lat: number; lon: number } => {
      const dx = x - CENTER;
      const dy = CENTER - y;
      const r = Math.min(RADIUS, Math.hypot(dx, dy));
      const lat = (Math.acos(r / RADIUS) * 180) / Math.PI;
      // Northern hemisphere only on this projection — preserve the
      // user's existing latitude sign rather than guess from the
      // mouse position.
      const lon = (Math.atan2(dy, dx) * 180) / Math.PI;
      return { lat, lon };
    },
    [CENTER, RADIUS],
  );

  const aPos = useMemo(
    () =>
      Number.isFinite(aLat) && Number.isFinite(aLon)
        ? project(aLat, aLon)
        : null,
    [aLat, aLon, project],
  );
  const bPos = useMemo(
    () =>
      Number.isFinite(bLat) && Number.isFinite(bLon)
        ? project(bLat, bLon)
        : null,
    [bLat, bLon, project],
  );

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * VIEW;
      const y = ((e.clientY - rect.top) / rect.height) * VIEW;
      const { lat, lon } = unproject(x, y);
      // Preserve the sign of the existing latitude so users can drag
      // a southern-hemisphere marker without it teleporting north.
      if (dragging === "A") {
        const signed = aLat < 0 ? -lat : lat;
        onChangeA(signed, lon);
      } else {
        const signed = bLat < 0 ? -lat : lat;
        onChangeB(signed, lon);
      }
    },
    [dragging, unproject, aLat, bLat, onChangeA, onChangeB],
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const startDrag = useCallback(
    (which: "A" | "B") =>
      (e: React.PointerEvent<SVGCircleElement>) => {
        e.preventDefault();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDragging(which);
      },
    [],
  );

  // Concentric latitude rings at every 30°.
  const latRings = [30, 60].map((lat) => ({
    lat,
    r: RADIUS * Math.cos((lat * Math.PI) / 180),
  }));

  // Meridian lines every 30°.
  const meridians = Array.from({ length: 6 }, (_, i) => i * 30);

  return (
    <div className="space-plane">
      <svg
        ref={svgRef}
        className="space-plane-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="img"
        aria-label="Equatorial-plane projection of two BrightSpace points"
      >
        {/* Earth disk */}
        <circle
          className="space-plane-disk"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
        />

        {/* Latitude rings */}
        {latRings.map(({ lat, r }) => (
          <circle
            key={lat}
            className="space-plane-grid"
            cx={CENTER}
            cy={CENTER}
            r={r}
          />
        ))}

        {/* Meridians */}
        {meridians.map((lon) => {
          const theta = (lon * Math.PI) / 180;
          return (
            <line
              key={lon}
              className="space-plane-meridian"
              x1={CENTER}
              y1={CENTER}
              x2={CENTER + RADIUS * Math.cos(theta)}
              y2={CENTER - RADIUS * Math.sin(theta)}
            />
          );
        })}

        {/* Cardinal labels */}
        <text className="space-plane-axis-label" x={CENTER + RADIUS + 12} y={CENTER + 3}>
          0°
        </text>
        <text className="space-plane-axis-label" x={CENTER} y={CENTER - RADIUS - 6}>
          90°E
        </text>
        <text className="space-plane-axis-label" x={CENTER - RADIUS - 14} y={CENTER + 3}>
          180°
        </text>
        <text className="space-plane-axis-label" x={CENTER} y={CENTER + RADIUS + 14}>
          90°W
        </text>
        <text className="space-plane-pole" x={CENTER} y={CENTER + 3}>
          pole
        </text>

        {/* Chord (projected) */}
        {aPos && bPos ? (
          <line
            className="space-plane-chord"
            x1={aPos.x}
            y1={aPos.y}
            x2={bPos.x}
            y2={bPos.y}
          />
        ) : null}

        {/* Markers */}
        {aPos ? (
          <g
            className={`space-plane-marker space-plane-marker-a${dragging === "A" ? " is-dragging" : ""}`}
          >
            <circle
              className="space-plane-marker-ring"
              cx={aPos.x}
              cy={aPos.y}
              r={11}
            />
            <circle
              cx={aPos.x}
              cy={aPos.y}
              r={6}
              onPointerDown={startDrag("A")}
            />
            <text
              className="space-plane-marker-label"
              x={aPos.x}
              y={aPos.y - 14}
            >
              A
            </text>
          </g>
        ) : null}
        {bPos ? (
          <g
            className={`space-plane-marker space-plane-marker-b${dragging === "B" ? " is-dragging" : ""}`}
          >
            <circle
              className="space-plane-marker-ring"
              cx={bPos.x}
              cy={bPos.y}
              r={11}
            />
            <circle
              cx={bPos.x}
              cy={bPos.y}
              r={6}
              onPointerDown={startDrag("B")}
            />
            <text
              className="space-plane-marker-label"
              x={bPos.x}
              y={bPos.y - 14}
            >
              B
            </text>
          </g>
        ) : null}
      </svg>

      <div className="space-plane-caption">
        Top-down view of the equatorial plane. Dashed line ={" "}
        <code>‖A − B‖</code> projected. Drag either marker to move it.
        <span className="space-plane-hint">
          Latitude collapses radius — equator at the rim, pole at the centre.
        </span>
      </div>
    </div>
  );
};

const GpsConverter: FC = () => {
  const [aLat, setALat] = useState("38.8951");
  const [aLon, setALon] = useState("-77.0364");
  const [aName, setAName] = useState("Washington, DC");
  const [bLat, setBLat] = useState("40.7128");
  const [bLon, setBLon] = useState("-74.006");
  const [bName, setBName] = useState("New York City");

  const parsedA = useMemo(() => {
    const lat = Number(aLat);
    const lon = Number(aLon);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : null;
  }, [aLat, aLon]);

  const parsedB = useMemo(() => {
    const lat = Number(bLat);
    const lon = Number(bLon);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : null;
  }, [bLat, bLon]);

  const ecefA = useMemo(() => (parsedA ? geodeticToEcef(parsedA) : null), [
    parsedA,
  ]);
  const ecefB = useMemo(() => (parsedB ? geodeticToEcef(parsedB) : null), [
    parsedB,
  ]);

  const distance = useMemo(
    () => (parsedA && parsedB ? gpsDistance(parsedA, parsedB) : null),
    [parsedA, parsedB],
  );

  const applyPreset = useCallback(
    (preset: (typeof GPS_PAIR_PRESETS)[number]) => {
      setALat(String(preset.a.latitude));
      setALon(String(preset.a.longitude));
      setAName(preset.a.name);
      setBLat(String(preset.b.latitude));
      setBLon(String(preset.b.longitude));
      setBName(preset.b.name);
    },
    [],
  );

  const handle = useCallback(
    (set: (v: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        set(e.target.value),
    [],
  );

  const ratio =
    distance && distance.chordMetres > 0
      ? distance.surfaceMetres / distance.chordMetres
      : null;

  return (
    <div className="space-card">
      <h2 className="space-section-title">Try it: GPS → BrightSpace</h2>
      <p className="space-section-lead">
        Enter two GPS points and the library converts each to ECEF, then
        gives you both the BrightSpace-native <strong>chord</strong> (a
        straight line through the Earth — the cryptographic light-floor)
        and the human-facing <strong>great-circle</strong> (around the
        Earth, on a sphere).
      </p>

      <EquatorialPlaneView
        aLat={parsedA?.latitude ?? Number.NaN}
        aLon={parsedA?.longitude ?? Number.NaN}
        bLat={parsedB?.latitude ?? Number.NaN}
        bLon={parsedB?.longitude ?? Number.NaN}
        onChangeA={(lat, lon) => {
          setALat(lat.toFixed(4));
          setALon(lon.toFixed(4));
          setAName("Custom");
        }}
        onChangeB={(lat, lon) => {
          setBLat(lat.toFixed(4));
          setBLon(lon.toFixed(4));
          setBName("Custom");
        }}
      />

      <div className="space-gps-points">
        {/* ── Point A ───────────────────────────────────────────── */}
        <div className="space-gps-point">
          <div className="space-gps-point-title">
            <h3>Point A</h3>
            <span className="space-gps-point-tag">{aName}</span>
          </div>
          <div className="space-gps-fields">
            <div>
              <label htmlFor="space-a-lat">Latitude (°)</label>
              <input
                id="space-a-lat"
                type="text"
                inputMode="decimal"
                className="space-input"
                value={aLat}
                onChange={handle(setALat)}
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="space-a-lon">Longitude (°)</label>
              <input
                id="space-a-lon"
                type="text"
                inputMode="decimal"
                className="space-input"
                value={aLon}
                onChange={handle(setALon)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="space-gps-ecef">
            <div className="space-gps-ecef-label">ECEF (m)</div>
            {ecefA
              ? `[ ${formatSignedM(ecefA.x, 2)} , ${formatSignedM(ecefA.y, 2)} , ${formatSignedM(ecefA.z, 2)} ]`
              : "—"}
            <div
              className="space-gps-ecef-label"
              style={{ marginTop: "0.5rem" }}
            >
              ECEF (BrightMeters)
            </div>
            {ecefA
              ? `[ ${formatBmSigned(ecefA.x)} , ${formatBmSigned(ecefA.y)} , ${formatBmSigned(ecefA.z)} ]`
              : "—"}
          </div>
        </div>

        {/* ── Point B ───────────────────────────────────────────── */}
        <div className="space-gps-point">
          <div className="space-gps-point-title">
            <h3>Point B</h3>
            <span className="space-gps-point-tag">{bName}</span>
          </div>
          <div className="space-gps-fields">
            <div>
              <label htmlFor="space-b-lat">Latitude (°)</label>
              <input
                id="space-b-lat"
                type="text"
                inputMode="decimal"
                className="space-input"
                value={bLat}
                onChange={handle(setBLat)}
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="space-b-lon">Longitude (°)</label>
              <input
                id="space-b-lon"
                type="text"
                inputMode="decimal"
                className="space-input"
                value={bLon}
                onChange={handle(setBLon)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="space-gps-ecef">
            <div className="space-gps-ecef-label">ECEF (m)</div>
            {ecefB
              ? `[ ${formatSignedM(ecefB.x, 2)} , ${formatSignedM(ecefB.y, 2)} , ${formatSignedM(ecefB.z, 2)} ]`
              : "—"}
            <div
              className="space-gps-ecef-label"
              style={{ marginTop: "0.5rem" }}
            >
              ECEF (BrightMeters)
            </div>
            {ecefB
              ? `[ ${formatBmSigned(ecefB.x)} , ${formatBmSigned(ecefB.y)} , ${formatBmSigned(ecefB.z)} ]`
              : "—"}
          </div>
        </div>
      </div>

      <div className="space-presets">
        {GPS_PAIR_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="space-preset"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Distance comparison ───────────────────────────────── */}
      <div className="space-distance-grid">
        <div className="space-distance-card is-chord">
          <div className="space-distance-eyebrow">
            Through the Earth · BrightSpace-native
          </div>
          <div className="space-distance-title">Euclidean chord</div>
          <div className="space-distance-primary">
            {distance ? formatBmAuto(distance.chordMetres) : "—"}
          </div>
          <div className="space-distance-secondary">
            {distance
              ? `${(distance.chordMetres / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} km · ${(distance.lightTravelSeconds * 1000).toFixed(3)} ms one-way`
              : "—"}
          </div>
          <p className="space-distance-body">
            <code>‖A − B‖</code> over ECEF. The cryptographic{" "}
            <em>light-floor</em>: no signal between A and B can be faster
            than this divided by <em>c</em>.
          </p>
        </div>

        <div className="space-distance-card is-surface">
          <div className="space-distance-eyebrow">
            Around the Earth · human-facing
          </div>
          <div className="space-distance-title">Great-circle (haversine)</div>
          <div className="space-distance-primary">
            {distance
              ? `${(distance.surfaceMetres / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} km`
              : "—"}
          </div>
          <div className="space-distance-secondary">
            {distance ? formatBmAuto(distance.surfaceMetres) : "—"}
          </div>
          <p className="space-distance-body">
            Arc on a sphere of radius{" "}
            <code>{(EARTH_MEAN_RADIUS_M / 1000).toLocaleString()} km</code>{" "}
            (IUGG mean). Accurate to ~0.5%; approximates what a vehicle
            travels along the surface.
          </p>
        </div>
      </div>

      {distance && ratio !== null ? (
        <div className="space-distance-gap">
          The surface arc is{" "}
          <code>
            {(distance.surfaceMinusChordMetres / 1000).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 },
            )}{" "}
            km
          </code>{" "}
          longer than the chord (ratio{" "}
          <code>{ratio.toFixed(4)}×</code>). At antipodal points this
          ratio approaches <code>π / 2 ≈ 1.5708×</code>; for nearby
          points it collapses toward <code>1.0000×</code>. BrightSpace
          uses the chord because <em>that</em> is the quantity light
          actually traverses.
        </div>
      ) : null}
    </div>
  );
};

const EcefConverter: FC = () => {
  const [xInput, setXInput] = useState(String(GODE_ITRF2020.positionM.x));
  const [yInput, setYInput] = useState(String(GODE_ITRF2020.positionM.y));
  const [zInput, setZInput] = useState(String(GODE_ITRF2020.positionM.z));

  const parsed = useMemo(() => {
    const x = Number(xInput.replace(/[, _]/g, ""));
    const y = Number(yInput.replace(/[, _]/g, ""));
    const z = Number(zInput.replace(/[, _]/g, ""));
    return { x, y, z };
  }, [xInput, yInput, zInput]);

  const norm = useMemo(() => {
    const { x, y, z } = parsed;
    if (![x, y, z].every(Number.isFinite)) return Number.NaN;
    return Math.sqrt(x * x + y * y + z * z);
  }, [parsed]);

  const lightTimeFromCenterMs = Number.isFinite(norm)
    ? (norm / SPEED_OF_LIGHT_M_PER_S) * 1000
    : Number.NaN;

  // ECEF → geodetic (lat/lon/alt) via the library, so the "back to GPS"
  // direction is right there in the same panel.
  const geodetic = useMemo(() => {
    const { x, y, z } = parsed;
    if (![x, y, z].every(Number.isFinite)) return null;
    return ecefToGeodetic({ x, y, z });
  }, [parsed]);

  const handle = useCallback(
    (set: (v: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        set(e.target.value),
    [],
  );

  const applyPreset = useCallback(
    (m: { x: number; y: number; z: number }) => {
      setXInput(String(m.x));
      setYInput(String(m.y));
      setZInput(String(m.z));
    },
    [],
  );

  return (
    <div className="space-card">
      <h2 className="space-section-title">Try it: ECEF → BrightSpace</h2>
      <p className="space-section-lead">
        Drop in a station&apos;s ITRF2020 ECEF coordinates (metres). The page
        divides by <code>c</code> and renders them as a BrightSpace vector,
        plus a chord-distance from Earth&apos;s centre. Use the altitude
        slider to lift the point along its WGS84 ellipsoid normal — same
        latitude and longitude, different altitude.
      </p>
      <label className="space-label">ECEF coordinates (metres)</label>
      <div className="space-ecef-grid">
        <input
          type="text"
          className="space-input"
          value={xInput}
          onChange={handle(setXInput)}
          spellCheck={false}
          aria-label="ECEF X in metres"
          placeholder="X (m)"
        />
        <input
          type="text"
          className="space-input"
          value={yInput}
          onChange={handle(setYInput)}
          spellCheck={false}
          aria-label="ECEF Y in metres"
          placeholder="Y (m)"
        />
        <input
          type="text"
          className="space-input"
          value={zInput}
          onChange={handle(setZInput)}
          spellCheck={false}
          aria-label="ECEF Z in metres"
          placeholder="Z (m)"
        />
      </div>

      {geodetic ? (
        <div style={{ marginTop: "1.25rem" }}>
          <label className="space-label" htmlFor="space-ecef-altitude">
            Altitude above WGS84 ellipsoid
            <span className="space-slider-readout">
              {geodetic.altitude < 1000
                ? `${geodetic.altitude.toFixed(1)} m`
                : `${(geodetic.altitude / 1000).toFixed(2)} km`}
            </span>
          </label>
          <input
            id="space-ecef-altitude"
            type="range"
            className="space-slider"
            min={-1000}
            max={50_000_000}
            step={1000}
            value={Math.max(-1000, Math.min(50_000_000, geodetic.altitude))}
            onChange={(e) => {
              const altM = Number(e.target.value);
              const lifted = geodeticToEcef({
                latitude: geodetic.latitude,
                longitude: geodetic.longitude,
                altitude: altM,
              });
              setXInput(lifted.x.toFixed(4));
              setYInput(lifted.y.toFixed(4));
              setZInput(lifted.z.toFixed(4));
            }}
          />
          <div className="space-presets" style={{ marginTop: "0.75rem" }}>
            {[
              { label: "Surface", altM: 0 },
              { label: "Burj Khalifa (828 m)", altM: 828 },
              { label: "Cruising (10 km)", altM: 10_000 },
              { label: "ISS (~400 km)", altM: 400_000 },
              { label: "MEO (~20 200 km)", altM: 20_200_000 },
              { label: "GEO (~35 786 km)", altM: 35_786_000 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className="space-preset"
                onClick={() => {
                  const lifted = geodeticToEcef({
                    latitude: geodetic.latitude,
                    longitude: geodetic.longitude,
                    altitude: p.altM,
                  });
                  setXInput(lifted.x.toFixed(4));
                  setYInput(lifted.y.toFixed(4));
                  setZInput(lifted.z.toFixed(4));
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-pill-grid">
        <Pill label="X (BrightMeters)" value={formatBmSigned(parsed.x)} highlight />
        <Pill label="Y (BrightMeters)" value={formatBmSigned(parsed.y)} highlight />
        <Pill label="Z (BrightMeters)" value={formatBmSigned(parsed.z)} highlight />
        <Pill
          label="‖r‖ from Earth centre"
          value={formatBmAuto(norm)}
        />
        <Pill
          label="Altitude (above WGS84 ellipsoid)"
          value={
            geodetic
              ? geodetic.altitude < 1000
                ? `${formatSignedM(geodetic.altitude, 2)} m`
                : `${(geodetic.altitude / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`
              : "—"
          }
        />
        <Pill
          label="Light-time from centre"
          value={
            Number.isFinite(lightTimeFromCenterMs)
              ? `${lightTimeFromCenterMs.toFixed(3)} ms`
              : "—"
          }
        />
        <Pill
          label="Latitude (WGS84)"
          value={
            geodetic ? `${geodetic.latitude.toFixed(7)}°` : "—"
          }
        />
        <Pill
          label="Longitude (WGS84)"
          value={
            geodetic ? `${geodetic.longitude.toFixed(7)}°` : "—"
          }
        />
      </div>

      <div className="space-presets">
        {ITRF_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="space-preset"
            onClick={() => applyPreset(p.m)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const DistanceBounding: FC = () => {
  // Manhattan reference (rough ECEF for 40.7128°N, 74.0060°W on the surface)
  const observerM = { x: 1_334_000, y: -4_654_000, z: 4_138_000 };
  const target = GODE_ITRF2020.positionM;
  const chordM = Math.sqrt(
    (observerM.x - target.x) ** 2 +
      (observerM.y - target.y) ** 2 +
      (observerM.z - target.z) ** 2,
  );
  const oneWayMs = (chordM / SPEED_OF_LIGHT_M_PER_S) * 1000;
  const roundTripMs = 2 * oneWayMs;

  return (
    <div className="space-card">
      <h2 className="space-section-title">
        Distance Bounding: causality as a floor
      </h2>
      <div className="space-bounding-grid">
        <div className="space-bounding-col">
          <h3>Legacy claim</h3>
          <pre className="space-bounding-pre">{`Node X says:
  "I'm in Maryland."
  "Round-trip ping: 1.6 ms."

Trust model:
  IP geolocation
  + self-reported lat/lng
  + best effort.`}</pre>
        </div>
        <div className="space-bounding-col is-bright">
          <h3>BrightSpace audit</h3>
          <pre className="space-bounding-pre">{`Manhattan ↔ GODE chord
  = ${formatBmAuto(chordM)}
  ≈ ${(chordM / 1000).toFixed(1)} km

Light-floor RTT
  = 2 · chord / c
  = ${roundTripMs.toFixed(3)} ms

Sub-${roundTripMs.toFixed(2)} ms reply →
  cryptographically impossible.`}</pre>
        </div>
      </div>
      <p className="space-bounding-footnote">
        BrightSpace doesn&apos;t prove a node&apos;s location — it rules out
        impossibilities. A response faster than{" "}
        <code>{roundTripMs.toFixed(3)} ms</code> can&apos;t come from
        Maryland; a response that <em>satisfies</em> the bound is
        unverified, not validated. Combine with multi-anchor probes and
        cryptographic identity for full attestation.
      </p>
    </div>
  );
};

// ─── bping / bright-iputils audit ───────────────────────────────────────────

const BPING_PRESETS: ReadonlyArray<{
  label: string;
  observer: { name: string; latitude: number; longitude: number };
  target: { name: string; latitude: number; longitude: number };
  measuredMs: number;
}> = [
  // The numbers are illustrative — typical real-world results for these pairs.
  {
    label: "DC ↔ NYC (efficient route)",
    observer: { name: "Washington, DC", latitude: 38.8951, longitude: -77.0364 },
    target: { name: "New York City", latitude: 40.7128, longitude: -74.006 },
    measuredMs: 4.8,
  },
  {
    label: "NYC ↔ London (transatlantic)",
    observer: { name: "New York City", latitude: 40.7128, longitude: -74.006 },
    target: { name: "London", latitude: 51.5074, longitude: -0.1278 },
    measuredMs: 71.0,
  },
  {
    label: "NYC ↔ Tokyo (long-haul)",
    observer: { name: "New York City", latitude: 40.7128, longitude: -74.006 },
    target: { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
    measuredMs: 145.0,
  },
  {
    label: "Spoofed Maryland (faster than physics)",
    observer: { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
    target: { name: '"Maryland"', latitude: 39.0217, longitude: -76.8267 },
    measuredMs: 38.0,
  },
];

const BpingAudit: FC = () => {
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = BPING_PRESETS[presetIdx];
  const [measuredMs, setMeasuredMs] = useState(String(preset.measuredMs));

  // Re-seed the measured-RTT input when the user picks a new preset.
  const applyPreset = useCallback((idx: number) => {
    setPresetIdx(idx);
    setMeasuredMs(String(BPING_PRESETS[idx].measuredMs));
  }, []);

  const dist = useMemo(
    () => gpsDistance(preset.observer, preset.target),
    [preset],
  );

  const measured = useMemo(() => {
    const n = Number(measuredMs);
    return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
  }, [measuredMs]);

  // Two-way light-time = 2 × chord / c. Anything under this floor is
  // physically impossible — the cryptographic Distance-Bounding signal.
  const lightFloorRttMs = dist.lightTravelSeconds * 2 * 1000;
  const efficiency = Number.isFinite(measured)
    ? lightFloorRttMs / measured
    : Number.NaN;

  // Three-band classification: impossible (< floor), warn (efficiency
  // implausibly close to 1 — possible spoof or co-location), normal.
  const verdict = useMemo<{
    kind: "impossible" | "near-c" | "ok" | "loose";
    label: string;
  }>(() => {
    if (!Number.isFinite(measured)) return { kind: "ok", label: "—" };
    if (measured < lightFloorRttMs)
      return {
        kind: "impossible",
        label: "Cryptographically impossible",
      };
    // Above 95% of c is suspicious for a real internet path (every
    // router and cable adds latency); treat as warning.
    if (efficiency > 0.95)
      return { kind: "near-c", label: "Suspicious: near-c efficiency" };
    if (efficiency > 0.5)
      return { kind: "ok", label: "Healthy: tight to physics" };
    return { kind: "loose", label: "Loose: routing overhead" };
  }, [measured, lightFloorRttMs, efficiency]);

  // Format helpers local to this component.
  const formatChord = formatBmAuto(dist.chordMetres);
  const efficiencyPct = Number.isFinite(efficiency)
    ? `${(efficiency * 100).toFixed(1)}%`
    : "—";

  const lineClass =
    verdict.kind === "impossible"
      ? "is-impossible"
      : verdict.kind === "near-c"
        ? "is-warn"
        : "";

  const verdictClass =
    verdict.kind === "impossible"
      ? "is-impossible"
      : verdict.kind === "near-c" || verdict.kind === "loose"
        ? "is-warn"
        : "";

  const targetForCmd = preset.target.name.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="space-card">
      <h2 className="space-section-title">
        bping: ping as a physical audit
      </h2>
      <p className="space-section-lead">
        Once a chord distance has units of <em>seconds of light-travel</em>,
        the round-trip time of a network probe stops being a relative number
        and becomes an <strong>audit</strong>. <code>bping</code> (part of
        the open-source{" "}
        <a
          href="https://github.com/Digital-Defiance/bright-iputils"
          target="_blank"
          rel="noopener noreferrer"
        >
          bright-iputils
        </a>{" "}
        toolkit) compares measured RTT to the BrightSpace light-floor and
        reports an efficiency percentage. Anything below the floor is
        cryptographically impossible; anything implausibly close to it is a
        red flag.
      </p>

      <div className="space-presets">
        {BPING_PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className="space-preset"
            onClick={() => applyPreset(i)}
            aria-pressed={i === presetIdx}
            style={
              i === presetIdx
                ? {
                    borderColor: "var(--accent-primary)",
                    color: "var(--accent-primary)",
                  }
                : undefined
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-ping-grid">
        <div className="space-ping-form">
          <div className="space-pill-label">Observer → Target</div>
          <div style={{ marginTop: "0.4rem", marginBottom: "0.85rem" }}>
            <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
              {preset.observer.name}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                color: "var(--accent-primary)",
              }}
            >
              ↳ {preset.target.name}
            </div>
          </div>
          <div className="space-ping-form-row">
            <div>
              <label htmlFor="space-bping-measured">Measured RTT (ms)</label>
              <input
                id="space-bping-measured"
                type="text"
                inputMode="decimal"
                className="space-input"
                value={measuredMs}
                onChange={(e) => setMeasuredMs(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label>Light-floor RTT</label>
              <div
                className="space-pill-value"
                style={{
                  padding: "0.55rem 0",
                  color: "var(--accent-primary)",
                }}
              >
                {lightFloorRttMs.toFixed(3)} ms
              </div>
            </div>
          </div>
          <div className="space-pill-grid" style={{ marginTop: "1rem" }}>
            <Pill
              label="Chord distance"
              value={formatChord}
              highlight
            />
            <Pill
              label="Surface (haversine)"
              value={`${(dist.surfaceMetres / 1000).toFixed(1)} km`}
            />
            <Pill
              label="One-way light-time"
              value={`${(dist.lightTravelSeconds * 1000).toFixed(3)} ms`}
            />
            <Pill
              label="Efficiency"
              value={efficiencyPct}
              highlight
            />
          </div>
        </div>

        <div
          className="space-ping-output"
          data-target={targetForCmd}
          aria-live="polite"
        >
          <div className={`space-ping-line ${lineClass}`}>
            <span className="space-ping-key">Latency:        </span>
            <span className="space-ping-val">
              {Number.isFinite(measured) ? `${measured.toFixed(2)} ms` : "—"}
            </span>
          </div>
          <div className="space-ping-line">
            <span className="space-ping-key">Light-floor:    </span>
            <span className="space-ping-val">
              {lightFloorRttMs.toFixed(3)} ms
            </span>
          </div>
          <div className="space-ping-line">
            <span className="space-ping-key">Chord distance: </span>
            <span className="space-ping-val">{formatChord}</span>
            <span className="space-ping-key">{"  ("}</span>
            <span className="space-ping-val">
              {(dist.chordMetres / 1000).toFixed(1)} km
            </span>
            <span className="space-ping-key">)</span>
          </div>
          <div className={`space-ping-line ${lineClass}`}>
            <span className="space-ping-key">Efficiency:     </span>
            <span className="space-ping-val">{efficiencyPct}</span>
            <span className="space-ping-key">
              {verdict.kind === "impossible"
                ? "  (faster than light)"
                : verdict.kind === "near-c"
                  ? "  (near-c — verify)"
                  : verdict.kind === "loose"
                    ? "  (routing overhead)"
                    : "  (tight to physics)"}
            </span>
          </div>
          <div className={`space-ping-verdict ${verdictClass}`}>
            {verdict.label}
          </div>
        </div>
      </div>

      <p
        className="space-bounding-footnote"
        style={{ marginTop: "1.5rem" }}
      >
        The efficiency band is the part legacy <code>ping</code> leaves on
        the table. <strong>Sub-floor</strong> reports falsify a location
        claim by physics alone — no certificate, no reputation, no IP
        geolocation database required. <strong>Near-c</strong> reports
        flag co-location, BGP shortcuts, or a target that isn&apos;t
        actually where it says it is. <strong>Loose</strong> efficiency
        is normal internet — the gap is your routing budget, your
        firewalls, your queueing.
      </p>

      <h3
        style={{
          marginTop: "2rem",
          marginBottom: "0.75rem",
          fontSize: "1rem",
          color: "var(--text-primary)",
          fontWeight: 700,
        }}
      >
        Why <code>bright-iputils</code>?
      </h3>
      <p className="space-section-lead" style={{ marginBottom: "0" }}>
        Standard <code>ping</code> / <code>traceroute</code> /{" "}
        <code>mtr</code> were designed for a flat, unitless network. They
        report milliseconds with no spatial grounding. <strong>
          bright-iputils
        </strong>{" "}
        replaces each tool with a BrightSpace-aware variant that carries
        chord distance and light-floor through the entire pipeline:
      </p>
      <div className="space-tools-list">
        <div className="space-tool-card">
          <code>bping</code>
          <p>
            ICMP/UDP probes with chord distance, light-floor, and live
            efficiency band. The audit-grade <code>ping</code>.
          </p>
        </div>
        <div className="space-tool-card">
          <code>btraceroute</code>
          <p>
            Per-hop chord deltas. Spot the hop where a route loops out to
            another continent and back.
          </p>
        </div>
        <div className="space-tool-card">
          <code>bmtr</code>
          <p>
            Continuous probe with rolling efficiency stats per hop. Catch
            BGP flaps and intermittent spoofing.
          </p>
        </div>
        <div className="space-tool-card">
          <code>baudit</code>
          <p>
            Multi-anchor distance bounding from independent vantage points.
            Confirm a claim, not just rule out impossibility.
          </p>
        </div>
      </div>
      <p
        className="space-bounding-footnote"
        style={{ marginTop: "1.5rem" }}
      >
        <code>bright-iputils</code> is open-source and uses the same{" "}
        <code>@brightchain/brightdate</code> primitives this page does — every
        chord, every light-floor, every efficiency comes from the
        library&apos;s exact-integer constants.
      </p>
    </div>
  );
};

const ItrfWorked: FC = () => {
  const epoch = GODE_ITRF2020.epoch;
  const [yearInput, setYearInput] = useState("2026");

  const projectedYear = useMemo(() => {
    const n = Number(yearInput);
    return Number.isFinite(n) && n > 1970 && n < 2200 ? n : Number.NaN;
  }, [yearInput]);

  const projectedM = useMemo(() => {
    if (!Number.isFinite(projectedYear)) return null;
    const dt = projectedYear - epoch;
    return {
      x: GODE_ITRF2020.positionM.x + dt * GODE_ITRF2020.velocityMPerYr.x,
      y: GODE_ITRF2020.positionM.y + dt * GODE_ITRF2020.velocityMPerYr.y,
      z: GODE_ITRF2020.positionM.z + dt * GODE_ITRF2020.velocityMPerYr.z,
    };
  }, [projectedYear, epoch]);

  const driftM = useMemo(() => {
    if (!projectedM) return null;
    const dt = projectedYear - epoch;
    return Math.sqrt(
      (dt * GODE_ITRF2020.velocityMPerYr.x) ** 2 +
        (dt * GODE_ITRF2020.velocityMPerYr.y) ** 2 +
        (dt * GODE_ITRF2020.velocityMPerYr.z) ** 2,
    );
  }, [projectedM, projectedYear, epoch]);

  return (
    <div className="space-card">
      <h2 className="space-section-title">
        Worked example: GODE @ ITRF2020
      </h2>
      <p className="space-section-lead">
        NASA GSFC station <strong>GODE</strong> (DOMES 40451M123) is one of the
        IGS core anchors. Reference epoch <strong>2015.0</strong>, current
        solution SOLN 5. Project to any year using the published
        velocity vector — and divide by <code>c</code> at the very end.
      </p>

      <pre className="space-itrf-pre">{`# Published @ epoch 2015.0
X = ${formatSignedM(GODE_ITRF2020.positionM.x)} m   (σ = ${GODE_ITRF2020.sigmaM.x} m)
Y = ${formatSignedM(GODE_ITRF2020.positionM.y)} m   (σ = ${GODE_ITRF2020.sigmaM.y} m)
Z = ${formatSignedM(GODE_ITRF2020.positionM.z)} m   (σ = ${GODE_ITRF2020.sigmaM.z} m)

# Velocity (m / yr)
Vx = ${GODE_ITRF2020.velocityMPerYr.x.toFixed(5)}
Vy = ${GODE_ITRF2020.velocityMPerYr.y.toFixed(5)}
Vz = ${GODE_ITRF2020.velocityMPerYr.z.toFixed(5)}

# Project: P(t) = P(2015.0) + (t − 2015.0) · V       [in metres]
# Convert: P_bm  = P(t) / c                          (c = ${SPEED_OF_LIGHT_M_PER_S.toLocaleString()} m)`}</pre>

      <div style={{ marginTop: "1.5rem" }}>
        <label className="space-label" htmlFor="space-year">
          Project to decimal year
        </label>
        <input
          id="space-year"
          type="text"
          className="space-input"
          value={yearInput}
          onChange={(e) => setYearInput(e.target.value)}
          spellCheck={false}
          inputMode="decimal"
          style={{ maxWidth: "240px" }}
        />
      </div>

      <div className="space-pill-grid">
        <Pill
          label="X @ year"
          value={projectedM ? `${formatSignedM(projectedM.x)} m` : "—"}
        />
        <Pill
          label="Y @ year"
          value={projectedM ? `${formatSignedM(projectedM.y)} m` : "—"}
        />
        <Pill
          label="Z @ year"
          value={projectedM ? `${formatSignedM(projectedM.z)} m` : "—"}
        />
        <Pill
          label="Plate drift since 2015.0"
          value={
            driftM !== null && Number.isFinite(driftM)
              ? `${(driftM * 100).toFixed(2)} cm`
              : "—"
          }
        />
        <Pill
          label="X (BrightMeters)"
          value={projectedM ? formatBmSigned(projectedM.x) : "—"}
          highlight
        />
        <Pill
          label="Y (BrightMeters)"
          value={projectedM ? formatBmSigned(projectedM.y) : "—"}
          highlight
        />
        <Pill
          label="Z (BrightMeters)"
          value={projectedM ? formatBmSigned(projectedM.z) : "—"}
          highlight
        />
        <Pill
          label="‖r‖ from Earth centre"
          value={
            projectedM
              ? formatBmAuto(
                  Math.sqrt(
                    projectedM.x ** 2 + projectedM.y ** 2 + projectedM.z ** 2,
                  ),
                )
              : "—"
          }
        />
      </div>
    </div>
  );
};

const FourDIndex: FC = () => {
  // Use the brightdate library to compute a current BrightDate at render time.
  const bd = useMemo(() => fromDate(new Date()), []);
  const target = GODE_ITRF2020.positionM;
  const xBm = metresToBm(target.x);
  const yBm = metresToBm(target.y);
  const zBm = metresToBm(target.z);

  return (
    <div className="space-card">
      <h2 className="space-section-title">
        The 4D Spacetime Vector
      </h2>
      <p className="space-section-lead">
        BrightDate (<code>t</code>) and BrightSpace (<code>x, y, z</code>) share
        a single epoch and a single unit. Every record in BrightChain or
        BrightDB is stamped with one immutable 4-tuple — no timezone, no
        ellipsoid, no civil-calendar drift.
      </p>
      <div className="space-vector-card">
        <div className="space-pill-label">
          GODE station, signed at this instant
        </div>
        <pre className="space-vector-pre">{`[t, x, y, z] = [
  ${bd.toFixed(6)},
  ${xBm >= 0 ? "+" : "−"}${Math.abs(xBm).toFixed(9)},
  ${yBm >= 0 ? "+" : "−"}${Math.abs(yBm).toFixed(9)},
  ${zBm >= 0 ? "+" : "−"}${Math.abs(zBm).toFixed(9)}
]
  // t = SI days since J2000.0 (TAI substrate)
  // x, y, z = BrightMeters, ECEF / ITRF2020`}</pre>
      </div>
    </div>
  );
};

const WHY_CARDS: ReadonlyArray<{ title: string; body: ReactNode }> = [
  {
    title: "Linear, vectorised math",
    body: (
      <>
        Distance is <code>‖A − B‖</code>. Spatial indexes map directly to
        SIMD lanes (NEON, AMX, AVX-512). Million-pair queries land in
        single-digit milliseconds against <em>150+ ms</em> for Haversine.
      </>
    ),
  },
  {
    title: "No singularities, no edge cases",
    body: (
      <>
        Every direction in 3-space is a well-defined unit vector. No
        wrap-around at ±180° longitude, no undefined longitude at the poles,
        no &ldquo;international date line&rdquo; in geometry code.
      </>
    ),
  },
  {
    title: "ITRF, not improvised",
    body: (
      <>
        BrightSpace shares an origin and orientation with ITRF/GRS80/WGS84.
        Existing GNSS pipelines feed it straight from their ECEF stage —
        the ellipsoid is just discarded at the boundary.
      </>
    ),
  },
];

const WhyMatters: FC = () => (
  <div className="space-why-grid">
    {WHY_CARDS.map((c) => (
      <div key={c.title} className="space-why-card">
        <h3>{c.title}</h3>
        <p>{c.body}</p>
      </div>
    ))}
  </div>
);

// ─── Page composition ───────────────────────────────────────────────────────

const BrightSpace: FC = () => (
  <div className="space">
    <div className="space-glow" aria-hidden="true" />
    <div className="space-container">
      <motion.header
        className="space-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Link to="/" className="space-back">
          ← Back to BrightDate
        </Link>
        <HeroBadge text="🌍 ITRF2020 · ECEF · BrightMeters" />
        <h1 className="space-title">
          The <span className="gradient-text">BrightSpace</span> Reference Frame
        </h1>
        <p className="space-subtitle">
          Earth-Centred, Earth-Fixed Cartesian coordinates measured in
          BrightMeters. No ellipsoid, no singularities, no mixed units.
        </p>
        <a
          href="https://github.brightchain.org/docs/papers/bright-space-standard/"
          target="_blank"
          rel="noopener noreferrer"
          className="space-paper-link"
        >
          📄 Read the paper →
        </a>
      </motion.header>

      <main>
        <RevealSection>
          <SpaceHero />
        </RevealSection>
        <RevealSection>
          <ComparisonTable />
        </RevealSection>
        <RevealSection>
          <ScaleOfThings />
        </RevealSection>
        <RevealSection>
          <GpsConverter />
        </RevealSection>
        <RevealSection>
          <EcefConverter />
        </RevealSection>
        <RevealSection>
          <DistanceBounding />
        </RevealSection>
        <RevealSection>
          <BpingAudit />
        </RevealSection>
        <RevealSection>
          <ItrfWorked />
        </RevealSection>
        <RevealSection>
          <FourDIndex />
        </RevealSection>
        <RevealSection>
          <WhyMatters />
        </RevealSection>
      </main>

      <footer className="space-footer">
        Standardized via Digital Defiance · Reference implementation:{" "}
        <a
          href="https://www.npmjs.com/package/@brightchain/brightdate"
          target="_blank"
          rel="noopener noreferrer"
        >
          @brightchain/brightdate
        </a>{" "}
        · paper:{" "}
        <a
          href="https://github.brightchain.org/docs/papers/bright-space-standard"
          target="_blank"
          rel="noopener noreferrer"
        >
          The BrightSpace Geocentric Reference Frame
        </a>
      </footer>
    </div>
  </div>
);

export default BrightSpace;
