import { useEffect, useState } from "react";
import ChatSelector from "./ChatSelector";
import ChatView from "./ChatView";
import chatState from "./state/state";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/material";
import ConfigView from "./ConfigView";
import { sendConfiguration } from "./utils/network";
import { sleep } from "../../utils/asyncUtils";
import ChatExportView from "./chatcomponents/ChatExportView";

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
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {selectedChat ? <ChatView externalMessages={[]} /> : <ChatSelector />}
      <Modal
        open={modalViewName !== null}
        onClose={() => setModalViewName(null)}
      >
        <Box sx={style}>
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
            {<ActiveComponent />}
          </div>
        </Box>
      </Modal>
    </div>
  );
};

// const style = {
//   position: "absolute",
//   top: "50%",
//   left: "50%",
//   transform: "translate(-50%, -50%)",
//   width: 1600,
//   height: 1200,
//   bgcolor: "background.paper",
//   // border: '1px solid #000',
//   boxShadow: 24,
//   borderRadius: 6,
//   p: 4,
// };
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: '90vw',
  maxHeight: '40vw',
  bgcolor: "background.paper",
  boxShadow: 24,
  overflow: 'hidden',
  borderRadius: 3,
  p: 0,
};

export default MCPPage;
