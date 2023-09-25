// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
// import inject from "@rollup/plugin-inject";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "HardwareWalletConnection",
      // the proper extensions will be added
      fileName: "index",
    },
    outDir: "lib",
    // rollupOptions: {
    //   plugins: [inject({ Buffer: ["Buffer", "Buffer"] })],
    // },
    // build: {
    //   rollupOptions: {
    //     plugins: [inject({ Buffer: ["Buffer", "Buffer"] })],
    //   },
    // },
  },
  plugins: [
    dts({
      bundledPackages: [
        "@ledgerhq/hw-app-eth",
        "@ledgerhq/hw-transport-webusb",
      ],
      // exclude: [],
    }),
  ],
});
