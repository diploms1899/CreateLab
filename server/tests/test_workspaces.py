"""Workspace endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_workspaces_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/workspaces")
    assert response.status_code == 401
