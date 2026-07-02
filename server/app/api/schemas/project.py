"""Pydantic schemas for projects and templates."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectTemplateResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    theme_id: Optional[str] = None
    ai_personality: Optional[str] = None
    learning_objectives: Optional[list] = None
    is_active: bool

    class Config:
        from_attributes = True


class UserProjectResponse(BaseModel):
    id: str
    user_id: str
    template_id: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    workspace_path: Optional[str] = None
    is_active: bool
    progress: int
    created_at: datetime

    class Config:
        from_attributes = True


class CreateProjectRequest(BaseModel):
    template_slug: str
    name: str
    description: Optional[str] = None
