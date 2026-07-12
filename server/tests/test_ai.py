"""AI chat endpoint tests — mocks DeepSeek API calls."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


class TestChatNonStreaming:
    """POST /api/v1/ai/chat/{workspace_id}"""

    @pytest.mark.asyncio
    async def test_chat_authenticated(self, auth_client: AsyncClient, test_workspace):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.json = lambda: {
                "choices": [{"message": {"content": "Here's your code!"}}],
            }
            mock_post.return_value.status_code = 200

            response = await auth_client.post(
                f"/api/v1/ai/chat/{test_workspace.id}",
                json={"message": "Help me with code", "include_files": True},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_nonexistent_workspace(self, auth_client: AsyncClient):
        """Nonexistent workspace falls back to default context (200, not 404)."""
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.json = lambda: {
                "choices": [{"message": {"content": "Hello!"}}],
            }
            mock_post.return_value.status_code = 200
            response = await auth_client.post(
                "/api/v1/ai/chat/nonexistent-id",
                json={"message": "Hello"},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_unauthenticated(self, client: AsyncClient, test_workspace):
        response = await client.post(
            f"/api/v1/ai/chat/{test_workspace.id}",
            json={"message": "Hello"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_chat_other_user_workspace(self, admin_client: AsyncClient, test_workspace):
        """Other user's workspace falls back to default context, not 404."""
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.json = lambda: {
                "choices": [{"message": {"content": "Hello!"}}],
            }
            mock_post.return_value.status_code = 200
            response = await admin_client.post(
                f"/api/v1/ai/chat/{test_workspace.id}",
                json={"message": "Hello"},
            )
            assert response.status_code == 200


class TestChatStreaming:
    """POST /api/v1/ai/chat/{workspace_id}/stream"""

    @pytest.mark.asyncio
    async def test_stream_authenticated(self, auth_client: AsyncClient, test_workspace):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.status_code = 200

            response = await auth_client.post(
                f"/api/v1/ai/chat/{test_workspace.id}/stream",
                json={"message": "Help me", "include_files": False},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_stream_unauthenticated(self, client: AsyncClient, test_workspace):
        response = await client.post(
            f"/api/v1/ai/chat/{test_workspace.id}/stream",
            json={"message": "Hello"},
        )
        assert response.status_code == 403
