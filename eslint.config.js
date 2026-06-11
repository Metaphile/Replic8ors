import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["build", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Legacy prototype-pattern code (still carrying `@ts-nocheck` until the
      // JS->TS ratchet and the Phase 5 functional port reach it) leans on `any`,
      // `this` aliasing, comma-operator method assignment, etc. Keep these as
      // warnings — visible backlog, not a red build — rather than churning code
      // that's about to be rewritten.
      // `@ts-nocheck` is our deliberate ratchet marker
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-empty": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-case-declarations": "warn",
      "no-constant-condition": "warn",
      "no-self-assign": "warn",
    },
  },
  // disable formatting rules that would conflict with Prettier
  prettier,
);
