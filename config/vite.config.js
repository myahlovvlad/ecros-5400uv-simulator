import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.resolve(repoRoot, "src");

export default defineConfig({
  root: srcRoot,
  cacheDir: path.resolve(repoRoot, ".vite"),
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, "tailwind.config.js") }),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
    open: process.env.PLAYWRIGHT !== "1",
  },
  build: {
    outDir: path.resolve(repoRoot, "dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
});
