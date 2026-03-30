import fs from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

async function ensureScreenshotDir() {
  const dir = path.join(process.cwd(), "qa-artifacts", "ui", "screenshots");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function saveScreenshot(page, name) {
  const dir = await ensureScreenshotDir();
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}

async function bootToInteractiveState(page) {
  await page.goto("/");
  await expect(page.getByTestId("app-root")).toBeVisible();
  await page.waitForTimeout(4200);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("instrument-panel")).toBeVisible();
  await expect(page.getByTestId("lcd-canvas")).toBeVisible();
}

test("captures shell screenshots, clickability, and visual baseline", async ({ page }) => {
  await bootToInteractiveState(page);

  await page.getByTestId("sidebar-width-640").click();
  await page.getByTestId("tile-navigation-toggle").click();
  await page.getByTestId("tile-navigation-toggle").click();

  await page.getByTestId("panel-button-file").click();
  await page.getByTestId("panel-button-esc").click();
  await page.getByTestId("panel-arrow-down").click();
  await page.getByTestId("panel-arrow-up").click();

  await expect(page.getByTestId("tile-lcdEditor")).toBeVisible();
  await expect(page.getByTestId("tile-cli")).toBeVisible();

  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noOverflow).toBe(true);

  await expect(page.getByTestId("instrument-panel")).toHaveScreenshot("instrument-panel-main.png");
  await expect(page.getByTestId("lcd-canvas-frame")).toHaveScreenshot("lcd-main-screen-frame.png");

  await saveScreenshot(page, "shell-clickability");
  await page.getByTestId("lcd-canvas").screenshot({
    path: path.join(await ensureScreenshotDir(), "lcd-main-screen.png"),
  });
});

test("CLI wavelength change updates simulator state and passes visual gate", async ({ page }) => {
  await bootToInteractiveState(page);

  const cliTile = page.getByTestId("tile-cli");
  const cliInput = cliTile.getByTestId("cli-input");
  const cliSubmit = cliTile.getByTestId("cli-submit");

  await cliInput.fill("swl 400");
  await cliSubmit.click();

  await expect(page.getByTestId("device-wavelength-value")).toContainText("400.0");
  await expect(page.getByTestId("device-status")).toHaveScreenshot("device-status-wavelength-400.png");
  await saveScreenshot(page, "cli-wavelength-400");
});

test("manual LCD editor mode keeps mixed-script LCD labels aligned", async ({ page }) => {
  await bootToInteractiveState(page);
  const rowOne = page.getByTestId("lcd-editor-row-1");

  await page.getByTestId("lcd-editor-manual-mode").check();
  await page.getByTestId("lcd-row-input-1").fill("ESC - Пропуск");
  await page.getByTestId("lcd-editor-title-underline").check();
  await page.getByTestId("lcd-row-input-1").blur();
  await expect(page.getByTestId("lcd-row-input-1")).toHaveValue("ESC - Пропуск");
  await page.waitForTimeout(100);

  await expect(rowOne.getByRole("alert")).toHaveCount(0);
  await expect(page.getByTestId("lcd-row-invert-1")).toBeDisabled();
  await expect(rowOne).toHaveScreenshot("lcd-editor-row-1-mixed-case.png");

  await saveScreenshot(page, "lcd-editor-manual-mode");
});
