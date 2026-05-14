import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaGithub, FaGooglePlay } from "react-icons/fa";
import "./Apps.css";

interface AppEntry {
  id: string;
  name: string;
  headline: string;
  description: string;
  png: string;
  svg: string;
  repoUrl: string;
  googlePlayUrl: string;
}

const APPS: AppEntry[] = [
  {
    id: "wearos",
    name: "Google Wear OS Watch Face",
    headline: "BrightDate on your wrist",
    description:
      "A declarative Wear OS watch face that shows local time and live BrightDate, with theme options and complication support.",
    png: "/apps/wearos-feature-graphic.png",
    svg: "/apps/wearos-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-android-wearos",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.brightchain.brightdate",
  },
  {
    id: "widget",
    name: "Dash Widget",
    headline: "Fast glance, zero friction",
    description:
      "A minimal Android home-screen widget that keeps BrightDate visible at a glance with lightweight, battery-aware updates.",
    png: "/apps/widget-feature-graphic.png",
    svg: "/apps/widget-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-android-widget",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.brightchain.brightdate.widget",
  },
  {
    id: "alarm",
    name: "Alarm Clock",
    headline: "Schedule in BrightDate",
    description:
      "A full Android alarm app using BrightDate as native time, including alarm scheduling, snooze controls, widget support, and conversions.",
    png: "/apps/alarm-feature-graphic.png",
    svg: "/apps/alarm-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-android-alarm",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.brightchain.brightdate.alarm",
  },
];

const Apps = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section className="apps section" id="apps" ref={ref}>
      <motion.div
        className="apps-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          BrightDate <span className="gradient-text">Apps</span>
        </h2>
        <p className="apps-subtitle">
          Three production Android experiences built around the same universal
          time model.
        </p>

        <div className="apps-grid">
          {APPS.map((app, index) => (
            <motion.article
              key={app.id}
              className="apps-card card"
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <div className="apps-media-wrap">
                <picture>
                  <source srcSet={app.svg} type="image/svg+xml" />
                  <img
                    className="apps-media"
                    src={app.png}
                    alt={`${app.name} feature graphic`}
                    loading="lazy"
                  />
                </picture>
              </div>

              <div className="apps-content">
                <h3>{app.name}</h3>
                <p className="apps-headline">{app.headline}</p>
                <p className="apps-description">{app.description}</p>
                <div className="apps-links">
                  <a
                    className="apps-link"
                    href={app.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub aria-hidden="true" />
                    <span>GitHub</span>
                  </a>
                  <a
                    className="apps-link"
                    href={app.googlePlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGooglePlay aria-hidden="true" />
                    <span>Google Play</span>
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Apps;
