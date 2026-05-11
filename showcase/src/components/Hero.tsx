import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaNpm, FaRust, FaTerminal } from "react-icons/fa";
import { fromDate } from "@brightchain/brightdate";
import "./Hero.css";

interface HeroProps {
  scrollY: number;
}

const Hero = ({ scrollY }: HeroProps) => {
  const parallaxOffset = scrollY * 0.5;
  const [liveValue, setLiveValue] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const v = fromDate(new Date());
      setLiveValue(v.toFixed(8));
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero" id="home">
      <div
        className="hero-background"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="particles" />
      </div>

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span className="badge-text">
            🔭 J2000.0 Epoch · 287,000+ Years · Sub-µs Resolution
          </span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          BrightDate
        </motion.h1>

        <motion.h2
          className="hero-subtitle gradient-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          One number. Every language. No timezones.
        </motion.h2>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          BrightDate is a timezone-free decimal time scalar anchored at J2000.0
          — the same epoch used by every space agency and observatory.
          <br />
          One float. Trivially sortable, diffable, and storable.{" "}
          <code>b&nbsp;&minus;&nbsp;a&nbsp;=&nbsp;elapsed days</code> — no
          libraries, no parsing, no surprises.
          <br />
          <span className="hero-highlight">
            🌍 No Timezones · ⏱ Simple Arithmetic · 🚀 Interplanetary Ready · 🔬
            Astronomy Native
          </span>
        </motion.p>

        {liveValue && (
          <motion.div
            className="hero-live"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
          >
            <span className="hero-live-label">Right now:</span>
            <span className="hero-live-value">BD: {liveValue}</span>
          </motion.div>
        )}

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <a
            href="https://www.npmjs.com/package/@brightchain/brightdate"
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaNpm />
            npm install
          </a>
          <a
            href="https://crates.io/crates/brightdate"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaRust />
            cargo add
          </a>
          <a
            href="https://github.com/Digital-Defiance/homebrew-tap"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTerminal />
            brew install
          </a>
          <a
            href="https://github.com/Digital-Defiance/brightdate"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
            View on GitHub
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="mouse">
          <div className="wheel" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
