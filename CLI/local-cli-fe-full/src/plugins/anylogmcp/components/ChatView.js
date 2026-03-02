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

  // Show text while its generating
  const generatingBufferRef = useRef("");
  const [generatingBuffer, setGeneratingBuffer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // TODO: Show table while its being outputted
  const generatingVisRef = useRef(null);
  const [generatingVis, setGeneratingVis] = useState(null);

  // Connected to backend WS status(ready-state, etc)
  const [status, setStatus] = useState("");

  const messagesContainerRef = useRef(null);
  const { exportRenderToPDF, exportToPDFLog } = usePDFExport();

  useEffect(() => {
    if (!currentExport || !currentExport.format) return;

    if (currentExport.format === "PDF") {
      console.log("Exporting in PDF view format");
      exportRenderToPDF(messagesContainerRef, `${chatTitle}` || "chat");
      setCurrentExport(currentExport.format, true);
    } else if (currentExport.format === "LOG") {
      console.log("Exporting in PDF view format");
      exportToPDFLog(messagesContainerRef, `${chatTitle}_LOG` || "chat");
      setCurrentExport(currentExport.format, true);
    }
  }, [currentExport]);

  const sendWSCommand = (commandType, messages = [], message = "") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command_type: commandType,
        message: `HISTORY: ${JSON.stringify(normalizeChatHistory(messages))}\n\n QUERY: ${message}`,
      };
      console.log(`Sending to backend`);
      console.log(command);
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

        updateChat(
          selectedChat.id,
          {
            messages: updatedMessages,
          },
          true,
        );

        return updatedMessages;
      });

      generatingBufferRef.current = "";
      generatingVisRef.current = null;
      setGeneratingBuffer("");
      setIsGenerating(false);

      await sleep(1500);
      setStatus("");
      return;
    }

    if (!input.trim()) return;

    handleSendMessage(input);
    setInput("");
  };

  // Avoid retriggering rendering process within React when visualizations are being shown
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

  // Visualization delay to prevent React overwriting visualizations
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
      updateChat(
        selectedChat?.id,
        {
          title: chatTitle,
        },
        false,
      );

      setRefreshChats((prev) => !prev);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [chatTitle, selectedChat?.id]);

  useEffect(() => {
    console.log(
      `Loading chat history of length: ${selectedChat?.messages?.length || 0}`,
    );

    setChatTitle(selectedChat?.title || "");
    setMessages(selectedChat?.messages || []);

    wsRef.current = new WebSocket("ws://localhost:8000/mcp/chat");

    wsRef.current.onopen = async () => {
      console.log("Connected to WebSocket");
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
          console.log(`Received ID from server: ${dataStream.id}`);
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

            console.log("Chart data added to generating message");
            break;
          }

          case "TABLE_DATA": {
            const newVis = {
              tableData: { ...dataStream.data },
              type: "table",
            };
            const updated = generatingVisRef.current
              ? Array.isArray(generatingVisRef.current)
                ? [...generatingVisRef.current, newVis]
                : [generatingVisRef.current, newVis]
              : newVis;

            generatingVisRef.current = updated;
            setGeneratingVis(updated);
            console.log("Table data added to generating message");
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

              updateChat(
                selectedChat.id,
                {
                  messages: updatedMessages,
                },
                true,
              );

              return updatedMessages;
            });

            // Reset generation state
            generatingBufferRef.current = "";
            generatingVisRef.current = null;
            setGeneratingBuffer("");
            setIsGenerating(false);
            break;
          }

          default:
            break;
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Connection error");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
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

    try {
      const success = sendWSCommand(WS_COMMANDS.GENERATE, updatedMessages, msg);

      if (success) {
        console.log(`Awaiting reply for message #${messages.length}: ${msg}`);
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

  const statusColor = connected ? (isGenerating ? "black" : "green") : "red";

  return (
    <div className="chat-view-container">
      <div className="chat-view-header">
        <div className="chat-view-header-left">
          <div className="chat-view-title-group">
            <input
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              className="chat-view-title-input"
            />
            <h2 className="chat-view-last-accessed">
              Last Accessed:{" "}
              {parseTimestamp(selectedChat.lastAccessDate) || "Unknown"}
            </h2>
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
        {messages.map((msg, index) => (
          <MemoizedMessage key={index} msg={msg} index={index} />
        ))}

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
          <h1 className="chat-view-status-text" style={{ color: statusColor }}>
            {status}
          </h1>
        )}
      </div>

      <div className="chat-view-input-area">
        <textarea
          ref={inputRef}
          className="chat-view-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          rows="3"
        />
        <button
          className={`chat-view-send-button ${isGenerating ? "chat-view-send-button--generating" : "chat-view-send-button--sending"}`}
          onClick={handleSend}
        >
          {isGenerating ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatView;
