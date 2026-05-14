import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaHeart,
  FaInfoCircle,
  FaMobileAlt,
  FaCode,
  FaEnvelopeOpenText,
} from "react-icons/fa";
import "./Support.css";

const Support = () => {
  return (
    <section className="support section" id="support">
      <title>Support - BrightDate</title>
      <meta
        name="description"
        content="Support information for BrightDate and other Digital Defiance projects. Best-effort community support; no warranty or guarantee of any kind."
      />
      <meta property="og:title" content="Support - BrightDate" />
      <meta
        property="og:description"
        content="Digital Defiance is a non-profit. We make a best-effort to respond to support requests for our open-source libraries, apps, and widgets."
      />
      <motion.div
        className="support-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="support-back">
          ← Back to BrightDate
        </Link>

        <header className="support-header">
          <h1 className="section-title">
            <span className="gradient-text">Support</span>
          </h1>
          <p className="support-subtitle">
            How we help, and what we can (and can't) promise.
          </p>
        </header>

        {/* Non-profit banner */}
        <div className="support-banner">
          <div className="support-banner-icon">
            <FaHeart />
          </div>
          <div className="support-banner-text">
            <h2>Digital Defiance is a non-profit.</h2>
            <p>
              Everything we publish — libraries, CLIs, apps, widgets, watch
              faces, and utilities — is built and maintained by volunteers and
              released as open source. We have limited resources, but we care
              deeply about the people who use our work, and we will do our best
              to help.
            </p>
          </div>
        </div>

        {/* As-is */}
        <div className="support-section">
          <h2>
            <FaInfoCircle /> Provided as-is, for everyone
          </h2>
          <p>
            All Digital Defiance code, apps, widgets, utilities, libraries, and
            related materials are provided to users free of charge and{" "}
            <strong>as-is</strong>. We make{" "}
            <strong>
              no warranty, guarantee, or representation of any kind
            </strong>{" "}
            — express or implied — including but not limited to merchantability,
            fitness for a particular purpose, accuracy, reliability,
            availability, or non-infringement. Use of our software is entirely
            at your own risk.
          </p>
          <p>
            The full legal terms are spelled out in the MIT License (or the
            applicable license file) bundled with each project.
          </p>
        </div>

        {/* Best effort */}
        <div className="support-section">
          <h2>
            <FaEnvelopeOpenText /> Best-effort support
          </h2>
          <p>
            We make a sincere best-effort to respond to support requests, bug
            reports, and questions — but because we are a small non-profit run
            on volunteer time, we cannot promise a response time, a fix, or any
            specific outcome. Please be patient and kind; a clear, reproducible
            report goes a long way.
          </p>
          <p>
            The fastest way to reach us is by opening an issue on the relevant
            project's GitHub repository. We monitor those continuously and
            triage as time allows.
          </p>
          <ul>
            <li>
              <a
                href="https://github.com/Digital-Defiance/brightdate/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                BrightDate issue tracker
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Digital-Defiance"
                target="_blank"
                rel="noopener noreferrer"
              >
                All Digital Defiance projects on GitHub
              </a>
            </li>
          </ul>
        </div>

        {/* App store apps */}
        <div className="support-section">
          <h2>
            <FaMobileAlt /> Apps on the App Store &amp; Google Play
          </h2>
          <p>
            Problems with apps we publish to the Apple App Store or Google Play
            Store will be addressed as soon as reasonably possible, when
            possible. Mobile platforms occasionally introduce changes outside of
            our control (OS updates, API deprecations, store policy changes)
            that may delay or prevent a fix — we'll do what we can within those
            constraints.
          </p>
          <p>When reporting an app issue, please include:</p>
          <ul>
            <li>The exact app name and version</li>
            <li>Your device model and OS version</li>
            <li>A clear description of what happened and what you expected</li>
            <li>Steps to reproduce, if possible</li>
            <li>Screenshots or screen recordings, if relevant</li>
          </ul>
        </div>

        {/* Open source */}
        <div className="support-section">
          <h2>
            <FaCode /> Open source &amp; community
          </h2>
          <p>
            Because everything we ship is open source, you are welcome — and
            encouraged — to read the code, fork it, fix it, and send a pull
            request. Community contributions are one of the most effective ways
            to get an issue resolved quickly, and we genuinely appreciate every
            one.
          </p>
          <p>
            If you'd like to help sustain the work, visit{" "}
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              digitaldefiance.org
            </a>{" "}
            to learn more about the organization and how to get involved.
          </p>
        </div>

        {/* Contact */}
        <div className="support-section">
          <h2>📬 Contact</h2>
          <p>
            For general inquiries that don't fit a specific project issue
            tracker, reach us at{" "}
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              digitaldefiance.org
            </a>
            . We'll respond when we can.
          </p>
        </div>

        <footer className="support-footer">
          <p>
            © {new Date().getFullYear()} Digital Defiance.{" "}
            <a
              href="https://github.com/Digital-Defiance/brightdate/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub style={{ verticalAlign: "middle" }} /> MIT License
            </a>
            {" • "}
            <Link to="/privacy">Privacy Policy</Link>
            {" • "}
            <Link to="/">Back to BrightDate</Link>
          </p>
        </footer>
      </motion.div>
    </section>
  );
};

export default Support;
