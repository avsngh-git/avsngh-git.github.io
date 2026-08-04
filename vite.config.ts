import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        transformerVariants: fileURLToPath(
          new URL("./projects/transformer-variants/index.html", import.meta.url),
        ),
        favoritaStoreSales: fileURLToPath(
          new URL("./projects/favorita-store-sales/index.html", import.meta.url),
        ),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["_site/**", "e2e/**", "test/**", "node_modules/**", "dist/**"],
    globals: true,
    css: true,
  },
});
