const ChatAuthorView = ({ isUser }) => {
    return (
        <div
            style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            // paddingTop: 8,
            // marginTop: 4,
            fontSize: 12,
            color: "#666",
            }}
        >
            {!isUser && (
            <img
                src="https://media.licdn.com/dms/image/v2/D560BAQGEAwR81QeqNQ/company-logo_200_200/B56ZWb3WosHEAI-/0/1742076734420/anylog_logo?e=2147483647&v=beta&t=afPFKL3XzSYyBvnCEebpeZ--u1KvV7IzniQ1KCvHTmM"
                style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "block",
                }}
            />
            )}
            <span>{isUser ? "You" : "AnyLog AI"}</span>
        </div>
    )
}

export default ChatAuthorView;