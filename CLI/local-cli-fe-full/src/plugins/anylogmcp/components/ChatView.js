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
import ToolStatusMarker from "../chatcomponents/ToolStatusMarker";

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
        message: `HISTORY: ${JSON.stringify(normalizeChatHistory(messages.map(m => ({ ...m }))))}\n\n QUERY: ${message}`,
      };
      wsRef.current.send(JSON.stringify(command));
      return true;
    }
    return false;
  };

  const handleSend = async () => {
    if (isGenerating) {
      sendWSCommand(WS_COMMANDS.STOP);
      setIsGenerating(false);
      setStatus("Interrupted");
      const newMessage = {
        sender: "AnyLog AI",
        text: "Message interrupted",
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        updateChat(selectedChat.id, { messages: updatedMessages }, true);
        return updatedMessages;
      });

      generatingBufferRef.current = "";
      generatingVisRef.current = null;
      setGeneratingBuffer("");
      setIsGenerating(false);

      liveToolEventsRef.current = {};

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

        switch (dataStream.marker) {
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
            const { tool_id, tool_name, tool_status } = dataStream.data ?? dataStream;
            if (!tool_id) break;

            const existingIndex = liveToolEventsRef.current[tool_id];

            if (existingIndex !== undefined) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  tool_status,
                };
                return updated;
              });
            } else {
              setMessages((prev) => {
                const newIndex = prev.length;
                liveToolEventsRef.current[tool_id] = newIndex;
                return [
                  ...prev,
                  { type: "tool_event", tool_id, tool_name, tool_status },
                ];
              });
            }
            break;
          }

          case "TEXT_END": {
            const finalVis = generatingVisRef.current;
            const finalResponse = generatingBufferRef.current;

            const newMessage = {
              sender: "AnyLog AI",
              text: finalResponse || "",
              vis: finalVis,
            };

            setMessages((prev) => {
              const updatedMessages = [...prev, newMessage];
              updateChat(selectedChat.id, { messages: updatedMessages }, true);
              return updatedMessages;
            });

            generatingBufferRef.current = "";
            generatingVisRef.current = null;
            setGeneratingBuffer("");
            setIsGenerating(false);

            liveToolEventsRef.current = {};
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

    liveToolEventsRef.current = {};

    try {
      const success = sendWSCommand(WS_COMMANDS.GENERATE, updatedMessages, msg);

      if (success) {
        setIsGenerating(true);
        setStatus("");
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "system", text: "Failed to generate message: corrupted connection" },
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
        {messages.map((msg, index) => {
          if (msg.type === "tool_event") {
            return (
              <div key={`tool-${msg.tool_id}-${index}`} className="chat-view-tool-event-row">
                <ToolStatusMarker
                  toolName={msg.tool_name}
                  status={msg.tool_status}
                />
              </div>
            );
          }
          return <MemoizedMessage key={index} msg={msg} index={index} />;
        })}

        {(generatingBuffer || generatingVis) && (
          <div className="chat-view-generating-wrapper">
            <div className="chat-view-generating-message">
              <ChatMessage isUser={false} text={generatingBuffer} />
            </div>

            {generatingVis && (
              <div className="chat-view-generating-vis">
                {(() => {
                  let genChartCounter = 0;
                  return (
                    Array.isArray(generatingVis) ? generatingVis : [generatingVis]
                  ).map((visualization, visIndex) => {
                    if (visualization.type === "chart") {
                      const currentChartData = generatingCharts?.[genChartCounter];
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
                        <div key={visIndex} className="chat-view-generating-table">
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
            {isGenerating ? <IoStop size={16}/> : <IoSend size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;