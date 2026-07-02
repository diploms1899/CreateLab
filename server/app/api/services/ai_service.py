"""DeepSeek AI proxy service — builds prompts, calls API, returns responses."""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from app.core.config import settings


SYSTEM_PROMPT_TEMPLATE = """You are an AI instructor for the CoreV2 Summer Camp.

PROJECT: {project_name}
PROJECT DESCRIPTION: {project_description}

YOUR PERSONALITY:
{ai_personality}

HARDWARE:
{hardware_config}

CODING STANDARDS:
{coding_standards}

WORKSPACE FILES:
{workspace_files}

BUILD OUTPUT:
{build_output}

RULES:
- You may ONLY modify files inside the active workspace.
- Every change must be presented as a unified diff before applying.
- Explain your reasoning before showing code.
- Never overwrite files directly — always show the diff first.
- Be encouraging but precise.
- You are a senior embedded engineer mentoring a student."""


class AIService:
    """Proxy service for DeepSeek API calls with automatic prompt assembly."""

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            base_url=settings.deepseek_base_url,
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(120.0),
        )

    def build_system_prompt(
        self, project_name: str, project_description: str,
        ai_personality: str, hardware_config: dict,
        coding_standards: str, workspace_files: str, build_output: str = "",
    ) -> str:
        return SYSTEM_PROMPT_TEMPLATE.format(
            project_name=project_name, project_description=project_description,
            ai_personality=ai_personality,
            hardware_config=json.dumps(hardware_config, indent=2),
            coding_standards=coding_standards,
            workspace_files=workspace_files,
            build_output=build_output or "(no build output yet)",
        )

    async def chat(self, system_prompt: str, messages: list[dict], user_message: str):
        from app.api.schemas.ai import AIResponse
        payload = {
            "model": settings.deepseek_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
                {"role": "user", "content": user_message},
            ],
            "max_tokens": settings.deepseek_max_tokens,
            "temperature": settings.deepseek_temperature,
            "stream": False,
        }
        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        choice = data["choices"][0]
        return AIResponse(
            content=choice["message"]["content"],
            role=choice["message"]["role"],
            tokens_used=data.get("usage", {}).get("total_tokens", 0),
            finish_reason=choice.get("finish_reason", "stop"),
        )

    async def chat_stream(self, system_prompt: str, messages: list[dict], user_message: str) -> AsyncIterator[str]:
        payload = {
            "model": settings.deepseek_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
                {"role": "user", "content": user_message},
            ],
            "max_tokens": settings.deepseek_max_tokens,
            "temperature": settings.deepseek_temperature,
            "stream": True,
        }
        async with self.client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    chunk = line[6:]
                    if chunk == "[DONE]":
                        break
                    try:
                        data = json.loads(chunk)
                        delta = data["choices"][0].get("delta", {})
                        if content := delta.get("content"):
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
