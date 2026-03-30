import { defineConfig, devices } from "@playwright/test";

const devCommand = process.platform === "win32"
  ? "npm.cmd run dev"
  : "npm run dev";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "qa-artifacts/ui/playwright-report.json" }],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: devCommand,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PLAYWRIGHT: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1200 },
      },
    },
  ],
});
