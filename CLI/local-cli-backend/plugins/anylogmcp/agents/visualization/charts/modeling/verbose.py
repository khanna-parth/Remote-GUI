from pydantic import BaseModel, Field
from typing import Literal, Dict, List, Union, Optional

class ChartDataset(BaseModel):
    label: str
    data_type: Literal['doughnut', 'line', 'scatter']
    yAxisID: str
    data: List[Union[float, dict]]
    backgroundColor: List[str] = []
    borderColor: Optional[str] = None
    borderWidth: Optional[str] = None
    tension: Optional[float] = None
    borderDash: Optional[List[int]] = None

# class ChartDataset(BaseModel):
#     model_config = ConfigDict(json_schema_extra={
#         "examples": [{
#             "label": "Revenue",
#             "data_type": "line",
#             "yAxisID": "y",
#             "data": [100, 200, 300],
#             "backgroundColor": ["rgba(75,192,192,0.4)"],
#             "borderColor": "rgb(75,192,192)",
#             "tension": 0.1
#         }]
#     })
    
#     label: str
#     data_type: Literal['doughnut', 'line', 'scatter']
#     yAxisID: str
#     data: List[Union[float, dict]]
#     backgroundColor: List[str] = Field(default_factory=list)
#     borderColor: Optional[str] = None
#     borderWidth: Optional[int] = 1
#     tension: Optional[float] = 0.4
#     borderDash: Optional[List[int]] = None

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[ChartDataset]

class AxisTitle(BaseModel):
    display: bool = True
    text: str
    font: Optional[dict] = Field(default={"weight": "bold"})

class ChartAxis(BaseModel):
    display: bool = True
    type: str = "linear"
    position: Literal['left', 'right']
    title: AxisTitle
    grid: dict = Field(default={"drawOnChartArea": False})
    stack: Optional[str] = None 
    offset: bool = True

class ChartPlugins(BaseModel):
    legend: dict = Field(default={"display": True, "position": "top"})
    tooltip: dict = Field(default={"enabled": True, "mode": "index"})

# class ChartOpts(BaseModel):
#     model_config = ConfigDict(json_schema_extra={
#         "examples": [{
#             "responsive": True,
#             "maintainAspectRatio": False,
#             "scales": {
#                 "y": {
#                     "display": True,
#                     "type": "linear",
#                     "position": "left",
#                     "title": {"display": True, "text": "Value"}
#                 }
#             }
#         }]
#     })
    
#     responsive: bool = True
#     maintainAspectRatio: bool = False
#     scales: Dict[str, ChartAxis] = Field(
#         default_factory=lambda: {
#             "y": ChartAxis(
#                 position="left",
#                 title=AxisTitle(text="Value")
#             )
#         }
#     )
#     plugins: ChartPlugins = Field(default_factory=ChartPlugins)

class ChartOpts(BaseModel):
    responsive: bool = True
    maintainAspectRatio: bool = False
    scales: Dict[str, ChartAxis] = Field(..., description="Map of axis IDs (y, y1, y2...) to axis configurations")
    plugins: ChartPlugins = Field(default_factory=ChartPlugins)

class AnalyticalResponse(BaseModel):
    analysis: str = Field(..., description='Very-detailed description of what the chart represents and key points')
    chart_data: ChartData
    chart_title: str
    chart_opts: ChartOpts