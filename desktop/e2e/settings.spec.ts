import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = () => null;
    });
  });

  test("settings page renders", async ({ page }) => {
    await page.goto("/settings");
    // Settings page should have config sections
    await expect(page.locator("text=Settings")).or(page.locator("text=AI"))
      .toBeVisible({ timeout: 10000 });
  });

  test("settings tabs are present", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=Editor")).or(page.locator("text=Hardware")).or(page.locator("text=Theme"))
      .toBeVisible({ timeout: 10000 });
  });
});
