import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => ({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "CFReactErrorReporter",
      fileName: (format) => `cf-react-error-reporter.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "check-coverage.js",
        "src/setupTests.ts",
        "src/lib/utils/errorCache.ts",
        "**/index.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/config.*",
        "**/types.ts",
        "dist/",
        "build/",
      ],
    },
  },
}));
