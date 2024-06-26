import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@assets": "/src/assets",
      "@components": "/src/components",
      "@utilities": "/src/utilities",
      "@hooks": "/src/hooks",
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
