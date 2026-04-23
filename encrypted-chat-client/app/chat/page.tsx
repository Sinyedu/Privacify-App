"use client";

import { useEffect } from "react";
import { socket } from "@/core/socket/socket";
import { useChatStore } from "@/core/store/chat-store";
import { decrypt } from "@/core/crypto/encryption";
import GroupSidebar from "../components/chat/GroupSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import EncryptionPanel from "../components/chat/EncryptionPanel";

export default function ChatPage() {
  useEffect(() => {
    socket.connect();

    const addMessage = useChatStore.getState().addMessage;

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    socket.on("receive_message", (payload) => {
      const decrypted = decrypt(payload.text);

      addMessage({
        id: crypto.randomUUID(),
        text: decrypted,
        encrypted: payload.text,
        sender: payload.sender,
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive_message");
      socket.disconnect();
    };
  }, []);
  return (
    <div className="h-screen flex">
      <GroupSidebar />

      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput />
      </div>

      <EncryptionPanel />
    </div>
  );
}
