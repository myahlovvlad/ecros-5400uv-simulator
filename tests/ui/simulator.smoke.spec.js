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

async function dragWindow(page, handle, deltaX, deltaY) {
  const box = await handle.boundingBox();
  if (!box) throw new Error("Window handle bounding box not found");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 8 });
  await page.mouse.up();
}

async function readWindowPosition(locator) {
  return locator.evaluate((node) => ({
    left: node.style.left,
    top: node.style.top,
  }));
}

test("workspace renders separate menu graph window", async ({ page }) => {
  await bootToInteractiveState(page);

  await expect(page.getByTestId("workspace-desktop")).toBeVisible();
  await expect(page.getByTestId("tile-menuGraph")).toBeVisible();
  await expect(page.getByTestId("tile-navigation")).toBeVisible();
  await expect(page.getByTestId("tile-menuGraph")).toContainText("Граф меню");
  await expect(page.getByTestId("tile-menuGraph").locator("svg")).toHaveCount(0);

  await saveScreenshot(page, "workspace-desktop");
});

test("CLI wavelength change updates simulator state in workspace layout", async ({ page }) => {
  await bootToInteractiveState(page);

  const cliWindow = page.getByTestId("tile-cli");
  const cliInput = cliWindow.getByTestId("cli-input");
  const cliSubmit = cliWindow.getByTestId("cli-submit");

  await cliInput.fill("swl 400");
  await cliSubmit.click();

  await expect(page.getByTestId("device-wavelength-value")).toContainText("400.0");
  await expect(page.getByTestId("device-screen-value")).toContainText("main");
  await saveScreenshot(page, "cli-wavelength-400");
});

test("LCD editor mirrors live screen content while manual mode is off", async ({ page }) => {
  await bootToInteractiveState(page);

  const rowInput = page.getByTestId("lcd-row-input-1");

  await expect(rowInput).toBeDisabled();
  await expect(rowInput).toHaveValue(/ГЛАВНОЕ МЕНЮ\s*/);

  await page.keyboard.press("Enter");

  await expect(page.getByTestId("device-screen-value")).toContainText("photometry");
  await expect(rowInput).toHaveValue(/ФОТОМЕТРИЯ А\s*/);
  await expect(page.getByTestId("lcd-row-apply-1")).toBeDisabled();
});

test("manual LCD editor applies row and glyph changes explicitly", async ({ page }) => {
  await bootToInteractiveState(page);

  await page.getByTestId("lcd-editor-manual-mode").check();
  await page.getByTestId("lcd-row-input-1").fill("ESC - РџСЂРѕРїСѓСЃРє");
  await expect(page.getByTestId("lcd-row-apply-1")).toBeEnabled();

  await page.getByTestId("lcd-row-apply-1").click();
  await expect(page.getByTestId("lcd-row-apply-1")).toBeDisabled();

  await page.getByTestId("glyph-char-0").click();
  await page.getByTestId("glyph-pixel-0-0").click();
  await expect(page.getByTestId("glyph-apply")).toBeEnabled();
  await page.getByTestId("glyph-apply").click();

  await expect(page.getByTestId("workspace-save-all")).toBeEnabled();
  await saveScreenshot(page, "lcd-editor-manual-mode");
});

test("global save turns off manual mode and keeps the saved LCD override on the same screen", async ({ page }) => {
  await bootToInteractiveState(page);

  const manualToggle = page.getByTestId("lcd-editor-manual-mode");
  const rowInput = page.getByTestId("lcd-row-input-1");

  await manualToggle.check();
  await rowInput.fill("ESC - РџСЂРѕРїСѓСЃРє");
  await page.getByTestId("lcd-row-apply-1").click();

  await page.getByTestId("workspace-save-all").click();

  await expect(manualToggle).not.toBeChecked();
  await expect(rowInput).toBeDisabled();
  await expect(rowInput).toHaveValue("ESC - РџСЂРѕРїСѓСЃРє");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("device-screen-value")).toContainText("photometry");
  await expect(rowInput).toHaveValue(/ФОТОМЕТРИЯ А\s*/);

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("device-screen-value")).toContainText("main");
  await expect(rowInput).toHaveValue("ESC - РџСЂРѕРїСѓСЃРє");
});

test("global save restores saved LCD override and window positions after reload", async ({ page }) => {
  await bootToInteractiveState(page);

  const manualToggle = page.getByTestId("lcd-editor-manual-mode");
  const rowInput = page.getByTestId("lcd-row-input-1");

  await manualToggle.check();
  await rowInput.fill("ESC - РџСЂРѕРїСѓСЃРє");
  await page.getByTestId("lcd-row-apply-1").click();

  const navigationWindow = page.getByTestId("tile-navigation");
  await dragWindow(page, page.getByTestId("window-handle-navigation"), 70, 50);
  const savedPosition = await readWindowPosition(navigationWindow);

  await page.getByTestId("workspace-save-all").click();
  await expect(page.getByTestId("workspace-save-all")).toBeDisabled();

  await page.goto("/");
  await expect(page.getByTestId("app-root")).toBeVisible();
  await page.waitForTimeout(4200);
  await page.keyboard.press("Escape");

  await expect(manualToggle).not.toBeChecked();
  await expect(rowInput).toBeDisabled();
  await expect(rowInput).toHaveValue("ESC - РџСЂРѕРїСѓСЃРє");
  await expect(page.getByTestId("tile-navigation")).toBeVisible();

  const restoredPosition = await readWindowPosition(page.getByTestId("tile-navigation"));
  expect(restoredPosition).toEqual(savedPosition);
});
