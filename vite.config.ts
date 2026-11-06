import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// base: no GitHub Pages o app e servido em /<repo>/, localmente em /.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
