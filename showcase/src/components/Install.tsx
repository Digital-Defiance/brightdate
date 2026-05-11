import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaNpm, FaRust, FaTerminal } from "react-icons/fa";
import "./Install.css";

interface CliTool {
  name: string;
  desc: string;
}

const CLI_TOOLS: CliTool[] = [
  { name: "bdate", desc: "Print today's BrightDate (and friends)." },
  { name: "btime", desc: "Live BrightDate clock for your terminal." },
  { name: "buptime", desc: "uptime, but in BrightDate units." },
  { name: "bcal", desc: "A calendar that thinks in BD numbers." },
  { name: "bwatch", desc: "Stopwatch / countdown in BrightDate." },
];

const Install = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section className="install section" id="install" ref={ref}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="container"
      >
        <div className="install-header">
          <span className="install-eyebrow">Now on Rust 🦀 + Homebrew 🍺</span>
          <h2>Install BrightDate everywhere</h2>
          <p className="install-subtitle">
            Same universal epoch, three native ecosystems. Pick your poison —
            ship it in TypeScript, embed it in Rust, or just{" "}
            <code>brew install</code> the CLI and read the time off your
            terminal.
          </p>
        </div>

        <div className="install-grid">
          <motion.div
            className="install-card rust"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="install-card-head">
              <span className="install-card-icon">
                <FaRust />
              </span>
              <h3>Rust crate</h3>
              <span className="install-card-tag">New</span>
            </div>
            <p className="install-card-desc">
              A pure-Rust port with the same float64 / TAI / J2000 semantics.
              Ships <code>BrightDate</code> + <code>BrightInstant</code> (exact
              1-ns precision). Zero unsafe, <code>no_std</code>-friendly core,
              perfect for embedded and astronomy work.
            </p>
            <div className="install-snippet">
              <span className="prompt">$</span>cargo add brightdate
            </div>
            <div className="install-snippet">
              <span className="comment">// in your Rust code</span>
              {"\n"}
              <span className="comment">use</span> brightdate::BrightDate;
              {"\n"}
              <span className="comment">let</span> bd = BrightDate::now();
            </div>
            <div className="install-card-links">
              <a
                href="https://crates.io/crates/brightdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                crates.io →
              </a>
              <a
                href="https://docs.rs/brightdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                docs.rs →
              </a>
              <a
                href="https://github.com/Digital-Defiance/brightdate-rust"
                target="_blank"
                rel="noopener noreferrer"
              >
                source →
              </a>
            </div>
          </motion.div>

          <motion.div
            className="install-card brew"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="install-card-head">
              <span className="install-card-icon">
                <FaTerminal />
              </span>
              <h3>Homebrew CLIs</h3>
              <span className="install-card-tag">New</span>
            </div>
            <p className="install-card-desc">
              Five tiny command-line tools — clock, calendar, uptime, stopwatch
              — all speaking BrightDate. One tap, one brew, you're in.
            </p>
            <div className="install-snippet">
              <span className="prompt">$</span>brew tap digital-defiance/tap
              {"\n"}
              <span className="prompt">$</span>brew install
              digital-defiance/tap/bdate
              {"\n"}
              <span className="prompt">$</span>bdate
              {"\n"}
              <span className="comment"># 9627.0123…</span>
            </div>
            <div className="install-card-links">
              <a
                href="https://github.com/Digital-Defiance/homebrew-tap"
                target="_blank"
                rel="noopener noreferrer"
              >
                Homebrew tap →
              </a>
              <a
                href="https://crates.io/crates/bdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                cargo install →
              </a>
            </div>
          </motion.div>

          <motion.div
            className="install-card npm"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="install-card-head">
              <span className="install-card-icon">
                <FaNpm />
              </span>
              <h3>TypeScript / JS</h3>
            </div>
            <p className="install-card-desc">
              The original reference implementation. Tree-shakeable ESM, full
              types, runs everywhere JS runs. Ships <code>BrightDate</code>,
              <code>BrightInstant</code>, and <code>ExactBrightDate</code> for
              every precision regime.
            </p>
            <div className="install-snippet">
              <span className="prompt">$</span>npm install
              @brightchain/brightdate
            </div>
            <div className="install-snippet">
              <span className="comment">// works in Node, Deno, browsers</span>
              {"\n"}
              <span className="comment">import</span> {"{ BrightDate }"}{" "}
              <span className="comment">from</span>{" "}
              <span>"@brightchain/brightdate"</span>;{"\n"}
              <span className="comment">const</span> bd = BrightDate.now();
            </div>
            <div className="install-card-links">
              <a
                href="https://www.npmjs.com/package/@brightchain/brightdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                npm →
              </a>
              <a
                href="https://github.com/Digital-Defiance/brightdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                source →
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="install-tools"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h3>Five CLI tools, one tap 🍺</h3>
          <p className="install-tools-sub">
            <code>brew install digital-defiance/tap/&lt;tool&gt;</code> — or{" "}
            <code>cargo install &lt;tool&gt;</code> if you're already a
            Rustacean.
          </p>
          <div className="tools-grid">
            {CLI_TOOLS.map((tool) => (
              <div className="tool-card" key={tool.name}>
                <div className="tool-name">{tool.name}</div>
                <div className="tool-desc">{tool.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Install;
