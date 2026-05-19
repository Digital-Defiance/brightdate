import { motion } from "framer-motion";
import { FC } from "react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import "./SpacePromo.css";

/**
 * Homepage teaser linking to the /space page — frames BrightDate as a spatial standard.
 */
const SpacePromo: FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="space-promo" ref={ref}>
      <motion.div
        className="space-promo-container"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <span className="space-promo-eyebrow">Spatial Standard</span>
        <h2>
          BrightDate extends to a{" "}
          <span className="gradient-text">unified space standard</span>
        </h2>
        <p>
          Explore how BrightDate's constants and units define a spatial
          hierarchy, from planetary to interstellar scales. Discover how
          coordinates, distances, and navigation are unified under the same
          principles that govern time.
        </p>
        <p>
          Learn about the spatial SI hierarchy, coordinate systems, and
          practical applications for navigation, mapping, and mission planning.
        </p>
        <Link to="/space" className="space-promo-cta">
          Explore the Bright Space Standard
          <span className="space-promo-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <a
          href="https://github.brightchain.org/docs/papers/bright-space-standard/"
          target="_blank"
          rel="noopener noreferrer"
          className="space-promo-paper"
        >
          📄 Read the space paper
        </a>
      </motion.div>
    </section>
  );
};

export default SpacePromo;
