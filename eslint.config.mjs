import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Separate Expo/React Native project — its own toolchain, not part of this Next.js app.
    "mobile/**",
    // Separate Zalo Mini App project (Vite + zmp-ui) — own toolchain, deployed via `zmp deploy`.
    "zalo-mini-app/**",
  ]),
]);

export default eslintConfig;
