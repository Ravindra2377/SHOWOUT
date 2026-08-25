import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, workers: 2,
  use: { baseURL: "http://localhost:3001", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://localhost:3001", reuseExistingServer: true },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
