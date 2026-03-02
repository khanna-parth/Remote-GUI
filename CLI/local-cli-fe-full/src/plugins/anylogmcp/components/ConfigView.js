import { useEffect, useState } from "react";
import { sleep } from "../../../utils/asyncUtils";
import chatState from "../state/state";
import { sendConfiguration } from "../utils/network";
import "../styles/ConfigView.css";

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
    <div className="config-view-container">
      <h3 style={{ margin: 0 }}>LLM Configuration</h3>

      <p className="config-view-description">
        Configure your LLM settings for OpenAI-compatible providers.
      </p>
      <p className="config-view-provider-label">
        Example of OpenAI-compatible providers:
      </p>
      <ul className="config-view-provider-list">
        <li>Claude (via Anthropic API)</li>
        <li>Gemini (via Google AI)</li>
        <li>OpenRouter</li>
        <li>Ollama (self-hosted)</li>
      </ul>
      <p className="config-view-hint">
        Enter the OpenAI-compatible endpoint URL, API key, and model name.
      </p>

      {!showAdvanced ? (
        <div className="config-view-section">
          <div className="config-view-section-row">
            <input
              value={mainConfig.base_url}
              onChange={(e) => updateAllConfigs("base_url", e.target.value)}
              placeholder="Base URL"
              className="config-view-input"
            />
            <input
              value={mainConfig.model}
              onChange={(e) => updateAllConfigs("model", e.target.value)}
              placeholder="LLM Model"
              className="config-view-input"
            />
          </div>
          <input
            type="password"
            value={mainConfig.api_key}
            onChange={(e) => updateAllConfigs("api_key", e.target.value)}
            placeholder="API Key"
            className="config-view-input"
          />
        </div>
      ) : (
        [
          { key: "planning", label: "Planning" },
          { key: "charting", label: "Charting" },
          { key: "tabulating", label: "Tabulating" },
          { key: "mcp", label: "MCP / AnyLog Network" },
        ].map(({ key, label }) => (
          <div key={key} className="config-view-section">
            <strong>{label}</strong>
            <div className="config-view-section-row">
              <input
                value={llmConfig[key].base_url}
                onChange={(e) => updateConfig(key, "base_url", e.target.value)}
                placeholder="Base URL"
                className="config-view-input"
              />
              <input
                value={llmConfig[key].model}
                onChange={(e) => updateConfig(key, "model", e.target.value)}
                placeholder="LLM Model"
                className="config-view-input"
              />
            </div>
            <input
              type="password"
              value={llmConfig[key].api_key}
              onChange={(e) => updateConfig(key, "api_key", e.target.value)}
              placeholder="API Key"
              className="config-view-input"
            />
          </div>
        ))
      )}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="config-view-advanced-toggle"
      >
        {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
      </button>

      <div className="config-view-actions">
        <button className="config-view-clear-button">Clear</button>
        <button className="config-view-apply-button" onClick={() => applySettings()}>
          Apply
        </button>
      </div>

      {status && (
        <div className="config-view-status">
          <h3 className="config-view-status-text">{status}</h3>
        </div>
      )}
    </div>
  );
};

export default ConfigView;
