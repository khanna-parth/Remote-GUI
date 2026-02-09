
const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

export const sendConfiguration = async (id, config) => {
  try {
    const reqBody = JSON.stringify({ llms: { ...config }, conn_id: id });
    const response = await fetch(`${API_URL}/mcp/configure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: reqBody,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data
  } catch (err) {
    console.error("Error:", err);
    return err
  }
};