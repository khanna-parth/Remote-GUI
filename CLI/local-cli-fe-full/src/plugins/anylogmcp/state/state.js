import { create } from 'zustand'
import { generateId } from '../utils/numerical';
import { addChat, createNewChat } from '../utils/storage';

const chatState = create((set) => ({
  wsID: null,
  showConfig: false,
  selectedChat: null,
  modelSettings: null,

  clearWsID: () => set({ wsID: null }),
  setWsID: (id) => set({ wsID: id }),

  toggleShowConfig: () => set((state) => ({ showConfig: !state.showConfig })),

  setSelectedChat: (chat) => set({ selectedChat: chat }),
  clearSelectedChat: () => set({ selectedChat: null }),
  setNewChat: () => {
    const newChat = createNewChat(true);
    set({ selectedChat: newChat });
  },
  setModelSettings: (settings) => set({ modelSettings: settings }),
}))

export default chatState;

