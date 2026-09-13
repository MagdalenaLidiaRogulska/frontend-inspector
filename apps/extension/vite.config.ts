import { defineConfig } from "vite";

const reactAdapterPath = new URL(
  "../../adapters/react/src/index.ts",
  import.meta.url,
).pathname;

export default defineConfig({
  resolve: {
    alias: {
      "@frontend-inspector/react-adapter": reactAdapterPath,
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        devtools: "devtools.html",
        panel: "panel.html",
        background: "src/background.ts",
        content: "src/content.ts",
        page: "src/page.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }

          if (chunkInfo.name === "content") {
            return "content.js";
          }

          if (chunkInfo.name === "page") {
            return "page.js";
          }

          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
