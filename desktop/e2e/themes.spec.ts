import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Project Themes", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string) => {
        if (cmd === "detect_arduino") return true;
        if (cmd === "list_workspaces") return [];
        if (cmd === "write_file") return true;
        return null;
      };
    });
    await page.route("**/api/v1/projects/templates", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", slug: "platformer", name: "Platformer Game", description: "Build a game", theme_id: "platformer", is_active: true },
          { id: "2", slug: "fishing", name: "Fishing Game", description: "Relaxing", theme_id: "fishing", is_active: true },
        ]),
      });
    });
  });

  test("app renders without crashing", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("body")).toBeVisible();
  });

  test("CSS custom properties are applied", async ({ page }) => {
    await page.goto("/workspace");
    // Check that CSS variables are set on the root
    const bgColor = await page.locator("html").evaluate((el) => {
      return getComputedStyle(el).getPropertyValue("--color-background");
    });
    expect(bgColor).toBeTruthy();
  });
});
