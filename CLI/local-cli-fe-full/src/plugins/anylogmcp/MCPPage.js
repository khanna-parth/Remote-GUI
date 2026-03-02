import { useEffect, useState } from "react";
import ChatView from "./components/ChatView";
import chatState from "./state/state";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/material";
import ConfigView from "./components/ConfigView";
import { sendConfiguration } from "./utils/network";
import { sleep } from "../../utils/asyncUtils";
import ChatExportView from "./chatcomponents/ChatExportView";
import Sidebar from "./components/Sidebar";
import "./styles/MCPPage.css";

export const pluginMetadata = {
  name: "Chat",
  icon: null,
};

const ModalComponents = {
  Config: ConfigView,
  ChatExporter: ChatExportView,
};

const MCPPage = () => {
  const selectedChat = chatState((state) => state.selectedChat);
  const wsID = chatState((state) => state.wsID);
  const modelSettings = chatState((state) => state.modelSettings);
  const setModelSettings = chatState((state) => state.modelSettings);
  const modalViewName = chatState((state) => state.modalViewName);
  const setModalViewName = chatState((state) => state.setModalViewName);

  useEffect(() => {
    try {
      const settings = localStorage.getItem("chat-plugin/user-settings");
      if (settings) {
        const settingsData = JSON.parse(settings);
        setModelSettings(settingsData);
        console.log(`Loaded locally saved LLM settings from mainpage`);
      } else {
        console.log(`Couldn't find locally saved LLM settings`);
      }
    } catch (e) {
      console.log(`Failed loading user settings: ${e}`);
    }
  }, []);

  useEffect(() => {
    const updateConfiguration = async () => {
      await sleep(3000);
      try {
        const updated = await sendConfiguration(wsID, modelSettings);
        console.log(`Config observer pushed config settings: ${updated}`);
      } catch (e) {
        console.log(`Config observer failed to push config settings: ${e}`);
      }
    };

    if (wsID) {
      updateConfiguration();
    }
  }, [wsID, modelSettings]);

  const ActiveComponent = ModalComponents[modalViewName];

  useEffect(() => {
    console.log(`Component being rendered: ${modalViewName}`);
  }, [modalViewName]);

  return (
    <div className="mcp-page-container">
      <div className="mcp-page-sidebar-wrapper">
        <Sidebar />
      </div>
      {selectedChat ? (
        <div className="mcp-page-chat-wrapper">
          <ChatView externalMessages={[]} />
        </div>
      ) : (
        <></>
      )}
      <Modal
        open={modalViewName !== null}
        onClose={() => setModalViewName(null)}
        style={{ overflow: "auto" }}
      >
        <Box className="mcp-page-modal-box">
          <div className="mcp-page-modal-inner">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default MCPPage;
