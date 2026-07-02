"""Project template and user project models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectTemplate(Base):
    """Pre-defined project template (Platformer, Fishing, Robotics, Calculator)."""
    __tablename__ = "project_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    theme_id = Column(String(64), nullable=True)
    ai_personality = Column(Text, nullable=True)
    coding_standards = Column(Text, nullable=True)
    hardware_config = Column(JSON, nullable=True)
    learning_objectives = Column(JSON, nullable=True)
    firmware_rules = Column(Text, nullable=True)
    starter_code_path = Column(String(256), nullable=True)
    documentation_path = Column(String(256), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class UserProject(Base):
    """A user's active project instance."""
    __tablename__ = "user_projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String, ForeignKey("project_templates.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(128), nullable=False)
    slug = Column(String(64), nullable=False, index=True)
    description = Column(Text, nullable=True)
    workspace_path = Column(String(256), nullable=True)
    is_active = Column(Boolean, default=True)
    progress = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
