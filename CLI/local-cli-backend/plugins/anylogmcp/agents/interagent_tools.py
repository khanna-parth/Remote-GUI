from typing import TYPE_CHECKING

from pydantic_ai import RunContext

from ..agents.base import StreamingMarker
from ..agents.core.types import AnylogAgentDeps
from ..agents.visualization.charts.charting_agent import (
    PlotChartRequest,
)
from ..agents.visualization.tables.tabular_agent import (
    GenerateTableRequest,
)

if TYPE_CHECKING:
    from plugins.anylogmcp.agents.core.core_agent import AnylogAgent


def setup_interagent_tools(agent: "AnylogAgent"):
    @agent.tool
    async def plot_chart(
        ctx: RunContext[AnylogAgentDeps],
        plot_title: str,
        plot_type: str,
        plot_data_csv: str,
    ) -> str:
        """
        Plot a chart. plot_type must be one of: line, bar, pie, scatter.
        plot_data_csv must be CSV with a header row e.g. "label,value\nJan,10\nFeb,20"
        """
        user_settings = ctx.deps.user_settings
        plot = PlotChartRequest(
            plot_title=plot_title, plot_type=plot_type, plot_data_csv=plot_data_csv
        )

        print(f"Plotting: {plot.plot_title}")
        ctx.deps.chart_tool_called = True

        if ctx.deps.resultFn:
            await ctx.deps.resultFn(
                {
                    "tool_id": ctx.tool_call_id,
                    "tool_name": f"Plotting: {plot.plot_title}",
                    "tool_status": "START",
                },
                StreamingMarker.TOOL_EVENT,
            )
            await ctx.deps.resultFn(
                f"Plotting: {plot.plot_title}", StreamingMarker.STATUS_UPDATE
            )

        try:
            chart = await ctx.deps.chart_agent.generate_chart(
                f"Create me a chart of this: {plot}", user_settings=user_settings
            )

            if isinstance(chart, Exception):
                return f"FAILED: {chart}. Try again with corrected data."

            print("Chart generated successfully")
            print(chart)

            if ctx.deps.resultFn:
                await ctx.deps.resultFn(
                    {
                        "tool_id": ctx.tool_call_id,
                        "tool_name": f"Plotting: {plot.plot_title}",
                        "tool_status": "END",
                    },
                    StreamingMarker.TOOL_EVENT,
                )
                await ctx.deps.resultFn(chart.model_dump(), StreamingMarker.CHART_DATA)

            return (
                "SUCCESS: Chart plotted. Finalize your response now. "
                "Do not call additional tools unless the user explicitly requested another external action."
            )

        except Exception as e:
            print(f"Error generating chart: {e}")
            return f"FAILED: {str(e)}. Try again with corrected data or a different plot_type."

    @agent.tool
    async def generate_table(
        ctx: RunContext[AnylogAgentDeps], tableRequest: GenerateTableRequest
    ) -> str:
        """
        Generate a table. Returns status of table attempt.
        """
        print(f"Constructing: {tableRequest.table_title}")
        ctx.deps.table_tool_called = True

        user_settings = ctx.deps.user_settings

        if ctx.deps.resultFn:
            await ctx.deps.resultFn(
                f"Constructing: {tableRequest.table_title}",
                StreamingMarker.STATUS_UPDATE,
            )

            await ctx.deps.resultFn(
                {
                    "tool_id": ctx.tool_call_id,
                    "tool_name": f"Constructing: {tableRequest.table_title}",
                    "tool_status": "START",
                },
                StreamingMarker.TOOL_EVENT,
            )

        try:
            table_result = await ctx.deps.tabular_agent.generate_table(
                f"Create me a table of this data: {tableRequest}",
                user_settings=user_settings,
            )

            if isinstance(table_result, Exception):
                return f"FAILED GENERATING TABLE\n GOT: {table_result}"

            print("Table generated successfully")
            print(table_result)
            if ctx.deps.resultFn:
                await ctx.deps.resultFn(
                    {
                        "tool_id": ctx.tool_call_id,
                        "tool_name": f"Constructing: {table_result.title}",
                        "tool_status": "END",
                    },
                    StreamingMarker.TOOL_EVENT,
                )

                await ctx.deps.resultFn(
                    table_result.model_dump(), StreamingMarker.TABLE_DATA
                )

            return "SUCCESS: Table generated. Continue and finalize your response."

        except Exception as e:
            print(f"Error generating table: {e}")
            return f"Error generating table: {str(e)}"

    @agent.tool
    async def perform_task(ctx: RunContext[AnylogAgentDeps], task: str) -> str:
        """
        Complete task/request relating to the AnyLog system and network.
        """

        user_settings = ctx.deps.user_settings

        print(f"Task: {task}")
        ctx.deps.mcp_tool_called = True

        if ctx.deps.resultFn:
            await ctx.deps.resultFn(
                "Contacting the AnyLog network", StreamingMarker.STATUS_UPDATE
            )

        try:
            task_result = await ctx.deps.mcp_agent.perform_task(
                f"Complete this MCP task: {task}", user_settings=user_settings
            )

            if isinstance(task_result, Exception):
                return f"FAILED COMPLETING TASK\n RESULT: {task_result}"

            print("Task result")
            print(task_result)

            # await ctx.deps.resultFn(task_result, StreamingMarker.CHUNK)

            return f"Task results: {task_result}"

        except Exception as e:
            print(f"Error completing MCP task: {e}")
            return f"Error completing AnyLog task: {e}"

    return agent
