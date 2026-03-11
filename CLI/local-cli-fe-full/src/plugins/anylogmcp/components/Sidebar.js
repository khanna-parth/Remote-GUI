import { IoCogSharp, IoAdd, IoChevronBack, IoChevronForward, IoTrashOutline } from "react-icons/io5";
import { useEffect, useState, useMemo } from "react";
import chatState from "../state/state";
import { getAllChats, initializeChats, deleteChat } from "../utils/storage";
import "../styles/Sidebar.css";

const SidebarEntry = ({ chat, isActive, isCollapsed, onClick, onDelete }) => {
  const initial = chat.title?.[0]?.toUpperCase() || "?";

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(chat.id);
  };

  if (isCollapsed) {
    return (
      <div
        className={`sidebar-entry sidebar-entry--collapsed ${isActive ? "sidebar-entry--active" : ""}`}
        onClick={onClick}
        title={chat.title}
      >
        <div className="sidebar-entry-avatar">{initial}</div>
      </div>
    );
  }

  const date = chat.lastAccessDate
    ? new Date(chat.lastAccessDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`sidebar-entry sidebar-entry--expanded ${isActive ? "sidebar-entry--active" : ""}`}
      onClick={onClick}
    >
      <div className="sidebar-entry-text">
        <p className="sidebar-entry-title">{chat.title || "Untitled"}</p>
        {date && <p className="sidebar-entry-meta">{date}</p>}
      </div>

      <button
        className="sidebar-entry-delete"
        onClick={handleDelete}
        title="Delete chat"
      >
        <IoTrashOutline size={13} />
      </button>
    </div>
  );
};

const Sidebar = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [chats, setChats] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedChat = chatState((state) => state.selectedChat);
  const refreshChats = chatState((state) => state.refreshChats);
  const setRefreshChats = chatState((state) => state.setRefreshChats);
  const { setSelectedChat, setNewChat, setModalViewName, clearSelectedChat } = chatState();

  const collapsedClass = isCollapsed ? "collapsed" : "expanded";

  useEffect(() => {
    const existingChats = getAllChats();
    if (!existingChats) {
      initializeChats();
      setChats(getAllChats());
    } else {
      try {
        setChats(existingChats);
      } catch (e) {
        console.error("Failed to parse chats", e);
        setChats([]);
      }
    }
  }, [refreshChats, selectedChat]);

  const filteredChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    if (!searchValue) {
      return [...chats].sort((a, b) => b.lastAccessDate - a.lastAccessDate);
    }

    const q = searchValue.trim().toLowerCase();
    const filtered = [];

    chats.forEach((chat) => {
      if (chat.title.toLowerCase().includes(q)) {
        filtered.push({ ...chat, matchType: "title" });
        return;
      }
      const idx = chat.messages?.findIndex((m) => m.text.toLowerCase().includes(q));
      if (idx !== -1) {
        filtered.push({ ...chat, matchType: "message", matchPos: idx });
      }
    });

    return filtered.sort((a, b) => b.lastAccessDate - a.lastAccessDate);
  }, [searchValue, chats]);

  const handleDelete = (id) => {
    const remaining = deleteChat(id);
    setChats(remaining);

    if (selectedChat?.id === id) {
      clearSelectedChat?.();
    }

    setRefreshChats((prev) => !prev);
  };

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
              <IoAdd size={16} />
            </button>

            <button
              className="sidebar-settings-button"
              onClick={() => setModalViewName("Config")}
              title="Settings"
            >
              <IoCogSharp size={15} />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="sidebar-search-wrapper">
            <input
              type="text"
              className={`sidebar-search-input ${searchFocused ? "sidebar-search-input--focused" : "sidebar-search-input--unfocused"}`}
              placeholder="Search chats…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        )}
      </div>

      <div className={`sidebar-list sidebar-list--${collapsedClass}`}>
        {filteredChats.length === 0 ? (
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
                  {searchValue ? "Try a different search" : "Click + to start"}
                </p>
              </>
            )}
          </div>
        ) : (
          filteredChats.map((chat, idx) => (
            <div key={chat.id ?? idx} className="sidebar-chat-item">
              <SidebarEntry
                chat={chat}
                isActive={selectedChat?.id === chat.id}
                isCollapsed={isCollapsed}
                onClick={() => setSelectedChat(chat)}
                onDelete={handleDelete}
              />
            </div>
          ))
        )}
      </div>

      <button
        className="sidebar-collapse-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed
          ? <IoChevronForward size={12} />
          : <IoChevronBack size={12} />
        }
      </button>

    </div>
  );
};

export default Sidebar;