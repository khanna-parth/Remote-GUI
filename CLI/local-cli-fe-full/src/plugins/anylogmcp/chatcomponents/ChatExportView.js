import { FaFileLines, FaFilePdf } from "react-icons/fa6";
import chatState from "../state/state";
import { useEffect, useState } from "react";
import "../styles/ChatExportView.css";

const ChatExportView = () => {
  const [isExporting, setIsExporting] = useState(false);
  const currentExport = chatState((state) => state.currentExport);
  const setCurrentExport = chatState((state) => state.setCurrentExport);

  const handleExport = async (format) => {
    setIsExporting(true);
    setCurrentExport(format, false);
  };

  useEffect(() => {
    if (!currentExport || !currentExport.completed) return;
    setCurrentExport(null, false);
    setIsExporting(false);
  }, [currentExport]);

  return (
    <div>
      <h3>Export Your Chat</h3>
      <p>Choose the viewing format to export your chat in.</p>
      <div className="chat-export-view__options">
        <div className="chat-export-view__option">
          <h4>LOG</h4>
          <div className="chat-export-view__feature-list">
            <span>Selectable text</span>
            <span>Quick scroll style</span>
            <span>Less storage</span>
            <span>Unofficial support for rendered visuals</span>
          </div>
          <button
            onClick={() => handleExport("LOG")}
            className="chat-export-view__button"
            disabled={isExporting}
          >
            <FaFileLines />
            <span>Download Log Format</span>
          </button>
        </div>

        <div className="chat-export-view__divider" />

        <div className="chat-export-view__option">
          <h4>PDF</h4>
          <div className="chat-export-view__feature-list">
            <span>Fully rendered chats</span>
            <span>Typical chat-conversation style appearance</span>
            <span>More storage</span>
            <span>Full support for rendered visuals</span>
          </div>
          <button
            onClick={() => handleExport("PDF")}
            className="chat-export-view__button"
            disabled={isExporting}
          >
            <FaFilePdf />
            <span>Download PDF Format</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatExportView;
