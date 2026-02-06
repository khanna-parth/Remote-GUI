import MarkdownTextBlock from "./MarkdownTextBlock";

const ChatMessage = ({ isUser, text}) => {
    return (
    <div
        // key={index}
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isUser ? "flex-end" : "flex-start",
        }}
    >
        <div
            style={{
            ...styles.message,
            backgroundColor: isUser ? "#4f93ff" : "#e5e5ea",
            color: isUser ? "#fff" : "#000",
            }}
        >
            <MarkdownTextBlock text={text}/>
        </div>
    </div>
    )
}

const styles = {
    message: {
        maxWidth: "100%",
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
}

export default ChatMessage;