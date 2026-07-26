import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  ignores: ["build/**", ".docusaurus/**", "node_modules/**"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
  },
});
