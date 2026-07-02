"""Application lifecycle event handlers."""

from __future__ import annotations

import logging

logger = logging.getLogger("createlab")


async def on_startup() -> None:
    """Called when the server starts."""
    logger.info("CreateLab server starting up.")


async def on_shutdown() -> None:
    """Called when the server shuts down."""
    logger.info("CreateLab server shutting down.")
