from starlette.websockets import WebSocketDisconnect, WebSocketState
from websockets.exceptions import ConnectionClosedOK
from uvicorn.protocols.utils import ClientDisconnected
from typing import Any
import asyncio
import os
from typing import Dict
import uuid
from fastapi import WebSocket
from pydantic_ai.mcp import MCPServerSSE
from dotenv import load_dotenv
from plugins.anylogmcp.agents.core.core_agent import AnylogAgent, create_default_agent, run_core_agent
from plugins.anylogmcp.agents.base import StreamingMarker, parse_agent_error

load_dotenv('/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env')

class MCPPluginManager:
    def __init__(self):
        self.sockets: Dict[WebSocket, uuid.UUID] = {}
        self.tasks: Dict[uuid.UUID, asyncio.Task] = {}
        server = MCPServerSSE('http://50.116.9.238:32349/mcp/sse')
        self.agent = create_default_agent(mcp=server)
    async def handle(self, ws: WebSocket, message):
        conn_id = uuid.uuid4()
        try:
            self.sockets[ws] = conn_id
            print(f"[{conn_id}] issued new chat request")
            task = asyncio.create_task(self._worker(ws, conn_id, message))
            self.tasks[conn_id] = task
        except Exception as e:
            print(f"Failed handling WebSocket: {e}")
            self.tasks.pop(conn_id, None)
            self.sockets.pop(ws, None)

    async def _worker(self, ws: WebSocket, conn_id, message):
        try:
            async def stream_ws(msg: Any, marker: StreamingMarker):
                try:
                    if ws.client_state != WebSocketState.CONNECTED:
                        raise asyncio.CancelledError("Client not connected")
                    datastream = {
                        "conn_id": str(conn_id),
                        "data": msg,
                        "marker": marker.value if hasattr(marker, 'value') else str(marker)
                    }
                    await ws.send_json(datastream)
                    print(f"[{conn_id}] Streamed {datastream["marker"]} response")
                    return "ok"
                except (WebSocketDisconnect, ConnectionClosedOK, ClientDisconnected, RuntimeError) as e:
                    print(f"[{conn_id}] WebSocket disconnected during send")
                    raise asyncio.CancelledError("WebSocket disconnected")
                except Exception as e:
                    print(f"Error in stream_ws: {e}")
            
            await run_core_agent(self.agent, message, stream_ws)
        except Exception as e:
            print(f"Parsing agent error")
            parsed_error = parse_agent_error(e)
            print(f"[{conn_id}] Worker error: {parsed_error}")
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_json({'error': parsed_error})
                except:
                    pass
    
    async def terminate(self, ws: WebSocket):
        conn_id = self.sockets.get(ws)
        if conn_id:
            task = self.tasks.get(conn_id)
            if task and not task.done():
                print(f"Cancelling task for: {conn_id}")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
            else:
                print(f"Task already completed for: {conn_id}")

