import "../styles/ChatAuthorView.css";

const ChatAuthorView = ({ isUser }) => {
  return (
    <div className="chat-author-view">
      {!isUser && (
        <img
          src="https://media.licdn.com/dms/image/v2/D560BAQGEAwR81QeqNQ/company-logo_200_200/B56ZWb3WosHEAI-/0/1742076734420/anylog_logo?e=2147483647&v=beta&t=afPFKL3XzSYyBvnCEebpeZ--u1KvV7IzniQ1KCvHTmM"
          className="chat-author-view__avatar"
          alt="AnyLog AI"
        />
      )}
      <span>{isUser ? "You" : "AnyLog AI"}</span>
    </div>
  );
};

export default ChatAuthorView;
