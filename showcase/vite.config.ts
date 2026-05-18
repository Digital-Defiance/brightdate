import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Client-side routes that should each get a real HTML file on disk so GitHub
 * Pages serves them with a 200 (instead of falling back to 404.html with a
 * 404 status). Keep this list in sync with the <Route> entries in App.tsx.
 */
const SPA_ROUTES = ["spacetime", "privacy", "support"] as const;

/**
 * Emits dist/404.html as a clone of dist/index.html so GitHub Pages can serve
 * the SPA for unknown client-side routes without the ?/ redirect hack. Also
 * emits dist/<route>/index.html for each known route so those URLs return a
 * real 200 to crawlers, link checkers, and curl. React Router reads
 * window.location.pathname on boot and renders the correct route either way.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    apply: "build",
    closeBundle() {
      const dist = fileURLToPath(new URL("./dist", import.meta.url));
      const indexHtml = `${dist}/index.html`;
      copyFileSync(indexHtml, `${dist}/404.html`);
      for (const route of SPA_ROUTES) {
        mkdirSync(`${dist}/${route}`, { recursive: true });
        copyFileSync(indexHtml, `${dist}/${route}/index.html`);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
  base: "/",
  resolve: {
    alias: {
      "@brightchain/brightdate": fileURLToPath(
        new URL("../src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
