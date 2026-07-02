"""Schemas for AI requests/responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AIRequest(BaseModel):
    message: str = Field(..., min_length=1)
    build_output: str | None = None
    include_files: list[str] = Field(default_factory=list)


class AIResponse(BaseModel):
    content: str
    role: str = "assistant"
    tokens_used: int = 0
    finish_reason: str = "stop"
