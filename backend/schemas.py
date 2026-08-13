"""
schemas.py — Pydantic request/response models.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth ---
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str

    model_config = {"from_attributes": True}


class RoleUpdateRequest(BaseModel):
    role: str  # "admin" or "staff"


# --- Inventory ---
class InventoryCreate(BaseModel):
    part_name: str
    car_model: str
    generation_type: str = ""
    part_category: str
    position: str
    side: str
    quality_tier: str
    oem_number: str = ""
    selling_price: float = 0
    stock: int = 0
    low_stock_threshold: int = 3
    compatible_models: list[str] = []


class InventoryUpdate(BaseModel):
    part_name: Optional[str] = None
    car_model: Optional[str] = None
    generation_type: Optional[str] = None
    part_category: Optional[str] = None
    position: Optional[str] = None
    side: Optional[str] = None
    quality_tier: Optional[str] = None
    oem_number: Optional[str] = None
    selling_price: Optional[float] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    compatible_models: Optional[list[str]] = None


class InventoryOut(BaseModel):
    id: int
    part_name: str
    car_model: str
    generation_type: str
    part_category: str
    position: str
    side: str
    quality_tier: str
    oem_number: str
    selling_price: float
    stock: int
    low_stock_threshold: int
    compatible_models: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Stock Adjustment ---
class StockAdjustRequest(BaseModel):
    delta: int  # positive = increase, negative = decrease
    reason: str


# --- Audit Log ---
class AuditLogOut(BaseModel):
    id: int
    worker_name: str
    worker_role: str
    part_name: str
    oem_number: str
    car_model: str
    generation_type: str
    action_type: str
    reason: str
    previous_stock: Optional[int]
    new_stock: Optional[int]
    delta: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Worker ---
class WorkerOut(BaseModel):
    id: int
    user_id: int
    name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard ---
class FastestMovingPart(BaseModel):
    part_name: str
    car_model: str
    total_issued: int


class StockValueByModel(BaseModel):
    car_model: str
    total_value: float


class CategoryQualityMix(BaseModel):
    part_category: str
    quality_tier: str
    count: int


class WorkerActivity(BaseModel):
    worker_name: str
    action_count: int


class DashboardStats(BaseModel):
    total_stock_value: float
    low_stock_count: int
    out_of_stock_count: int
    thirty_day_action_count: int
    fastest_moving: list[FastestMovingPart]
    reorder_list: list[InventoryOut]
    stock_value_by_model: list[StockValueByModel]
    category_quality_mix: list[CategoryQualityMix]
    worker_activity: list[WorkerActivity]
