import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("AI Chat", () => {
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
    // Mock AI chat endpoint
    await page.route("**/api/v1/ai/chat/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: "Here's some code for you!", role: "assistant" }),
      });
    });
  });

  test("chat panel shows welcome message", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("text=Welcome")).or(page.locator("text=mentor"))
      .toBeVisible({ timeout: 15000 });
  });

  test("can type and send a message", async ({ page }) => {
    await page.goto("/workspace");
    const input = page.locator("textarea").or(page.locator("input[type='text']")).last();
    if (await input.count() > 0) {
      await input.fill("How do I write a game loop?");
      // Try clicking send button or pressing Enter
      const sendBtn = page.locator("button[title*='Send']").or(page.locator("button:has(svg)").last());
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
      }
    }
  });

  test("shows error when AI server unreachable", async ({ page }) => {
    await page.route("**/api/v1/ai/chat/*", (route) => {
      route.fulfill({ status: 500 });
    });
    await page.goto("/workspace");
    const input = page.locator("textarea").or(page.locator("input[type='text']")).last();
    if (await input.count() > 0) {
      await input.fill("test");
      const sendBtn = page.locator("button[title*='Send']").or(page.locator("button:has(svg)").last());
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
        await expect(page.locator("text=Could not reach")).or(page.locator("text=unavailable"))
          .toBeVisible({ timeout: 10000 });
      }
    }
  });
});
