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
  ]),
  {
    // React Three Fiber idioms (mutating buffers in useFrame, reading refs to
    // build geometry, setState in mount/scroll effects) trip the new strict
    // react-compiler-style rules. They're intentional here — downgrade to warn.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // One-off Payload local-API scripts (seeding/migrating CMS content) run
    // via tsx outside the app bundle. They cast collection slugs/docs `as
    // any` since we haven't generated payload-types.ts — standard for this
    // kind of script and not worth the generated-types dependency here.
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
