from typing import TYPE_CHECKING, List

from pydantic_ai import RunContext

from plugins.anylogmcp.agents.base import StreamingMarker
from plugins.anylogmcp.agents.core.types import AnylogAgentDeps
from plugins.anylogmcp.agents.visualization.charts.charting_agent import (
    PlotChartRequest,
)
from plugins.anylogmcp.agents.visualization.tables.tabular_agent import (
    GenerateTableRequest,
)

if TYPE_CHECKING:
    from plugins.anylogmcp.agents.core.core_agent import AnylogAgent


def setup_interagent_tools(agent: "AnylogAgent"):
    @agent.tool
    async def plot_charts(
        ctx: RunContext[AnylogAgentDeps], charts: List[PlotChartRequest]
    ) -> str:
        """
        Plot multiple charts. Returns status of each chart attempt.
        If any charts fail, returns details about which ones failed so they can be retried.
        """

        user_settings = ctx.deps.user_settings

        results = []
        failed_charts = []

        for idx, plot in enumerate(charts):
            print(f"Plotting: {plot.plot_title}")

            if ctx.deps.resultFn:
                await ctx.deps.resultFn(
                    f"Plotting: {plot.plot_title}", StreamingMarker.STATUS_UPDATE
                )
            try:
                chart = await ctx.deps.chart_agent.generate_chart(
                    f"Create me a chart of this: {plot}", user_settings=user_settings
                )
                if isinstance(chart, Exception):
                    failed_charts.append(
                        {"index": idx, "plot": plot, "error": str(chart)}
                    )
                    results.append(f"Chart #{idx} FAILED: {chart}")
                else:
                    print(f"Chart #{idx} generated successfully")
                    print(chart)

                    if ctx.deps.resultFn:
                        await ctx.deps.resultFn(
                            chart.model_dump(), StreamingMarker.CHART_DATA
                        )
                    results.append(f"Chart #{idx} SUCCESS")
            except Exception as e:
                print(f"Error generating chart #{idx}: {e}")
                failed_charts.append({"index": idx, "plot": plot, "error": str(e)})
                results.append(f"Chart #{idx} FAILED: {str(e)}")

        if not failed_charts:
            return (
                "SUCCESS: All charts successfully plotted. Continue with your response."
            )
        else:
            failure_details = "\n".join(
                [f"- Chart #{f['index']}: {f['error']}" for f in failed_charts]
            )
            return f"PARTIAL SUCCESS: {len(charts) - len(failed_charts)}/{len(charts)} charts succeeded.\nFailed charts:\n{failure_details}\n\nPlease retry ONLY the failed charts with corrected data or different parameters."

    @agent.tool
    async def generate_table(
        ctx: RunContext[AnylogAgentDeps], table_request: GenerateTableRequest
    ) -> str:
        """
        Generate a table. Returns status of table attempt.
        """
        print(f"Constructing: {table_request.table_title}")

        user_settings = ctx.deps.user_settings

        if ctx.deps.resultFn:
            await ctx.deps.resultFn(
                f"Constructing: {table_request.table_title}",
                StreamingMarker.STATUS_UPDATE,
            )

        try:
            table_result = await ctx.deps.tabular_agent.generate_table(
                f"Create me a table of this data: {table_request}",
                user_settings=user_settings,
            )

            if isinstance(table_result, Exception):
                return f"FAILED GENERATING TABLE\n GOT: {table_result}"

            print("Table generated successfully")
            print(table_result)
            if ctx.deps.resultFn:
                await ctx.deps.resultFn(
                    table_result.model_dump(), StreamingMarker.TABLE_DATA
                )
            return "SUCCESS: Table successfully generated. Continue with your response."

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
