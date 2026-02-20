import { useEffect } from "react";
import ChartView from "../../../components/ChartView";
import ExpandableElement from "../ExpandableElement";

const RenderChart = ({ chartData, visualization, chartIndex }) => {
  return (
    <div key={chartIndex} style={{ marginBottom: 16, width: '100%' }}>
      <ExpandableElement
        title={visualization.chart_title}
        innerElement={
          <>
            <ChartView
              chartTitle={visualization.chart_title}
              chartData={chartData}
              chartOptions={visualization.chart_opts}
              chartStyle={{ maxWidth: '50vw', maxHeight: '40vh' }}
            />
            {visualization.analysis && (
              <p style={{ fontStyle: 'italic', fontSize: 12, color: 'black', opacity: '70%', paddingLeft: 6 }}>
                {visualization.analysis}
              </p>
            )}
          </>
        }
      />
    </div>
  )
}

export default RenderChart;
