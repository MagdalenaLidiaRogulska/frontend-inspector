import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        devtools: "devtools.html",
        panel: "panel.html",
        background: "src/background.ts",
        content: "src/content.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }

          if (chunkInfo.name === "content") {
            return "content.js";
          }

          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
