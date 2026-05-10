/**
 * DatePage — Displays the current BrightDate value live, alongside common
 * date formats and known holidays for today using date-holidays.
 */

import {
  fromDate,
  toJulianDate,
  toModifiedJulianDate,
  toUnixMs,
} from "@brightchain/brightdate";
import { motion } from "framer-motion";
import Holidays from "date-holidays";
import { FC, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { BrightDate } from "./BrightDate";
import { HeroBadge } from "./HeroBadge";
import "./DatePage.css";

// ─── Date Format Helpers ─────────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// ─── Interplanetary Telemetry ────────────────────────────────────────────────

const SPEED_OF_LIGHT_KM_S = 299_792.458;
const SECONDS_PER_DAY = 86_400;
const MOON_DISTANCE_KM = 384_400;
const MARS_MIN_DISTANCE_KM = 54_600_000;
const MARS_MAX_DISTANCE_KM = 401_000_000;

function secondsToMillidays(seconds: number): number {
  return (seconds / SECONDS_PER_DAY) * 1000;
}

function estimateMarsDistanceKm(date: Date): number {
  const SYNODIC_PERIOD_DAYS = 779.94;
  const referenceOpposition = new Date("2022-12-08T00:00:00Z");
  const daysSinceOpposition =
    (date.getTime() - referenceOpposition.getTime()) / (1000 * 60 * 60 * 24);
  const phase = (2 * Math.PI * daysSinceOpposition) / SYNODIC_PERIOD_DAYS;
  const midpoint = (MARS_MIN_DISTANCE_KM + MARS_MAX_DISTANCE_KM) / 2;
  const amplitude = (MARS_MAX_DISTANCE_KM - MARS_MIN_DISTANCE_KM) / 2;
  return midpoint - amplitude * Math.cos(phase);
}

// ─── Holiday type label ──────────────────────────────────────────────────────

function holidayTypeLabel(type: string): string {
  switch (type) {
    case "public":
      return "Public";
    case "bank":
      return "Bank";
    case "observance":
      return "Observance";
    default:
      return "Observance";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DatePage: FC = () => {
  const [now, setNow] = useState(new Date());
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const holidays = useMemo(() => {
    const hd = new Holidays("US", { languages: ["en"] });
    const result = hd.isHoliday(now);
    if (!result) return [];
    return result;
  }, [now]);

  const brightValue = fromDate(now);
  const julianDate = toJulianDate(brightValue);
  const mjd = toModifiedJulianDate(brightValue);
  const unixMs = toUnixMs(brightValue);
  const unixTs = Math.floor(unixMs / 1000);
  const dayOfYear = getDayOfYear(now);
  const isoWeek = getISOWeek(now);
  const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;

  // Interplanetary
  const moonLightDelaySec = MOON_DISTANCE_KM / SPEED_OF_LIGHT_KM_S;
  const moonDelayMd = secondsToMillidays(moonLightDelaySec);
  const marsMinMd = secondsToMillidays(
    MARS_MIN_DISTANCE_KM / SPEED_OF_LIGHT_KM_S,
  );
  const marsMaxMd = secondsToMillidays(
    MARS_MAX_DISTANCE_KM / SPEED_OF_LIGHT_KM_S,
  );
  const marsCurrentMd = secondsToMillidays(
    estimateMarsDistanceKm(now) / SPEED_OF_LIGHT_KM_S,
  );

  const formats: Array<{ label: string; value: string }> = [
    {
      label: "BrightDate (full precision)",
      value: `BD: ${brightValue.toFixed(8)}`,
    },
    { label: "BrightDate (standard)", value: `BD: ${brightValue.toFixed(5)}` },
    { label: "BrightDate (compact)", value: `BD: ${brightValue.toFixed(3)}` },
    { label: "ISO 8601", value: now.toISOString() },
    { label: "UTC", value: now.toUTCString() },
    { label: "Local Date & Time", value: now.toLocaleString() },
    {
      label: "Local Date",
      value: now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    { label: "Local Time", value: now.toLocaleTimeString() },
    { label: "Unix Timestamp", value: String(unixTs) },
    { label: "Unix Milliseconds", value: String(now.getTime()) },
    { label: "Julian Date", value: julianDate.toFixed(5) },
    { label: "Modified Julian Date", value: mjd.toFixed(5) },
    { label: "Day of Year", value: `${dayOfYear} / ${daysInYear}` },
    { label: "ISO Week", value: `W${String(isoWeek).padStart(2, "0")}` },
    { label: "RFC 2822", value: now.toString() },
  ];

  return (
    <section className="datepage section" id="datepage" ref={ref}>
      <motion.div
        className="datepage-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          <span className="gradient-text">One Number</span> on One Timeline
        </h2>
        <p className="datepage-subtitle">
          No timezones. No daylight saving. No ambiguity.
        </p>

        <HeroBadge text="UTC With Benefits" />

        {/* BrightDate Hero */}
        <motion.div
          className="datepage-hero-card"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <p className="datepage-hero-label">
            BrightDate — decimal days since J2000.0
          </p>
          <div className="datepage-hero-value">
            <BrightDate date={now} interval={0} format="full" />
          </div>
          <p className="datepage-hero-sub">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {now.toLocaleTimeString()}
          </p>
        </motion.div>

        {/* Holidays */}
        {holidays.length > 0 && (
          <motion.div
            className="datepage-card"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="datepage-card-title">
              Today's Holidays & Observances
            </h3>
            <div className="holiday-chips">
              {holidays.map((h) => (
                <span key={h.name} className={`chip chip-${h.type}`}>
                  {h.name} ({holidayTypeLabel(h.type)})
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Formats */}
        <motion.div
          className="datepage-card"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <h3 className="datepage-card-title">All Date Formats</h3>
          <dl className="format-grid">
            {formats.map(({ label, value }) => (
              <div key={label} className="format-row">
                <dt className="format-label">{label}</dt>
                <dd className="format-value">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Epoch reference */}
        <motion.div
          className="datepage-card"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h3 className="datepage-card-title">
            <a
              href="https://github.com/Digital-Defiance/brightdate/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              About BrightDate
            </a>
          </h3>
          <p className="datepage-text">
            BrightDate counts decimal days since the J2000.0 epoch (January 1,
            2000 at 12:00:00 UTC) — the same epoch used by astronomers worldwide
            for celestial mechanics.
          </p>
          <p className="datepage-text">
            The integer part is the day count. The fractional part is the
            decimal time of day. For example, 0.5 = noon, 0.25 = 06:00, 0.75 =
            18:00.
          </p>
          <p className="datepage-text">
            No time zones, no daylight saving, no ambiguity — just one number on
            one timeline.
          </p>
        </motion.div>

        {/* Interplanetary Telemetry */}
        <motion.div
          className="datepage-card"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <h3 className="datepage-card-title datepage-mono">
            🛰️ Interplanetary Telemetry
          </h3>
          <p className="datepage-text">
            Current one-way light-delay expressed in millidays (md)
          </p>
          <dl className="format-grid">
            <div className="format-row">
              <dt className="format-label">Earth → Moon</dt>
              <dd
                className="format-value"
                title={`${moonLightDelaySec.toFixed(2)}s`}
              >
                {moonDelayMd.toFixed(4)} md
              </dd>
            </div>
            <div className="format-row">
              <dt className="format-label">Earth → Mars (min)</dt>
              <dd
                className="format-value"
                title={`${(MARS_MIN_DISTANCE_KM / SPEED_OF_LIGHT_KM_S).toFixed(1)}s`}
              >
                {marsMinMd.toFixed(4)} md
              </dd>
            </div>
            <div className="format-row">
              <dt className="format-label">Earth → Mars (max)</dt>
              <dd
                className="format-value"
                title={`${(MARS_MAX_DISTANCE_KM / SPEED_OF_LIGHT_KM_S).toFixed(1)}s`}
              >
                {marsMaxMd.toFixed(4)} md
              </dd>
            </div>
            <div className="format-row">
              <dt className="format-label">Earth → Mars (current est.)</dt>
              <dd className="format-value format-value--accent">
                {marsCurrentMd.toFixed(4)} md
              </dd>
            </div>
          </dl>
          <p className="datepage-caption">
            BrightDate is designed for a world beyond Earth-Standard Time. One
            milliday ≈ 86.4 seconds.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default DatePage;
