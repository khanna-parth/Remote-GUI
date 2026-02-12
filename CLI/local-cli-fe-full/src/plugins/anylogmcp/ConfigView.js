import { useEffect, useState } from "react";
import { sleep } from "../../utils/asyncUtils";
import chatState from "./state/state";
import { sendConfiguration } from "./utils/network";

const ConfigView = ({ onApply = () => {} }) => {
  const {
    modelSettings,
    setModelSettings,
    modalViewName,
    setModalViewName,
    wsID,
  } = chatState();
  const [status, setStatus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [llmConfig, setLlmConfig] = useState({
    planning: {
      provider: "openai",
      model: "",
      api_key: "",
      base_url: "",
    },
    charting: {
      provider: "openai",
      model: "",
      api_key: "",
      base_url: "",
    },
    tabulating: {
      provider: "openai",
      model: "",
      api_key: "",
      base_url: "",
    },
    mcp: {
      provider: "openai",
      model: "",
      api_key: "",
      base_url: "",
    },
  });

  useEffect(() => {
    try {
      const rawSettings = localStorage.getItem("chat-plugin/user-settings");
      if (!rawSettings) return;

      const saved = JSON.parse(rawSettings);

      setLlmConfig((prev) => ({
        planning: { ...prev.planning, ...saved.planning },
        charting: { ...prev.charting, ...saved.charting },
        tabulating: { ...prev.tabulating, ...saved.tabulating },
        mcp: { ...prev.mcp, ...saved.mcp },
      }));

      console.log("Restored LLM configuration");
    } catch (e) {
      console.log(`Failed loading settings for config: ${e}`);
    }
  }, []);

  const updateConfig = (section, field, value) => {
    setLlmConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateAllConfigs = (field, value) => {
    setLlmConfig((prev) => ({
      planning: { ...prev.planning, [field]: value },
      charting: { ...prev.charting, [field]: value },
      tabulating: { ...prev.tabulating, [field]: value },
      mcp: { ...prev.mcp, [field]: value },
    }));
  };

  const applySettings = async () => {
    setModelSettings(llmConfig);
    try {
      localStorage.setItem(
        "chat-plugin/user-settings",
        JSON.stringify(llmConfig),
      );
      console.log(`Saved LLM configuration settings locally`);
      setStatus("Applied");
      await sleep(2000);
      if (modalViewName) {
        setModalViewName(null);
      }
    } catch (e) {
      console.log(`Failed updating settings: ${e}`);
      setStatus(`Failed applying settings: ${e}`);
    }
  };

  const mainConfig = llmConfig.planning;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        background: "#fafafa",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ margin: 0 }}>LLM Configuration</h3>

      <p style={{ margin: "0 0 8px 0" }}>
        Configure your LLM settings for OpenAI-compatible providers.
      </p>
      <p style={{ margin: "0 0 0px 0", fontWeight: 500 }}>
        Example of OpenAI-compatible providers:
      </p>
      <ul style={{ margin: "0 0 8px 0", paddingLeft: 20 }}>
        <li>Claude (via Anthropic API)</li>
        <li>Gemini (via Google AI)</li>
        <li>OpenRouter</li>
        <li>Ollama (self-hosted)</li>
      </ul>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Enter the OpenAI-compatible endpoint URL, API key, and model name.
      </p>

      {!showAdvanced ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: 12,
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={mainConfig.base_url}
              onChange={(e) => updateAllConfigs("base_url", e.target.value)}
              placeholder="Base URL"
              style={inputStyle}
            />

            <input
              value={mainConfig.model}
              onChange={(e) => updateAllConfigs("model", e.target.value)}
              placeholder="LLM Model"
              style={inputStyle}
            />
          </div>

          <input
            type="password"
            value={mainConfig.api_key}
            onChange={(e) => updateAllConfigs("api_key", e.target.value)}
            placeholder="API Key"
            style={inputStyle}
          />
        </div>
      ) : (
        [
          { key: "planning", label: "Planning" },
          { key: "charting", label: "Charting" },
          { key: "tabulating", label: "Tabulating" },
          { key: "mcp", label: "MCP / AnyLog Network" },
        ].map(({ key, label }) => (
          <div
            key={key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: 12,
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <strong>{label}</strong>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={llmConfig[key].base_url}
                onChange={(e) => updateConfig(key, "base_url", e.target.value)}
                placeholder="Base URL"
                style={inputStyle}
              />

              <input
                value={llmConfig[key].model}
                onChange={(e) => updateConfig(key, "model", e.target.value)}
                placeholder="LLM Model"
                style={inputStyle}
              />
            </div>

            <input
              type="password"
              value={llmConfig[key].api_key}
              onChange={(e) => updateConfig(key, "api_key", e.target.value)}
              placeholder="API Key"
              style={inputStyle}
            />
          </div>
        ))
      )}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          background: "#f3f4f6",
          border: "1px solid #d1d5db",
          cursor: "pointer",
          color: "black",
        }}
      >
        {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <button style={{ background: "gray", borderRadius: 6 }}>Clear</button>
        <button style={{ borderRadius: 6 }} onClick={() => applySettings()}>
          Apply
        </button>
      </div>
      {status && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <h3 style={{ fontSize: 14, color: "green", margin: 0 }}>{status}</h3>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  width: "80%",
};

export default ConfigView;
