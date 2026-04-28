// ChatClient.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { socket } from "@/core/socket/socket";
import { useChatStore } from "@/core/store/chat-store";
import { decrypt } from "@/core/crypto/encryption";

import GroupSidebar from "../components/chat/GroupSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import EncryptionPanel from "../components/chat/EncryptionPanel";

export default function ChatClient() {
  const params = useSearchParams();
  const roomId = params.get("room") || "general";

  useEffect(() => {
    const addMessage = useChatStore.getState().addMessage;
    const clearMessages = useChatStore.getState().clearMessages;

    clearMessages();

    const onConnect = () => {
      socket.emit("join_room", { roomId });
    };

    socket.on("connect", onConnect);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("chat_history", (messages: any[]) => {
      messages.forEach((msg) => {
        addMessage({
          id: msg._id,
          text: decrypt(msg.encrypted),
          encrypted: msg.encrypted,
          sender: msg.sender,
        });
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("receive_message", (msg: any) => {
      addMessage({
        id: crypto.randomUUID(),
        text: decrypt(msg.text),
        encrypted: msg.text,
        sender: msg.sender,
      });
    });

    if (socket.connected) {
      socket.emit("join_room", { roomId });
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("chat_history");
      socket.off("receive_message");
    };
  }, [roomId]);

  return (
    <div className="h-screen flex">
      <GroupSidebar />
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput roomId={roomId} />
      </div>
      <EncryptionPanel />
    </div>
  );
}
