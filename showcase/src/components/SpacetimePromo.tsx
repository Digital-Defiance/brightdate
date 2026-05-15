import { motion } from "framer-motion";
import { FC } from "react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import "./SpacetimePromo.css";

/**
 * Homepage teaser linking to the /spacetime page — frames BrightDate as the
 * terrestrial slice of a wider c = 1 standard.
 */
const SpacetimePromo: FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="spacetime-promo" ref={ref}>
      <motion.div
        className="spacetime-promo-container"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <span className="spacetime-promo-eyebrow">Beyond Earth</span>
        <h2>
          BrightDate is the terrestrial slice of a{" "}
          <span className="gradient-text">wider c = 1 standard</span>
        </h2>
        <p>
          The same exact-integer constants that define a BrightDay extend
          naturally into space. Set the speed of light to <strong>1</strong>,
          give space and time a single decimal SI hierarchy (μbm → Gbm), anchor
          everything to J2000.0, and suddenly coordinates <em>are</em> latencies
          — useful from cislunar comms to interstellar mission design.
        </p>
        <p>
          Explore the unit hierarchy, the Minkowski metric in Bright form, an
          interactive distance converter, and a live time-dilation demo backed
          by <code>@brightchain/brightdate</code>.
        </p>
        <Link to="/spacetime" className="spacetime-promo-cta">
          Explore the Bright Spacetime Standard
          <span className="spacetime-promo-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <a
          href="https://github.brightchain.org/docs/papers/bright-spacetime-standard/"
          target="_blank"
          rel="noopener noreferrer"
          className="spacetime-promo-paper"
        >
          📄 Read the paper
        </a>
      </motion.div>
    </section>
  );
};

export default SpacetimePromo;
