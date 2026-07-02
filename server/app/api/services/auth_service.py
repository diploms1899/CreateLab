"""Authentication business logic."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.api.models.user import User
from app.api.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    """Handles registration, login, token refresh, and role checks."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, req: RegisterRequest) -> User:
        existing = await self.db.execute(
            select(User).where((User.username == req.username) | (User.email == req.email))
        )
        if existing.scalar_one_or_none():
            raise ValueError("Username or email already exists.")

        user = User(
            username=req.username,
            email=req.email,
            hashed_password=hash_password(req.password),
            display_name=req.display_name or req.username,
            role="student",
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def login(self, req: LoginRequest) -> TokenResponse:
        result = await self.db.execute(select(User).where(User.username == req.username))
        user = result.scalar_one_or_none()
        if not user or not verify_password(req.password, user.hashed_password):
            raise ValueError("Invalid username or password.")
        if not user.is_active:
            raise ValueError("Account is disabled.")

        user.last_login = datetime.now(timezone.utc)
        self.db.add(user)
        await self.db.flush()

        return TokenResponse(
            access_token=create_access_token(subject=user.id, extra_claims={"role": user.role.value if hasattr(user.role, 'value') else str(user.role)}),
            refresh_token=create_refresh_token(subject=user.id),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            from app.core.security import decode_token
            payload = decode_token(refresh_token)
        except Exception:
            raise ValueError("Invalid or expired refresh token.")
        if payload.get("type") != "refresh":
            raise ValueError("Token is not a refresh token.")

        user_id = payload["sub"]
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive.")

        return TokenResponse(
            access_token=create_access_token(subject=user.id, extra_claims={"role": user.role.value if hasattr(user.role, 'value') else str(user.role)}),
            refresh_token=create_refresh_token(subject=user.id),
        )
