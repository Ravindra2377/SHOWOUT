import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"], coverage: { reporter: ["text", "html"] } },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "."), "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts") } },
});
