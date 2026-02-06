import asyncio
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel
from pydantic_ai import Agent, ModelSettings, RunContext, ToolsetTool
from pydantic_ai.mcp import MCPServerSSE, MCPServerStdio, MCPServerStreamableHTTP
from pydantic_ai.models import Model
from pydantic_ai.providers.groq import GroqProvider
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from plugins.anylogmcp.agents.mcp.sys_prompt import MCP_PROMPT
from plugins.anylogmcp.agents.base import ResultFn, StreamingMarker


from dotenv import load_dotenv

load_dotenv('/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env')

default_model = OpenAIChatModel(
    # 'qwen/qwen3-next-80b-a3b-instruct:free',
    # 'qwen/qwen3-14b',
    # 'zai-org/glm-4.7-flash',
    # 'openai/gpt-oss-20b',
    'qwen/qwen3-30b-a3b-2507',
    provider=OpenAIProvider(
        base_url='http://100.127.214.126:1234/v1',
        api_key="lm-studio"
        # base_url='https://openrouter.ai/api/v1',
        # api_key=os.getenv("OPENROUTER_API_KEY")
    ),
)

# provider = GoogleProvider(api_key=os.getenv('GEMINI_API_KEY'))
# model = GoogleModel('gemini-2.5-flash', provider=provider)

# model = GroqModel(
#     'openai/gpt-oss-20b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'llama-3.3-70b-versatile', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'openai/gpt-oss-120b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
# )

class ToolSummary(BaseModel):
    name: str
    description: str

class MCPAgent(Agent):
    def __init__(self, mcp: Union[MCPServerSSE, MCPServerStreamableHTTP, MCPServerStdio], model: Optional[Model] = None, on_tool_call: Optional[ResultFn] = None):
        self.on_tool_call = on_tool_call
        original_tool_call = mcp.call_tool
        
        async def catch_tool_call(name: str, tool_args: Dict[str, Any], ctx: RunContext[Any], tool: ToolsetTool[Any]):
            print(f"Calling MCP tool {name} | {ctx.tool_call_id}")
            print(f"Args: {tool_args}")
            if self.on_tool_call:
                await self.on_tool_call({'name': name, 'id': ctx.tool_call_id, 'done': False}, StreamingMarker.TOOL_EVENT)

            tool_result = await original_tool_call(name, tool_args, ctx, tool)
            print(f"{ctx.tool_call_id} tool result: {tool_result}")
            if self.on_tool_call:
                await self.on_tool_call({'name': name, 'id': ctx.tool_call_id, 'done': True}, StreamingMarker.TOOL_EVENT)

            return tool_result

        mcp.call_tool = catch_tool_call

        super().__init__(model=model if model else default_model, toolsets=[mcp], retries=3, system_prompt=MCP_PROMPT, model_settings=ModelSettings(parallel_tool_calls=False),)
        self.mcp = mcp

    async def list_help(self) -> List[ToolSummary]:
        tools = await self.mcp.list_tools()
        
        summaries: List[ToolSummary] = [ToolSummary(name=tool.name, description=tool.description or "") for tool in tools]

        return summaries
    
    async def perform_task(self, prompt) -> str:
        print(f"[MCP Agent] Received query: {prompt}")
        response = await self.run(prompt)


        print(f"[MCP Agent] Result: {response.output}")
        return response.output

if __name__ == "__main__":
    def test():
        mcp = MCPServerSSE('http://23.239.12.151:32349/mcp/sse')
        agent = MCPAgent(mcp=mcp)

        while True:
            prompt = input(f"Input: ").strip()
            if prompt == "break":
                break

            output = agent.run_sync(prompt)
            print(output)

    test()
    # asyncio.run(test())
