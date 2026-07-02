"""Device registration model."""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base


class DeviceTrust(str, enum.Enum):
    pending = "pending"
    trusted = "trusted"
    disabled = "disabled"
    revoked = "revoked"


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(128), unique=True, nullable=False, index=True)
    hardware_fingerprint = Column(String(256), nullable=False)
    secure_random_key = Column(String(256), nullable=False)
    friendly_name = Column(String(128), nullable=True)
    operating_system = Column(String(64), nullable=True)
    trust_status = Column(Enum(DeviceTrust), default=DeviceTrust.pending, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    last_user = Column(String(128), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    permission_level = Column(String(32), default="student")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="devices")
