import colorsys
from pydantic import BaseModel, Field
from typing import Literal, Dict, List, Union, Optional

class AxisTitle(BaseModel):
    display: bool = True
    text: str
    font: dict = {"weight": "bold"}

class ChartAxis(BaseModel):
    display: bool = True
    type: Literal["linear", "category", "logarithmic"] = "linear"
    position: Literal['left', 'right', 'top', 'bottom']
    title: AxisTitle
    grid: dict = {"drawOnChartArea": False}

class ChartOpts(BaseModel):
    responsive: bool = True
    maintainAspectRatio: bool = False
    scales: Dict[str, ChartAxis]

class AnalyticalResponse(BaseModel):
    analysis: str = Field(..., description="Detailed response of whats happening throughout the datapoints. Give insights on patterns/trends.")
    chart_data: Dict
    chart_title: str
    chart_opts: ChartOpts

class SimpleDataset(BaseModel):
    label: str
    data_type: Literal['doughnut', 'line', 'scatter', 'bar', 'radar']
    data: List[Union[float, dict]]
    yAxisID: str = "y"


class CompressedChart(BaseModel):
    chart_title: str
    analysis: str
    labels: List[str]
    datasets: List[SimpleDataset]
    y_axis_label: str = "Value"
    y_axis_type: Literal["linear", "category", "logarithmic"] = "linear"
    x_axis_type: Literal["linear", "category", "logarithmic"] = "category"
    x_axis_label: str = ""
    y1_axis_label: Optional[str] = None
    y1_axis_type: Literal["linear", "category", "logarithmic"] = "linear"

def build_full_chart_data(data: CompressedChart) -> AnalyticalResponse:
    processed_datasets = []
    total_ds = len(data.datasets)
    
    for i, ds in enumerate(data.datasets):
        is_pie_chart = ds.data_type.lower() in ['pie', 'doughnut', 'polararea']
        
        if is_pie_chart:
            border_colors = []
            bg_colors = []
            for j in range(len(ds.data)):
                hue = j / max(len(ds.data), 1)
                r, g, b = colorsys.hls_to_rgb(hue, 0.6, 0.7)
                
                border_color = f"rgb({int(r*255)}, {int(g*255)}, {int(b*255)})"
                bg_color = f"rgba({int(r*255)}, {int(g*255)}, {int(b*255)}, 0.8)"
                
                border_colors.append(border_color)
                bg_colors.append(bg_color)
            
            processed_datasets.append({
                "type": ds.data_type,
                # "label": ds.label,
                "data": ds.data,
                "borderColor": border_colors,
                "backgroundColor": bg_colors,
                "borderWidth": 2,
            })
        else:
            border_color, bg_color = get_dynamic_color(i, total_ds)
            
            processed_datasets.append({
                "type": ds.data_type,
                "label": ds.label,
                "data": ds.data,
                "borderColor": border_color,
                "backgroundColor": bg_color,
                "fill": True,
                "tension": 0.4,
                "borderWidth": 2,
                "pointRadius": 2,
                "yAxisID": ds.yAxisID
            })
    
    # Only add scales for non-pie charts
    is_any_pie = any(ds.data_type.lower() in ['pie', 'doughnut', 'polararea'] for ds in data.datasets)
    
    if not is_any_pie:
        scales = {
            "y": ChartAxis(
                type=getattr(data, 'y_axis_type', 'linear'),
                position="left",
                title=AxisTitle(
                    display=True,
                    text=data.y_axis_label,
                    font={"weight": "bold"}
                ),
                grid={"color": "rgba(200, 200, 200, 0.2)"}
            ),
            "x": ChartAxis(
                type=getattr(data, 'x_axis_type', 'category'),
                position="bottom",
                title=AxisTitle(
                    display=True,
                    text=getattr(data, 'x_axis_label', ''),
                    font={"weight": "bold"}
                ),
                grid={"display": False}
            )
        }
        
        if data.y1_axis_label:
            scales["y1"] = ChartAxis(
                type=getattr(data, 'y1_axis_type', 'linear'),
                position="right",
                title=AxisTitle(
                    display=True,
                    text=data.y1_axis_label
                ),
                grid={"drawOnChartArea": False}
            )
    else:
        scales = {}
    
    opts = ChartOpts(
        responsive=True,
        maintainAspectRatio=False,
        scales=scales
    )
    
    return AnalyticalResponse(
        analysis=data.analysis,
        chart_title=data.chart_title,
        chart_data={"labels": data.labels, "datasets": processed_datasets},
        chart_opts=opts
    )


def get_dynamic_color(index, total):
    hue = index / max(total, 1)
    r, g, b = colorsys.hls_to_rgb(hue, 0.6, 0.7)
    
    border = f"rgb({int(r*255)}, {int(g*255)}, {int(b*255)})"
    bg = f"rgba({int(r*255)}, {int(g*255)}, {int(b*255)}, 0.1)"
    return border, bg
