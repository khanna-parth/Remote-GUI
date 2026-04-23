import React, { useEffect, useState, useMemo, useRef } from "react";
import RenderChart from "../rendering/RenderChart";
import { cleanNullData } from "../../../utils/chart_helpers";
import ChatMessage from "../chatcomponents/ChatMessage";
import ChatAuthorView from "../chatcomponents/ChatAuthorView";
import { sleep } from "../../../utils/asyncUtils";
import chatState from "../state/state";
import { parseTimestamp } from "../utils/numerical";
import { updateChat } from "../utils/storage";
import { usePDFExport } from "../hooks/pdfExport";
import ExportButton from "../chatcomponents/ExportPDFButton";
import MemoizedMessage from "../chatcomponents/MemoizedMessage";
import { normalizeChatHistory } from "../utils/normalize";
import RenderTable from "../rendering/RenderTable";
import "../styles/ChatView.css";
import { IoSend } from "react-icons/io5";
import { IoStop } from "react-icons/io5";
import ToolStatusMarker, {
  TOOL_STATUS,
} from "../chatcomponents/ToolStatusMarker";

const WS_COMMANDS = {
  GENERATE: "GENERATE",
  STOP: "STOP",
};

const ChatView = () => {
  const [chatTitle, setChatTitle] = useState("");
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const selectedChat = chatState((state) => state.selectedChat);
  const clearSelectedChat = chatState((state) => state.clearSelectedChat);
  const setModalViewName = chatState((state) => state.setModalViewName);
  const setWsID = chatState((state) => state.setWsID);
  const currentExport = chatState((state) => state.currentExport);
  const setCurrentExport = chatState((state) => state.setCurrentExport);

  const setRefreshChats = chatState((state) => state.setRefreshChats);

  const [messages, setMessages] = useState([]);

  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const generatingBufferRef = useRef("");
  const [generatingBuffer, setGeneratingBuffer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatingVisRef = useRef(null);
  const [generatingVis, setGeneratingVis] = useState(null);

  const [status, setStatus] = useState("");

  const liveToolEventsRef = useRef({});
  const [liveToolEvents, setLiveToolEvents] = useState([]);
  const runStateRef = useRef({ cancelRequested: false, finalized: false });

  const messagesContainerRef = useRef(null);
  const { exportRenderToPDF, exportToPDFLog } = usePDFExport();

  useEffect(() => {
    if (!currentExport || !currentExport.format) return;

    if (currentExport.format === "PDF") {
      exportRenderToPDF(messagesContainerRef, `${chatTitle}` || "chat");
      setCurrentExport(currentExport.format, true);
    } else if (currentExport.format === "LOG") {
      exportToPDFLog(messagesContainerRef, `${chatTitle}_LOG` || "chat");
      setCurrentExport(currentExport.format, true);
    }
  }, [currentExport]);

  const sendWSCommand = (commandType, messages = [], message = "") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command_type: commandType,
        message: `HISTORY: ${JSON.stringify(normalizeChatHistory(messages.map((m) => ({ ...m }))))}\n\n QUERY: ${message}`,
      };
      wsRef.current.send(JSON.stringify(command));
      return true;
    }
    return false;
  };

  const failOutstandingToolEvents = () => {
    setLiveToolEvents((prev) =>
      prev.map((evt) =>
        evt.tool_status === TOOL_STATUS.SUCCESS
          ? evt
          : { ...evt, tool_status: TOOL_STATUS.FAILED },
      ),
    );
  };

  const resetGenerationState = () => {
    generatingBufferRef.current = "";
    generatingVisRef.current = null;
    setGeneratingBuffer("");
    setGeneratingVis(null);
    setIsGenerating(false);
    liveToolEventsRef.current = {};
    setLiveToolEvents([]);
  };

  const commitGeneratingOutput = (suffix = "") => {
    const finalVis = generatingVisRef.current;
    const finalResponse = `${generatingBufferRef.current || ""}${suffix}`;
    const hasContent = Boolean(
      (finalResponse && finalResponse.trim().length > 0) || finalVis,
    );
    if (!hasContent) return;

    const newMessage = {
      sender: "AnyLog AI",
      text: finalResponse,
      vis: finalVis,
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, newMessage];
      updateChat(selectedChat.id, { messages: updatedMessages }, true);
      return updatedMessages;
    });
  };

  const handleSend = async () => {
    if (isGenerating) {
      sendWSCommand(WS_COMMANDS.STOP);
      runStateRef.current.cancelRequested = true;
      runStateRef.current.finalized = true;
      setStatus("Generation cancelled");
      failOutstandingToolEvents();
      commitGeneratingOutput("\n\n_Generation cancelled by user._");
      resetGenerationState();

      await sleep(1500);
      setStatus("");
      return;
    }

    if (!input.trim()) return;

    handleSendMessage(input);
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const generatingCharts = useMemo(() => {
    if (!generatingVis) return null;

    if (Array.isArray(generatingVis)) {
      return generatingVis
        .map((v) => {
          if (v.type === "chart" && v.chart_data) {
            return cleanNullData(v.chart_data);
          }
          return null;
        })
        .filter((data) => data !== null);
    } else {
      if (generatingVis.type === "chart" && generatingVis.chart_data) {
        return [cleanNullData(generatingVis.chart_data)];
      }
    }
    return null;
  }, [generatingVis]);

  useEffect(() => {
    if (!isGenerating && generatingVis) {
      const timer = setTimeout(() => {
        setGeneratingVis(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isGenerating, generatingVis]);

  useEffect(() => {
    if (!chatTitle) return;

    const timeout = setTimeout(() => {
      updateChat(selectedChat?.id, { title: chatTitle }, false);
      setRefreshChats((prev) => !prev);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [chatTitle, selectedChat?.id]);

  useEffect(() => {
    setChatTitle(selectedChat?.title || "");
    setMessages(selectedChat?.messages || []);

    liveToolEventsRef.current = {};
    setLiveToolEvents([]);
    runStateRef.current = { cancelRequested: false, finalized: false };

    wsRef.current = new WebSocket("ws://localhost:8000/mcp/chat");

    wsRef.current.onopen = async () => {
      inputRef.current?.focus();
      await sleep(2000);
      setStatus("Connected to server");
      setConnected(true);
      inputRef.current?.focus();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const dataStream = JSON.parse(event.data);

        if (dataStream.id) {
          setWsID(dataStream.id);
        }

        if (
          runStateRef.current.cancelRequested &&
          ["TEXT_CHUNK", "CHART_DATA", "TABLE_DATA", "TOOL_EVENT", "TEXT_END"].includes(
            dataStream.marker,
          )
        ) {
          return;
        }

        switch (dataStream.marker) {
          case "STATUS_UPDATE":
            setStatus(dataStream.data || "");
            break;

          case "TEXT_CHUNK":
            generatingBufferRef.current += dataStream.data;
            setGeneratingBuffer(generatingBufferRef.current);
            break;

          case "CHART_DATA": {
            const newVis = { ...dataStream.data, type: "chart" };
            const updated = generatingVisRef.current
              ? Array.isArray(generatingVisRef.current)
                ? [...generatingVisRef.current, newVis]
                : [generatingVisRef.current, newVis]
              : newVis;
            generatingVisRef.current = updated;
            setGeneratingVis(updated);
            break;
          }

          case "TABLE_DATA": {
            const newVis = { tableData: { ...dataStream.data }, type: "table" };
            const updated = generatingVisRef.current
              ? Array.isArray(generatingVisRef.current)
                ? [...generatingVisRef.current, newVis]
                : [generatingVisRef.current, newVis]
              : newVis;
            generatingVisRef.current = updated;
            setGeneratingVis(updated);
            break;
          }

          case "TOOL_EVENT": {
            const { tool_id, tool_name, tool_status, tool_data } =
              dataStream.data ?? dataStream;
            if (!tool_id) break;

            liveToolEventsRef.current[tool_id] = {
              tool_id,
              tool_name,
              tool_status,
              tool_data,
            };
            setLiveToolEvents(Object.values(liveToolEventsRef.current));
            break;
          }

          case "TEXT_END": {
            if (runStateRef.current.finalized) break;
            runStateRef.current.finalized = true;
            commitGeneratingOutput();
            setStatus("");

            failOutstandingToolEvents();
            resetGenerationState();
            break;
          }
          case "ERROR": {
            if (runStateRef.current.finalized) break;
            runStateRef.current.finalized = true;
            const newMessage = {
              sender: "AnyLog AI",
              text: dataStream.data || "",
            };

            setMessages((prev) => {
              const updatedMessages = [...prev, newMessage];
              updateChat(selectedChat.id, { messages: updatedMessages }, true);
              return updatedMessages;
            });
            setStatus("");

            failOutstandingToolEvents();
            resetGenerationState();
            break;
          }

          default:
            break;
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    wsRef.current.onerror = () => {
      setStatus("Connection error");
    };

    wsRef.current.onclose = () => {
      setConnected(false);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [selectedChat?.id]);

  const handleSendMessage = (msg) => {
    const newMessage = { sender: "User", text: msg };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    updateChat(selectedChat.id, { messages: updatedMessages }, true);

    generatingBufferRef.current = "";
    setGeneratingBuffer("");
    setGeneratingVis(null);
    setLiveToolEvents([]);
    runStateRef.current = { cancelRequested: false, finalized: false };

    liveToolEventsRef.current = {};

    try {
      const success = sendWSCommand(WS_COMMANDS.GENERATE, updatedMessages, msg);

      if (success) {
        setIsGenerating(true);
        setStatus("");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "system",
            text: "Failed to generate message: corrupted connection",
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: `Failed to generate message: ${e.message}` },
      ]);
    }
  };

  const statusColor = connected
    ? isGenerating
      ? "var(--cv-text-secondary)"
      : "var(--cv-status-connected)"
    : "var(--cv-danger)";

  return (
    <div className="chat-view-container">
      <div className="chat-view-header">
        <div className="chat-view-header-left">
          <div className="chat-view-title-group">
            <input
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              className="chat-view-title-input"
              placeholder="Untitled chat"
            />
            <span className="chat-view-header-sep" aria-hidden="true" />
            <span className="chat-view-last-accessed">
              {parseTimestamp(selectedChat.lastAccessDate)
                ? parseTimestamp(selectedChat.lastAccessDate)
                : "Never accessed"}
            </span>
          </div>
        </div>

        <div className="chat-view-header-actions">
          <ExportButton
            onClick={() => setModalViewName("ChatExporter")}
            disabled={messages.length === 0}
            hint=""
          />
        </div>
      </div>

      <div ref={messagesContainerRef} className="chat-view-messages">
        {messages.map((msg, index) =>
          msg.type === "tool_event" ? null : (
            <MemoizedMessage key={index} msg={msg} index={index} />
          ),
        )}

        {(generatingBuffer || generatingVis || liveToolEvents.length > 0) && (
          <div className="chat-view-generating-wrapper">
            {liveToolEvents.length > 0 && (
              <div className="chat-view-tool-event-list">
                {liveToolEvents.map((evt) => (
                  <div
                    key={`tool-${evt.tool_id}`}
                    className="chat-view-tool-event-row"
                  >
                    <ToolStatusMarker
                      toolName={evt.tool_name}
                      status={evt.tool_status}
                      data={evt.tool_data}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="chat-view-generating-message">
              <ChatMessage isUser={false} text={generatingBuffer} />
            </div>

            {generatingVis && (
              <div className="chat-view-generating-vis">
                {(() => {
                  let genChartCounter = 0;
                  return (
                    Array.isArray(generatingVis)
                      ? generatingVis
                      : [generatingVis]
                  ).map((visualization, visIndex) => {
                    if (visualization.type === "chart") {
                      const currentChartData =
                        generatingCharts?.[genChartCounter];
                      genChartCounter++;
                      return (
                        <RenderChart
                          key={visIndex}
                          chartData={currentChartData}
                          visualization={visualization}
                          chartIndex={genChartCounter - 1}
                        />
                      );
                    } else if (visualization.type === "table") {
                      return (
                        <div
                          key={visIndex}
                          className="chat-view-generating-table"
                        >
                          <RenderTable
                            tableTitle={visualization.tableData?.title}
                            tableData={visualization.tableData}
                          />
                        </div>
                      );
                    }
                    return null;
                  });
                })()}
              </div>
            )}

            <ChatAuthorView isUser={false} />
          </div>
        )}
      </div>

      <div className="chat-view-status-bar">
        {status.length > 0 && (
          <p className="chat-view-status-text" style={{ color: statusColor }}>
            {status}
          </p>
        )}
      </div>

      <div className="chat-view-input-area">
        <div className="chat-view-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-view-textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything…"
            rows={1}
          />
          <button
            className={`chat-view-send-button ${
              isGenerating
                ? "chat-view-send-button--generating"
                : "chat-view-send-button--sending"
            }`}
            onClick={handleSend}
            title={isGenerating ? "Stop" : "Send"}
          >
            {isGenerating ? <IoStop size={16} /> : <IoSend size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
