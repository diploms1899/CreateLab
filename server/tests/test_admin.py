"""Admin endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestAdminDevices:
    """GET /api/v1/admin/devices, PATCH /api/v1/admin/devices/{id}"""

    @pytest.mark.asyncio
    async def test_list_devices_admin(self, admin_client: AsyncClient):
        response = await admin_client.get("/api/v1/admin/devices")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_devices_student(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/admin/devices")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_devices_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/devices")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_device_admin(self, admin_client: AsyncClient):
        response = await admin_client.patch("/api/v1/admin/devices/some-id", json={
            "trust_status": "trusted",
        })
        # Returns 404 for nonexistent device, but authorization check passes
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_device_student(self, auth_client: AsyncClient):
        response = await auth_client.patch("/api/v1/admin/devices/some-id", json={
            "trust_status": "trusted",
        })
        assert response.status_code == 403


class TestAdminUsers:
    """GET /api/v1/admin/users"""

    @pytest.mark.asyncio
    async def test_list_users_admin(self, admin_client: AsyncClient):
        response = await admin_client.get("/api/v1/admin/users")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_users_student(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/admin/users")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_users_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 403
