import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

// zmp-vite-plugin reads ./app-config.json, sets base "./", outputs to `www/` and writes the
// runtime app-config.json Zalo needs (list of CSS/JS entry files) — `zmp deploy` uploads `www/`.
export default defineConfig({
  plugins: [zaloMiniApp(), react()],
  build: {
    assetsInlineLimit: 0,
  },
});
