import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { transformWithOxc } from "vite";

const forceJsx = {
  name: "force-jsx",
  enforce: "pre",
  async transform(code, id) {
    if (id.endsWith(".js") && !id.includes("node_modules")) {
      return transformWithOxc(code, id, { lang: "jsx" });
    }
  },
};

export default defineConfig({
  plugins: [forceJsx, react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    passWithNoTests: true,
    // Agent worktrees live under .claude/worktrees with their own tests/;
    // collected from the main checkout they resolve "@" to the wrong src.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
