import { useEffect, useState } from "react";

const NewChatListEntry = ({ chat, onClick, isActive, isCollapsed }) => {
	const [isHovered, setIsHovered] = useState(false);

	const normalizeMessage = (msg) => {
		if (!msg) return "";

		const parts = msg.split(".");
		const cleanedParts = [];

		for (let i = 0; i < parts.length; i++) {
			const trimmed = parts[i].trim();
			if (trimmed !== "") {
				cleanedParts.push(trimmed);
			}
		}

		const firstTwo = cleanedParts.slice(0, 2).join(". ");

		return firstTwo.replaceAll("*", "").replaceAll("#", "");
	};

	if (isCollapsed) {
		return (
			<div
				style={{
					width: "100%",
					borderRadius: "10px",
					background: isHovered
						? "#e0e7ff"
						: isActive
							? "#e0e7ff"
							: "transparent",
					padding: "10px",
					cursor: "pointer",
					transition: "all 0.2s ease",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onClick}
				title={chat.title}
			>
				<div
					style={{
						width: "32px",
						height: "32px",
						borderRadius: "8px",
						//   background: '#6366f1',
						background: "transparent",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "10px",
						fontWeight: "600",
						color: "black",
					}}
				>
					{/* {chat.title.charAt(0).toUpperCase()} */}
					{chat.title.slice(0, 20)}
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				width: "100%",
				borderRadius: "12px",
        minWidth: 0,
				background: isHovered
					? "#f1f5f9"
					: isActive
						? "#e0e7ff"
						: "transparent",
				padding: "12px 16px",
				cursor: "pointer",
				transition: "background 0.2s ease",
				borderLeft: isHovered ? "3px solid #6366f1" : "3px solid transparent",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onClick}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "6px",
          minWidth: 0,
          width: "100%",
				}}
			>
				<h3
					style={{
						fontSize: "14px",
						fontWeight: "600",
						color: chat.matchType === "title" ? "#f59e0b" : "#0f172a",
						margin: 0,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{chat.title}
				</h3>

				{chat.messages && chat.messages.length > 0 ? (
					<p
						style={{
							fontSize: "13px",
							lineHeight: "1.4",
							color: "#64748b",
							margin: 0,
              minWidth: 0,
              width: "100%",
              display: "block",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							background:
								chat.matchType === "message" ? "#fef3c7" : "transparent",
							padding: chat.matchType === "message" ? "2px 6px" : "0",
							borderRadius: chat.matchType === "message" ? "4px" : "0",
						}}
					>
						{chat.matchType === "message"
							? normalizeMessage(chat.messages.at(chat.matchPos)?.text)
							: normalizeMessage(chat.messages.at(-1)?.text)}
					</p>
				) : (
					<p
						style={{
							fontSize: "13px",
							color: "#94a3b8",
							fontStyle: "italic",
							margin: 0,
						}}
					>
						No messages yet
					</p>
				)}

				<span
					style={{
						fontSize: "11px",
						color: "#94a3b8",
						fontWeight: "500",
					}}
				>
					{chat.lastAccessDate
						? new Date(chat.lastAccessDate).toLocaleDateString()
						: "Unknown"}
				</span>
			</div>
		</div>
	);
};

export default NewChatListEntry;
