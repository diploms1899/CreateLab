"""Project template endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_templates_empty(client: AsyncClient):
    response = await client.get("/api/v1/projects/templates")
    # Without auth, should be 401
    assert response.status_code == 401
