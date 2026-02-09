import { useEffect, useState } from 'react';
import ChatSelector from './ChatSelector';
import ChatView from './ChatView';
import chatState from './state/state';
import Modal from '@mui/material/Modal';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ConfigView from './ConfigView';
import { sendConfiguration } from './utils/network';
import { sleep } from '../../utils/asyncUtils';

export const pluginMetadata = {
  name: 'Chat',
  icon: null
};

const MCPPage = () => {
  // const [selectedChat, setSelectedChat] = useState('');
  const { selectedChat, showConfig, toggleShowConfig, modelSettings, setModelSettings, wsID } = chatState();

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
  }, [])

  useEffect(() => {
    const updateConfiguration = async () => {
      await sleep(3000);
      try {
        const updated = await sendConfiguration(wsID, modelSettings);
        console.log(`Config observer pushed config settings: ${updated}`);
      } catch (e) {
        console.log(`Config observer failed to push config settings: ${e}`);
      }
    }

    if (wsID) {
      updateConfiguration()
    }
  }, [wsID, modelSettings])

  return (
    <div style={{
      width: "100%",
      height: "100%",
      overflow: 'hidden'
    }}>
      {
        selectedChat ? (
          <div>
            <ChatView externalMessages={[]} />
            <Modal
              open={showConfig}
              onClose={toggleShowConfig}
            >
              <Box sx={style}>
                <ConfigView />
              </Box>
            </Modal>
          </div>
        ) : (
          <div>
            <ChatSelector />
            <Modal
              open={showConfig}
              onClose={toggleShowConfig}
            >
              <Box sx={style}>
                <ConfigView />
              </Box>
            </Modal>
          </div>
        )
      }
      {/* <ChatView /> */}
    </div>
  )
}


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  // border: '1px solid #000',
  boxShadow: 24,
  borderRadius: 6,
  p: 4,
};

export default MCPPage;
