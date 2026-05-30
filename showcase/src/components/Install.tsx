import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaNpm, FaRust, FaTerminal } from "react-icons/fa";
import "./Install.css";

interface CliTool {
  name: string;
  desc: string;
}

interface EcosystemProject {
  emoji: string;
  name: string;
  desc: string;
  tools: readonly CliTool[];
  links: readonly { label: string; href: string }[];
  brew?: string;
}

const PIPELINE_LAYERS = [
  {
    label: "Layer 1",
    title: "BSH",
    body: "Shell prompt %P, $BRIGHTEPOCH, stat, ls -l, TIMEFMT",
  },
  {
    label: "Layer 2",
    title: "brightdate-rust",
    body: "Core library + bdate, btime, buptime, bcal, bwatch",
  },
  {
    label: "Layer 3",
    title: "bright-findutils",
    body: "bfind, blocate, bupdatedb, bxargs",
  },
  {
    label: "Layer 4",
    title: "bright-iputils",
    body: "bping, bclockdiff, btraceroute, bmtr, baudit",
  },
] as const;

const ECOSYSTEM_PROJECTS: readonly EcosystemProject[] = [
  {
    emoji: "🐚",
    name: "BSH — BrightShell",
    desc: "A zsh-compatible shell where BrightDate is woven into every time-related surface — prompt, exported epoch, and built-ins.",
    tools: [
      { name: "prompt %P", desc: "Live BrightDate in the shell line." },
      { name: "$BRIGHTEPOCH", desc: "Exported scalar for downstream b* tools." },
      { name: "stat / ls -l", desc: "File timestamps as decimal BD." },
      { name: "TIMEFMT %d*", desc: "Shell time keyword in millidays." },
    ],
    links: [
      { label: "bsh.brightchain.org", href: "https://bsh.brightchain.org" },
      { label: "GitHub", href: "https://github.com/Digital-Defiance/bsh" },
    ],
    brew: "bsh",
  },
  {
    emoji: "🦀",
    name: "brightdate-rust",
    desc: "Canonical Rust implementation — core library plus CLI replacements for date, time, uptime, cal, and watch.",
    tools: [
      { name: "bdate", desc: "Print today's BrightDate (and friends)." },
      { name: "btime", desc: "Live clock and command timing in BD / md." },
      { name: "buptime", desc: "uptime, but in BrightDate units." },
      { name: "bcal", desc: "A calendar that thinks in BD numbers." },
      { name: "bwatch", desc: "Stopwatch / countdown in BrightDate." },
    ],
    links: [
      { label: "brightdate.org", href: "https://brightdate.org" },
      { label: "crates.io", href: "https://crates.io/crates/brightdate" },
      { label: "GitHub", href: "https://github.com/Digital-Defiance/brightdate-rust" },
    ],
    brew: "bdate btime buptime bcal bwatch",
  },
  {
    emoji: "🔎",
    name: "bright-findutils",
    desc: "GNU findutils re-dressed for BrightDate — new predicates, %W printf, BD -daystart, and colorized output.",
    tools: [
      { name: "bfind", desc: "-after/-before filters, %Wt printf, -daystart." },
      { name: "blocate", desc: "Locate with DB age shown as BrightDate." },
      { name: "bupdatedb", desc: "Rebuild the locate database." },
      { name: "bxargs", desc: "findutils xargs, BrightDate-aware." },
    ],
    links: [
      {
        label: "findutils.digitaldefiance.org",
        href: "https://findutils.digitaldefiance.org",
      },
      { label: "GitHub", href: "https://github.com/Digital-Defiance/bright-findutils" },
    ],
    brew: "bright-findutils",
  },
  {
    emoji: "📡",
    name: "bright-iputils",
    desc: "Networking tools extended with BrightSpace — light-floor, milliday RTT, geo distance, and efficiency scoring.",
    tools: [
      { name: "bping", desc: "ICMP/UDP probes with chord distance and light-floor." },
      { name: "bclockdiff", desc: "Clock skew in BrightDate sub-day units." },
      { name: "btraceroute", desc: "Per-hop geoIP, RTT in md, path comparison." },
      { name: "bmtr", desc: "Continuous probe with rolling efficiency stats." },
      { name: "baudit", desc: "Multi-anchor distance bounding audit." },
    ],
    links: [
      {
        label: "iputils.digitaldefiance.org",
        href: "https://iputils.digitaldefiance.org",
      },
      { label: "GitHub", href: "https://github.com/Digital-Defiance/bright-iputils" },
    ],
    brew: "bright-iputils",
  },
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
          <span className="install-eyebrow">
            find · ping · time · shell — one scalar
          </span>
          <h2>Install the BrightDate universe</h2>
          <p className="install-subtitle">
            One timezone-free decimal day count since J2000.0 — from shell prompt
            to file search, command timing, and network probes. Same semantics in
            TypeScript, Rust, and twenty-plus CLI tools. Pick your layer and ship
            it.
          </p>
          <a
            className="install-hub-link"
            href="https://brightutils.digitaldefiance.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full ecosystem docs at brightutils.digitaldefiance.org →
          </a>
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
              <span className="install-card-tag">Core</span>
            </div>
            <p className="install-card-desc">
              The reference library every <code>b*</code> binary builds on.
              Same float64 / TAI / J2000 semantics — <code>BrightDate</code>,{" "}
              <code>BrightInstant</code>, and exact 1-ns precision. Zero unsafe,
              <code>no_std</code>-friendly core.
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
              <h3>Homebrew stack</h3>
              <span className="install-card-tag">CLIs</span>
            </div>
            <p className="install-card-desc">
              Shell, file tools, networking, and timing utilities — all speaking
              BrightDate. One tap installs the whole pipeline or individual
              formulas.
            </p>
            <div className="install-snippet">
              <span className="prompt">$</span>brew tap digital-defiance/tap
              {"\n"}
              <span className="prompt">$</span>brew install bsh bright-findutils
              bright-iputils
              {"\n"}
              <span className="prompt">$</span>brew install bdate btime buptime
              bcal bwatch
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
                href="https://brightutils.digitaldefiance.org#install"
                target="_blank"
                rel="noopener noreferrer"
              >
                install guide →
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
              The original reference implementation for Node, Deno, and browsers.
              Tree-shakeable ESM with full types — <code>BrightDate</code>,{" "}
              <code>BrightInstant</code>, <code>ExactBrightDate</code>, plus
              BrightSpace geodesy.
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
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Four layers, one scalar</h3>
          <p className="install-tools-sub">
            Every tool shares J2000.0 / TAI semantics from{" "}
            <code>brightdate-rust</code>. Pipe them together — no translation
            step between your prompt, logs, and probes.
          </p>
          <div className="install-pipeline">
            {PIPELINE_LAYERS.map((layer) => (
              <div className="install-pipeline-step" key={layer.title}>
                <div className="install-pipeline-label">{layer.label}</div>
                <div className="install-pipeline-title">{layer.title}</div>
                <p>{layer.body}</p>
              </div>
            ))}
          </div>
          <div className="install-snippet install-stack-snippet">
            <span className="comment">
              # correlate file mtime, command timing, and network RTT
            </span>
            {"\n"}
            <span className="prompt">$</span> now=$BRIGHTEPOCH
            {"\n"}
            <span className="prompt">$</span> bfind . -after $now -name
            &apos;*.rs&apos; -printf &apos;%Wt %p\n&apos; | head -2
            {"\n"}
            <span className="prompt">$</span> btime -f &apos;%Wt %dE md&apos;
            cargo test -q
            {"\n"}
            <span className="prompt">$</span> bping -c 1 8.8.8.8
          </div>
        </motion.div>

        <motion.div
          className="install-ecosystem"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h3>The full tool stack</h3>
          <p className="install-tools-sub">
            <code>brew install digital-defiance/tap/&lt;formula&gt;</code> — or{" "}
            <code>cargo install &lt;tool&gt;</code> for individual binaries.
          </p>
          <div className="install-ecosystem-grid">
            {ECOSYSTEM_PROJECTS.map((project) => (
              <article className="install-ecosystem-card" key={project.name}>
                <div className="install-ecosystem-head">
                  <span className="install-ecosystem-emoji">{project.emoji}</span>
                  <h4>{project.name}</h4>
                </div>
                <p className="install-ecosystem-desc">{project.desc}</p>
                <div className="tools-grid">
                  {project.tools.map((tool) => (
                    <div className="tool-card" key={tool.name}>
                      <div className="tool-name">{tool.name}</div>
                      <div className="tool-desc">{tool.desc}</div>
                    </div>
                  ))}
                </div>
                {project.brew ? (
                  <div className="install-ecosystem-brew">
                    <span className="install-ecosystem-brew-label">brew</span>
                    <code>brew install {project.brew}</code>
                  </div>
                ) : null}
                <div className="install-card-links">
                  {project.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="install-tools install-btime"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>btime: in color</h3>
          <p className="install-tools-sub">
            Interactive tools share a consistent <code>--color</code> model —
            BrightDate integers, fractional parts, and CPU heat each get distinct
            hues so you can scan logs at a glance. Piped output stays plain for
            scripts.
          </p>
          <div className="install-btime-shot">
            <img
              src="/btime-screenshot.png"
              title="btime screenshot"
              alt="btime colorized timing report in the terminal"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Install;
