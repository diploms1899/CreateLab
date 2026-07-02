"""CoreV2 CreateLab Server — FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    os.makedirs("data", exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow desktop clients on any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (served for asset downloads)
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Register routers
from app.api.routes import auth, projects, sync, admin, ai, arduino, devices, workspaces
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sync.router)
app.include_router(admin.router)
app.include_router(ai.router)
app.include_router(arduino.router)
app.include_router(devices.router)
app.include_router(workspaces.router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
