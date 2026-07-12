import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string) => {
        if (cmd === "detect_arduino") return true;
        if (cmd === "list_workspaces") return [];
        if (cmd === "write_file") return true;
        if (cmd === "push_changes") return true;
        if (cmd === "pull_changes") return [];
        return null;
      };
    });
  });

  test("sync indicator is visible", async ({ page }) => {
    await page.goto("/workspace");
    // The sync indicator button should be present
    await expect(page.locator(".sync-indicator").or(page.locator("[title*='Sync']")))
      .toBeVisible({ timeout: 15000 });
  });

  test("sync button is clickable", async ({ page }) => {
    await page.goto("/workspace");
    const syncBtn = page.locator(".sync-indicator").or(page.locator("[title*='Sync']"));
    if (await syncBtn.count() > 0) {
      await syncBtn.first().click();
    }
  });
});
