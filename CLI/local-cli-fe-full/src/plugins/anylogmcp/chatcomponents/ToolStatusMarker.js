import React, { useEffect, useState } from "react";
import "../styles/ToolStatusMarker.css";

export const TOOL_STATUS = {
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCESS: "SUCCESS",
};

const ToolStatusMarker = ({ toolName, status, data }) => {
  const [progressWidth, setProgressWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (status !== TOOL_STATUS.IN_PROGRESS) return;

    const t = setTimeout(() => setProgressWidth(100), 30);
    return () => clearTimeout(t);
  }, [status]);

  const renderIcon = () => {
    if (status === TOOL_STATUS.IN_PROGRESS) {
      return (
        <svg className="tool-event-spinner" viewBox="0 0 14 14" fill="none">
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="22 12"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (status === TOOL_STATUS.SUCCESS) {
      return (
        <svg
          className="tool-event-check success"
          viewBox="0 0 14 14"
          fill="none"
        >
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
      );
    }

    if (status === TOOL_STATUS.FAILED) {
      return (
        <svg className="tool-event-x failed" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1" />
          <line
            x1="4.5"
            y1="4.5"
            x2="9.5"
            y2="9.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="9.5"
            y1="4.5"
            x2="4.5"
            y2="9.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="tool-event-wrapper">
      <div
        className={`tool-event-entry ${
          status === TOOL_STATUS.IN_PROGRESS
            ? "tool-event-entry--running"
            : "tool-event-entry--done"
        }`}
      >
        <div className="tool-event-icon">{renderIcon()}</div>
        <div className="tool-event-body">
          <span className="tool-event-label">
            <span className="tool-event-name">{toolName}</span>
          </span>
        </div>

        {data != null && (
          <button
            className="tool-event-expand-btn"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? "Hide output" : "Show output"}
          >
            <svg
              viewBox="0 0 10 10"
              fill="none"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline
                points="2,3.5 5,6.5 8,3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {expanded && data != null && (
        <div className="tool-event-output">
          {data.error != null ? (
            <span className="tool-event-output--error">{data.error}</span>
          ) : (
            <span>{JSON.stringify(data, null, 2)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolStatusMarker;
