import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  treeshake: true,
  minify: false,
  external: [
    "next/navigation",
    "next/router",
    "react-router-dom",
    "react",
    "zod"
  ]
});