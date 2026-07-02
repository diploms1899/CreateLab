"""Admin routes: device management, user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.models.user import User
from app.api.models.device import Device, DeviceTrust
from app.api.dependencies.auth import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["administration"])


@router.get("/devices")
async def list_devices(
    current_user: User = Depends(require_role("administrator")),
    db: AsyncSession = Depends(get_db),
):
    """List all registered devices (admin only)."""
    result = await db.execute(select(Device).order_by(Device.created_at.desc()))
    return result.scalars().all()


@router.patch("/devices/{device_id}")
async def update_device(
    device_id: str,
    body: dict,
    current_user: User = Depends(require_role("administrator")),
    db: AsyncSession = Depends(get_db),
):
    """Update device trust status, friendly name, etc."""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if "trust_status" in body:
        device.trust_status = DeviceTrust(body["trust_status"])
    if "friendly_name" in body:
        device.friendly_name = body["friendly_name"]
    if "permission_level" in body:
        device.permission_level = body["permission_level"]

    await db.flush()
    return {"status": "updated"}


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_role("administrator")),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()
