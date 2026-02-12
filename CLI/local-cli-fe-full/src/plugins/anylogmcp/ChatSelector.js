import { SearchOutlined } from "@mui/icons-material";
import { alignItems, borderRadius, color, flexDirection, justifyContent } from "@mui/system";
import { IoCogSharp } from "react-icons/io5";
import { useEffect, useMemo, useState } from "react";
import { parseTimestamp } from "./utils/numerical";
import chatState from "./state/state";
import { getAllChats, initializeChats } from "./utils/storage";
import MarkdownTextBlock from "./chatcomponents/MarkdownTextBlock";

export const ChatListEntry = ({ chat }) => {
  const normalizeMessage = (msg) => {
    if (msg.includes(".")) {
      const lines = msg.split(".")
      if (lines.length > 0) {
        return lines.slice(0, 5).join('. ').replaceAll("*", "").replaceAll("#", "");
      }
    }
    return `${msg.slice(0, 150)}...`.replaceAll("*", "").replaceAll("#", "");
  }
  return (
    <div style={{
      width: '95%',
      borderRadius: 8,
      background: 'white',
      margin: '10px auto',
      padding: 10,
      border: '1px solid #e0e0e0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      cursor: 'pointer'
    }}>
      <div style={{ marginBottom: 4 }}>
        <h1 style={{
          color: 'black',
          display: 'flex',
          flexDirection: 'row',
          fontSize: 18,
          alignItems: 'center',
          alignContent: 'center',
          margin: 0
        }}>
          <span style={{ backgroundColor: chat.matchType === "title" ? '#fff59d' : 'transparent' }}>
            {chat.title}
          </span>

          <span style={{ paddingLeft: 6, fontSize: 14, color: '#666', fontWeight: 'normal' }}>
            | Last accessed: {parseTimestamp(chat.lastAccessDate) || 'Unknown'}
          </span>
        </h1>
      </div>

      {chat.messages && chat.messages.length > 0 ? (
        // <MarkdownTextBlock
        //   text={
        //     chat.matchType === "messages" ?
        //     clipMessage(chat.messages.at(chat.matchPos)?.text) :
        //     clipMessage(chat.messages.at(-1)?.text)
        //   }
        //   extraStyles={{fontSize: 14, color: '#444', backgroundColor: chat.matchType === "message" ? "#fff59d" : "transparent"}}
        // />
        <span style={{
          fontSize: 14,
          color: '#444',
          backgroundColor: chat.matchType === "message" ? '#fff59d' : 'transparent'
        }}>
          {chat.matchType === "message"
            ? normalizeMessage(chat.messages.at(chat.matchPos)?.text)
            : normalizeMessage(chat.messages.at(-1)?.text)
          }
        </span>
      ) : (
        <span style={{ fontSize: 14, color: '#999', fontStyle: 'italic' }}>
          No content yet...
        </span>
      )}
    </div>
  );
}

const ChatSelector = () => {
  const [chats, setChats] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const { setSelectedChat, setNewChat, setModalViewName } = chatState();

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  }

  const filteredChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    if (!searchValue) {
      return [...chats].sort((c1, c2) => c2.lastAccessDate - c1.lastAccessDate)
    }

    let filtered = [];

    chats.forEach((chat) => {
      const titleMatch = chat.title.toLowerCase().includes(searchValue.trim().toLowerCase());
      if (titleMatch) {
        filtered.push({ ...chat, matchType: 'title', matchPos: 0 })
        return;
      }

      const msgMatchIdx = chat.messages?.findIndex(msg => msg.text.toLowerCase().includes(searchValue.trim().toLowerCase()));

      if (msgMatchIdx !== -1) {
        filtered.push({ ...chat, matchType: 'message', matchPos: msgMatchIdx })
      }
    })

    return filtered.sort((c1, c2) => c2.lastAccessDate - c1.lastAccessDate);
  }, [searchValue, chats])

  useEffect(() => {
    const existingChats = getAllChats();
    // console.log(`RAW: ${JSON.stringify(existingChats, null, 2)}`)
    if (!existingChats) {
      initializeChats(); 
      const defaultChats = getAllChats();
      console.log('Initialized chats');
      setChats(defaultChats);
    } else {
      try {
        setChats(existingChats);
        console.log("Parsed local chats");
      } catch (e) {
        console.error("Failed to parse chats", e);
        setChats([]);
      }
    }
  }, [])

  return (
    <>
      <div style={{
        background: 'white', width: '98%', height: '100%'
      }}>

        {/* Search Bar Header */}
        <div style={{
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          display: 'flex',
          gap: 4,
          position: 'sticky',
          paddingBottom: 40,
        }}>
          <textarea
            style={{ borderRadius: 8, width: '100%', padding: 8, fontSize: 14 }}
            placeholder={"Search for a chat"}
            rows={1}
            value={searchValue}
            onChange={handleSearchChange}
          />
          <IoCogSharp size={30} style={{ borderRadius: 8, cursor: 'pointer' }} onClick={() => setModalViewName("Config")} />
        </div>

        {/* Chats */}
        <div style={{
          // background: '#E5E4E2',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <h4 style={{
            fontSize: 16,
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center',
          }}>{filteredChats.length === chats.length ? 'Your conversations' : 'Filtered Chats'}</h4>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
            <button style={{ color: '#0000FF', width: '150px', height: '50px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }} onClick={() => setNewChat()}>
              <span style={{ fontSize: 16, color: 'white', fontWeight: 'bolder' }}>Create new chat</span>
            </button>
          </div>
          {filteredChats.map((chat, idx) => (
            <div key={idx}>
              <div onClick={() => setSelectedChat(chat)}>
                <ChatListEntry chat={chat} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ChatSelector;
