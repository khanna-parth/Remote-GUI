import { SearchOutlined } from "@mui/icons-material";
import { IoCogSharp, IoAdd, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useEffect, useState, useMemo } from "react";
import chatState from "./state/state";
import { getAllChats, initializeChats } from "./utils/storage";
import NewChatListEntry from "./chatcomponents/NewChatListEntry";

const Sidebar = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const selectedChat = chatState((state) => state.selectedChat);
  const [chats, setChats] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setSelectedChat, setNewChat, setModalViewName } = chatState();

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  }

  useEffect(() => {
    const existingChats = getAllChats();
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

  return (
    <div style={{
      width: isCollapsed ? '80px' : '320px',
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      transition: 'width 0.3s ease',
    }}>
      <div style={{
        padding: isCollapsed ? '16px 12px' : '16px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isCollapsed ? '0' : '16px',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? '12px' : '0',
        }}>
          {!isCollapsed && (
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0,
            }}>
              Chats
            </h1>
          )}
          
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            flexDirection: isCollapsed ? 'column' : 'row',
          }}>
            <button
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#6366f1',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
                margin: 0,
                padding: 0
              }}
              onClick={setNewChat}
              title="New chat"
            >
              <IoAdd size={20} color="#ffffff" />
            </button>
            
            <button
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
                margin: 0,
                padding: 0,
              }}
              onClick={() => setModalViewName('Config')}
              title="Settings"
            >
              <IoCogSharp size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div style={{
            position: 'relative',
          }}>
            <SearchOutlined style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchFocused ? '#6366f1' : '#94a3b8',
              fontSize: '18px',
              transition: 'color 0.2s ease',
              pointerEvents: 'none',
            }} />
            
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                fontSize: '14px',
                color: '#0f172a',
                background: searchFocused ? '#ffffff' : '#f1f5f9',
                border: searchFocused ? '2px solid #6366f1' : '2px solid transparent',
                borderRadius: '10px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isCollapsed ? '8px 6px' : '8px 12px',
      }}>
        {chats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isCollapsed ? '20px 10px' : '40px 20px',
          }}>
            <div style={{
              fontSize: isCollapsed ? '24px' : '36px',
              marginBottom: isCollapsed ? '0' : '12px',
              opacity: 0.5,
            }}>💬</div>
            {!isCollapsed && (
              <>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '500',
                  margin: 0,
                }}>
                  {searchValue ? 'No matches found' : 'No chats yet'}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  margin: '6px 0 0 0',
                }}>
                  {searchValue ? 'Try a different search' : 'Click + to start chatting'}
                </p>
              </>
            )}
          </div>
        ) : (
          chats.map((chat, idx) => (
            <div 
              key={idx}
              style={{}}
            >
                <NewChatListEntry 
                key={idx}
                chat={chat} 
                onClick={() => setSelectedChat(chat)}
                isActive={selectedChat?.id === chat.id}
                isCollapsed={isCollapsed}
                />
            </div>
          ))
        )}
      </div>

      <button
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12px',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '48px',
          borderRadius: '0 12px 12px 0',
          background: '#6366f1',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          zIndex: 10,
          margin: 8,
          padding: 4
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <IoChevronForward size={16} color="#ffffff" />
        ) : (
          <IoChevronBack size={16} color="#ffffff" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;