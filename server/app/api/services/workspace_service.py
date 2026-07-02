"""Workspace business logic."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.models.workspace import Workspace


class WorkspaceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_user_workspaces(self, user_id: str) -> list[Workspace]:
        result = await self.db.execute(
            select(Workspace).where(Workspace.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_workspace(self, workspace_id: str, user_id: str) -> Workspace | None:
        result = await self.db.execute(
            select(Workspace).where(
                Workspace.id == workspace_id, Workspace.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def update_file(self, workspace: Workspace, path: str, content: str) -> None:
        current = json.loads(workspace.file_index) if workspace.file_index else {}
        current[path] = content
        workspace.file_index = json.dumps(current)
        workspace.sync_version += 1
        workspace.last_synced = datetime.now(timezone.utc)
