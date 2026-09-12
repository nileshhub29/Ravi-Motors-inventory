"""main.py — FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.database import create_tables
from backend.websocket import manager
from backend.routers import (
    auth_router,
    inventory_router,
    audit_router,
    workers_router,
    dashboard_router,
    sync_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    await create_tables()
    yield


app = FastAPI(
    title="MarutiParts Hub API",
    description="Maruti Suzuki Spare Parts Inventory Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev servers and any Vercel deployment URL
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://ravi-motors-inventory-r3cpbbvj2.vercel.app",
]
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Matches all Vercel deployment preview/production URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(inventory_router.router)
app.include_router(audit_router.router)
app.include_router(workers_router.router)
app.include_router(dashboard_router.router)
app.include_router(sync_router.router)

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "MarutiParts Hub"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time inventory updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client sends pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)