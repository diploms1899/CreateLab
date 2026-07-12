/**
 * Tauri invoke mock for Playwright E2E tests.
 *
 * Playwright runs in a standard browser, not Tauri's WebView,
 * so window.__TAURI_INTERNALS__ and @tauri-apps/api/core invoke()
 * don't exist. This script mocks them so React components can
 * render without crashing.
 */
export const TAURI_MOCK_SCRIPT = `
window.__TAURI_INTERNALS__ = {
  invoke: function(cmd, args) {
    return window.__TAURI_MOCK_HANDLER__
      ? window.__TAURI_MOCK_HANDLER__(cmd, args)
      : Promise.resolve(null);
  }
};
window.__TAURI_MOCK_HANDLER__ = null;
`;

/**
 * Default mock handlers for common Tauri commands.
 * Tests can override via page.evaluate().
 */
export const DEFAULT_HANDLERS: Record<string, any> = {
  detect_arduino: true,
  list_boards: [
    { name: "ESP32 Dev Module", fqbn: "esp32:esp32:esp32" },
    { name: "Arduino Uno", fqbn: "arduino:avr:uno" },
  ],
  list_ports: [{ name: "COM3", description: "USB Serial" }],
  compile_sketch: "Build complete.",
  upload_sketch: "Upload complete.",
  serial_monitor: "Hello from ESP32!",
  list_libraries: [],
  search_libraries: [],
  install_library: true,
  remove_library: true,
  list_workspaces: [],
  create_workspace: { id: "ws-mock-1", name: "Mock Workspace", template_slug: "platformer" },
  read_file: "// mock content",
  write_file: true,
  push_changes: true,
  pull_changes: [],
  get_sync_status: { status: "synced" },
  scan_repo_health: { ok: true },
  run_shell_cmd: "",
};

export function getDefaultHandler(cmd: string, args?: any): any {
  if (cmd in DEFAULT_HANDLERS) {
    return DEFAULT_HANDLERS[cmd];
  }
  return null;
}
