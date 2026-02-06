import asyncio
from typing import Optional, Union
import httpx
from pydantic_ai import Agent
from pydantic_ai.providers.groq import GroqProvider
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.models import Model
from pydantic import BaseModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.google import GoogleModel
from dotenv import load_dotenv
from pydantic_ai.mcp import MCPServerSSE, MCPServerStdio, MCPServerStreamableHTTP
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
import json
from plugins.anylogmcp.agents.base import ResultFn, StreamingMarker
from plugins.anylogmcp.agents.interagent_tools import setup_interagent_tools
from plugins.anylogmcp.agents.core.types import AnylogAgentDeps
from plugins.anylogmcp.agents.visualization.charts.charting_agent import create_chart_agent
from plugins.anylogmcp.agents.mcp.mcp_agent import MCPAgent
from plugins.anylogmcp.agents.core.sys_prompt import CORE_PROMPT
import os
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.providers.anthropic import AnthropicProvider

# model = AnthropicModel(
#     'claude-sonnet-4-5', provider=AnthropicProvider(api_key='your-api-key')
# )

from plugins.anylogmcp.agents.visualization.tables.tabular_agent import create_tabular_agent

load_dotenv('/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env')

default_model = OpenAIChatModel(
    # 'qwen/qwen3-14b',
    # 'zai-org/glm-4.7-flash',
    # 'openai/gpt-oss-20b',
    'qwen/qwen3-30b-a3b-2507',
    provider=OpenAIProvider(
        base_url='http://100.127.214.126:1234/v1',
        api_key="lm-studio"
    ),
)

class CoreAgentOutput(BaseModel):
    output: str
    # chart_plots: List[PlotChartRequest]


# provider = GoogleProvider(api_key=os.getenv('GEMINI_API_KEY'))
# model = GoogleModel('gemini-2.5-flash', provider=provider)

# model = GroqModel(
#     'openai/gpt-oss-20b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'llama-3.3-70b-versatile', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'openai/gpt-oss-120b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
# )

class AnylogAgent(Agent):
    def __init__(self, model: Model, guidelines: str, mcp: Union[MCPServerSSE, MCPServerStreamableHTTP, MCPServerStdio],**kwargs):
        super().__init__(
            model=model,
            system_prompt=guidelines,
            retries=3,
            deps_type=AnylogAgentDeps, #type:ignore
            output_type=CoreAgentOutput, #type:ignore
            **kwargs
        )
        self.selected_model = model
        self.mcp = mcp
        self.guidelines = guidelines
        self.agent_deps: AnylogAgentDeps

def create_default_agent(mcp: MCPServerSSE, model: Optional[Model] = None) -> AnylogAgent:
        base_agent = AnylogAgent(model if model else default_model, guidelines=CORE_PROMPT, mcp=mcp)
        full_agent = setup_interagent_tools(base_agent)

        chart_agent = create_chart_agent(custom_model=full_agent.selected_model)
        tabular_agent = create_tabular_agent(custom_model=full_agent.selected_model)
        mcp_agent = MCPAgent(mcp=full_agent.mcp, on_tool_call=None) 
        full_agent.agent_deps = AnylogAgentDeps(None, chart_agent, tabular_agent, mcp_agent)

        return full_agent

async def run_core_agent(agent: AnylogAgent, prompt: str, resultFn: ResultFn):
    agent.agent_deps.resultFn = resultFn
    agent.agent_deps.mcp_agent.on_tool_call = resultFn
    
    json_buffer = ""
    last_msg_length = 0

    try:
        await resultFn("Generating a response...", StreamingMarker.STATUS_UPDATE)

        async with agent.run_stream(prompt, deps=agent.agent_deps) as result:
            try:
                async for resp, is_complete in result.stream_responses():
                    print(f"Response: {resp}")
                    # await resultFn("Generating a response...", StreamingMarker.STATUS_UPDATE)
                    print(f"Is Complete: {is_complete}")
                    
                    if not resp.parts:
                        continue
                    
                    part = resp.parts[0]

                    tool_called = hasattr(part, "tool_name")
                    if tool_called and part.tool_name == 'final_result':
                        tool_name = getattr(part, "tool_name")
                        if tool_name == "final_result":
                            await resultFn(f"Finalizing your response...", StreamingMarker.STATUS_UPDATE)
                        else:
                            await resultFn(f"Using {tool_name}", StreamingMarker.STATUS_UPDATE)

                        raw_args = part.args
                    else:
                        continue
                    
                    if isinstance(raw_args, dict):
                        result_data = raw_args
                    elif isinstance(raw_args, str):
                        json_buffer = raw_args
                        try:
                            result_data = json.loads(json_buffer)
                        except json.JSONDecodeError:
                            import re
                            match = re.search(r'"output"\s*:\s*"([^"]*(?:\\"[^"]*)*)', json_buffer)
                            if match:
                                partial_output = match.group(1).replace('\\"', '"').replace('\\n', '\n')
                                result_data = {"output": partial_output, "chart_plots": []}
                            else:
                                continue
                    else:
                        continue
                    
                    output_text = result_data.get("output", "")
                    
                    if output_text:
                        new_text = output_text[last_msg_length:]
                        if new_text:
                            await resultFn(new_text, StreamingMarker.CHUNK)
                            last_msg_length = len(output_text)
            except (asyncio.CancelledError, httpx.ReadError, httpx.RemoteProtocolError):
                print(f"Core agent stream interrupted or cancelled")
                return
        await resultFn("", StreamingMarker.END)
        
    except (asyncio.CancelledError, httpx.ReadError, httpx.RemoteProtocolError):
        print(f"Core agent interrupted or cancelled")
    except Exception as e:
        print(f"Error in run_core_agent: ''''{e}'''")
    finally:
        pass
