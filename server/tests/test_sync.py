"""Synchronization endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestSyncWorkspace:
    """POST /api/v1/sync/workspace/{workspace_id}"""

    @pytest.mark.asyncio
    async def test_sync_empty_delta(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.post(
            f"/api/v1/sync/workspace/{test_workspace.id}",
            json={"workspace_id": test_workspace.id, "files": [], "deleted_files": []},
        )
        assert response.status_code == 200
        data = response.json()
        assert "updated_files" in data
        assert "server_time" in data

    @pytest.mark.asyncio
    async def test_sync_new_files(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.post(
            f"/api/v1/sync/workspace/{test_workspace.id}",
            json={
                "workspace_id": test_workspace.id,
                "files": [
                    {
                        "relative_path": "game.cpp",
                        "content_hash": "abc123",
                        "size_bytes": 100,
                    },
                    {
                        "relative_path": "display.h",
                        "content_hash": "def456",
                        "size_bytes": 50,
                    },
                ],
                "deleted_files": [],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["updated_files"]) == 2

    @pytest.mark.asyncio
    async def test_sync_deleted_files(self, auth_client: AsyncClient, test_workspace):
        # First sync a file in
        await auth_client.post(
            f"/api/v1/sync/workspace/{test_workspace.id}",
            json={
                "workspace_id": test_workspace.id,
                "files": [{"relative_path": "to_delete.cpp", "content_hash": "xxx", "size_bytes": 10}],
                "deleted_files": [],
            },
        )
        # Then delete it
        response = await auth_client.post(
            f"/api/v1/sync/workspace/{test_workspace.id}",
            json={
                "workspace_id": test_workspace.id,
                "files": [],
                "deleted_files": ["to_delete.cpp"],
            },
        )
        assert response.status_code == 200
        assert "to_delete.cpp" in response.json()["deleted_files"]

    @pytest.mark.asyncio
    async def test_sync_nonexistent_workspace(self, auth_client: AsyncClient):
        response = await auth_client.post(
            "/api/v1/sync/workspace/bad-id",
            json={"workspace_id": "bad-id", "files": [], "deleted_files": []},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_sync_other_user_workspace(self, admin_client: AsyncClient, test_workspace):
        """Cannot sync another user's workspace."""
        response = await admin_client.post(
            f"/api/v1/sync/workspace/{test_workspace.id}",
            json={"workspace_id": test_workspace.id, "files": [], "deleted_files": []},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_sync_unauthenticated(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/sync/workspace/any-id",
            json={"workspace_id": "any-id", "files": [], "deleted_files": []},
        )
        assert response.status_code == 403
