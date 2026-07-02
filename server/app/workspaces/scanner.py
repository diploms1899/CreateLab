"""Workspace file scanner — indexes project files for AI context."""

from __future__ import annotations

import json
import os
from pathlib import Path

SCAN_EXTENSIONS = {
    ".ino", ".cpp", ".h", ".hpp", ".c", ".json",
    ".md", ".txt", ".toml", ".yaml", ".yml", ".py",
}


def scan_workspace(root: str | Path) -> dict[str, str]:
    """Scan a workspace directory and return a path→content dict of source files."""
    root = Path(root)
    index: dict[str, str] = {}
    if not root.exists():
        return index
    for entry in root.rglob("*"):
        if entry.is_file() and entry.suffix.lower() in SCAN_EXTENSIONS:
            try:
                content = entry.read_text(encoding="utf-8", errors="replace")
                rel = str(entry.relative_to(root))
                if len(content) < 50_000:  # Skip huge files
                    index[rel] = content
            except (OSError, UnicodeDecodeError):
                continue
    return index


def build_file_index_json(root: str | Path) -> str:
    """Scan and return a JSON string of the file index."""
    return json.dumps(scan_workspace(root))
