"""Workspace synchronization routes — delta sync between desktop and server."""

import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.models.user import User
from app.api.models.workspace import Workspace, WorkspaceFile
from app.api.schemas.workspace import SyncRequest, SyncResponse, FileEntry
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/sync", tags=["synchronization"])


@router.post("/workspace/{workspace_id}", response_model=SyncResponse)
async def sync_workspace(
    workspace_id: str,
    request: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delta sync: send local changes, receive server-side changes."""
    ws_result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.user_id == current_user.id,
        )
    )
    workspace = ws_result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    updated_files: list[FileEntry] = []
    deleted_files: list[str] = []

    # Process incoming file changes
    for file_entry in request.files:
        existing = await db.execute(
            select(WorkspaceFile).where(
                WorkspaceFile.workspace_id == workspace_id,
                WorkspaceFile.relative_path == file_entry.relative_path,
            )
        )
        ws_file = existing.scalar_one_or_none()

        if ws_file:
            ws_file.file_hash = file_entry.content_hash or ws_file.file_hash
            ws_file.size_bytes = file_entry.size_bytes
            ws_file.last_modified = file_entry.last_modified or datetime.now(timezone.utc)
        else:
            ws_file = WorkspaceFile(
                workspace_id=workspace_id,
                relative_path=file_entry.relative_path,
                file_hash=file_entry.content_hash or "",
                size_bytes=file_entry.size_bytes,
                last_modified=file_entry.last_modified or datetime.now(timezone.utc),
            )
            db.add(ws_file)
        updated_files.append(file_entry)

    # Process deleted files
    for path in request.deleted_files:
        existing = await db.execute(
            select(WorkspaceFile).where(
                WorkspaceFile.workspace_id == workspace_id,
                WorkspaceFile.relative_path == path,
            )
        )
        ws_file = existing.scalar_one_or_none()
        if ws_file:
            await db.delete(ws_file)
            deleted_files.append(path)

    workspace.last_synced_at = datetime.now(timezone.utc)
    workspace.file_count = len(updated_files) - len(deleted_files) + (
        await _count_files(db, workspace_id)
    )
    await db.flush()

    return SyncResponse(
        updated_files=updated_files,
        deleted_files=deleted_files,
        server_time=datetime.now(timezone.utc),
    )


async def _count_files(db: AsyncSession, workspace_id: str) -> int:
    result = await db.execute(
        select(WorkspaceFile).where(WorkspaceFile.workspace_id == workspace_id)
    )
    return len(result.scalars().all())
