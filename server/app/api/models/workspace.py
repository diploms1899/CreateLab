"""Workspace and file version models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, LargeBinary, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Workspace(Base):
    """A user's workspace for a project."""
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("user_projects.id", ondelete="CASCADE"), nullable=True)
    template_id = Column(String, ForeignKey("project_templates.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(256), nullable=False, default="")
    path = Column(String(512), nullable=False, default="")
    file_index = Column(JSON, nullable=True)
    sync_version = Column(Integer, default=0)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    file_count = Column(Integer, default=0)
    total_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    @property
    def last_synced(self):
        """Alias for last_synced_at used by routes."""
        return self.last_synced_at

    # Relationships
    user = relationship("User", back_populates="workspaces")
    files = relationship("WorkspaceFile", back_populates="workspace", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceFile(Base):
    """Metadata for a single file in a workspace."""
    __tablename__ = "workspace_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    relative_path = Column(String(1024), nullable=False)
    file_hash = Column(String(64), nullable=False)
    size_bytes = Column(Integer, default=0)
    last_modified = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    workspace = relationship("Workspace", back_populates="files")


class FileVersion(Base):
    """Version history for workspace files."""
    __tablename__ = "file_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_file_id = Column(String, ForeignKey("workspace_files.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content_hash = Column(String(64), nullable=False)
    content = Column(LargeBinary, nullable=True)
    diff_patch = Column(Text, nullable=True)
    author_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
