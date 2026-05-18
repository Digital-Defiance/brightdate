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
import BrightDateIcon from "./BrightDateIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PBD } from "./PBD";

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
              <BrightDateIcon
                height={42}
                width={42}
                fill={"#00ff88"}
                style={{ verticalAlign: "-0.4em" }}
              />{" "}
              Why BrightDate?
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
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            <h3 className="about-heading">
              <FaCode /> PBD — Pre-BrightDate Eras
            </h3>
            <p>
              BrightDate is anchored at J2000.0, so anything before{" "}
              <code>2000-01-01T11:58:55.816Z</code> is mathematically a negative
              scalar. Negatives are fine for the CPU, but they are a usability
              footgun — sign flips, off-by-one bugs in formatters, and "is&nbsp;
              <code>−2.5×10¹²</code> before or after <code>−1.4×10¹²</code>?"
              confusion at deep-time scales.
            </p>
            <p>
              Instead of an unbounded negative line, BrightDate{" "}
              <strong>pages</strong> the pre-epoch timeline into{" "}
              <strong>Tera-second blocks</strong> (10¹² SI&nbsp;seconds ≈ 31,710
              Julian years each) called <strong>PBD eras</strong> (
              <em>Pre-BrightDate, era N</em>). The first step past J2000.0
              enters <code>PBD1</code>; each further Tera-second backward bumps
              the era index by one.{" "}
              <strong>
                All of recorded human history (3000 BC to now) sits inside{" "}
                <code>PBD1</code>.
              </strong>{" "}
              The Big Bang lands somewhere around <code>PBD435,000</code> —
              still well inside <code>Number.MAX_SAFE_INTEGER</code>, no
              floating-point heroics required.
            </p>
            <p>
              The current era — J2000.0 and everything after it — is
              <em>not</em> paged. It stays a plain signed{" "}
              <strong>BD scalar</strong>. There is no <code>PBD0</code>: the
              “Pre-” in PBD would be a contradiction. BD covers the future
              forever; PBD<em>N</em> (with <code>N ≥ 1</code>) labels the past
              in human-friendly Tera-Bright chunks.
            </p>
            <h4 className="about-glob-heading">
              SI-Metric alignment — the Tera-Bright
            </h4>
            <p>
              PBD math is done in <strong>Bright-seconds (bs)</strong>, where
              one bs equals one SI second — the same canonical unit shared with{" "}
              <strong>BrightSpacetime</strong> and{" "}
              <strong>BrightInstant</strong>. One <strong>Tera-Bright</strong> (
              <code>1&nbsp;Ts</code>) is simultaneously:
            </p>
            <ul className="about-pbd-rules">
              <li>
                <strong>Time:</strong>{" "}
                <code>10¹²&nbsp;s ≈ 31,710 Julian years</code> — exactly one PBD
                page.
              </li>
              <li>
                <strong>Distance:</strong>{" "}
                <code>1&nbsp;Tera-light-second ≈ 0.0317&nbsp;ly</code> — the
                volume of space light fills in one Tera-second.
              </li>
            </ul>
            <p>
              Because the same SI prefix lineage governs both axes, a{" "}
              <code>PBDN</code> label isn't a random bucket — it's a{" "}
              <strong>Giga-light-second volume of history</strong>: 10¹² seconds
              long, 10¹² light-seconds wide, anchored to the same
              <code>&nbsp;J2000.0</code> zero point used by BrightSpacetime.
            </p>
            <h4 className="about-glob-heading">
              Dual-mode standard — scalar for machines, PBD for humans
            </h4>
            <p>
              The same way latitude is always a signed float at the machine
              level (<code>−122.23</code>) but a directional suffix in print (
              <code>122.23°&nbsp;W</code>), BrightDate keeps two interoperable
              views of the same instant.{" "}
              <strong>The signed scalar is canonical and always valid.</strong>{" "}
              PBD is purely a human-readable layer.
            </p>
            <table className="about-pbd-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Format</th>
                  <th>Use case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Scalar</strong> (canonical)
                  </td>
                  <td>
                    <code>−1,826,250&nbsp;BD</code> (days)
                  </td>
                  <td>
                    APIs, databases, physics, logic, sort keys, deltas — plain
                    subtraction works
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Label</strong> (BD / PBD)
                  </td>
                  <td>
                    <code>9,635&nbsp;BD</code> or{" "}
                    <code>PBD1:&nbsp;842000000000.000</code>
                  </td>
                  <td>
                    UI, history books, conversation, labels, indexes — library
                    unfolds to scalar before doing math
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              If you only need the math, keep using the signed scalar. Negative
              BrightDate values are first-class and will remain so forever. If a
              downstream system has never heard of PBD, it still receives a
              perfectly valid signed Float64 —{" "}
              <strong>graceful degradation by construction</strong>.
            </p>
            <pre className="about-pre">
              <code>{`Let  T = 1,000,000,000,000 s  (one Tera-Bright ≈ 31,710 years)

BD    →  raw [    0, +∞)              J2000.0 → forever        (plain scalar)
PBD1  →  raw (   −T,  0)              ~29,710 BC → J2000.0
PBD2  →  raw (  −2T, −T]              ~61,420 BC → ~29,710 BC
PBDN  →  raw (−N·T, −(N−1)·T]         ~31,710 years per page  (N ≥ 1)

pageValue   = rawSeconds + N · T     // always in (0, T]
rawSeconds  = pageValue   − N · T    // perfectly lossless`}</code>
            </pre>
            <h4 className="about-glob-heading">
              The Zero-Point Handshake — keeping the math pure
            </h4>
            <p>
              The canonical representation is <strong>always</strong> the signed
              scalar. The <code>(era, page)</code> tuple is generated at format
              time and parsed at input time — exactly the way Unix timestamps
              relate to <code>toISOString()</code>.
            </p>
            <p>Three rules keep deltas honest:</p>
            <ol className="about-pbd-rules">
              <li>
                <strong>
                  One timeline, always increasing toward the future.
                </strong>{" "}
                Within <em>any</em> era, a larger page value is <em>later</em>.
                In <code>PBD1</code>, page <code>999,999,999,999</code> is one
                second before J2000.0 (raw <code>−1</code>); page <code>1</code>{" "}
                is almost a full Tera-second before J2000.0. Numbers do{" "}
                <em>not</em> count backwards in pre-epoch eras — this is the
                opposite of BC labeling, and the reason BC dates break every
                library that touches them.
              </li>
              <li>
                <strong>Boundaries are half-open with closed upper.</strong>{" "}
                <code>BD&nbsp;=&nbsp;[0,&nbsp;+∞)</code>,{" "}
                <code>PBD1&nbsp;=&nbsp;(−T,&nbsp;0)</code>,{" "}
                <code>PBDN&nbsp;=&nbsp;(−N·T,&nbsp;−(N−1)·T]</code>. The exact
                boundary <code>−k·T</code> is the <em>last instant</em> of{" "}
                <code>PBD(k+1)</code> (page&nbsp;<code>T</code>). Exactly one
                canonical label for every scalar — no “Year Zero” ambiguity.
              </li>
              <li>
                <strong>Deltas use the scalar, not the page.</strong>{" "}
                <code>Δt = raw_a − raw_b</code>. <em>Never</em>{" "}
                <code>pageA − pageB</code> — subtracting page values across an
                era boundary silently drops a Tera-second jump.
              </li>
            </ol>
            <p>
              The corollary you have to be comfortable with:{" "}
              <strong>
                PBD<em>N</em> values sit “lower on the timeline” than BD values
              </strong>{" "}
              even though their page numbers can look enormous. Comparing{" "}
              <code>PBD1:&nbsp;999,999,999,999</code> to <code>1&nbsp;BD</code>{" "}
              resolves to <code>PBD1 &lt; BD</code> — because{" "}
              <code>−1 &lt; 1</code>. Sort ascending by time = BD first, then
              PBD by era <em>descending</em>, then page <em>ascending</em>.
            </p>
            <pre className="about-pre">
              <code>{`import { toBrightLabel, fromBrightLabel, brightDateToLabel } from "@brightchain/brightdate";

// Unified label: BD for t ≥ 0, PBD for t < 0.
toBrightLabel(0)                    // { kind: "BD",  seconds: 0 }
toBrightLabel(1)                    // { kind: "BD",  seconds: 1 }
toBrightLabel(-1)                   // { kind: "PBD", era: 1, page: 999_999_999_999 }
toBrightLabel(-1_000_000_000_000)   // { kind: "PBD", era: 2, page: 1_000_000_000_000 }

// 3000 BC ≈ -5000 Julian years × 31,557,600 s
toBrightLabel(-157_788_000_000)     // { kind: "PBD", era: 1, page: ≈ 842_212_000_000 }

fromBrightLabel({ kind: "PBD", era: 1, page: 999_999_999_999 })  // -1

// BrightDate (days) → label is wired up for you
brightDateToLabel(BrightDate.fromValue(-1_826_250))
// → { kind: "PBD", era: 1, page: ≈ 842_212_000_000 }

// Comparison across the BD/PBD divide
function isLater(a, b) {
  if (a.kind !== b.kind) return a.kind === "BD";        // any BD > any PBD
  if (a.kind === "BD") return a.seconds > b.seconds;
  if (a.era !== b.era) return a.era < b.era;            // smaller era = later
  return a.page > b.page;                                // within era, larger = later
}`}</code>
            </pre>

            <h4 className="about-glob-heading">
              Live demo — walk 27.6 billion years on a single slider
            </h4>
            <p>
              The slider is signed-log around <strong>J2000.0</strong>: drag
              left into the past, right into the future. Watch the label flip
              between <code>BD</code> (current era) and{" "}
              <code>
                PBD<em>N</em>
              </code>{" "}
              (paged past), and the era index climb as you cross each
              Tera-Bright boundary. Preset buttons jump to canonical anchors.
            </p>
            <div className="about-pbd-demo">
              <div className="about-pbd-demo-item">
                <span className="about-pbd-demo-caption">
                  Interactive — drag the slider
                </span>
                <PBD />
              </div>
              <div className="about-pbd-demo-item">
                <span className="about-pbd-demo-caption">
                  ~3000 BC — start of recorded history
                </span>
                <PBD value={-1_835_946} />
              </div>
              <div className="about-pbd-demo-item">
                <span className="about-pbd-demo-caption">
                  ~66 Myr ago — K–Pg extinction
                </span>
                <PBD value={-24_106_500_000} />
              </div>
              <div className="about-pbd-demo-item">
                <span className="about-pbd-demo-caption">
                  ~13.8 Gyr ago — the Big Bang
                </span>
                <PBD value={-5_040_450_000_000} />
              </div>
            </div>

            <p className="about-bsh-challenge">
              <strong>Status:</strong> PBD-N ships in the next minor release
              with full <code>toPBD</code> / <code>fromPBD</code> /{" "}
              <code>toExactPBD</code> (BigInt picosecond) support and the{" "}
              <code>pbd</code> serialization key. The signed scalar remains
              canonical — PBD is an additional view, never a replacement.
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
                href="https://bsh.digitaldefiance.org"
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
