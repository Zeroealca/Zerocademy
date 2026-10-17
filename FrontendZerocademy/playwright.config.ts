import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Browser fixtures communicate through one guarded container file; serial
  // execution keeps projects from replacing one another's test-owned fixture.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "narrow-mobile", use: { ...devices["Pixel 5"], viewport: { width: 320, height: 700 } } },
  ],
});
