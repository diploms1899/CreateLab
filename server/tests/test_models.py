"""Database model tests — verify constraints, cascades, and JSON storage."""

from __future__ import annotations

import pytest
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.models.user import User, UserRole, Session as UserSession
from app.api.models.device import Device, DeviceTrust
from app.api.models.project import ProjectTemplate, UserProject
from app.api.models.workspace import Workspace, WorkspaceFile, FileVersion
from app.core.security import hash_password


class TestUserModel:
    async def test_create_user(self, db_session: AsyncSession):
        user = User(username="m1", email="m1@test.com",
                    hashed_password=hash_password("pw"), role=UserRole.student)
        db_session.add(user)
        await db_session.flush()
        assert user.id is not None
        assert user.role in (UserRole.student, "student")

    async def test_unique_username(self, db_session: AsyncSession):
        db_session.add(User(username="unique1", email="u1@t.com",
                            hashed_password="x", role=UserRole.student))
        db_session.add(User(username="unique1", email="u2@t.com",
                            hashed_password="x", role=UserRole.student))
        with pytest.raises(Exception):
            await db_session.flush()
        await db_session.rollback()

    async def test_unique_email(self, db_session: AsyncSession):
        db_session.add(User(username="u1", email="same@t.com",
                            hashed_password="x", role=UserRole.student))
        db_session.add(User(username="u2", email="same@t.com",
                            hashed_password="x", role=UserRole.student))
        with pytest.raises(Exception):
            await db_session.flush()
        await db_session.rollback()

    async def test_default_role(self, db_session: AsyncSession):
        user = User(username="defrole", email="dr@t.com",
                    hashed_password="x")
        db_session.add(user)
        await db_session.flush()
        assert user.role in (UserRole.student, "student")

    async def test_default_is_active(self, db_session: AsyncSession):
        user = User(username="active1", email="act@t.com",
                    hashed_password="x")
        db_session.add(user)
        await db_session.flush()
        assert user.is_active is True


class TestDeviceModel:
    async def test_create_device(self, db_session: AsyncSession, test_user):
        device = Device(
            device_id="dev-test-1",
            hardware_fingerprint="fp1",
            secure_random_key="key1",
            friendly_name="Test Device",
            os_name="Windows",
            os_version="11",
            user_id=test_user.id,
        )
        db_session.add(device)
        await db_session.flush()
        assert device.id is not None
        assert device.trust_status == DeviceTrust.pending
        assert device.is_approved is False
        assert device.os_name == "Windows"

    async def test_unique_device_id(self, db_session: AsyncSession):
        db_session.add(Device(device_id="dev-dup", hardware_fingerprint="a",
                              secure_random_key="b"))
        db_session.add(Device(device_id="dev-dup", hardware_fingerprint="c",
                              secure_random_key="d"))
        with pytest.raises(Exception):
            await db_session.flush()
        await db_session.rollback()


class TestProjectTemplateModel:
    async def test_create_template(self, db_session: AsyncSession):
        t = ProjectTemplate(
            slug="test-tmpl", name="Test Template",
            starter_files={"main.cpp": "// code"},
            sort_order=0,
        )
        db_session.add(t)
        await db_session.flush()
        assert t.id is not None
        assert t.starter_files == {"main.cpp": "// code"}
        assert t.is_active is True


class TestWorkspaceModel:
    async def test_create_workspace(self, db_session: AsyncSession, test_user):
        ws = Workspace(
            user_id=test_user.id,
            name="Test WS",
            file_index={"main.cpp": {}},
        )
        db_session.add(ws)
        await db_session.flush()
        assert ws.id is not None
        assert ws.last_synced == ws.last_synced_at
        assert ws.sync_version == 0

    async def test_last_synced_property(self, db_session: AsyncSession, test_user):
        ws = Workspace(user_id=test_user.id, name="Alias Test")
        db_session.add(ws)
        await db_session.flush()
        assert ws.last_synced == ws.last_synced_at


class TestWorkspaceFileModel:
    async def test_create_file(self, db_session: AsyncSession, test_user):
        ws = Workspace(user_id=test_user.id, name="File WS")
        db_session.add(ws)
        await db_session.flush()
        f = WorkspaceFile(
            workspace_id=ws.id,
            relative_path="main.cpp",
            file_hash="abc123",
            size_bytes=42,
        )
        db_session.add(f)
        await db_session.flush()
        assert f.id is not None
        assert f.workspace_id == ws.id


class TestCascadeDelete:
    async def test_workspace_cascades_files(self, db_session: AsyncSession, test_user):
        ws = Workspace(user_id=test_user.id, name="Cascade WS")
        db_session.add(ws)
        await db_session.flush()
        f = WorkspaceFile(workspace_id=ws.id, relative_path="test.cpp",
                          file_hash="abc", size_bytes=10)
        db_session.add(f)
        await db_session.flush()

        await db_session.delete(ws)
        await db_session.flush()
        result = await db_session.execute(
            select(func.count()).select_from(WorkspaceFile).where(
                WorkspaceFile.workspace_id == ws.id
            )
        )
        assert result.scalar() == 0
