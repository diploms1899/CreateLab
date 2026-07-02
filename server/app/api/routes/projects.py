"""Project routes: templates, user projects."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.models.user import User
from app.api.models.project import ProjectTemplate, UserProject
from app.api.schemas.project import (
    ProjectTemplateResponse,
    UserProjectResponse,
    CreateProjectRequest,
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/templates", response_model=list[ProjectTemplateResponse])
async def list_templates(db: AsyncSession = Depends(get_db)):
    """Return all active project templates."""
    result = await db.execute(
        select(ProjectTemplate).where(ProjectTemplate.is_active == True)
    )
    return result.scalars().all()


@router.get("/templates/{slug}", response_model=ProjectTemplateResponse)
async def get_template(slug: str, db: AsyncSession = Depends(get_db)):
    """Return a specific project template by slug."""
    result = await db.execute(
        select(ProjectTemplate).where(ProjectTemplate.slug == slug)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.post("/", response_model=UserProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project from a template."""
    result = await db.execute(
        select(ProjectTemplate).where(ProjectTemplate.slug == request.template_slug)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    project = UserProject(
        user_id=current_user.id,
        template_id=template.id,
        name=request.name,
        slug=request.name.lower().replace(" ", "-"),
        description=request.description,
    )
    db.add(project)
    await db.flush()
    return project


@router.get("/", response_model=list[UserProjectResponse])
async def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all projects for the current user."""
    result = await db.execute(
        select(UserProject).where(
            UserProject.user_id == current_user.id,
            UserProject.is_active == True,
        )
    )
    return result.scalars().all()
