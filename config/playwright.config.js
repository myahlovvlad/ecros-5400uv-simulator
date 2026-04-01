import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const devCommand = process.platform === "win32"
  ? "npm.cmd run dev"
  : "npm run dev";

export default defineConfig({
  testDir: path.resolve(repoRoot, "tests/ui"),
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
    ["json", { outputFile: path.resolve(repoRoot, "qa-artifacts/ui/playwright-report.json") }],
    ["html", { open: "never", outputFolder: path.resolve(repoRoot, "playwright-report") }],
  ],
  outputDir: path.resolve(repoRoot, "test-results/playwright"),
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: devCommand,
    cwd: repoRoot,
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
