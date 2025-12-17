// vite.config.js
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import packageJson from "./package.json";
// import inject from "@rollup/plugin-inject";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "HardwareWalletConnection",
      // the proper extensions will be added
      fileName: "index",
    },
    outDir: "lib",
  },
  plugins: [
    dts({
      exclude: ["events"],
      clearPureImport: true,
      rollupTypes: true,
      bundledPackages: [
        "ethers",
        "@ledgerhq/device-management-kit",
        "@ledgerhq/device-signer-kit-ethereum",
        "@ledgerhq/device-signer-kit-solana",
        "@ledgerhq/device-transport-kit-web-ble",
        "@ledgerhq/device-transport-kit-web-hid",
      ],
      afterBuild: async () => {
        /**
         * vite-plugin-dts does an awesome job of inlining declarations
         * of the dependencies, but has a weird bug of including just one
         * incorrect import. Here we absolutely inelegantly fix this bug
         * by replacing the import with an unknown type
         */
        const filePath = packageJson.types;
        const filePathAbs = path.join(__dirname, filePath);
        const content = fs.readFileSync(filePathAbs, "utf-8");
        const searchValue = "import { EIP712Message } from './modules/EIP712';";
        const replaceValue = "type EIP712Message = unknown;";
        const replaced = content.replace(searchValue, replaceValue);
        fs.writeFileSync(filePath, replaced);
      },
    }),
  ],
});
