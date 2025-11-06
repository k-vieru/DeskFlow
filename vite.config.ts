import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This config ensures correct build output for Tauri
export default defineConfig({
  base: "./", // important: makes assets load correctly in Tauri .exe
  plugins: [react()],
  build: {
    outDir: "dist", // must match your tauri.conf.json
    emptyOutDir: true, // cleans old builds before building new ones
  },
});
