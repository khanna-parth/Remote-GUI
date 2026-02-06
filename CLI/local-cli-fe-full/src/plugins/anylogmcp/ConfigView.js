import { width } from "@mui/system";
import { useEffect, useState } from "react";
import { sleep } from "../../utils/asyncUtils";
import chatState from "./state/state";

const ConfigView = () => {
  const { modelSettings, setModelSettings, toggleShowConfig } = chatState();
  const [status, setStatus] = useState("");
  const [llmConfig, setLlmConfig] = useState({
    planning: {
      baseUrl: '',
      model: '',
      apiKey: '',
    },
    charting: {
      baseUrl: '',
      model: '',
      apiKey: '',
    },
    tabulating: {
      baseUrl: '',
      model: '',
      apiKey: '',
    },
    mcp: {
      baseUrl: '',
      model: '',
      apiKey: '',
    },
  });

  useEffect(() => {
    if (modelSettings) {
      try {
        setLlmConfig(modelSettings);
      } catch (e) {
        console.log(`Failed restoring previously saved model settings: ${e}`)
      }
    }
  }, [modelSettings])
  const updateConfig = (section, field, value) => {
    setLlmConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };
  const applySettings = async () => {
    console.log(`Settings: ${JSON.stringify(llmConfig, null, 2)}`);
    setModelSettings(llmConfig);
    setStatus("Applied");
    await sleep(2000);
    toggleShowConfig();
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        background: '#fafafa',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        // maxWidth: 520,
      }}
    >
      <h3 style={{ margin: 0 }}>LLM Configuration</h3>

      {[
        { key: 'planning', label: 'Planning' },
        { key: 'charting', label: 'Charting' },
        { key: 'tabulating', label: 'Tabulating' },
        { key: 'mcp', label: 'MCP / AnyLog Network' },
      ].map(({ key, label }) => (
        <div
          key={key}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 12,
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <strong>{label}</strong>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={llmConfig[key].baseUrl}
              onChange={(e) =>
                updateConfig(key, 'baseUrl', e.target.value)
              }
              placeholder="Base URL"
              style={inputStyle}
            />

            <input
              value={llmConfig[key].model}
              onChange={(e) =>
                updateConfig(key, 'model', e.target.value)
              }
              placeholder="LLM Name"
              style={inputStyle}
            />
          </div>

          <input
            type="password"
            value={llmConfig[key].apiKey}
            onChange={(e) =>
              updateConfig(key, 'apiKey', e.target.value)
            }
            placeholder="API Key"
            style={inputStyle}
          />
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 20 }}>
        <button style={{ background: 'gray', borderRadius: 6 }}>Clear</button>
        <button style={{ borderRadius: 6 }} onClick={() => applySettings()}>Apply</button>
      </div>
      {status && (
        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
          <h3 style={{ fontSize: 14, color: 'green', margin: 0 }}>{status}</h3>
        </div>
      )
      }
    </div>
  )
}

const inputStyle = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 14,
  width: '80%',
};

export default ConfigView;
