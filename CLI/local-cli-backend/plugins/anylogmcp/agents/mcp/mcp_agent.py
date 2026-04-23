import re
from typing import Any, Dict, List, Optional, Union

from dotenv import load_dotenv
from pydantic import BaseModel
from pydantic_ai import Agent, ModelSettings, RunContext, ToolsetTool
from pydantic_ai.mcp import MCPServerSSE, MCPServerStdio, MCPServerStreamableHTTP
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from plugins.anylogmcp.agents.base import ResultFn, StreamingMarker
from plugins.anylogmcp.agents.configuration import User
from plugins.anylogmcp.agents.mcp.sys_prompt import MCP_PROMPT

load_dotenv(
    "/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env"
)

default_model = OpenAIChatModel(
    # 'qwen/qwen3-next-80b-a3b-instruct:free',
    # 'qwen/qwen3-14b',
    # 'zai-org/glm-4.7-flash',
    # 'openai/gpt-oss-20b',
    "qwen/qwen3-30b-a3b-2507",
    provider=OpenAIProvider(
        base_url="http://100.127.214.126:1234/v1",
        api_key="lm-studio",
        # base_url='https://openrouter.ai/api/v1',
        # api_key=os.getenv("OPENROUTER_API_KEY")
    ),
)


class ToolSummary(BaseModel):
    name: str
    description: str


class MCPResult(BaseModel):
    answer: str


class MCPAgent(Agent):
    def __init__(
        self,
        mcp: Union[MCPServerSSE, MCPServerStreamableHTTP, MCPServerStdio],
        model: Optional[Model] = None,
        on_tool_call: Optional[ResultFn] = None,
    ):
        self.on_tool_call = on_tool_call
        self._run_mode = "general"
        original_tool_call = mcp.call_tool

        async def catch_tool_call(
            name: str,
            tool_args: Dict[str, Any],
            ctx: RunContext[Any],
            tool: ToolsetTool[Any],
        ):
            try:
                if self._run_mode == "sql":
                    allowed_sql_tools = {"executeQuery", "listColumns", "listTables"}
                    if name not in allowed_sql_tools:
                        return (
                            f"BLOCKED: '{name}' is outside SQL-mode allowed tools "
                            f"{sorted(allowed_sql_tools)}."
                        )

                print(f"Calling MCP tool {name} | {ctx.tool_call_id}")
                print(f"Args: {tool_args}")
                if self.on_tool_call:
                    await self.on_tool_call(
                        {
                            "tool_name": name,
                            "tool_id": ctx.tool_call_id,
                            "tool_status": "IN_PROGRESS",
                            "tool_data": None,
                        },
                        StreamingMarker.TOOL_EVENT,
                    )

                tool_result = await original_tool_call(name, tool_args, ctx, tool)
                print(f"{ctx.tool_call_id} tool result: {tool_result}")
                if self.on_tool_call:
                    await self.on_tool_call(
                        {
                            "tool_name": name,
                            "tool_id": ctx.tool_call_id,
                            "tool_status": "SUCCESS",
                            "tool_data": {"result": tool_result},
                        },
                        StreamingMarker.TOOL_EVENT,
                    )

                return tool_result
            except Exception as e:
                print(f"Failed to process intercepted tool call: {e}")
                if self.on_tool_call:
                    try:
                        await self.on_tool_call(
                            {
                                "tool_name": name,
                                "tool_id": ctx.tool_call_id,
                                "tool_status": "FAILED",
                                "tool_data": {"error": str(e)},
                            },
                            StreamingMarker.TOOL_EVENT,
                        )
                    except Exception as e:
                        print(f"Tool: {name} failed: {e}")

        mcp.call_tool = catch_tool_call

        super().__init__(
            model=model if model else default_model,
            toolsets=[mcp],
            retries=3,
            system_prompt=MCP_PROMPT,
            output_type=MCPResult,
            model_settings=ModelSettings(parallel_tool_calls=False),
        )
        self.mcp = mcp

    async def list_help(self) -> List[ToolSummary]:
        tools = await self.mcp.list_tools()

        summaries: List[ToolSummary] = [
            ToolSummary(name=tool.name, description=tool.description or "")
            for tool in tools
        ]

        return summaries

    async def perform_task(self, prompt: str, user_settings: User) -> str:
        print(f"[MCP Agent] Received query: {prompt}")
        lowered = prompt.lower()
        self._run_mode = (
            "sql"
            if re.search(
                r"\b(sql|select|from|where|database|db|table|column|rows|entries)\b",
                lowered,
            )
            else "general"
        )

        if self._run_mode == "sql":
            prompt = (
                "SQL MODE INSTRUCTIONS:\n"
                "- Use direct SQL retrieval workflow only.\n"
                "- Prefer executeQuery first when table and columns are already specified.\n"
                "- If schema mismatch happens, call listColumns once, then retry executeQuery once.\n"
                "- Avoid discovery/policy/network/meta tools.\n"
                "- Keep total tool calls <= 3 unless an execution error requires one extra retry.\n\n"
                f"Task:\n{prompt}"
            )

        model = user_settings.mcp_model()
        response = await self.run(prompt, model=model)

        print(f"[MCP Agent] Result: {response.output}")
        return response.output.answer
