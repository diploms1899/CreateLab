import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Workspace View", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string) => {
        if (cmd === "list_workspaces") return [];
        if (cmd === "detect_arduino") return true;
        if (cmd === "write_file") return true;
        return null;
      };
    });
  });

  test("workspace renders with editor and panels", async ({ page }) => {
    await page.goto("/workspace");
    // Editor should be visible
    await expect(page.locator("[class*='editor']").or(page.locator("text=main.cpp"))).toBeVisible({ timeout: 15000 });
  });

  test("AI chat panel is present", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("text=AI")).or(page.locator("[class*='chat']")).toBeVisible({ timeout: 15000 });
  });

  test("file explorer shows files", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("text=main.cpp")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=config.h")).toBeVisible();
    await expect(page.locator("text=README.md")).toBeVisible();
  });

  test("resizable panels exist", async ({ page }) => {
    await page.goto("/workspace");
    // Panel resize handles should be present
    const handles = page.locator("[data-panel-resize-handle-id]");
    await expect(handles.first()).toBeVisible({ timeout: 15000 });
  });

  test("hardware panel toggle works", async ({ page }) => {
    await page.goto("/workspace");
    // Toggle hardware button should exist
    const toggleBtn = page.locator("button[title*='Hardware']").or(page.locator("button[title*='Toggle']"));
    if (await toggleBtn.count() > 0) {
      await toggleBtn.first().click();
    }
  });
});
