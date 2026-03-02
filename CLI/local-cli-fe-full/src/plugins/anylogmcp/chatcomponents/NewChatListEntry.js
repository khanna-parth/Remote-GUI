import { useState } from "react";
import "../styles/NewChatListEntry.css";

const NewChatListEntry = ({ chat, onClick, isActive, isCollapsed }) => {
  const [isHovered, setIsHovered] = useState(false);

  const normalizeMessage = (msg) => {
    if (!msg) return "";
    const parts = msg.split(".");
    const cleanedParts = [];
    for (let i = 0; i < parts.length; i++) {
      const trimmed = parts[i].trim();
      if (trimmed !== "") cleanedParts.push(trimmed);
    }
    return cleanedParts.slice(0, 2).join(". ").replaceAll("*", "").replaceAll("#", "");
  };

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onClick,
  };

  if (isCollapsed) {
    const stateClass = isHovered || isActive
      ? "chat-list-entry--collapsed-hovered"
      : "chat-list-entry--collapsed-default";

    return (
      <div
        className={`chat-list-entry chat-list-entry--collapsed ${stateClass}`}
        title={chat.title}
        {...handlers}
      >
        <div className="chat-list-entry__collapsed-icon">
          {chat.title.slice(0, 20)}
        </div>
      </div>
    );
  }

  const stateClass = isHovered
    ? "chat-list-entry--expanded-hovered"
    : isActive
      ? "chat-list-entry--expanded-active"
      : "chat-list-entry--expanded-default";

  return (
    <div
      className={`chat-list-entry chat-list-entry--expanded ${stateClass}`}
      {...handlers}
    >
      <div className="chat-list-entry__body">
        <h3 className={`chat-list-entry__title ${chat.matchType === "title" ? "chat-list-entry__title--match" : ""}`}>
          {chat.title}
        </h3>

        {chat.messages && chat.messages.length > 0 ? (
          <p className={`chat-list-entry__preview ${chat.matchType === "message" ? "chat-list-entry__preview--match" : ""}`}>
            {chat.matchType === "message"
              ? normalizeMessage(chat.messages.at(chat.matchPos)?.text)
              : normalizeMessage(chat.messages.at(-1)?.text)}
          </p>
        ) : (
          <p className="chat-list-entry__empty">No messages yet</p>
        )}

        <span className="chat-list-entry__date">
          {chat.lastAccessDate
            ? new Date(chat.lastAccessDate).toLocaleDateString()
            : "Unknown"}
        </span>
      </div>
    </div>
  );
};

export default NewChatListEntry;
