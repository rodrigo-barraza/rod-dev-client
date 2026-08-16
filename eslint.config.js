// ============================================================
// Two deliberate version ceilings live in package.json:
//
//   eslint      ^9.x   — NOT ^10. eslint-config-next bundles
//                        eslint-plugin-react (peer: <=^9.7) and
//                        eslint-plugin-import (peer: <=^9). On eslint 10
//                        `eslint .` crashes outright rather than linting
//                        ("scopeManager.addGlobals is not a function" /
//                        "contextOrFilename.getFilename is not a function"),
//                        so the gate passes by never running.
//   typescript  ^5.9.x — NOT ^6/^7. typescript-eslint peers
//                        `typescript >=4.8.4 <6.1.0`, and TS 7 also breaks
//                        Next 16's verifyTypeScriptSetup.
//
// Raise either only after its plugins declare support.
// ============================================================
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettierConfig,
  {
    rules: {
      // The base rule cannot see TypeScript's type-only constructs: it reports
      // every parameter name inside an interface's function signature
      // (`onChange: (value: string) => void`) as an unused argument. Defer to
      // the TS-aware rule, which understands them.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      // Warn, not error. The remaining sites are the "reset derived state when
      // an input changes" and "sync state to a DOM measurement" shapes; each
      // needs its own restructure (derive during render, or key the subtree)
      // and several sit on pages that only exercise against live services.
      // Kept visible so they get paid down, without gating the build on a
      // refactor. Same call as reels-client.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
