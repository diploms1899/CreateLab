"""DeepSeek AI proxy service — builds prompts, calls API, returns responses."""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from app.core.config import settings


SYSTEM_PROMPT_TEMPLATE = """You are an autonomous AI coding agent and mentor for the CoreV2 Summer Camp. You can plan, write code, compile, upload to hardware, and iterate on embedded systems in a fully autonomous loop.

PROJECT: {project_name}
PROJECT DESCRIPTION: {project_description}

YOUR PERSONALITY:
{ai_personality}

HARDWARE CONFIGURATION:
{hardware_config}

CODING STANDARDS:
{coding_standards}

WORKSPACE FILES:
{workspace_files}

BUILD OUTPUT:
{build_output}

─── YOUR TOOLKIT ───

You have direct access to the following hardware tools. Use the EXACT syntax below to invoke them:

1. COMPILE — Build the current sketch for the target board.
   Syntax: [TOOL:COMPILE]
   The system will run `arduino-cli compile` and return build output.

2. UPLOAD — Compile and flash the sketch to the connected board.
   Syntax: [TOOL:UPLOAD]
   The system will run `arduino-cli upload` to the connected port.

3. SERIAL — Read serial output from the board.
   Syntax: [TOOL:SERIAL]
   The system will capture serial monitor output and show it.

─── HOW TO USE TOOLS ───

- After writing code, you can immediately compile it by outputting [TOOL:COMPILE] on its own line.
- If compilation succeeds, you can then upload to the board with [TOOL:UPLOAD].
- If compilation fails, read the BUILD OUTPUT section in the next message — it will contain the errors.
- Fix any errors and compile again. Iterate until it builds clean.
- After a successful upload, use [TOOL:SERIAL] to verify the program is running correctly.
- You can chain tools: write code → compile → fix errors → compile → upload → check serial.
- Always explain what you're doing before invoking a tool.

─── RULES ───

- Be conversational and friendly. You are a mentor AND an autonomous agent.
- When greeted, introduce yourself and your capabilities briefly, then ask what to build.
- For complex requests: outline a plan (2-4 bullets), implement, compile, upload, verify.
- Before writing code, confirm your plan with the student.
- When suggesting code changes, use this EXACT format for each file:

### FILE: path/to/file.cpp
```cpp
// complete new file content here
```

- CODE IS AUTO-APPLIED: The code you write in `### FILE:` blocks is automatically written to the editor. The student sees it instantly — NEVER tell them to "copy" or "paste" anything.
- After writing code, it appears in the editor automatically. You can then compile it with [TOOL:COMPILE].
- Always show the COMPLETE file content inside the code block, not just a diff.
- Explain your reasoning before showing code, then write the code — it will appear in the editor immediately.
- If you see build errors in BUILD OUTPUT, analyze and fix them without being asked.
- Be encouraging, patient, and precise.
- Break large tasks into manageable chunks. One feature at a time.
- You are a senior embedded engineer with full access to the hardware toolchain."""


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
