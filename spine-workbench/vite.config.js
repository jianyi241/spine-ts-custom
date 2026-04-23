import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const projectNodeModules = path.resolve(__dirname, "node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@esotericsoftware/spine-core": path.resolve(
        projectNodeModules,
        "@esotericsoftware/spine-core/dist/index.js"
      ),
      three: path.resolve(projectNodeModules, "three"),
      "gsap/CustomEase": path.resolve(
        projectNodeModules,
        "gsap/CustomEase.js"
      ),
      "@local-spine-player": path.resolve(
        workspaceRoot,
        "spine-ts/spine-threejs/src/SpinePlayer.ts"
      ),
      "@local-gsap-helper": path.resolve(
        workspaceRoot,
        "spine-ts/spine-threejs/src/gsap-util/index.js"
      ),
    },
  },
  optimizeDeps: {
    include: ["@esotericsoftware/spine-core", "three", "gsap", "gsap/CustomEase"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3107",
    },
    fs: {
      allow: [workspaceRoot],
    },
  },
});
