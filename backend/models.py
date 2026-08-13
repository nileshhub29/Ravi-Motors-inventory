"""
models.py — SQLAlchemy ORM models for the spare parts inventory.
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    String, Integer, Numeric, Text, DateTime, Enum, ForeignKey, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class AppRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    staff = "staff"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # relationships
    role_entry: Mapped["UserRole"] = relationship(back_populates="user", uselist=False, lazy="joined")
    worker: Mapped["Worker"] = relationship(back_populates="user", uselist=False, lazy="joined")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    role: Mapped[AppRole] = mapped_column(Enum(AppRole), nullable=False, default=AppRole.staff)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="role_entry")


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    role: Mapped[AppRole] = mapped_column(Enum(AppRole), nullable=False, default=AppRole.staff)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="worker")


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    part_name: Mapped[str] = mapped_column(String(500), nullable=False)
    car_model: Mapped[str] = mapped_column(String(100), nullable=False)
    generation_type: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    part_category: Mapped[str] = mapped_column(String(50), nullable=False)  # Headlights, Backlights, Bumpers
    position: Mapped[str] = mapped_column(String(20), nullable=False)       # Front, Back
    side: Mapped[str] = mapped_column(String(20), nullable=False)           # LH, RH, Universal
    quality_tier: Mapped[str] = mapped_column(String(50), nullable=False)   # MGP Genuine, Aftermarket
    oem_number: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    compatible_models: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class StockAuditLog(Base):
    __tablename__ = "stock_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    worker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    worker_role: Mapped[str] = mapped_column(String(50), nullable=False)
    part_name: Mapped[str] = mapped_column(String(500), nullable=False)
    oem_number: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    car_model: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    generation_type: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    previous_stock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_stock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    delta: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now()
    )
