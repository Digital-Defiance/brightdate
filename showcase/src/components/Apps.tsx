import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaAppStoreIos,
  FaGithub,
  FaGooglePlay,
  FaSearchPlus,
  FaTimes,
} from "react-icons/fa";
import "./Apps.css";

interface AppEntry {
  id: string;
  name: string;
  headline: string;
  description: string;
  png: string;
  svg: string;
  repoUrl: string;
  googlePlayUrl?: string;
  appleStoreUrl?: string;
  zoom?: string;
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
    zoom: "/apps/wearos-screenshot.png",
  },
  {
    id: "wearos-lcars",
    name: "Google Wear OS LCARS Watch Face",
    headline: "BrightDate on your wrist, Star Trek style",
    description:
      "A declarative Wear OS watch face that shows local time and live BrightDate, with various Star Trek theme options and complication support.",
    png: "/apps/wearos-lcars-feature-graphic.png",
    svg: "/apps/wearos-lcars-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-wearos-lcars.git",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.digitaldefiance.brightdate.lcars",
    zoom: "/apps/wearos-lcars-screenshot.png",
  },
  {
    id: "widget",
    name: "Android Dash Widget",
    headline: "Fast glance, zero friction",
    description:
      "A minimal Android home-screen widget that keeps BrightDate visible at a glance with lightweight, battery-aware updates.",
    png: "/apps/widget-feature-graphic.png",
    svg: "/apps/widget-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-android-widget",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.brightchain.brightdate.widget",
    zoom: "/apps/android-widget-screenshot.png",
  },
  {
    id: "alarm",
    name: "Android Alarm Clock",
    headline: "Schedule in BrightDate",
    description:
      "A full Android alarm app using BrightDate as native time, including alarm scheduling, snooze controls, widget support, and conversions.",
    png: "/apps/alarm-feature-graphic.png",
    svg: "/apps/alarm-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-android-alarm",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=org.brightchain.brightdate.alarm",
    zoom: "/apps/android-alarm-screenshot.png",
  },
  {
    id: "apple-statusbar",
    name: "MacOS Status Bar",
    headline: "BrightDate in your menu bar",
    description:
      "A simple MacOS status bar app that shows the current BrightDate",
    png: "/apps/apple-statusbar-feature-graphic.png",
    svg: "/apps/apple-statusbar-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-macos-statusbar",
    // appleStoreUrl:
    //   "https://apps.apple.com/us/app/brightdate-status-bar/id6769225145?mt=12",
    zoom: "/apps/apple-statusbar-screenshot.png",
  },
  {
    id: "apple-widget",
    name: "MacOS/IOS Widget",
    headline: "BrightDate on your desktop and home screen",
    description:
      "A simple MacOS and IOS widget that shows the current BrightDate on your desktop or home screen.",
    png: "/apps/widget-feature-graphic.png",
    svg: "/apps/widget-feature-graphic.svg",
    repoUrl: "https://github.com/Digital-Defiance/brightdate-apple-widget",
    // appleStoreUrl:
    //   "https://apps.apple.com/us/app/brightdate-apple-widget/id6769260250?mt=12",
    zoom: "/apps/apple-widget-screenshot.png",
  },
];

const Apps = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });
  const [zoomedApp, setZoomedApp] = useState<AppEntry | null>(null);

  useEffect(() => {
    if (!zoomedApp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedApp(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomedApp]);

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
          Four production Android experiences built around the same universal
          time model.
        </p>
        <p className="apps-subtitle">
          Two Apple/IOS apps are also in development, coming soon.
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
                {app.zoom ? (
                  <button
                    type="button"
                    className="apps-media-button"
                    onClick={() => setZoomedApp(app)}
                    aria-label={`View larger screenshot of ${app.name}`}
                  >
                    <picture>
                      <source srcSet={app.svg} type="image/svg+xml" />
                      <img
                        className="apps-media"
                        src={app.png}
                        alt={`${app.name} feature graphic`}
                        loading="lazy"
                      />
                    </picture>
                    <span className="apps-media-zoom-hint" aria-hidden="true">
                      <FaSearchPlus />
                      <span>Click to zoom</span>
                    </span>
                  </button>
                ) : (
                  <picture>
                    <source srcSet={app.svg} type="image/svg+xml" />
                    <img
                      className="apps-media"
                      src={app.png}
                      alt={`${app.name} feature graphic`}
                      loading="lazy"
                    />
                  </picture>
                )}
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
                  {app.googlePlayUrl && (
                    <a
                      className="apps-link"
                      href={app.googlePlayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaGooglePlay aria-hidden="true" />
                      <span>Google Play</span>
                    </a>
                  )}
                  {app.appleStoreUrl && (
                    <a
                      className="apps-link"
                      href={app.appleStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaAppStoreIos aria-hidden="true" />
                      <span>Apple Store</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {zoomedApp && zoomedApp.zoom && (
          <motion.div
            className="apps-zoom-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoomedApp(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${zoomedApp.name} screenshot`}
          >
            <motion.div
              className="apps-zoom-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="apps-zoom-close"
                onClick={() => setZoomedApp(null)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
              <img
                src={zoomedApp.zoom}
                alt={`${zoomedApp.name} screenshot`}
                className="apps-zoom-image"
              />
              <p className="apps-zoom-caption">{zoomedApp.name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Apps;
