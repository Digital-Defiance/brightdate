/**
 * FractionTable — local clock → BD scalar association builder.
 *
 * # Goal
 *
 * Help a visitor build the mental association between their local clock
 * and the BrightDate scalar / fraction that clock produces. BrightDate has
 * one scalar and one fraction — both universal, the same number for every
 * observer at the same instant. The local clock is just the *label* the
 * visitor reads on their wall; BD is what BrightDate gives back.
 *
 * # What you see
 *
 * Each row is one local hour today (00:00 → 23:00 in the visitor's zone).
 * For each row we ask the library "what BD value does my wall clock
 * produce when it reads this hour today?" via `bdFromLocalClock`. The
 * fraction column is the same universal BD-day fraction for everyone at
 * that instant — there is no localized variant.
 *
 * The current local hour is highlighted live (1 s tick); a live "now" cell
 * shows the live BD scalar / fraction down to five decimals.
 */

import { motion } from "framer-motion";
import { FC, Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bdFromLocalClock, fromDate } from "@brightchain/brightdate";
import "./FractionTable.css";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function fmtFraction(f: number): string {
  return f.toFixed(4);
}

/** Best-effort IANA timezone label, with a UTC±HH:MM fallback. */
function getTimezoneLabel(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    /* fall through */
  }
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/** Visitor's local UTC offset in fractional days (east-positive). */
function getLocalOffsetDays(): number {
  return -new Date().getTimezoneOffset() / 1440;
}

interface Row {
  hour: number; // local civil hour 0–23
  bd: number; // BD scalar at HH:00 local today
  bdHalf: number; // BD scalar at HH:30 local today
  fraction: number; // BD-day fraction at HH:00
  fractionHalf: number; // BD-day fraction at HH:30
}

/** Format a Date as `HH:MM:SS` in the visitor's local timezone. */
function fmtLocalClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const FractionTable: FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tzLabel = useMemo(() => getTimezoneLabel(), []);
  // Re-read each render so a DST transition near midnight doesn't lie.
  const offsetDays = getLocalOffsetDays();

  const bdNow = fromDate(now);
  const fractionNow = bdNow - Math.floor(bdNow);
  const currentLocalHour = now.getHours();

  const rows: Row[] = useMemo(() => {
    return HOURS.map((h) => {
      const bd = bdFromLocalClock(bdNow, h, 0, 0, offsetDays);
      const bdHalf = bdFromLocalClock(bdNow, h, 30, 0, offsetDays);
      return {
        hour: h,
        bd,
        bdHalf,
        fraction: bd - Math.floor(bd),
        fractionHalf: bdHalf - Math.floor(bdHalf),
      };
    });
  }, [bdNow, offsetDays]);

  return (
    <section className="fraction-table-page section">
      <motion.div
        className="fraction-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="fraction-table-back">
          ← Back to home
        </Link>

        <h1 className="fraction-table-title">
          Your <span className="gradient-text">Local Clock</span> as
          BrightDate
        </h1>
        <p className="fraction-table-subtitle">
          BrightDate has one universal scalar, with one universal fraction.
          Every observer at the same instant gets the same number. This page
          shows what BD value your clock <em>produces</em> at each local hour
          today, so you can start associating wall-clock times with the BD
          scalar. The local clock is just a label you read; the scalar is
          universal.
        </p>

        <div className="fraction-table-meta">
          <div>
            <span className="fraction-table-meta-label">Your timezone</span>
            <span className="fraction-table-meta-value">{tzLabel}</span>
          </div>
          <div>
            <span className="fraction-table-meta-label">Local time</span>
            <span className="fraction-table-meta-value mono">
              {now.toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="fraction-table-meta-label">BD now</span>
            <span className="fraction-table-meta-value mono">
              {bdNow.toFixed(5)}
            </span>
          </div>
          <div>
            <span className="fraction-table-meta-label">BD fraction now</span>
            <span className="fraction-table-meta-value mono">
              {fractionNow.toFixed(5)}
            </span>
          </div>
        </div>

        <div className="fraction-table-card">
          <div className="fraction-table-scroll">
            <table className="fraction-table">
              <thead>
                <tr>
                  <th scope="col" className="col-hour">
                    Local hour
                    <span className="col-sub">{tzLabel}</span>
                  </th>
                  <th scope="col">BD value</th>
                  <th scope="col">Fraction (:00)</th>
                  <th scope="col">Fraction (:30)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isCurrent = r.hour === currentLocalHour;
                  const cls = isCurrent ? "row-current" : "";
                  // Insert a live "now" row right after the current local
                  // hour's row so it floats at its real position on the
                  // grid (e.g. between 11:00 and 12:00 when local is
                  // 11:51). The row is the actual live BD scalar from
                  // `bdNow`, not a forecast.
                  const nowRow = isCurrent ? (
                    <tr
                      key={`now-${r.hour}`}
                      className="row-now"
                      aria-label="Current local time"
                    >
                      <th scope="row" className="col-hour mono">
                        {fmtLocalClock(now)}
                        <span className="col-sub">now</span>
                      </th>
                      <td className="mono">{bdNow.toFixed(5)}</td>
                      <td className="mono">{fmtFraction(fractionNow)}</td>
                      <td className="mono dim">—</td>
                    </tr>
                  ) : null;
                  return (
                    <Fragment key={r.hour}>
                      <tr className={cls}>
                        <th scope="row" className="col-hour mono">
                          {pad2(r.hour)}:00
                        </th>
                        <td className="mono">{r.bd.toFixed(5)}</td>
                        <td className="mono">{fmtFraction(r.fraction)}</td>
                        <td className="mono dim">
                          {fmtFraction(r.fractionHalf)}
                        </td>
                      </tr>
                      {nowRow}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="fraction-table-legend">
            <li>
              <span className="legend-dot legend-dot-current" /> The
              highlighted row is the current local hour. The bright "now"
              row is the live local clock and BD scalar.
            </li>
            <li>
              The fraction is the universal BD-day fraction at the instant
              your clock reads HH:00 today — the same number any observer on
              Earth would see at that same instant.
            </li>
          </ul>
        </div>

        <div className="fraction-table-tips">
          <h2>Quick mental tricks</h2>
          <ul>
            <li>
              <strong>Multiply by 24</strong> — the BD-day fraction × 24 is
              the BD-day hour. <code>0.375 × 24 = 9</code>. (BD hours start
              at the J2000.0 anchor instant, so they don&apos;t line up
              with your wall clock.)
            </li>
            <li>
              <strong>Millidays</strong> — three decimals after the dot are
              millidays (1/1000 of a day, ≈ 86.4 s). 0.504 = 504 md.
            </li>
            <li>
              <strong>Microdays</strong> — six decimals are microdays
              (≈ 86.4 ms). Useful for sub-second arithmetic without
              floating-point fights.
            </li>
            <li>
              <strong>One scalar, every observer</strong> — the BD value
              and its fraction are the same for everyone at the same
              instant. The table above shows what your clock&apos;s
              schedule looks like in BD terms today.
            </li>
          </ul>
        </div>
      </motion.div>
    </section>
  );
};

export default FractionTable;
