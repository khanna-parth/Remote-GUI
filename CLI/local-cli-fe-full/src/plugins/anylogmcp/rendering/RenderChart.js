import { useEffect } from "react";
import ChartView from "../../../components/ChartView";
import ExpandableElement from "../ExpandableElement";
import { BsFiletypeCsv, BsFiletypeJson } from "react-icons/bs";

const RenderChart = ({ chartData, visualization, chartIndex }) => {
  const downloadChartToCSV = () => {
    const years = chartData.labels;
    const datasets = chartData.datasets;

    const headers = ["Year", ...datasets.map((ds) => ds.label)];

    const csvRows = years.map((year, index) => {
      const row = [year];
      datasets.forEach((ds) => {
        row.push(ds.data[index]);
      });
      return row.join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${visualization.chart_title.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadChartToJSON = () => {
    const years = chartData.labels;
    const datasets = chartData.datasets;

    const cleanData = years.map((year, index) => {
      const entry = { Year: year };
      datasets.forEach((ds) => {
        entry[ds.label] = ds.data[index];
      });
      return entry;
    });

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${visualization.chart_title.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div key={chartIndex} style={{ marginBottom: 16, width: "100%" }}>
      <ExpandableElement
        title={visualization.chart_title}
        headerElement={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              style={{
                margin: 0,
                background: "none",
                border: "none",
                color: "black",
                padding: 0,
                cursor: "pointer",
              }}
              onClick={() => downloadChartToCSV()}
            >
              <BsFiletypeCsv size={20} />
            </button>

            <button
              style={{
                margin: 0,
                background: "none",
                border: "none",
                color: "black",
                padding: 0,
                cursor: "pointer",
              }}
              onClick={() => downloadChartToJSON()}
            >
              <BsFiletypeJson size={20} />
            </button>
          </div>
        }
        innerElement={
          <>
            <ChartView
              chartTitle={visualization.chart_title}
              chartData={chartData}
              chartOptions={visualization.chart_opts}
              chartStyle={{ maxWidth: "50vw", maxHeight: "40vh" }}
            />
            {visualization.analysis && (
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "black",
                  opacity: "70%",
                  paddingLeft: 6,
                }}
              >
                {visualization.analysis}
              </p>
            )}
          </>
        }
      />
    </div>
  );
};

export default RenderChart;
