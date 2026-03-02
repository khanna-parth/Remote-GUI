import MarkdownTextBlock from "./MarkdownTextBlock";
import "../styles/ChatMessage.css";

const ChatMessage = ({ isUser, text }) => {
  return (
    <div className={`chat-message ${isUser ? "chat-message--user" : "chat-message--ai"}`}>
      <div className={`chat-message__bubble ${isUser ? "chat-message__bubble--user" : "chat-message__bubble--ai"}`}>
        <MarkdownTextBlock text={text} />
      </div>
    </div>
  );
};

export default ChatMessage;
