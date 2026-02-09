import asyncio
import uuid

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel

from plugins.anylogmcp.agents.configuration import (
    LLMProvider,
    LLMRole,
    LLMSettings,
    User,
)

from .anylogmcp import MCPPluginManager

mcp_manager = MCPPluginManager()
api_router = APIRouter(prefix="/mcp", tags=["MCP"])


class ChatRequest(BaseModel):
    msg: str


class UserConfiguration(BaseModel):
    conn_id: str
    llms: dict[LLMRole, LLMSettings]


@api_router.get("/configurations")
async def get_configurations():
    users = list(mcp_manager.connections.values())

    return users

    raise HTTPException(400, "User not connected. Configuration failed")


@api_router.post("/configure")
async def post_configure(config: UserConfiguration):
    for _, user in mcp_manager.connections.items():
        if user.conn_id == uuid.UUID(config.conn_id):
            # Set configuration of LLMs
            for role, settings in config.llms.items():
                user.set_llm(role, settings)
            return {"status": "ok"}

    raise HTTPException(400, "User not connected. Configuration failed")


@api_router.websocket("/chat")
async def chat(ws: WebSocket):
    await ws.accept()

    conn_id = uuid.uuid4()
    user = User.from_defaults(conn_id=conn_id, provider=LLMProvider.openai)
    user._state.conn = ws
    mcp_manager.connections[ws] = user
    print(f"[{conn_id}] WebSocket connected")

    try:
        await asyncio.sleep(1)
        await ws.send_json({"id": str(conn_id)})
        while True:
            message = await ws.receive_text()
            await mcp_manager.handle(ws, message)
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        print("Terminating connection")
        await mcp_manager.terminate(ws)
