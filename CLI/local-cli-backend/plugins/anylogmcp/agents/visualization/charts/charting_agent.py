from pydantic import BaseModel
from pydantic_ai import Agent, RunContext, AgentRunResult
from pydantic_ai.models import Model
from dataclasses import dataclass
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.providers.groq import GroqProvider
from pydantic_ai.models.groq import GroqModel
from plugins.anylogmcp.agents.base import ResultFn
from plugins.anylogmcp.agents.visualization.charts.sys_prompt import CHARTING_PROMPT
from .modeling.simplified import *
from dotenv import load_dotenv

load_dotenv('/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env')

@dataclass
class ChartingDeps:
    chart_data: AnalyticalResponse
    resultFn: ResultFn

class PlotChartRequest(BaseModel):
     plot_title: str
     plot_type: str
     plot_data_csv: str

class ChartOutput(BaseModel):
    chart_info: CompressedChart

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

# default_model = GroqModel(
#     'openai/gpt-oss-20b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'llama-3.3-70b-versatile', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
#     # 'openai/gpt-oss-120b', provider=GroqProvider(api_key=os.getenv("GROQ_API_KEY"))
# )


class ChartingAgent(Agent):
    """
    Agent that takes in a prompt to plot data and outputs a simplified CompressedChart.

    NOTE: CompressedChart is not Chart.js compatible and requires full chart to be built
    """
    def __init__(self, model: Model, guidelines: str, **kwargs):
        super().__init__(
            model=model,
            instructions=guidelines,
            system_prompt=guidelines,
            retries=3,
            output_type=ChartOutput, #type:ignore
            deps_type=ChartingDeps, #type:ignore
            **kwargs
        )
        self.guidelines = guidelines

    async def generate_chart(self, query: str) -> AnalyticalResponse | Exception:
        ''' Asynchronously runs the charting agent and builds full Chart.js schema from its normal simplified output'''
        try:
            print(f"CHART REQUEST: {query}")
            result: AgentRunResult[ChartOutput] = await self.run(query, output_type=ChartOutput)

            compressed_data = result.output.chart_info
            full_chart = build_full_chart_data(compressed_data)
            return full_chart
        except Exception as e:
            return Exception(f"Failed to generate chart: {e}")



def create_chart_agent(custom_model: Optional[Model] = None, custom_guidelines: str | None = None) -> ChartingAgent:
    ''' Creates a  ChartingAgent with predefined charting guidelines'''
    chart_agent = ChartingAgent(model=custom_model if custom_model else default_model, guidelines=custom_guidelines if custom_guidelines else CHARTING_PROMPT)
    
    return chart_agent

# async def run_chart_agent(agent: ChartingAgent, query: str) -> AnalyticalResponse | Exception:
#     ''' Asynchronously runs the charting agent and builds full Chart.js schema from its normal simplified output'''
#     try:
#         result: AgentRunResult[ChartOutput] = await agent.run(query, output_type=ChartOutput)

#         compressed_data = result.output.chart_info
#         full_chart = build_full_chart_data(compressed_data)
#         return full_chart
#     except Exception as e:
#         return Exception(f"Failed to generate chart: {e}")

