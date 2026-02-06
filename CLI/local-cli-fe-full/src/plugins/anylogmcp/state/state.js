import { create } from 'zustand'

const chatState = create((set) => ({
  showConfig: false,
  selectedChat: null,
  modelSettings: null,

  toggleShowConfig: () => set((state) => ({ showConfig: !state.showConfig })),

  setSelectedChat: (chat) => set({ selectedChat: chat }),
  clearSelectedChat: () => set({ selectedChat: null }),
  setNewChat: () => set({
    selectedChat: {
      title: "Untitled Chat",
      messages: [{ text: "Hello, how can I help you?", sender: "AnyLog AI" }],
      lastAccessDate: Date.now(),
    }
  }),
  setModelSettings: (settings) => set({ modelSettings: settings }),
}))

export default chatState;

