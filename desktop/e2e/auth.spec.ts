import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT, DEFAULT_HANDLERS } from "./fixtures/tauri-mock";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string, args: any) => {
        if (cmd === "list_workspaces") return [];
        if (cmd in { detect_arduino: 1, list_boards: 1, list_ports: 1 })
          return [];
        return null;
      };
    });
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=CreateLab")).toBeVisible();
    await expect(page.locator("input[type='text']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/workspace");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({ status: 401, body: JSON.stringify({ detail: "Invalid credentials" }) });
    });
    await page.fill("input[type='text']", "wronguser");
    await page.fill("input[type='password']", "wrongpass");
    await page.click("button[type='submit']");
    // Should show error state
    await expect(page.locator("text=error")).or(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });
});
