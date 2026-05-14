import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaGithub } from "react-icons/fa";
import "./PrivacyPolicy.css";

const EFFECTIVE_DATE = "May 11, 2026";

const PRODUCTS = [
  {
    icon: "📦",
    name: "brightdate (npm)",
    desc: "TypeScript / JS library",
  },
  {
    icon: "🦀",
    name: "brightdate (Rust)",
    desc: "Rust crate on crates.io",
  },
  {
    icon: "🍺",
    name: "CLI tools",
    desc: "bdate, btime, bcal & friends",
  },
  {
    icon: "🐚",
    name: "bsh",
    desc: "Zsh BrightShell port",
  },
  {
    icon: "⌚",
    name: "WearOS Watch Face",
    desc: "Android / Wear OS app",
  },
  {
    icon: "📱",
    name: "Android Widget",
    desc: "Android home screen widget",
  },
  {
    icon: "⏰",
    name: "Android Alarm",
    desc: "Android alarm clock app",
  },
  {
    icon: "💻",
    name: "Android Status Bar",
    desc: "Android status bar app",
  },
];

const PrivacyPolicy = () => {
  return (
    <section className="privacy section" id="privacy">
      <motion.div
        className="privacy-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="privacy-back">
          ← Back to BrightDate
        </Link>

        <header className="privacy-header">
          <h1 className="section-title">
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="privacy-date">Effective date: {EFFECTIVE_DATE}</p>
        </header>

        {/* Zero-data banner */}
        <div className="privacy-zero-banner">
          <div className="privacy-zero-icon">🛡️</div>
          <div className="privacy-zero-text">
            <h2>We collect zero data. Full stop.</h2>
            <p>
              No analytics. No telemetry. No crash reports. No identifiers. No
              network calls. The BrightDate family of products is entirely
              offline and processes all data locally on your device. Nothing is
              ever transmitted to Digital Defiance or any third party.
            </p>
          </div>
        </div>

        {/* Covered products */}
        <div className="privacy-section">
          <h2>
            <FaShieldAlt /> Covered Products
          </h2>
          <p>
            This policy applies to all software distributed by Digital Defiance
            under the BrightDate umbrella:
          </p>
          <div className="privacy-products">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="privacy-product-card">
                <div className="privacy-product-icon">{p.icon}</div>
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Information we do NOT collect */}
        <div className="privacy-section">
          <h2>📵 Information We Do Not Collect</h2>
          <p>
            None of the products listed above collect, store, transmit, or share
            any personal or non-personal information, including but not limited
            to:
          </p>
          <ul>
            <li>Identifiers (name, email, device ID, IP address, etc.)</li>
            <li>Usage data, analytics, or telemetry</li>
            <li>Crash reports or diagnostic data</li>
            <li>Location data</li>
            <li>Health or fitness data</li>
            <li>Contacts, calendar, or communication data</li>
            <li>Financial or payment information</li>
            <li>Browsing or search history</li>
          </ul>
        </div>

        {/* Local-only processing */}
        <div className="privacy-section">
          <h2>💻 Local-Only Processing</h2>
          <p>
            All computation performed by BrightDate products — date conversion,
            astronomical calculations, scheduling, formatting, and all other
            operations — happens entirely on your local device or within your
            own runtime environment. No data leaves your device as a result of
            using these products.
          </p>
          <p>
            The <strong>WearOS Watch Face</strong> reads only the system clock
            provided by the Android platform. It does not request, access, or
            transmit any other sensor data, health information, or personal
            details.
          </p>
          <p>
            The <strong>bsh zsh port</strong> and CLI tools operate as standard
            Unix processes with no background services, network sockets, or
            persistent daemons that communicate externally.
          </p>
        </div>

        {/* Third-party services */}
        <div className="privacy-section">
          <h2>🔗 Third-Party Services</h2>
          <p>
            The BrightDate products themselves do not integrate with any
            third-party analytics, advertising, or data-collection services.
          </p>
          <p>
            Distribution platforms (npm, crates.io, Google Play, Homebrew, and
            GitHub) have their own independent privacy policies that govern
            download and installation activity on their respective platforms. We
            have no control over and do not receive any data from those
            platforms.
          </p>
        </div>

        {/* Open source */}
        <div className="privacy-section">
          <h2>
            <FaGithub /> Open Source &amp; Verifiable
          </h2>
          <p>
            All BrightDate libraries and CLI tools are open source (MIT
            licensed) and publicly available on GitHub. You are welcome to audit
            the full source code to independently verify these claims.
          </p>
          <ul>
            <li>
              <a
                href="https://github.com/Digital-Defiance/brightdate"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Digital-Defiance/brightdate
              </a>{" "}
              — TypeScript library &amp; CLI tools
            </li>
            <li>
              <a
                href="https://github.com/Digital-Defiance/bsh"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Digital-Defiance/bsh
              </a>{" "}
              — bsh zsh BrightShell port
            </li>
          </ul>
        </div>

        {/* Children */}
        <div className="privacy-section">
          <h2>👶 Children's Privacy</h2>
          <p>
            Because we collect no data whatsoever, our products are safe for
            users of all ages. We do not knowingly collect any information from
            anyone, including children under the age of 13.
          </p>
        </div>

        {/* Changes */}
        <div className="privacy-section">
          <h2>📝 Changes to This Policy</h2>
          <p>
            We will update this page if our data practices ever change. The
            effective date at the top of this page will always reflect the date
            of the most recent revision. Given that our products collect no
            data, we expect this policy to remain stable indefinitely.
          </p>
        </div>

        {/* Contact */}
        <div className="privacy-section">
          <h2>📬 Contact</h2>
          <p>
            Questions about this privacy policy? Reach us at{" "}
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              digitaldefiance.org
            </a>{" "}
            or open an issue on{" "}
            <a
              href="https://github.com/Digital-Defiance/brightdate/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>

        <footer className="privacy-footer">
          <p>
            © {new Date().getFullYear()} Digital Defiance.{" "}
            <a
              href="https://github.com/Digital-Defiance/brightdate/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
            {" • "}
            <Link to="/">Back to BrightDate</Link>
          </p>
        </footer>
      </motion.div>
    </section>
  );
};

export default PrivacyPolicy;
