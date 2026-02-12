import React, { useEffect, useState, useMemo, useRef } from "react";
import RenderChart from "./rendering/RenderChart";
import { cleanNullData } from "../../utils/chart_helpers";
import ChatMessage from "./chatcomponents/ChatMessage";
import ChatAuthorView from "./chatcomponents/ChatAuthorView";
import TableView from "./rendering/TableView";
import { sleep } from "../../utils/asyncUtils";
import { IoCogSharp, IoReturnUpBack } from "react-icons/io5";
import chatState from "./state/state";
import { parseTimestamp } from "./utils/numerical";
import { updateChat } from "./utils/storage";
import { usePDFExport } from "./hooks/pdfExport";
import ExportButton from "./chatcomponents/ExportPDFButton";

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
                    <TableView
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
  

  // const { selectedChat, clearSelectedChat, setModalViewName, setWsID, setCurrentExport } =
  //   chatState();

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
      console.log('Exporting in PDF view format');
      exportRenderToPDF(messagesContainerRef, `${chatTitle}` || 'chat');
      setCurrentExport(currentExport.format, true);

    } else if (currentExport.format === "LOG") {
      console.log('Exporting in PDF view format');
      exportToPDFLog(messagesContainerRef, `${chatTitle}_LOG` || 'chat');
      setCurrentExport(currentExport.format, true);
    }
  }, [currentExport])

  const sendWSCommand = (commandType, message = "") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command_type: commandType,
        message: message,
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
      updateChat(selectedChat?.id, {
        title: chatTitle,
      });
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

              updateChat(selectedChat.id, {
                messages: updatedMessages,
              }, true);

              return updatedMessages;
            });

            // Reset generation state
            generatingBufferRef.current = "";
            generatingVisRef.current = null;
            setGeneratingBuffer("");
            setIsGenerating(false);
            setStatus("");

            console.log("Message completed");
            break;
          }

          case "STATUS_UPDATE":
            setStatus(dataStream.data);
            break;

          default:
            console.warn("Unknown marker:", dataStream.marker);
        }
      } catch (err) {
        console.error("Failed to parse message:", event.data, err);
        setIsGenerating(false);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      setStatus("Disconnected from server");
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      setConnected(false);
      setStatus("Connection error");
    };

    return () => {
      wsRef.current?.close();
    };
  }, [selectedChat, setWsID]);

  const handleSendMessage = (msg) => {
    const userMessage = { sender: "user", text: msg };
    setMessages((prev) => [...prev, userMessage]);

    // Clear out buffers from previous message
    generatingBufferRef.current = "";
    generatingVisRef.current = null;
    setGeneratingBuffer("");
    setGeneratingVis(null);

    try {
      const success = sendWSCommand(WS_COMMANDS.GENERATE, msg);

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

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
        padding: "20px 0 0 0",
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          alignItems: "center",
          // marginTop: 20
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          <button
            style={{
              width: "60px",
              height: "60px",
              borderRadius: 10,
              background: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => clearSelectedChat()}
          >
            <IoReturnUpBack
              style={{ paddingRight: 4, marginRight: 4 }}
              size={30}
              color="red"
            />
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                width: "100%",
              }}
            />
            <h2 style={{ fontSize: "14px", color: "gray", margin: 0 }}>
              Last Accessed:{" "}
              {parseTimestamp(selectedChat.lastAccessDate) ||
                "Last Accessed: Unknown"}
            </h2>
          </div>
        </div>
        <div style={{
          gap: 8,
          display: 'flex',
          flexDirection: 'row'
        }}>
          <ExportButton
            onClick={() => setModalViewName("ChatExporter")}
            disabled={messages.length === 0}
            hint=''
          />
{/* 
          <ExportButton
            onClick={handleExportRender}
            disabled={messages.length === 0}
            hint='PDF'
          /> */}
          <IoCogSharp
            style={{ cursor: "pointer", paddingRight: 4, marginRight: 4 }}
            size={30}
            onClick={() => setModalViewName("Config")}
          />
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundColor: "#f9f9f9",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {messages.map((msg, index) => (
          <MemoizedMessage key={index} msg={msg} index={index} />
        ))}

        {(generatingBuffer || generatingVis) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: "100vw" }}>
              <ChatMessage isUser={false} text={generatingBuffer} />
            </div>

            {generatingVis && (
              <div style={{ position: "relative", width: "100%" }}>
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
                        <div key={visIndex} style={{ maxWidth: "80%" }}>
                          <TableView
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {status.length > 0 && (
          <h1
            style={{
              fontSize: 14,
              color: connected ? (isGenerating ? "black" : "green") : "red",
            }}
          >
            {status}
          </h1>
        )}
      </div>

      <div
        style={{
          display: "flex",
          backgroundColor: "#fff",
          padding: "10px",
          borderTop: "1px solid #ccc",
          boxSizing: "border-box",
        }}
      >
        <textarea
          ref={inputRef}
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            outline: "none",
          }}
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
          style={{
            marginLeft: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: isGenerating ? "#FF0000" : "#4f93ff",
            color: "#fff",
            cursor: "pointer",
          }}
          onClick={handleSend}
        >
          {isGenerating ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatView;