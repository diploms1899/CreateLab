"""Authentication endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRegister:
    """POST /api/v1/auth/register"""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "username": "testuser", "email": "test@test.com",
            "password": "testpass123", "display_name": "Test User",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "username": "dup", "email": "a@test.com", "password": "testpass123",
        })
        response = await client.post("/api/v1/auth/register", json={
            "username": "dup", "email": "b@test.com", "password": "testpass123",
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "username": "user1", "email": "dup@test.com", "password": "testpass123",
        })
        response = await client.post("/api/v1/auth/register", json={
            "username": "user2", "email": "dup@test.com", "password": "testpass123",
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "username": "shortpw", "email": "short@test.com", "password": "123",
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "username": "bademail", "email": "not-an-email",
            "password": "testpass123",
        })
        assert response.status_code == 422


class TestLogin:
    """POST /api/v1/auth/login"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "username": "loginuser", "email": "login@test.com",
            "password": "testpass123",
        })
        response = await client.post("/api/v1/auth/login", json={
            "username": "loginuser", "password": "testpass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "username": "wrongpw", "email": "wrongpw@test.com",
            "password": "testpass123",
        })
        response = await client.post("/api/v1/auth/login", json={
            "username": "wrongpw", "password": "badpassword",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={
            "username": "noone", "password": "testpass123",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, client: AsyncClient, db_session):
        from app.api.models.user import User, UserRole
        from app.core.security import hash_password
        user = User(
            username="inactive", email="inactive@test.com",
            hashed_password=hash_password("testpass123"),
            role=UserRole.student, is_active=False,
        )
        db_session.add(user)
        await db_session.flush()
        await db_session.commit()
        response = await client.post("/api/v1/auth/login", json={
            "username": "inactive", "password": "testpass123",
        })
        assert response.status_code == 403


class TestRefresh:
    """POST /api/v1/auth/refresh"""

    @pytest.mark.asyncio
    async def test_refresh_success(self, client: AsyncClient):
        reg = await client.post("/api/v1/auth/register", json={
            "username": "refreshme", "email": "refresh@test.com",
            "password": "testpass123",
        })
        refresh_token = reg.json()["refresh_token"]
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "not-a-valid-token",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_with_access_token(self, client: AsyncClient):
        reg = await client.post("/api/v1/auth/register", json={
            "username": "accRef", "email": "accref@test.com",
            "password": "testpass123",
        })
        access_token = reg.json()["access_token"]
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": access_token,
        })
        assert response.status_code == 401


class TestGetMe:
    """GET /api/v1/auth/me"""

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@test.com"
        assert data["role"] == "student"

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 403
