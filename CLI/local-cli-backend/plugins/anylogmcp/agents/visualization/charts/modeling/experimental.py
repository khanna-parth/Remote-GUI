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