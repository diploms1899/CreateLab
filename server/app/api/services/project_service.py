"""Project template business logic."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.models.project import ProjectTemplate
from app.core.config import settings


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_active_templates(self) -> list[ProjectTemplate]:
        result = await self.db.execute(
            select(ProjectTemplate)
            .where(ProjectTemplate.is_active == True)
            .order_by(ProjectTemplate.sort_order)
        )
        return list(result.scalars().all())

    async def get_template_by_slug(self, slug: str) -> ProjectTemplate | None:
        result = await self.db.execute(
            select(ProjectTemplate).where(
                ProjectTemplate.slug == slug, ProjectTemplate.is_active == True
            )
        )
        return result.scalar_one_or_none()
