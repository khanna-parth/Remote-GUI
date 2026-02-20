
import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  ScatterController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  ScatterController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

export default function ChartView({ chartTitle, chartData, chartOptions, chartStyle, allowed=['png', 'json', 'csv'] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const processedData = {
      ...chartData,
      datasets: chartData.datasets.map(ds => ({
        ...ds,
        type: ds.data_type || ds.type,
      }))
    };

    chartRef.current = new Chart(canvasRef.current, {
      type: processedData.datasets[0].type,
      data: processedData,
      options: chartOptions
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [chartData, chartOptions]);

  const downloadPNG = () => {
    if (!chartRef.current) return;

    const link = document.createElement("a");
    link.href = chartRef.current.toBase64Image();
    link.download = "chart.png";
    link.click();
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "chart-data.json";
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const downloadCSV = () => {
    let csv = "Label,Value\n";

    chartData.labels.forEach((label, index) => {
      csv += `${label},${chartData.datasets[0].data[index]}\n`;
    });


    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "chart-data.csv";
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const downloads = [
    { type: 'png', label: 'Download Chart (PNG)', onClick: downloadPNG },
    { type: 'json', label: 'Download Data (JSON)', onClick: downloadJSON },
    { type: 'csv', label: 'Download Data (CSV)', onClick: downloadCSV },
  ];

  return (
    <div
      style={{
        position: 'relative',
        textAlign: "center",
        width: `calc(${chartStyle.maxWidth} + 200px)`,
        height: `calc(${chartStyle.maxHeight} + 70px)`,
        // border: '0.5px solid gray',
        boxShadow: "0 0 4px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ textAlign: 'center'}}>
        <h2>{chartTitle}</h2>
      </div>

      <div style={{
        ...chartStyle, 
        display: 'flex', 
        justifyContent: 'start',
        alignItems: 'stretch',
        height: '100%',
        flex: 1,
        padding: '20px'
      }}>
        <canvas ref={canvasRef} />
      </div>
      {
         <div style={{
          position: "absolute",
          top: 2,
          right: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          // padding: "4px",
          // borderRadius: "4px",
        }}>
          {downloads.map(({ type, label, onClick }) => 
            allowed.includes(type) && (
              <button style={{fontSize: 10, background: 'none', color: 'black'}} key={type} onClick={onClick}>{label}</button>
            )
          )}
        </div>
      }
    </div>
  );
}