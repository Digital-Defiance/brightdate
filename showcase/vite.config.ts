import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
