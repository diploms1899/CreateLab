/** Workspace file scanner and indexer. */

const SCAN_EXTENSIONS = new Set([
  ".ino", ".cpp", ".h", ".hpp", ".c", ".json",
  ".md", ".txt", ".toml", ".yaml", ".py",
]);

export interface IndexedFile {
  path: string;
  content: string;
  language: string;
}

export function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ino: "cpp", cpp: "cpp", c: "c", h: "cpp", hpp: "cpp",
    ts: "typescript", tsx: "typescript", js: "javascript",
    jsx: "javascript", json: "json", md: "markdown",
    toml: "ini", yaml: "yaml", yml: "yaml", py: "python",
    css: "css", html: "html",
  };
  return map[ext] || "text";
}

export function shouldIndex(path: string): boolean {
  return SCAN_EXTENSIONS.has("." + (path.split(".").pop() || "").toLowerCase());
}
