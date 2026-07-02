"""Device registration and management API routes."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user, require_admin
from app.core.database import get_db
from app.api.models.user import User
from app.api.models.device import Device

router = APIRouter(prefix="/devices", tags=["Devices"])


class RegisterDeviceRequest(BaseModel):
    device_id: str
    friendly_name: str
    os_name: str
    os_version: str = ""
    hardware_fingerprint: str
    secure_key: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_device(
    req: RegisterDeviceRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    key_hash = hashlib.sha256(req.secure_key.encode()).hexdigest()
    result = await db.execute(select(Device).where(Device.device_id == req.device_id))
    device = result.scalar_one_or_none()

    if device:
        device.friendly_name = req.friendly_name
        device.os_name = req.os_name
        device.os_version = req.os_version
        device.hardware_fingerprint = req.hardware_fingerprint
        device.secure_key_hash = key_hash
        device.last_user_id = user.id
        device.last_login = datetime.now(timezone.utc)
    else:
        device = Device(
            device_id=req.device_id,
            friendly_name=req.friendly_name,
            os_name=req.os_name,
            os_version=req.os_version,
            hardware_fingerprint=req.hardware_fingerprint,
            secure_key_hash=key_hash,
            last_user_id=user.id,
            permission_level=user.role,
        )
        db.add(device)

    await db.flush()
    return {
        "id": device.id,
        "device_id": device.device_id,
        "trust_status": device.trust_status,
        "is_approved": device.is_approved,
    }


@router.get("")
async def list_devices(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Device))
    devices = result.scalars().all()
    return [
        {
            "id": d.id,
            "device_id": d.device_id,
            "friendly_name": d.friendly_name,
            "os_name": d.os_name,
            "trust_status": d.trust_status,
            "is_approved": d.is_approved,
            "last_user_id": d.last_user_id,
            "last_login": d.last_login.isoformat() if d.last_login else None,
        }
        for d in devices
    ]


@router.put("/{device_id}/approve")
async def approve_device(
    device_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")
    device.is_approved = True
    device.trust_status = "trusted"
    await db.flush()
    return {"status": "approved"}


@router.put("/{device_id}/revoke")
async def revoke_device(
    device_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")
    device.trust_status = "revoked"
    device.is_approved = False
    await db.flush()
    return {"status": "revoked"}
