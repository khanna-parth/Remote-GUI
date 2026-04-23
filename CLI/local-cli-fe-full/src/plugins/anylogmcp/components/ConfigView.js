import { useEffect, useState } from "react";
import { sleep } from "../../../utils/asyncUtils";
import chatState from "../state/state";
import "../styles/ConfigView.css";

const PROVIDER_URLS = {
  "Claude (Anthropic)": "https://api.anthropic.com/v1",
  "Gemini (Google AI)":
    "https://generativelanguage.googleapis.com/v1beta/openai",
  OpenRouter: "https://openrouter.ai/api/v1",
  Ollama: "http://localhost:11434/v1",
};

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
  const [activeProvider, setActiveProvider] = useState(null);
  const [llmConfig, setLlmConfig] = useState({
    planning: { provider: "openai", model: "", api_key: "", base_url: "" },
    charting: { provider: "openai", model: "", api_key: "", base_url: "" },
    tabulating: { provider: "openai", model: "", api_key: "", base_url: "" },
    mcp: { provider: "openai", model: "", api_key: "", base_url: "" },
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

      const savedUrl = saved.planning?.base_url;
      const match = Object.entries(PROVIDER_URLS).find(
        ([, url]) => url === savedUrl,
      );
      if (match) setActiveProvider(match[0]);
    } catch (e) {
      console.log(`Failed loading settings for config: ${e}`);
    }
  }, []);

  const updateConfig = (section, field, value) => {
    setLlmConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
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

  const handleProviderClick = (providerName) => {
    const url = PROVIDER_URLS[providerName];
    if (url) {
      updateAllConfigs("base_url", url);
      setActiveProvider(providerName);
    }
  };

  const applySettings = async () => {
    setModelSettings(llmConfig);
    try {
      localStorage.setItem(
        "chat-plugin/user-settings",
        JSON.stringify(llmConfig),
      );
      setStatus("Applied");
      await sleep(2000);
      setStatus("");
      if (modalViewName) setModalViewName(null);
    } catch (e) {
      console.log(`Failed updating settings: ${e}`);
      setStatus(`Failed applying settings: ${e}`);
    }
  };

  const clearSettings = () => {
    const empty = { provider: "openai", model: "", api_key: "", base_url: "" };
    setLlmConfig({
      planning: { ...empty },
      charting: { ...empty },
      tabulating: { ...empty },
      mcp: { ...empty },
    });
    setActiveProvider(null);
    setStatus("");
  };

  const mainConfig = llmConfig.planning;

  const advancedSections = [
    { key: "planning", label: "Planning" },
    { key: "charting", label: "Charting" },
    { key: "tabulating", label: "Tabulating" },
    { key: "mcp", label: "MCP / AnyLog Network" },
  ];

  return (
    <div className="config-view-container">
      <div className="config-view-header">
        <h3>LLM Configuration</h3>
        <p className="config-view-description">
          Configure your LLM settings for any OpenAI-compatible provider.
        </p>
      </div>

      <div>
        <p className="config-view-provider-label">Compatible providers</p>
        <div className="config-view-provider-chips">
          {Object.keys(PROVIDER_URLS).map((p) => (
            <span
              key={p}
              className={`config-view-chip${activeProvider === p ? " active" : ""}`}
              onClick={() => handleProviderClick(p)}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="config-view-divider" />

      {!showAdvanced ? (
        <div className="config-view-section">
          <div className="config-view-section-row">
            <input
              value={mainConfig.base_url}
              onChange={(e) => {
                updateAllConfigs("base_url", e.target.value);
                setActiveProvider(null);
              }}
              placeholder="Base URL"
              className="config-view-input"
            />
            <input
              value={mainConfig.model}
              onChange={(e) => updateAllConfigs("model", e.target.value)}
              placeholder="Model name"
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
        advancedSections.map(({ key, label }) => (
          <div key={key} className="config-view-section">
            <span className="config-view-section-label">{label}</span>
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
                placeholder="Model name"
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
        {showAdvanced ? "▲ Hide advanced settings" : "▼ Advanced settings"}
      </button>

      <div className="config-view-divider" />

      <div className="config-view-actions">
        <button className="config-view-clear-button" onClick={clearSettings}>
          Clear
        </button>
        <button className="config-view-apply-button" onClick={applySettings}>
          Apply
        </button>
      </div>

      {status && (
        <div className="config-view-status">
          <div className="config-view-status-dot" />
          <h3 className="config-view-status-text">{status}</h3>
        </div>
      )}
    </div>
  );
};

export default ConfigView;
