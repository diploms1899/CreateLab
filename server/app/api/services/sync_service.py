"""Delta synchronization business logic."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.api.models.workspace import Workspace


class SyncService:
    @staticmethod
    def get_files(workspace: "Workspace") -> dict:
        return json.loads(workspace.file_index) if workspace.file_index else {}

    @staticmethod
    def apply_push(workspace: "Workspace", files: dict[str, str], base_version: int) -> int:
        current = json.loads(workspace.file_index) if workspace.file_index else {}
        current.update(files)
        workspace.file_index = json.dumps(current)
        workspace.sync_version += 1
        workspace.last_synced = datetime.now(timezone.utc)
        return workspace.sync_version

    @staticmethod
    def check_conflict(workspace: "Workspace", client_version: int) -> bool:
        return client_version != workspace.sync_version
