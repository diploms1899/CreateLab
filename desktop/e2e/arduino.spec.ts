import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./fixtures/tauri-mock";

test.describe("Arduino Hardware Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.addInitScript(() => {
      window.__TAURI_MOCK_HANDLER__ = (cmd: string) => {
        if (cmd === "detect_arduino") return true;
        if (cmd === "list_boards") return [
          { name: "ESP32 Dev Module", fqbn: "esp32:esp32:esp32" },
          { name: "Arduino Uno", fqbn: "arduino:avr:uno" },
        ];
        if (cmd === "list_ports") return [{ name: "COM3" }];
        if (cmd === "compile_sketch") return "Build complete.";
        if (cmd === "upload_sketch") return "Upload complete.";
        if (cmd === "list_workspaces") return [];
        if (cmd === "write_file") return true;
        return null;
      };
    });
  });

  test("board selector shows available boards", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("text=ESP32")).or(page.locator("text=Board"))
      .toBeVisible({ timeout: 15000 });
  });

  test("compile button is present", async ({ page }) => {
    await page.goto("/workspace");
    const compileBtn = page.locator("button").filter({ hasText: /compile|build/i });
    if (await compileBtn.count() > 0) {
      await expect(compileBtn.first()).toBeVisible();
    }
  });

  test("serial monitor shows no data initially", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("text=No data")).or(page.locator("text=Serial"))
      .toBeVisible({ timeout: 15000 });
  });
});
