import React, { useEffect, useState, useMemo, useRef } from "react";
import ChatMessage from "./ChatMessage";
import RenderChart from "../rendering/RenderChart";
import TableView from "../rendering/TableView";
import ChatAuthorView from "./ChatAuthorView";
import { cleanNullData } from "../../../utils/chart_helpers";
import RenderTable from "../rendering/RenderTable";

const WS_COMMANDS = {
  GENERATE: "GENERATE",
  STOP: "STOP",
};

const MemoizedMessage = React.memo(({ msg, index }) => {
  const isUser = msg.sender === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ maxWidth: "100vw" }}>
        <ChatMessage isUser={isUser} text={msg.text} />
      </div>

      {!isUser && msg.vis && (
        <div style={{ position: "relative", width: "100%" }}>
          {(Array.isArray(msg.vis) ? msg.vis : [msg.vis]).map(
            (visualization, visIndex) => {
              if (visualization.type === "chart" && visualization.chart_data) {
                const currentChartData = cleanNullData(
                  visualization.chart_data,
                );
                return (
                  <RenderChart
                    key={visIndex}
                    chartData={currentChartData}
                    visualization={visualization}
                    chartIndex={visIndex}
                  />
                );
              } else if (visualization.type === "table") {
                return (
                  <div key={visIndex} style={{ maxWidth: "80%" }}>
                    <RenderTable
                      tableTitle={visualization.tableData?.title}
                      tableData={visualization.tableData}
                    />
                  </div>
                );
              }
              return null;
            },
          )}
        </div>
      )}
      <ChatAuthorView isUser={isUser} />
    </div>
  );
});

MemoizedMessage.displayName = "MemoizedMessage";

export default MemoizedMessage;