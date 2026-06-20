import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // ✅ 綁自訂網域用 "/"（如果還沒綁網域，先看下面備註）
  build: {
    outDir: "../docs",     // ✅ 輸出到 repo 根目錄的 /docs
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true,
  },
  // Pre-bundle the three.js postprocessing addons on server start so adding/using them
  // never triggers a mid-session dep re-optimize (which corrupts HMR → black canvas).
  optimizeDeps: {
    include: [
      "three",
      "three/addons/postprocessing/EffectComposer.js",
      "three/addons/postprocessing/RenderPass.js",
      "three/addons/postprocessing/UnrealBloomPass.js",
      "three/addons/postprocessing/OutputPass.js",
    ],
  },
});
