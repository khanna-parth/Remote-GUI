from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional
from plugins.anylogmcp.agents.base import ResultFn
from plugins.anylogmcp.agents.configuration import User

if TYPE_CHECKING:
    from plugins.anylogmcp.agents.visualization.charts.charting_agent import ChartingAgent
    from plugins.anylogmcp.agents.visualization.tables.tabular_agent import TabularAgent
    from plugins.anylogmcp.agents.mcp.mcp_agent import MCPAgent

@dataclass
class AnylogAgentDeps:
    resultFn: Optional[ResultFn]
    chart_agent: "ChartingAgent"
    tabular_agent: "TabularAgent"
    mcp_agent: "MCPAgent"
    user_settings: User