import { FaFileLines, FaFilePdf } from "react-icons/fa6";
import chatState from "../state/state";
import { sleep } from "../../../utils/asyncUtils";
import { useEffect, useState } from "react";

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

    }, [currentExport])
    return (
        <div>
            <h3>Export Your Chat</h3>
            <p>Choose the viewing format to export your chat in.</p>
            <div style={{
                maxWidth: "100%",
                maxHeight: "100%",
                display: 'flex',
                flexDirection: 'row',
                padding: 4,
                justifyContent: 'center',
                alignItems: 'center',
                alignContent: 'center',
                gap: '32px',
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center'
                }}>
                    <h4>LOG</h4>
                    <div style={{
                        width: '300px',
                        height: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <span>Selectable text</span>
                        <span>Quick scroll style</span>
                        <span>Less storage</span>
                        <span>Unofficial support for rendered visuals</span>
                    </div>
                    <button onClick={() => handleExport("LOG")} style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        cursor: 'pointer'
                    }} disabled={isExporting}
                    >
                        <FaFileLines />
                        <span>Download Log Format</span>
                    </button>
                </div>
                
                <div style={{
                    width: '1px',
                    height: '400px',
                    backgroundColor: '#ddd',
                    alignSelf: 'stretch'
                }}></div>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center'
                }}>
                    <h4>PDF</h4>
                    <div style={{
                        width: '300px',
                        height: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <span>Fully rendered chats</span>
                        <span>Typical chat-conversation style appearance</span>
                        <span>More storage</span>
                        <span>Full support for rendered visuals</span>
                    </div>
                    <button onClick={() => handleExport("PDF")} style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        cursor: 'pointer'
                    }} disabled={isExporting}
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