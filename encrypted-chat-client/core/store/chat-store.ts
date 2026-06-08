import { create } from "zustand";

type Message = {
  id: string;
  roomId: string;
  text: string; // decrypted (for UI)
  encrypted: string; // encrypted version
  sender: string;
};

type DebugInfo = {
  plaintext: string;
  encrypted: string;
};

type ChatState = {
  clearMessages: () => void;
  messages: Message[];
  debug?: DebugInfo;

  addMessage: (msg: Message) => void;
  setDebug: (debug: DebugInfo) => void;
  updateMessageText: (id: string, text: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  debug: undefined,

  addMessage: (msg) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === msg.id);
      if (exists) return state;

      return {
        messages: [...state.messages, msg],
      };
    }),

  setDebug: (debug) => set({ debug }),
  updateMessageText: (id, text) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, text } : message,
      ),
    })),
  clearMessages: () => set({ messages: [] }),
}));
