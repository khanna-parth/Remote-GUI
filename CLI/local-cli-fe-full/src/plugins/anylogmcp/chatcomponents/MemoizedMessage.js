import React from "react";
import ChatMessage from "./ChatMessage";
import RenderChart from "../rendering/RenderChart";
import ChatAuthorView from "./ChatAuthorView";
import { cleanNullData } from "../../../utils/chart_helpers";
import RenderTable from "../rendering/RenderTable";
import "../styles/MemoizedMessage.css";
import MessageActions from "./MessageActions";

const MemoizedMessage = React.memo(({ msg, index }) => {
  const isUser = msg.sender === "User";

  return (
    <div
      className={`memoized-message ${isUser ? "memoized-message--user" : "memoized-message--ai"}`}
    >
      <div className="memoized-message__text">
        <ChatMessage isUser={isUser} text={msg.text} />
      </div>

      {!isUser && msg.vis && (
        <div className="memoized-message__vis">
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
                  <div key={visIndex} className="memoized-message__table">
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
      <MessageActions
        isUser={isUser}
        message={msg.text}
        copyResponseCallback={() => {}}
      />
      <ChatAuthorView isUser={isUser} />
    </div>
  );
});

MemoizedMessage.displayName = "MemoizedMessage";

export default MemoizedMessage;
