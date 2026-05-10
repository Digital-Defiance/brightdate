import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "./Features.css";

interface Feature {
  problem: string;
  solution: string;
  emoji: string;
}

const FEATURES: Feature[] = [
  {
    emoji: "🌍",
    problem: "Timezone confusion",
    solution: "Single universal value — no zones, no offsets, no DST surprises.",
  },
  {
    emoji: "⏱️",
    problem: "Leap second ambiguity",
    solution: "TAI mode gives you a fully monotonic timeline with zero stutters.",
  },
  {
    emoji: "➕",
    problem: "Complex date arithmetic",
    solution: "Simple subtraction: b − a = elapsed days. No libraries needed.",
  },
  {
    emoji: "🔢",
    problem: "Sort / compare complexity",
    solution: "Float64 sorts natively. v2 sortable-string encoding handles mixed-sign indexes.",
  },
  {
    emoji: "📅",
    problem: "2038 Unix timestamp problem",
    solution: "Float64 covers 287,000+ years with sub-µs resolution in the current era.",
  },
  {
    emoji: "⛓️",
    problem: "Blockchain / archival fidelity",
    solution: "ExactBrightDate (BigInt picoseconds) gives bit-exact Unix-ms round-trips.",
  },
  {
    emoji: "🚀",
    problem: "Interplanetary coordination",
    solution: "One universal reference epoch works across the entire solar system.",
  },
  {
    emoji: "🔭",
    problem: "Astronomy integration",
    solution: "Native JD / MJD / GMST / lunar phase support. J2000.0 is the astronomer's epoch.",
  },
];

const Features = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section className="features section" id="features" ref={ref}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Why <span className="gradient-text">BrightDate</span>?
        </h2>
        <p className="features-subtitle">
          Every feature exists to solve a real engineering pain point.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.problem}
              className="features-card card"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.5 }}
            >
              <div className="features-emoji">{f.emoji}</div>
              <div className="features-problem">{f.problem}</div>
              <div className="features-arrow">→</div>
              <div className="features-solution">{f.solution}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="features-precision"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h3>Precision at a Glance</h3>
          <div className="precision-table-wrap">
            <table className="precision-table">
              <thead>
                <tr>
                  <th>Era</th>
                  <th>BD magnitude</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>J2000.0 epoch</td>
                  <td className="mono">0</td>
                  <td>sub-yoctosecond</td>
                </tr>
                <tr>
                  <td>Current era (~2026)</td>
                  <td className="mono">~9 500</td>
                  <td>~190 ns</td>
                </tr>
                <tr>
                  <td>Year 2273</td>
                  <td className="mono">~100 000</td>
                  <td>~1.9 µs</td>
                </tr>
                <tr>
                  <td>Year 4737</td>
                  <td className="mono">~1 000 000</td>
                  <td>~19 µs</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="features-precision-note">
            For workloads requiring bit-exact Unix-ms round-trips at any era,
            use <strong>ExactBrightDate</strong> (BigInt picoseconds).
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Features;
