import asyncio
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import WebSocket
from pydantic_ai.mcp import MCPServerSSE
from starlette.websockets import WebSocketDisconnect, WebSocketState
from uvicorn.protocols.utils import ClientDisconnected
from websockets.exceptions import ConnectionClosedOK

from plugins.anylogmcp.agents.base import StreamingMarker, parse_agent_error
from plugins.anylogmcp.agents.configuration import User
from plugins.anylogmcp.agents.core.core_agent import (
    create_default_agent,
    run_core_agent,
)

load_dotenv(
    "/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env"
)


class MCPPluginManager:
    def __init__(self):
        self.connections: Dict[WebSocket, User] = {}
        server = MCPServerSSE("http://50.116.9.238:32349/mcp/sse")
        self.agent = create_default_agent(mcp=server)

    async def handle(self, ws: WebSocket, message):
        user = self.connections.get(ws)
        if not user:
            print("ERROR: No user found for WebSocket")
            return

        try:
            for task in user._state.tasks:
                if task and not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        print(f"[{user.conn_id}] Previous task cancelled")
                    except Exception as e:
                        print(f"[{user.conn_id}] Error during task cancellation: {e}")

            user._state.tasks.clear()

            print(f"[{user.conn_id}] Starting new task")
            task = asyncio.create_task(self._worker(user, message))
            user._state.tasks.append(task)

        except Exception as e:
            print(f"Failed handling message: {e}")
            await self._cleanup_user(user)

    async def _worker(self, user: User, message):
        conn_id = user.conn_id
        ws = user._state.conn

        try:

            async def stream_ws(msg: Any, marker: StreamingMarker):
                try:
                    if not ws or ws.client_state != WebSocketState.CONNECTED:
                        raise asyncio.CancelledError("Client not connected")
                    datastream = {
                        "conn_id": str(conn_id),
                        "data": msg,
                        "marker": marker.value
                        if hasattr(marker, "value")
                        else str(marker),
                    }
                    await ws.send_json(datastream)
                    print(f"[{conn_id}] Streamed {datastream['marker']} response")
                    return "ok"
                except (
                    WebSocketDisconnect,
                    ConnectionClosedOK,
                    ClientDisconnected,
                    RuntimeError,
                ):
                    print(f"[{conn_id}] WebSocket disconnected during send")
                    raise asyncio.CancelledError("WebSocket disconnected")
                except Exception as e:
                    print(f"Error in stream_ws: {e}")

            await run_core_agent(self.agent, message, stream_ws, user)
        except Exception as e:
            print("Parsing agent error")
            parsed_error = parse_agent_error(e)
            print(f"[{conn_id}] Worker error: {parsed_error}")
            if ws and ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_json({"error": parsed_error})
                except Exception:
                    pass

    async def _cleanup_user(self, user: User):
        ws = user._state.conn
        if ws:
            self.connections.pop(ws, None)
            user._state.conn = None

        for task in user._state.tasks:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        user._state.tasks.clear()
        print(f"[{user.conn_id}] Cleaned up user and runtime state")

    async def terminate(self, ws: WebSocket):
        user = self.connections.get(ws)
        if user:
            await self._cleanup_user(user)
