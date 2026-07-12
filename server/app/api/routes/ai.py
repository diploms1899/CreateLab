"""AI proxy routes — desktop talks to server, never DeepSeek directly."""

from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.api.models.user import User
from app.api.models.workspace import Workspace
from app.api.models.conversation import Conversation
from app.api.models.project import ProjectTemplate
from app.api.schemas.ai import AIRequest, AIResponse
from app.api.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])


def _format_files(files: dict[str, str]) -> str:
    """Format file contents for the system prompt."""
    lines = []
    for path, content in files.items():
        lines.append(f"--- {path} ---")
        lines.append(content)
        lines.append("")
    return "\n".join(lines) if lines else "{}"


@router.post("/chat/{workspace_id}", response_model=AIResponse)
async def chat(
    workspace_id: str,
    req: AIRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()

    if workspace:
        tmpl_result = await db.execute(
            select(ProjectTemplate).where(ProjectTemplate.id == workspace.template_id)
        )
        template = tmpl_result.scalar_one_or_none()
    else:
        # Fallback: use first available template for context
        tmpl_result = await db.execute(select(ProjectTemplate).limit(1))
        template = tmpl_result.scalar_one_or_none()

    hist_result = await db.execute(
        select(Conversation)
        .where(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.sequence)
    )
    history = hist_result.scalars().all()
    messages = [{"role": h.role, "content": h.content} for h in history[-20:]]

    service = AIService()
    hw_config = template.hardware_config if template and template.hardware_config else {}
    if isinstance(hw_config, str):
        hw_config = json.loads(hw_config)
    system_prompt = service.build_system_prompt(
        project_name=template.name if template else "Project",
        project_description=template.description if template else "",
        ai_personality=template.ai_personality if template else "",
        hardware_config=hw_config,
        coding_standards=template.coding_standards if template else "",
        workspace_files=_format_files(req.files) if req.files else str(workspace.file_index) if workspace and workspace.file_index else "{}",
        build_output=req.build_output or "",
    )

    response = await service.chat(system_prompt, messages, req.message)

    next_seq = len(history)
    db.add(Conversation(
        workspace_id=workspace_id, role="user", content=req.message, sequence=next_seq,
    ))
    db.add(Conversation(
        workspace_id=workspace_id, role="assistant", content=str(response.content),
        tokens_used=int(response.tokens_used), sequence=next_seq + 1,
    ))

    return response


@router.post("/chat/{workspace_id}/stream")
async def chat_stream(
    workspace_id: str,
    req: AIRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    service = AIService()
    system_prompt = service.build_system_prompt(
        project_name="Project", project_description="", ai_personality="",
        hardware_config={}, coding_standards="",
        workspace_files=workspace.file_index if workspace.file_index else "{}",
        build_output=req.build_output or "",
    )

    async def event_stream():
        async for chunk in service.chat_stream(system_prompt, [], req.message):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
