import re
from typing import Optional, Union

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerSSE, MCPServerStdio, MCPServerStreamableHTTP
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from plugins.anylogmcp.agents.base import ResultFn, StreamingMarker
from plugins.anylogmcp.agents.configuration import User
from plugins.anylogmcp.agents.core.sys_prompt import CORE_PROMPT
from plugins.anylogmcp.agents.core.types import AnylogAgentDeps
from plugins.anylogmcp.agents.interagent_tools import setup_interagent_tools
from plugins.anylogmcp.agents.mcp.mcp_agent import MCPAgent
from plugins.anylogmcp.agents.visualization.charts.charting_agent import (
    create_chart_agent,
)
from plugins.anylogmcp.agents.visualization.tables.tabular_agent import (
    create_tabular_agent,
)

load_dotenv(
    "/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env"
)

default_model = OpenAIChatModel(
    "qwen/qwen3-30b-a3b-2507",
    provider=OpenAIProvider(
        base_url="http://100.127.214.126:1234/v1", api_key="lm-studio"
    ),
)


class AnylogAgent(Agent):
    def __init__(
        self,
        model: Model,
        guidelines: str,
        mcp: Union[MCPServerSSE, MCPServerStreamableHTTP, MCPServerStdio],
        **kwargs,
    ):
        super().__init__(
            model=model,
            system_prompt=guidelines,
            retries=3,
            deps_type=AnylogAgentDeps,  # type:ignore
            output_type=str,
            **kwargs,
        )
        self.selected_model = model
        self.mcp = mcp
        self.guidelines = guidelines
        self.agent_deps: AnylogAgentDeps


def _query_requires_tool_calls(prompt: str) -> bool:
    lowered = prompt.lower()
    return any(
        re.search(pattern, lowered)
        for pattern in (
            r"\b(select|from|where|sql|database|db|query|entries|rows|table)\b",
            r"\b(chart|plot|graph|visualize|trend)\b",
            r"\b(cpu|memory|disk|node|resource|mcp)\b",
        )
    )


def create_default_agent(
    mcp: MCPServerSSE, model: Optional[Model] = None
) -> AnylogAgent:
    base_agent = AnylogAgent(
        model if model else default_model, guidelines=CORE_PROMPT, mcp=mcp
    )
    full_agent = setup_interagent_tools(base_agent)

    chart_agent = create_chart_agent(custom_model=full_agent.selected_model)
    tabular_agent = create_tabular_agent(custom_model=full_agent.selected_model)
    mcp_agent = MCPAgent(mcp=full_agent.mcp, on_tool_call=None)
    full_agent.agent_deps = AnylogAgentDeps(
        None, chart_agent, tabular_agent, mcp_agent, user_settings=User.from_defaults()
    )

    return full_agent


async def run_core_agent(
    agent: AnylogAgent, prompt: str, resultFn: ResultFn, user_settings: User
):
    agent.agent_deps.mcp_agent.on_tool_call = resultFn

    run_deps = AnylogAgentDeps(
        resultFn=resultFn,
        chart_agent=agent.agent_deps.chart_agent,
        tabular_agent=agent.agent_deps.tabular_agent,
        mcp_agent=agent.agent_deps.mcp_agent,
        user_settings=user_settings,
    )
    run_deps.mcp_agent.on_tool_call = resultFn

    end_sent = False
    try:
        await resultFn("Generating a response...", StreamingMarker.STATUS_UPDATE)

        planning_model = user_settings.planning_model()

        requires_tools = _query_requires_tool_calls(prompt)
        execution_model = planning_model

        async with agent.run_stream(
            prompt,
            model=execution_model,
            deps=run_deps,
        ) as result:
            async for chunk in result.stream_text(delta=True):
                if chunk:
                    await resultFn(chunk, StreamingMarker.CHUNK)
            any_tool_called = (
                run_deps.mcp_tool_called
                or run_deps.chart_tool_called
                or run_deps.table_tool_called
            )

        if requires_tools and not any_tool_called:
            print(
                "No tools were called in first pass despite tool-required query. Retrying once."
            )
            retry_prompt = (
                "MANDATORY EXECUTION MODE: Use one or more tools now if the query asks "
                "for external data, charting, or tabulation. Do not answer with a plan.\n\n"
                f"{prompt}"
            )
            async with agent.run_stream(
                retry_prompt,
                model=execution_model,
                deps=run_deps,
            ) as retry_result:
                async for chunk in retry_result.stream_text(delta=True):
                    if chunk:
                        print(f"RESPONSE: {chunk}")
                        await resultFn(chunk, StreamingMarker.CHUNK)
            any_tool_called = (
                run_deps.mcp_tool_called
                or run_deps.chart_tool_called
                or run_deps.table_tool_called
            )
            if not any_tool_called:
                raise RuntimeError(
                    "Tool-required query produced no tool calls after retry. "
                    "The selected model/provider is not honoring tool calls."
                )

        await resultFn("", StreamingMarker.END)
        end_sent = True

    except BaseException as e:
        print(f"Core agent failed: {e}")
        try:
            await resultFn(
                f"Failed: {e}. \n\nDouble check the plugin backend or LLM configuration",
                StreamingMarker.ERROR,
            )
        except Exception as notify_err:
            print(f"Failed to notify user: {notify_err}")
    finally:
        if not end_sent:
            try:
                await resultFn("", StreamingMarker.END)
            except Exception as end_err:
                print(f"Failed to send END marker: {end_err}")


# async def run_core_agent(
#     agent: AnylogAgent, prompt: str, resultFn: ResultFn, user_settings: User
# ):
#     # agent.agent_deps.resultFn = resultFn
#     agent.agent_deps.mcp_agent.on_tool_call = resultFn

#     run_deps = AnylogAgentDeps(
#         resultFn=resultFn,
#         chart_agent=agent.agent_deps.chart_agent,
#         tabular_agent=agent.agent_deps.tabular_agent,
#         mcp_agent=agent.agent_deps.mcp_agent,
#         user_settings=user_settings,
#     )
#     run_deps.mcp_agent.on_tool_call = resultFn

#     json_buffer = ""
#     last_msg_length = 0

#     try:
#         await resultFn("Generating a response...", StreamingMarker.STATUS_UPDATE)

#         async with agent.run_stream(
#             prompt, model=user_settings.planning_model(), deps=run_deps
#         ) as result:
#             try:
#                 async for resp, is_complete in result.stream_responses():
#                     print(f"Response: {resp}")
#                     # await resultFn("Generating a response...", StreamingMarker.STATUS_UPDATE)
#                     print(f"Is Complete: {is_complete}")

#                     if not resp.parts:
#                         continue

#                     part = resp.parts[0]

#                     tool_called = hasattr(part, "tool_name")
#                     if tool_called and part.tool_name == "final_result":  # type:ignore
#                         tool_name = getattr(part, "tool_name")
#                         if tool_name == "final_result":
#                             await resultFn(
#                                 "Finalizing your response...",
#                                 StreamingMarker.STATUS_UPDATE,
#                             )
#                         else:
#                             await resultFn(
#                                 f"Using {tool_name}", StreamingMarker.STATUS_UPDATE
#                             )

#                         raw_args = part.args  # type:ignore
#                     else:
#                         continue

#                     if isinstance(raw_args, dict):
#                         result_data = raw_args
#                     elif isinstance(raw_args, str):
#                         json_buffer = raw_args
#                         try:
#                             result_data = json.loads(json_buffer)
#                         except json.JSONDecodeError:
#                             import re

#                             match = re.search(
#                                 r'"output"\s*:\s*"([^"]*(?:\\"[^"]*)*)', json_buffer
#                             )
#                             if match:
#                                 partial_output = (
#                                     match.group(1)
#                                     .replace('\\"', '"')
#                                     .replace("\\n", "\n")
#                                 )
#                                 result_data = {
#                                     "output": partial_output,
#                                     "chart_plots": [],
#                                 }
#                             else:
#                                 continue
#                     else:
#                         continue

#                     output_text = result_data.get("output", "")

#                     if output_text:
#                         new_text = output_text[last_msg_length:]
#                         if new_text:
#                             await resultFn(new_text, StreamingMarker.CHUNK)
#                             last_msg_length = len(output_text)
#             except (asyncio.CancelledError, httpx.ReadError, httpx.RemoteProtocolError):
#                 print("Core agent stream interrupted or cancelled")
#                 return
#         await resultFn("", StreamingMarker.END)

#     except BaseException as e:  # catches everything, including KeyboardInterrupt, SystemExit, asyncio.CancelledError, etc.
#         print(f"Core agent failed: {e}")
#         try:
#             await resultFn(
#                 f"Failed: {e}. \n\nDouble check the plugin backend or LLM configuration",
#                 StreamingMarker.ERROR,
#             )
#         except Exception as notifyErr:
#             print(f"Failed to notify user: {notifyErr}")
# if isinstance(e, (KeyboardInterrupt, SystemExit, asyncio.CancelledError)):
#     raise
# except (asyncio.CancelledError, httpx.ReadError, httpx.RemoteProtocolError) as e:
#     print("Core agent interrupted or cancelled")
#     try:
#         await resultFn(
#             f"Failed: {e}. Double check the plugin backend or LLM configuration",
#             StreamingMarker.ERROR,
#         )
#     except Exception as statusErr:
#         print(f"Failed to run core agent: {e}")
#         print(f"Failed to notify user: {statusErr}")
# except Exception as e:
#     print(f"Error in run_core_agent: ''''{e}'''")
#     try:
#         await resultFn(
#             f"Failed: {e}. Double check the plugin backend or LLM configuration",
#             StreamingMarker.ERROR,
#         )
#     except Exception as statusErr:
#         print(f"Failed to run core agent: {e}")
#         print(f"Failed to notify user: {statusErr}")
