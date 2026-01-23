import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // ✅ 綁自訂網域用 "/"（如果還沒綁網域，先看下面備註）
  build: {
    outDir: "../docs",     // ✅ 輸出到 repo 根目錄的 /docs
    emptyOutDir: true,
  },
});
