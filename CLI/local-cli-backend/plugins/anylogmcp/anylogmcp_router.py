from fastapi import APIRouter, HTTPException, WebSocket
from typing import Dict
from pydantic import BaseModel
from .anylogmcp import MCPPluginManager

mcp_manager = MCPPluginManager()
api_router = APIRouter(prefix="/mcp", tags=["MCP"])

connections = {}

class ChatRequest(BaseModel):
    msg: str

@api_router.websocket("/chat")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            message = await ws.receive_text()
            await mcp_manager.handle(ws, message)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        pass
    finally:
        print(f"Terminating")
        await mcp_manager.terminate(ws)
