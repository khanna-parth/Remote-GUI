from typing import Any, Callable, Awaitable, Literal
from enum import Enum

class StreamingMarker(Enum):
    CHUNK = "TEXT_CHUNK"
    END = "TEXT_END"
    CHART_DATA = "CHART_DATA"
    TABLE_DATA = "TABLE_DATA"
    STATUS_UPDATE = "STATUS_UPDATE"
    TOOL_EVENT = "TOOL_EVENT"

type ResultFn = Callable[[Any, StreamingMarker], Awaitable[str]]
# type ToolListenerFn = Callable[[str, StreamingMarker], Awaitable[str]]

def parse_agent_error(e) -> str:
    print(f"Agent error: {e}")
    if hasattr(e, "error"):
        return getattr(e, "error")

    if hasattr(e, "body"):
        body = getattr(e, "body")

        if isinstance(body, dict):
            if "error" in body:
                return body["error"]
            if "message" in body:
                return body["message"]

        if hasattr(body, "error"):
            return getattr(body, "error")
        if hasattr(body, "message"):
            return getattr(body, "message")

    return str(e)
