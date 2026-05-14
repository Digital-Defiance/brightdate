import { copyFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Emits dist/404.html as a clone of dist/index.html so GitHub Pages can serve
 * the SPA for any client-side route (e.g. /privacy) without per-route HTML
 * files or the ?/ redirect hack. React Router reads window.location.pathname
 * on boot and renders the correct route; the URL stays clean.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    apply: "build",
    closeBundle() {
      const dist = fileURLToPath(new URL("./dist", import.meta.url));
      copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
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
