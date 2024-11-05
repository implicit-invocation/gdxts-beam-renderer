import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["src/renderer"] })],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/renderer/index.ts"),
      name: "BeamRenderer",
      fileName: "beam-renderer",
    },
    rollupOptions: {
      external: ["gdxts"],
    },
  },
});
