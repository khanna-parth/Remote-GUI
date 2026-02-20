export const normalizeChatHistory = (messages, contentLength = null, historyLength = 5) => {
  const targetMessages = historyLength ? messages.slice(-historyLength) : messages;

  return targetMessages
    .map((msg) => {
      const prefix = msg.sender === "user" ? "User" : "AI";
      
      let content = msg.text || "";
      if (contentLength && content.length > contentLength) {
        content = content.substring(0, contentLength) + "...";
      }

      return `${prefix}: ${content}`;
    })
    .join("\n");
};