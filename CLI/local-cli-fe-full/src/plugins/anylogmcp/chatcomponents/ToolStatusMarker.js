import React, { useEffect, useState } from "react";
import "../styles/ToolStatusMarker.css";

const ToolStatusMarker = ({ toolName, status }) => {
  const isDone = status === "END";
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (!isDone) {
      const t = setTimeout(() => setProgressWidth(100), 30);
      return () => clearTimeout(t);
    }
  }, [isDone]);

  return (
    <div className={`tool-event-entry ${isDone ? "tool-event-entry--done" : "tool-event-entry--running"}`}>
      <div className="tool-event-icon">
        {isDone ? (
          <svg className="tool-event-check" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1" />
            <polyline
              points="4,7 6.2,9.2 10,5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ) : (
          <svg className="tool-event-spinner" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7" cy="7" r="5.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="22 12"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="tool-event-body">
        <span className="tool-event-label">
          <span className="tool-event-name">{toolName}</span>
        </span>
      </div>
    </div>
  );
};

export default ToolStatusMarker;