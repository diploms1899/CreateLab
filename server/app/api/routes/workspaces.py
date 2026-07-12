"""Workspace management API routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.api.models.user import User
from app.api.models.project import ProjectTemplate
from app.api.models.workspace import Workspace

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


class CreateWorkspaceRequest(BaseModel):
    template_slug: str
    name: str


@router.get("")
async def list_workspaces(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Workspace).where(Workspace.user_id == user.id))
    workspaces = result.scalars().all()
    return [
        {
            "id": w.id,
            "name": w.name,
            "template_id": w.template_id,
            "sync_version": w.sync_version,
            "last_synced": w.last_synced.isoformat() if w.last_synced else None,
            "created_at": w.created_at.isoformat(),
        }
        for w in workspaces
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    req: CreateWorkspaceRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    tmpl_result = await db.execute(
        select(ProjectTemplate).where(ProjectTemplate.slug == req.template_slug)
    )
    template = tmpl_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found.")

    workspace = Workspace(
        user_id=user.id,
        template_id=template.id,
        name=req.name,
        file_index=template.starter_files,
    )
    db.add(workspace)
    await db.flush()
    return {
        "id": workspace.id,
        "name": workspace.name,
        "template_slug": template.slug,
        "file_index": workspace.file_index,
    }


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    return {
        "id": workspace.id,
        "name": workspace.name,
        "template_id": workspace.template_id,
        "file_index": workspace.file_index,
        "sync_version": workspace.sync_version,
    }


@router.get("/{workspace_id}/files")
async def get_file_index(
    workspace_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    return {"files": workspace.file_index, "sync_version": workspace.sync_version}


@router.put("/{workspace_id}/files/{file_path:path}")
async def write_file(
    workspace_id: str,
    file_path: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: dict = {},
):
    # Reject path traversal
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path.")

    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    content = body.get("content", "")
    current = dict(workspace.file_index) if workspace.file_index else {}
    current[file_path] = content
    workspace.file_index = current
    workspace.sync_version += 1
    return {"path": file_path, "status": "saved"}
