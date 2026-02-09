import { generateId } from "./numerical";

const CHAT_STORAGE_PREFIX = "chat-plugin/conversations";

export const initializeChats = () => {
  const rawChats = localStorage.getItem(CHAT_STORAGE_PREFIX);
  if (!rawChats) {
    const defaultChats = [
      {
        id: generateId(),
        title: "Introductions",
        messages: [
          { text: "Hi there", sender: "user" },
          { text: "Hello, how may I help you", sender: "AnyLog AI" },
          { text: "What can you do?", sender: "user" },
          { text: "I can help you in many ways", sender: "AnyLog AI" },
        ],
        lastAccessDate: Date.now(),
      },
    ];
    localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(defaultChats));
  }
};

export const getAllChats = () => {
  initializeChats();
  const rawChats = localStorage.getItem(CHAT_STORAGE_PREFIX);
  return JSON.parse(rawChats);
};

export const getChatById = (id) => {
  const chats = getAllChats();
  return chats.find(chat => chat.id === id) || null;
};

export const createNewChat = (saveOnCreate) => {
    const newChat = {
      id: generateId(),
      title: "Untitled Chat",
      messages: [{ text: "Hello, how can I help you?", sender: "AnyLog AI" }],
      lastAccessDate: Date.now(),
    }

    if (saveOnCreate) {
        addChat(newChat);
    }

    return newChat;
}

export const addChat = (chat) => {
  const chats = getAllChats();
  chats.push(chat);
  localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(chats));
};

export const updateChat = (id, updatedData) => {
  const chats = getAllChats();
  const index = chats.findIndex(chat => chat.id === id);
  if (index === -1) return null;

  chats[index] = {
    ...chats[index],
    ...updatedData,
    lastAccessDate: Date.now(),
  };

  localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(chats));
  console.log(`Updated chat #${id}`);
  return chats[index];
};

export const deleteChat = (id) => {
  const chats = getAllChats();
  const filteredChats = chats.filter(chat => chat.id !== id);
  localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(filteredChats));
  return filteredChats;
};
