"""CoreV2 CreateLab Server — entry point for running the server."""

import uvicorn

from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
