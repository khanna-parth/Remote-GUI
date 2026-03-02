import { SearchOutlined } from "@mui/icons-material";
import { IoCogSharp, IoAdd, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useEffect, useState, useMemo } from "react";
import chatState from "../state/state";
import { getAllChats, initializeChats } from "../utils/storage";
import NewChatListEntry from "../chatcomponents/NewChatListEntry";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedChat = chatState((state) => state.selectedChat);

  const refreshChats = chatState((state) => state.refreshChats);
  const setRefreshChats = chatState((state) => state.setRefreshChats);

  const [chats, setChats] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setSelectedChat, setNewChat, setModalViewName } = chatState();

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  useEffect(() => {
    const existingChats = getAllChats();
    if (!existingChats) {
      initializeChats();
      const defaultChats = getAllChats();
      console.log("Initialized chats");
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
  }, [refreshChats, selectedChat]);

  const filteredChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    if (!searchValue) {
      return [...chats].sort((c1, c2) => c2.lastAccessDate - c1.lastAccessDate);
    }

    let filtered = [];

    chats.forEach((chat) => {
      const titleMatch = chat.title
        .toLowerCase()
        .includes(searchValue.trim().toLowerCase());
      if (titleMatch) {
        filtered.push({ ...chat, matchType: "title", matchPos: 0 });
        return;
      }

      const msgMatchIdx = chat.messages?.findIndex((msg) =>
        msg.text.toLowerCase().includes(searchValue.trim().toLowerCase()),
      );

      if (msgMatchIdx !== -1) {
        filtered.push({ ...chat, matchType: "message", matchPos: msgMatchIdx });
      }
    });

    return filtered.sort((c1, c2) => c2.lastAccessDate - c1.lastAccessDate);
  }, [searchValue, chats]);

  const collapsedClass = isCollapsed ? "collapsed" : "expanded";

  return (
    <div className={`sidebar-container sidebar-container--${collapsedClass}`}>
      <div className={`sidebar-header sidebar-header--${collapsedClass}`}>
        <div className={`sidebar-header-top sidebar-header-top--${collapsedClass}`}>
          {!isCollapsed && <h1 className="sidebar-title">Chats</h1>}

          <div className={`sidebar-actions sidebar-actions--${collapsedClass}`}>
            <button
              className="sidebar-new-chat-button"
              onClick={setNewChat}
              title="New chat"
            >
              <IoAdd size={20} color="#ffffff" />
            </button>

            <button
              className="sidebar-settings-button"
              onClick={() => setModalViewName("Config")}
              title="Settings"
            >
              <IoCogSharp size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="sidebar-search-wrapper">
            {/* <SearchOutlined
              className={`sidebar-search-icon ${searchFocused ? "sidebar-search-icon--focused" : "sidebar-search-icon--unfocused"}`}
            /> */}
            <input
              type="text"
              className={`sidebar-search-input ${searchFocused ? "sidebar-search-input--focused" : "sidebar-search-input--unfocused"}`}
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        )}
      </div>

      <div className={`sidebar-list sidebar-list--${collapsedClass}`}>
        {chats.length === 0 ? (
          <div className={`sidebar-empty-state sidebar-empty-state--${collapsedClass}`}>
            <div className={`sidebar-empty-icon sidebar-empty-icon--${collapsedClass}`}>
              💬
            </div>
            {!isCollapsed && (
              <>
                <p className="sidebar-empty-title">
                  {searchValue ? "No matches found" : "No chats yet"}
                </p>
                <p className="sidebar-empty-subtitle">
                  {searchValue ? "Try a different search" : "Click + to start chatting"}
                </p>
              </>
            )}
          </div>
        ) : (
          filteredChats.map((chat, idx) => (
            <div key={idx} className="sidebar-chat-item">
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
        className="sidebar-collapse-button"
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
