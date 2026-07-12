"""Arduino endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestListBoards:
    """GET /api/v1/arduino/boards"""

    @pytest.mark.asyncio
    async def test_list_boards_public(self, client: AsyncClient):
        response = await client.get("/api/v1/arduino/boards")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["name"] == "ESP32 Dev Module"


class TestCompile:
    """POST /api/v1/arduino/compile"""

    @pytest.mark.asyncio
    async def test_compile_authenticated(self, auth_client: AsyncClient, test_workspace):
        response = await auth_client.post("/api/v1/arduino/compile", json={
            "workspace_id": test_workspace.id,
            "board": "esp32:esp32:esp32",
            "sketch_path": "/test/sketch",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_compile_unauthenticated(self, client: AsyncClient):
        response = await client.post("/api/v1/arduino/compile", json={
            "board": "esp32:esp32:esp32",
            "sketch_path": "/test/sketch",
        })
        assert response.status_code == 403
