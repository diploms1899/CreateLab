"""Pydantic schemas for device endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DeviceTrust = Literal["pending", "trusted", "disabled", "revoked"]


class RegisterDeviceRequest(BaseModel):
    device_id: str = Field(..., min_length=8, max_length=128)
    friendly_name: str = Field(default="", max_length=128)
    os_name: str = Field(..., max_length=32)
    os_version: str = Field(default="", max_length=64)
    hardware_fingerprint: str = Field(..., min_length=32, max_length=256)
    secure_key: str = Field(..., min_length=32, max_length=256)


class DeviceResponse(BaseModel):
    id: str
    device_id: str
    friendly_name: str
    os_name: str
    trust_status: DeviceTrust
    is_approved: bool
    last_login: datetime | None = None


class DeviceApprovalRequest(BaseModel):
    approved: bool
    trust_status: DeviceTrust = "trusted"
