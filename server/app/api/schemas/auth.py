"""Pydantic schemas for authentication."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str
    device_id: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    display_name: Optional[str] = None
    role: str
    is_active: bool


class DeviceRegistrationRequest(BaseModel):
    device_id: str
    hardware_fingerprint: str
    secure_random_key: str
    friendly_name: Optional[str] = None
    operating_system: Optional[str] = None
