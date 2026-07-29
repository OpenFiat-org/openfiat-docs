import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Must stay in its own config object: flat config only treats `ignores` as a
  // global ignore when it is the object's sole key. Bundled alongside `rules`
  // it degrades to a per-object filter, which left the recommended configs
  // above still linting Docusaurus's generated bundles.
  { ignores: ["build/**", ".docusaurus/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
