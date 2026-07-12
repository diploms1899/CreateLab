"""Pydantic schemas for workspace sync."""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class FileEntry(BaseModel):
    relative_path: str
    content: Optional[str] = None
    content_hash: Optional[str] = None
    size_bytes: int = 0
    last_modified: Optional[datetime] = None


class SyncRequest(BaseModel):
    workspace_id: str
    files: list[FileEntry]
    deleted_files: list[str] = []


class SyncResponse(BaseModel):
    updated_files: list[FileEntry]
    deleted_files: list[str] = []
    server_time: datetime


class WorkspaceStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: Optional[str] = None
    path: str
    file_count: int
    total_size_bytes: int
    last_synced_at: Optional[datetime] = None
    files: list[FileEntry] = []
