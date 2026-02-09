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

const ChatView = () => {
  const [chatTitle, setChatTitle] = useState("");
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const { selectedChat, clearSelectedChat, toggleShowConfig, setWsID } =
    chatState();

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

  // Connected to backend WS status
  const [status, setStatus] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    handleSendMessage(input);
    setInput("");
  };

  // Avoid retriggering rendering process within React when visuializations are being shown
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

  // Visualization delay to prevent React overwriting visualizations (fix from ChatGPT)
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
  }, [chatTitle]);

  useEffect(() => {
    console.log(
      `Loading chat history of length: ${selectedChat?.messages?.length || 0}`,
    );

    setChatTitle(selectedChat?.title || "");
    setMessages(selectedChat?.messages || []);

    // Connect to backend's MCP handler
    wsRef.current = new WebSocket("ws://localhost:8000/mcp/chat");

    wsRef.current.onopen = async () => {
      console.log("Connected to WebSocket");
      inputRef.current?.focus();
      await sleep(2000);
      setStatus(`Connected to server`);
      setConnected(true);
      inputRef.current?.focus();
    };

    wsRef.current.onmessage = (event) => {
      try {
        // Get raw data from websocket
        // TODO: For each message from websocket, define structure in frontend so its easier to parse
        const dataStream = JSON.parse(event.data);

        if (dataStream.id) {
          setWsID(dataStream.id);
          console.log(`Received ID from server: ${dataStream.id}`);
        }

        if (dataStream.marker === "TEXT_CHUNK") {
          // Add to current text streamed
          generatingBufferRef.current += dataStream.data;
          setGeneratingBuffer(generatingBufferRef.current);
        } else if (dataStream.marker === "CHART_DATA") {
          // Append it to list of visuals (can be visuals of any type)
          // Marked by 'type' to sort how to render what
          // Chart data from backend is already wrapped inside of chart_data because other data such as analysis exists
          const newVis = { ...dataStream.data, type: "chart" };
          const updated = generatingVisRef.current
            ? Array.isArray(generatingVisRef.current)
              ? [...generatingVisRef.current, newVis]
              : [generatingVisRef.current, newVis]
            : newVis;

          generatingVisRef.current = updated;
          setGeneratingVis(updated);
          console.log("Chart data added to generating message");
        } else if (dataStream.marker === "TABLE_DATA") {
          // Append it to list of visuals (can be visuals of any type)
          // Marked by 'type' to sort how to render what
          // Table data is NOT wrapped inside of a json object.
          // Table data is directly dataStream.data
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
        } else if (dataStream.marker === "TEXT_END") {
          // Append new text chunk to buffer of text being generated
          const finaVis = generatingVisRef.current;
          const finalResponse = generatingBufferRef.current;

          const newMessage = {
            sender: "AnyLog AI",
            text: finalResponse || "",
            vis: finaVis,
          };

          setMessages((prev) => {
            const updatedMessages = [...prev, newMessage];

            updateChat(selectedChat.id, {
              messages: updatedMessages,
            });

            return updatedMessages;
          });

          // TEXT_END signals that the current message being sent back is over. Empty for next message

          generatingBufferRef.current = "";
          generatingVisRef.current = null;
          setGeneratingBuffer("");
          setIsGenerating(false);
          setStatus("");

          console.log("Message completed");
        } else if (dataStream.marker === "STATUS_UPDATE") {
          // For status message at bottom, requires no parsing
          setStatus(dataStream.data);
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
      setStatus(`Connection error: ${err}`);
    };

    return () => {
      wsRef.current.close();
    };
  }, []);

  const handleSendMessage = (msg) => {
    const generateReply = async () => {
      const userMessage = { sender: "user", text: msg };

      setMessages((prev) => [...prev, userMessage]);

      // Clear out buffers from previous message
      generatingBufferRef.current = "";
      generatingVisRef.current = null;
      setGeneratingBuffer("");
      setGeneratingVis(null);

      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(msg);
          console.log(`Awaiting reply for message #${messages.length}: ${msg}`);
          setIsGenerating(true);
          setStatus("");
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "system",
              text: `Failed to generate message: corrupted connection`,
            },
          ]);
        }
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { sender: "system", text: `Failed to generate message: ${e}` },
        ]);
      }
    };

    generateReply();
  };
  return (
    <div style={styles.container}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          alignItems: "center",
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
            }}
            onClick={() => clearSelectedChat()}
          >
            <IoReturnUpBack
              style={{ paddingRight: 4, marginRight: 4, cursor: "pointer" }}
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
            {/* <h2 style={{ margin: 0 }}>
              {selectedChat.title.length > 20
                ? selectedChat.title.slice(0, 20)
                : selectedChat.title}
            </h2> */}
            <h2 style={{ fontSize: "14px", color: "gray", margin: 0 }}>
              Last Accessed:{" "}
              {parseTimestamp(selectedChat.lastAccessDate) ||
                "Last Accessed: Unknown"}
            </h2>
          </div>
        </div>
        <IoCogSharp
          style={{ cursor: "pointer", paddingRight: 4, marginRight: 4 }}
          size={30}
          onClick={() => toggleShowConfig()}
        />
      </div>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={index}
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
                  {/* If only one visualization, direct render. If more than 1 visualization generated, loop over each one and render */}
                  {(Array.isArray(msg.vis) ? msg.vis : [msg.vis]).map(
                    (visualization, visIndex) => {
                      if (
                        visualization.type === "chart" &&
                        visualization.chart_data
                      ) {
                        // LLM likes to generate chart option fields that are sometimes null
                        // NULL fields are NOT supported from Chart.js
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
        })}

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

      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          style={styles.input}
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
          style={styles.button}
          // disabled={!connected}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, sans-serif",
    overflow: "hidden",
  },
  chatBox: {
    flex: 1,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "#f9f9f9",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  inputArea: {
    display: "flex",
    backgroundColor: "#fff",
    padding: "10px",
    borderTop: "1px solid #ccc",
    boxSizing: "border-box",
  },
  input: {
    flex: 1,
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    outline: "none",
  },
  button: {
    marginLeft: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#4f93ff",
    color: "#fff",
    cursor: "pointer",
  },
  message: {
    maxWidth: "75%",
    padding: "6px 14px",
    borderRadius: "6px",
    lineHeight: 1.5,
    fontSize: "12px",
    marginBottom: "6px",
    wordBreak: "break-word",
  },

  inlineCode: {
    background: "rgba(0,0,0,0.1)",
    padding: "2px 4px",
    borderRadius: "4px",
    fontSize: "0.9em",
  },

  codeBlock: {
    background: "#1e1e1e",
    color: "#f8f8f2",
    padding: "10px",
    borderRadius: "8px",
    overflowX: "auto",
    fontSize: "13px",
    marginTop: "8px",
  },
};

export default ChatView;
