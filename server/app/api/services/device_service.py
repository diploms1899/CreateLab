"""Device registration business logic."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.models.device import Device


class DeviceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def find_by_device_id(self, device_id: str) -> Device | None:
        result = await self.db.execute(select(Device).where(Device.device_id == device_id))
        return result.scalar_one_or_none()

    async def register_or_update(
        self, device_id: str, friendly_name: str, os_name: str,
        os_version: str, hardware_fingerprint: str, secure_key: str,
        user_id: str, role: str,
    ) -> Device:
        key_hash = hashlib.sha256(secure_key.encode()).hexdigest()
        device = await self.find_by_device_id(device_id)

        if device:
            device.friendly_name = friendly_name
            device.os_name = os_name
            device.os_version = os_version
            device.hardware_fingerprint = hardware_fingerprint
            device.secure_key_hash = key_hash
            device.last_user_id = user_id
            device.last_login = datetime.now(timezone.utc)
        else:
            device = Device(
                device_id=device_id, friendly_name=friendly_name,
                os_name=os_name, os_version=os_version,
                hardware_fingerprint=hardware_fingerprint,
                secure_key_hash=key_hash, last_user_id=user_id,
                permission_level=role,
            )
            self.db.add(device)
        return device
