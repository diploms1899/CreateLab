"""Device registration and management endpoint tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRegisterDevice:
    """POST /api/v1/devices/register"""

    @pytest.mark.asyncio
    async def test_register_success(self, auth_client: AsyncClient):
        response = await auth_client.post("/api/v1/devices/register", json={
            "device_id": "dev-001",
            "friendly_name": "Test Laptop",
            "os_name": "Windows",
            "os_version": "11",
            "hardware_fingerprint": "a" * 32,
            "secure_key": "b" * 32,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["device_id"] == "dev-001"
        assert data["trust_status"] == "pending"
        assert data["is_approved"] is False

    @pytest.mark.asyncio
    async def test_register_update_existing(self, auth_client: AsyncClient):
        """Registering the same device_id should update it."""
        await auth_client.post("/api/v1/devices/register", json={
            "device_id": "dev-002",
            "friendly_name": "Old Name",
            "os_name": "Windows",
            "hardware_fingerprint": "a" * 32,
            "secure_key": "b" * 32,
        })
        response = await auth_client.post("/api/v1/devices/register", json={
            "device_id": "dev-002",
            "friendly_name": "New Name",
            "os_name": "Windows",
            "os_version": "11",
            "hardware_fingerprint": "a" * 32,
            "secure_key": "b" * 32,
        })
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_register_unauthenticated(self, client: AsyncClient):
        response = await client.post("/api/v1/devices/register", json={
            "device_id": "dev-003",
            "friendly_name": "No Auth",
            "os_name": "Windows",
            "hardware_fingerprint": "a" * 32,
            "secure_key": "b" * 32,
        })
        assert response.status_code == 403


class TestListDevices:
    """GET /api/v1/devices"""

    @pytest.mark.asyncio
    async def test_list_admin(self, admin_client: AsyncClient):
        response = await admin_client.get("/api/v1/devices")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_list_non_admin(self, auth_client: AsyncClient):
        """Student cannot list all devices."""
        response = await auth_client.get("/api/v1/devices")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/devices")
        assert response.status_code == 403


class TestApproveDevice:
    """PUT /api/v1/devices/{device_id}/approve"""

    @pytest.mark.asyncio
    async def test_approve_admin(self, admin_client: AsyncClient):
        # First register a device
        from app.core.security import create_access_token
        # Register device as a student (need student auth)
        pass

    @pytest.mark.asyncio
    async def test_approve_non_admin(self, auth_client: AsyncClient):
        response = await auth_client.put("/api/v1/devices/any-id/approve")
        assert response.status_code == 403


class TestRevokeDevice:
    """PUT /api/v1/devices/{device_id}/revoke"""

    @pytest.mark.asyncio
    async def test_revoke_non_admin(self, auth_client: AsyncClient):
        response = await auth_client.put("/api/v1/devices/any-id/revoke")
        assert response.status_code == 403
