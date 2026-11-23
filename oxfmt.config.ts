import { defineConfig } from "oxfmt";

export default defineConfig({
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  endOfLine: "lf",
  trailingComma: "all",
  insertFinalNewline: true,
  sortImports: { newlinesBetween: false },
  ignorePatterns: [
    "reference/**",
    "vendor/**",
    "node_modules/**",
    "lib/**",
    ".alchemy/**",
    "**/*.md",
  ],
});
