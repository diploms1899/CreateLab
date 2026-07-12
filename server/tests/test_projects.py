"""Project template endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestListTemplates:
    """GET /api/v1/projects/templates"""

    @pytest.mark.asyncio
    async def test_list_empty(self, client: AsyncClient):
        response = await client.get("/api/v1/projects/templates")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_with_templates(self, client: AsyncClient, seeded_templates):
        response = await client.get("/api/v1/projects/templates")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        slugs = {t["slug"] for t in data}
        assert slugs == {"platformer", "fishing", "robotics", "calculator"}

    @pytest.mark.asyncio
    async def test_inactive_excluded(self, client: AsyncClient, db_session):
        from app.api.models.project import ProjectTemplate
        t = ProjectTemplate(slug="inactive", name="Inactive", is_active=False)
        db_session.add(t)
        await db_session.flush()
        response = await client.get("/api/v1/projects/templates")
        assert response.status_code == 200
        slugs = {t["slug"] for t in response.json()}
        assert "inactive" not in slugs


class TestGetTemplate:
    """GET /api/v1/projects/templates/{slug}"""

    @pytest.mark.asyncio
    async def test_get_by_slug(self, client: AsyncClient, seeded_templates):
        response = await client.get("/api/v1/projects/templates/platformer")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "platformer"
        assert data["name"] == "Platformer Game"

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, client: AsyncClient):
        response = await client.get("/api/v1/projects/templates/nonexistent")
        assert response.status_code == 404


class TestCreateProject:
    """POST /api/v1/projects/"""

    @pytest.mark.asyncio
    async def test_create_success(self, auth_client: AsyncClient, seeded_templates):
        response = await auth_client.post("/api/v1/projects/", json={
            "template_slug": "platformer",
            "name": "My Platformer",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My Platformer"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_missing_template(self, auth_client: AsyncClient):
        response = await auth_client.post("/api/v1/projects/", json={
            "template_slug": "nonexistent",
            "name": "Bad Project",
        })
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_unauthenticated(self, client: AsyncClient):
        response = await client.post("/api/v1/projects/", json={
            "template_slug": "platformer",
            "name": "No Auth",
        })
        assert response.status_code == 403


class TestListUserProjects:
    """GET /api/v1/projects/"""

    @pytest.mark.asyncio
    async def test_list_empty(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/projects/")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_with_projects(self, auth_client: AsyncClient, seeded_templates):
        await auth_client.post("/api/v1/projects/", json={
            "template_slug": "platformer", "name": "P1",
        })
        await auth_client.post("/api/v1/projects/", json={
            "template_slug": "fishing", "name": "P2",
        })
        response = await auth_client.get("/api/v1/projects/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_user_isolation(self, auth_client: AsyncClient, admin_client: AsyncClient, seeded_templates):
        await auth_client.post("/api/v1/projects/", json={
            "template_slug": "platformer", "name": "User A Project",
        })
        response = await admin_client.get("/api/v1/projects/")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/projects/")
        assert response.status_code == 403
