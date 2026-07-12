"""Workspace endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestListWorkspaces:
    """GET /api/v1/workspaces"""

    @pytest.mark.asyncio
    async def test_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/workspaces")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_empty(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/workspaces")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_with_workspaces(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.get("/api/v1/workspaces")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "My Platformer"

    @pytest.mark.asyncio
    async def test_user_isolation(self, auth_client: AsyncClient, admin_client: AsyncClient, test_workspace):
        response = await admin_client.get("/api/v1/workspaces")
        assert response.status_code == 200
        assert response.json() == []


class TestCreateWorkspace:
    """POST /api/v1/workspaces"""

    @pytest.mark.asyncio
    async def test_create_success(self, auth_client: AsyncClient, seeded_templates):
        response = await auth_client.post("/api/v1/workspaces", json={
            "template_slug": "platformer",
            "name": "My New Workspace",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My New Workspace"
        assert data["template_slug"] == "platformer"
        assert "file_index" in data
        assert "main.cpp" in data["file_index"]

    @pytest.mark.asyncio
    async def test_create_missing_template(self, auth_client: AsyncClient):
        response = await auth_client.post("/api/v1/workspaces", json={
            "template_slug": "nonexistent",
            "name": "Bad Workspace",
        })
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_unauthenticated(self, client: AsyncClient):
        response = await client.post("/api/v1/workspaces", json={
            "template_slug": "platformer",
            "name": "No Auth",
        })
        assert response.status_code == 403


class TestGetWorkspace:
    """GET /api/v1/workspaces/{id}"""

    @pytest.mark.asyncio
    async def test_get_success(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.get(f"/api/v1/workspaces/{test_workspace.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "My Platformer"
        assert "file_index" in data

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/workspaces/nonexistent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_other_user(self, admin_client: AsyncClient, test_workspace):
        response = await admin_client.get(f"/api/v1/workspaces/{test_workspace.id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_unauthenticated(self, client: AsyncClient, test_workspace):
        response = await client.get(f"/api/v1/workspaces/{test_workspace.id}")
        assert response.status_code == 403


class TestGetFileIndex:
    """GET /api/v1/workspaces/{id}/files"""

    @pytest.mark.asyncio
    async def test_get_files(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.get(f"/api/v1/workspaces/{test_workspace.id}/files")
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "main.cpp" in data["files"]

    @pytest.mark.asyncio
    async def test_get_files_nonexistent(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/workspaces/bad-id/files")
        assert response.status_code == 404


class TestWriteFile:
    """PUT /api/v1/workspaces/{id}/files/{path}"""

    @pytest.mark.asyncio
    async def test_write_file_success(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.put(
            f"/api/v1/workspaces/{test_workspace.id}/files/new_file.cpp",
            json={"content": "void setup() {}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_write_file_nonexistent_workspace(self, auth_client: AsyncClient):
        response = await auth_client.put(
            "/api/v1/workspaces/bad-id/files/test.cpp",
            json={"content": "test"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_write_file_unauthenticated(self, client: AsyncClient, test_workspace):
        response = await client.put(
            f"/api/v1/workspaces/{test_workspace.id}/files/test.cpp",
            json={"content": "test"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_write_file_path_traversal(self, auth_client: AsyncClient, test_workspace):
        """Path traversal should be rejected (FastAPI normalizes ../ before handler sees it → 404)."""
        response = await auth_client.put(
            f"/api/v1/workspaces/{test_workspace.id}/files/../../../etc/passwd",
            json={"content": "hacked"},
        )
        assert response.status_code in (400, 404)
