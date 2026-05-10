import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaGithub,
  FaHeart,
  FaCode,
  FaRocket,
  FaLightbulb,
  FaStar,
} from "react-icons/fa";
import "./About.css";

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="about section" id="about" ref={ref}>
      <motion.div
        className="about-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Built with <span className="gradient-text">❤️</span> by Digital Defiance
        </h2>
        <p className="about-subtitle">
          Open source. MIT licensed. Built for software engineers and scientists.
        </p>

        <div className="about-content">
          <motion.div
            className="about-main card"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="about-heading">
              <FaRocket /> Why BrightDate?
            </h3>
            <p>
              Timestamps are one of the most mishandled data types in software. Timezone confusion,
              DST bugs, leap-second ambiguity, sort-order hacks — they're all symptoms of the same
              underlying problem: no single, universal reference point.
            </p>
            <p>
              <strong>BrightDate</strong> solves this with one scalar number anchored at J2000.0 —
              the same epoch astronomers have used for decades. Float64 covers 287,000+ years
              with sub-microsecond resolution in the current era. Simple subtraction gives elapsed
              days. Native numeric comparison gives sort order. No libraries required.
            </p>
            <p className="highlight-text">
              <FaCode /> <strong>100% Open Source.</strong> MIT licensed.
              Freely available, forever.
            </p>
          </motion.div>

          <div className="about-features">
            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaHeart />
              </div>
              <h4>Open Source First</h4>
              <p>
                MIT licensed and community-driven. Every line of code is open
                for inspection, improvement, and contribution.
              </p>
            </motion.div>

            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaCode />
              </div>
              <h4>985+ Tests</h4>
              <p>
                Property-based and unit tests cover arithmetic identities,
                astronomical correctness, serialization round-trips, and
                edge cases at extreme magnitudes.
              </p>
            </motion.div>

            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaStar />
              </div>
              <h4>Two Companion Types</h4>
              <p>
                <strong>BrightDate</strong> (Float64) for fast math and astronomy.
                <strong> ExactBrightDate</strong> (BigInt picoseconds) for
                bit-exact storage boundaries where lossless round-trips matter.
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="about-cta"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h3>Get Involved</h3>
          <p>
            Star the repo, open an issue, or send a PR. BrightDate is built for the
            development community and thrives on real-world feedback. Need something
            custom?{" "}
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Digital Defiance
            </a>{" "}
            about maintenance contracts.
          </p>
          <div className="cta-buttons">
            <a
              href="https://www.npmjs.com/package/@brightchain/brightdate"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FaRocket />
              Install from npm
            </a>
            <a
              href="https://github.com/Digital-Defiance/brightdate"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaGithub />
              View on GitHub
            </a>
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaLightbulb />
              Digital Defiance
            </a>
          </div>
        </motion.div>

        <div className="about-footer">
          <p>
            © {new Date().getFullYear()} Digital Defiance. Made with{" "}
            <span className="heart">❤️</span> for the development community.
          </p>
          <p className="footer-links">
            <a
              href="https://github.com/Digital-Defiance/brightdate/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
            {" • "}
            <a
              href="https://github.com/Digital-Defiance/brightdate"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {" • "}
            <a
              href="https://www.npmjs.com/package/@brightchain/brightdate"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
