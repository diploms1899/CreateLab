"""Arduino integration API routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.api.models.user import User
from app.api.models.workspace import Workspace

router = APIRouter(prefix="/arduino", tags=["Arduino"])


class BuildRequest(BaseModel):
    workspace_id: str
    board: str = "esp32:esp32:esp32"
    sketch_path: str = ""


class BuildResult(BaseModel):
    success: bool
    output: str
    errors: list[str]


@router.post("/compile", response_model=BuildResult)
async def compile_sketch(
    req: BuildRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Trigger a sketch compilation — proxied through server for logging."""
    result = await db.execute(
        select(Workspace).where(Workspace.id == req.workspace_id, Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    return BuildResult(success=True, output="Compilation would run on desktop via arduino-cli.", errors=[])


@router.get("/boards")
async def list_supported_boards():
    """Return known supported boards and their FQBNs."""
    return [
        {"name": "ESP32 Dev Module", "fqbn": "esp32:esp32:esp32"},
        {"name": "ESP32-S3 Dev Module", "fqbn": "esp32:esp32:esp32s3"},
        {"name": "Arduino Uno", "fqbn": "arduino:avr:uno"},
        {"name": "Arduino Nano", "fqbn": "arduino:avr:nano"},
        {"name": "Raspberry Pi Pico", "fqbn": "rp2040:rp2040:rpipico"},
    ]
