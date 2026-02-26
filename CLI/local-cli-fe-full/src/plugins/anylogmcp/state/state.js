import { create } from 'zustand'
import { generateId } from '../utils/numerical';
import { addChat, createNewChat } from '../utils/storage';

const chatState = create((set) => ({
  wsID: null,
  clearWsID: () => set({ wsID: null }),
  setWsID: (id) => set({ wsID: id }),

  selectedChat: null,
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  clearSelectedChat: () => set({ selectedChat: null }),
  setNewChat: () => {
    const newChat = createNewChat(true);
    set({ selectedChat: newChat });
  },

  refreshChats: false,
  setRefreshChats: (val) => set({ refreshChats: val }),

  modelSettings: null,
  setModelSettings: (settings) => set({ modelSettings: settings }),

  modalViewName: null,
  setModalViewName: (viewName) => set({ modalViewName: viewName }),

  currentExport: { format: null, completed: false },
  setCurrentExport: (formatToExport, completedState) => set({
    currentExport: { format: formatToExport, completed: completedState}
  }),
}))

export default chatState;

