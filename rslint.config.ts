import { defineConfig, ts, js, importPlugin, unicornPlugin } from "@rslint/core";

export default defineConfig([
  ts.configs.recommended,
  js.configs.recommended,
  importPlugin.configs.recommended,
  unicornPlugin.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
