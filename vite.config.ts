import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(() => ({
  base: "/",
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  // Mirrors the nginx reverse proxy in the production image, so the app talks
  // to a same-origin /app/v1 in dev too and nothing has to change between the
  // two. Point at a different gateway with GATEWAY_URL if needed.
  server: {
    host: true, // listen on 0.0.0.0 so a phone on the LAN can reach the dev server
    proxy: {
      "/app/v1": {
        target: process.env.GATEWAY_URL || "http://localhost:8080",
        changeOrigin: true,
      },
      "/ws": {
        target: process.env.GATEWAY_URL || "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
}));