import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import {
  FaGithub,
  FaHeart,
  FaCode,
  FaRocket,
  FaLightbulb,
  FaStar,
  FaTerminal,
} from "react-icons/fa";
import "./About.css";
import { faStarship } from "@awesome.me/kit-a20d532681/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
          Built with <span className="gradient-text">❤️</span> by Digital
          Defiance
        </h2>
        <p className="about-subtitle">
          Open source. MIT licensed. Built for software engineers and
          scientists.
        </p>

        <div className="about-content">
          <motion.div
            className="about-main card"
            style={{ marginBottom: "1.5rem" }}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <h3 className="about-heading">
              <FontAwesomeIcon icon={faStarship} /> Star Dates &amp; BrightDate
            </h3>
            <p>
              If you’re a Star Trek fan, you’ve probably wondered if there’s a
              formula for stardates. The truth is: <strong>there isn’t</strong>{" "}
              — stardates are famously discontinuous across the series, and even
              within a single show, the numbers jump around with no consistent
              logic. (Trust us, we tried!)
            </p>
            <p>
              <strong>BrightDate</strong> is as close to a real,
              scientifically-grounded stardate as you can get — even though it’s
              “non-canon.” It’s a single, sortable, universal number that
              actually means something: SI days since J2000.0, the epoch used by
              every modern observatory and space agency. If you ever wanted a
              stardate you could use in real code, this is it.
            </p>
          </motion.div>
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
              Timezone handling is not hard to <em>understand</em> — it is hard
              to <em>not forget</em>. Every service boundary, API call, and
              database write is an opportunity to drop the offset or apply the
              wrong one. BrightDate replaces the translation problem with a
              single rule: there is no translation. One float, everywhere.
            </p>
            <p>
              <strong>BrightDate</strong> is a Float64 count of SI days since
              J2000.0 — the standard epoch used by every space agency and
              observatory. Simple subtraction gives elapsed days. Native numeric
              comparison gives sort order. No libraries required. Float64 covers
              287,000+ years with ~190 ns resolution in the current era.
            </p>
            <p className="highlight-text">
              <FaCode /> <strong>100% Open Source.</strong> MIT licensed. Freely
              available, forever.
            </p>
          </motion.div>

          <motion.div
            className="about-main card"
            style={{ marginTop: "1.5rem" }}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="about-heading">
              <FaTerminal /> BSH: BrightDate in the Wild
            </h3>
            <p>
              The best evidence that BrightDate is production-ready is{" "}
              <a
                href="https://bsh.brightchain.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                BSH (BrightShell)
              </a>
              — a fork of zsh 5.10 that wires BrightDate into every time-related
              surface of the shell: the prompt (<code>%P</code>),{" "}
              <code>ls -l</code> timestamps, <code>stat</code> output,{" "}
              <code>history -t</code>, <code>sched</code>, and the{" "}
              <code>$BRIGHTEPOCH</code> parameter. The same float appears
              everywhere. No translation. No format mismatch.
            </p>
            <p>
              BSH uses the <code>brightdate</code> Rust crate at its core,
              statically linked via a minimal C FFI. It is the living proof that
              BrightDate composes cleanly with real-world C codebases — and that
              once every time surface speaks the same number, the cognitive
              overhead of working with timestamps drops to nearly zero.
            </p>

            <h4 className="about-glob-heading">
              Glob time qualifiers — what zsh can't do
            </h4>
            <p>
              Zsh's glob qualifiers (<code>.m</code>, <code>.a</code>,{" "}
              <code>.c</code>) only accept <strong>integer</strong> day counts.
              BSH patches the qualifier engine to accept{" "}
              <strong>fractional decimal-day values</strong> — the same unit as
              BrightDate. One centiday is 864 seconds (~14 minutes), so you can
              filter files with precision that zsh simply cannot express:
            </p>
            <pre className="about-pre">
              <code>{`# zsh: .m-1 means "within 1 day" — can't go finer
# BSH: fractional values work natively
echo *.log(.m-0.05)   # within 0.05 d  (~72 min)
echo *.log(.m-0.01)   # within 1 centiday (~14 min)
echo *.log(.m-0.001)  # within 1 milliday (~86 s)`}</code>
            </pre>
            <p>
              BSH also introduces the <code>.b</code> qualifier — birth time
              (file creation time from <code>st_birthtimespec</code> on macOS
              and BSD). This is entirely absent from upstream zsh.{" "}
              <code>touch</code> can reset <code>mtime</code>; it cannot change
              when a file was <em>born</em>. Combining birth-time filtering with
              fractional precision gives you a tamper-resistant timestamp at the
              filesystem level:
            </p>
            <pre className="about-pre">
              <code>{`$ touch old.log && perl -e 'utime time()-7200, time()-7200, "old.log"'
$ echo *.log(.m-0.01)   # mtime says both are fresh after touch
new.log old.log
$ echo *.log(.b-0.01)   # birthtime never lies — old.log was born 2 h ago
new.log

# Sort all files by creation time, newest first
echo *(ob)
# Today's logs, oldest-first
echo /var/log/*.log(.b-1On)`}</code>
            </pre>
            <p className="about-glob-suffix">
              All suffixes accept fractional values: <code>d</code> (days,
              default), <code>h</code> (hours), <code>m</code> (minutes),{" "}
              <code>s</code> (seconds), <code>w</code> (weeks), <code>M</code>{" "}
              (months).
            </p>

            <p className="about-bsh-challenge">
              The <strong>BSH chsh challenge</strong>: switch your login shell
              for a week. Your prompt, files, history, and scripts all agree on
              one decimal. Once you stop translating, it is hard to go back.
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
              <h4>1035+ Tests</h4>
              <p>
                Property-based and unit tests cover arithmetic identities,
                astronomical correctness, serialization round-trips, and edge
                cases at extreme magnitudes.
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
              <h4>Three Companion Types</h4>
              <p>
                <strong>BrightDate</strong> (Float64) for fast math and
                astronomy. <strong>BrightInstant</strong> (TAI seconds + nanos)
                for exact 1-nanosecond precision at any magnitude — distributed
                systems, GPS, interplanetary timing.{" "}
                <strong>ExactBrightDate</strong> (BigInt picoseconds) for
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
            Star the repo, open an issue, or send a PR. BrightDate is built for
            the development community and thrives on real-world feedback. Need
            something custom?{" "}
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
              href="https://crates.io/crates/brightdate"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaCode />
              Rust crate
            </a>
            <a
              href="https://github.com/Digital-Defiance/homebrew-tap"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaRocket />
              Homebrew tap
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
            {" • "}
            <a
              href="https://crates.io/crates/brightdate"
              target="_blank"
              rel="noopener noreferrer"
            >
              crates.io
            </a>
            {" • "}
            <a
              href="https://github.com/Digital-Defiance/homebrew-tap"
              target="_blank"
              rel="noopener noreferrer"
            >
              Homebrew tap
            </a>
            {" • "}
            <Link to="/support">Support</Link>
            {" • "}
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
