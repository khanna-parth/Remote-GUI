import { useEffect, useState } from "react";
import { LuCopy } from "react-icons/lu";
import { MdCheck } from "react-icons/md";
import { LuClipboard } from "react-icons/lu";
import { LuClipboardCheck } from "react-icons/lu";

const MessageActions = ({ isUser, message, copyResponseCallback }) => {
  const [copied, setCopied] = useState(false);
  const messagePaddingSize = 6;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      copyResponseCallback("Copied!");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy!", err);
      copyResponseCallback(`Failed to copy: ${err}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        paddingBottom: 10,
        marginLeft: isUser ? 0 : messagePaddingSize,
        marginRight: isUser ? messagePaddingSize : 0,
        marginTop: -2,
      }}
    >
      {copied ? (
        <LuClipboardCheck color={"green"} enableBackground={false} size={13} />
      ) : (
        <LuClipboard
          color={copied ? "gray" : "black"}
          style={{
            cursor: `${copied ? "default" : "pointer"}`,
          }}
          size={13}
          onClick={handleCopy}
        />
      )}
    </div>
  );
};

export default MessageActions;
