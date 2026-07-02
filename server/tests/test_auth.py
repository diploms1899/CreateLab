"""Authentication endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "username": "testuser", "email": "test@test.com",
        "password": "testpass123", "display_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["username"] == "testuser"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "username": "testuser2", "email": "test2@test.com",
        "password": "testpass123",
    })
    response = await client.post("/api/v1/auth/login", json={
        "username": "testuser2", "password": "testpass123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "username": "nonexistent", "password": "wrong",
    })
    assert response.status_code == 401
