import { create } from "zustand";

type Message = {
  id: string;
  text: string;           // decrypted (for UI)
  encrypted: string;      // encrypted version
  sender: string;
};

type DebugInfo = {
  plaintext: string;
  encrypted: string;
};

type ChatState = {
  messages: Message[];
  debug?: DebugInfo;

  addMessage: (msg: Message) => void;
  setDebug: (debug: DebugInfo) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  debug: undefined,

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setDebug: (debug) => set({ debug }),
}));
