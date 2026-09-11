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
    // npm install / build sırasında kopyalanan ffmpeg.wasm dosyaları.
    // Bizim yazdığımız kod değil, derlenmiş üçüncü parti çıktı.
    "public/ffmpeg/**",
    // Prisma'nın ürettiği istemci.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
