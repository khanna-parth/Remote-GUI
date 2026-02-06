// MCP Plugin API
// Simple API client for AnylogMCP plugin

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

export const getMCPStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/mcp/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (e) {
        console.error(`Error fetching MCP status:`, e);
        throw e;
    }
}

export const startMCP = async () => {
    try {
        const response = await fetch(`${API_URL}/mcp/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (e) {
        console.error(`Error fetching MCP status:`, e);
        throw e;
    }
}

export const chatMCP = async (wsRef, msg) => {
    try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(msg);
        }
    } catch (e) {
        throw new Error(`Failed generating reply: ${e}`)
    }
}

// export const chatMCP = async (msg) => {
//     try {
//         const response = await fetch(`${API_URL}/mcp/chat`, {
//             method: 'POST',
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ msg: msg })
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         let json = await response.json();
//         console.log(JSON.stringify(json, null, 2));
//         return json;
//     } catch (e) {
//         console.error(`Error fetching MCP status:`, e);
//         throw e;
//     }
// }

export const stopMCP = async () => {
    try {
        const response = await fetch(`${API_URL}/mcp/stop`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (e) {
        console.error(`Error fetching MCP status:`, e);
        throw e;
    }
}