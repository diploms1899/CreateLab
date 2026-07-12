import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Project Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string) => {
        if (cmd === "list_workspaces") return [];
        if (cmd === "detect_arduino") return true;
        return null;
      };
    });
    // Mock server templates
    await page.route("**/api/v1/projects/templates", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", slug: "platformer", name: "Platformer Game", description: "Build a side-scrolling game", theme_id: "platformer", is_active: true },
          { id: "2", slug: "fishing", name: "Fishing Game", description: "Relaxing fishing simulation", theme_id: "fishing", is_active: true },
        ]),
      });
    });
  });

  test("project grid renders templates", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("text=Platformer Game")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Fishing Game")).toBeVisible();
  });

  test("project cards are clickable", async ({ page }) => {
    await page.goto("/projects");
    const platformerCard = page.locator("text=Platformer Game").first();
    await expect(platformerCard).toBeVisible({ timeout: 10000 });
    await platformerCard.click();
  });

  test("empty state when no templates", async ({ page }) => {
    await page.route("**/api/v1/projects/templates", (route) => {
      route.fulfill({ status: 200, body: "[]" });
    });
    await page.goto("/projects");
    // Should not crash with empty list
    await expect(page).toHaveURL(/\/projects/);
  });
});
