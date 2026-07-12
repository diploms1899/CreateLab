"""Pytest fixtures for CreateLab server tests."""

from __future__ import annotations

from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.api.models.user import User, UserRole
from app.api.models.project import ProjectTemplate
from app.api.models.workspace import Workspace
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Raw database session for seeding test data (auto-commits before test runs)."""
    async with test_session_factory() as session:
        yield session
        await session.commit()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test student user and return the User object."""
    user = User(
        username="testuser",
        email="test@test.com",
        hashed_password=hash_password("testpass123"),
        display_name="Test User",
        role=UserRole.student,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.commit()
    return user


@pytest.fixture
async def auth_client(test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated test client with a student user's token."""
    token = create_access_token(subject=test_user.id, extra_claims={"role": "student"})
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    user = User(
        username="admin",
        email="admin@test.com",
        hashed_password=hash_password("adminpass123"),
        display_name="Admin",
        role=UserRole.administrator,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.commit()
    return user


@pytest.fixture
async def admin_client(admin_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated test client with admin token."""
    token = create_access_token(subject=admin_user.id, extra_claims={"role": "administrator"})
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


@pytest.fixture
async def seeded_templates(db_session: AsyncSession) -> list[ProjectTemplate]:
    """Create the 4 project templates for testing."""
    templates_data = [
        {
            "slug": "platformer", "name": "Platformer Game",
            "description": "Build a side-scrolling game", "theme_id": "platformer",
            "ai_personality": "Veteran game dev", "sort_order": 0,
            "starter_files": {"main.cpp": "// platformer starter", "config.h": "// config"},
        },
        {
            "slug": "fishing", "name": "Fishing Game",
            "description": "Relaxing fishing simulation", "theme_id": "fishing",
            "ai_personality": "Calm fishing guide", "sort_order": 1,
            "starter_files": {"main.cpp": "// fishing starter"},
        },
        {
            "slug": "robotics", "name": "Robotics Project",
            "description": "Build a robot", "theme_id": "robotics",
            "ai_personality": "Embedded engineer", "sort_order": 2,
            "starter_files": {"main.cpp": "// robotics starter"},
        },
        {
            "slug": "calculator", "name": "Scientific Calculator",
            "description": "Build a calculator", "theme_id": "calculator",
            "ai_personality": "Engineering professor", "sort_order": 3,
            "starter_files": {"main.cpp": "// calculator starter"},
        },
    ]
    templates = []
    for td in templates_data:
        t = ProjectTemplate(**td)
        db_session.add(t)
        templates.append(t)
    await db_session.flush()
    await db_session.commit()
    return templates


@pytest.fixture
async def test_workspace(
    test_user: User, seeded_templates: list[ProjectTemplate], db_session: AsyncSession,
) -> Workspace:
    """Create a workspace for the test user using the platformer template."""
    ws = Workspace(
        user_id=test_user.id,
        template_id=seeded_templates[0].id,
        name="My Platformer",
        file_index=seeded_templates[0].starter_files,
    )
    db_session.add(ws)
    await db_session.flush()
    await db_session.commit()
    return ws
