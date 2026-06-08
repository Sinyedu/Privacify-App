"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { socket } from "@/core/socket/socket";
import { useChatStore } from "@/core/store/chat-store";
import { decrypt, onRoomKeyImported } from "@/core/crypto/encryption";
import { useRoomWebRtc } from "@/core/webrtc/useRoomWebRtc";
import type { EncryptedPeerMessage } from "@/core/webrtc/types";
import { useIdentity } from "@/app/context/IdentityContext";

import GroupSidebar from "../components/chat/GroupSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import EncryptionPanel from "../components/chat/EncryptionPanel";

export default function ChatClient() {
  const params = useSearchParams();
  const roomId = params.get("room") || "general";
  const { identity } = useIdentity();

  const addEncryptedMessage = useCallback(
    async ({ id, roomId, encrypted, sender }: EncryptedPeerMessage) => {
      const addMessage = useChatStore.getState().addMessage;

      let text = "Encrypted message - waiting for room key";

      try {
        text = await decrypt(encrypted, roomId);
      } catch (error) {
        console.warn("[crypto] decrypt failed:", error);
      }

      addMessage({
        id,
        roomId,
        text,
        encrypted,
        sender,
      });
    },
    [],
  );

  const { peerCount, broadcastMessage } = useRoomWebRtc({
    socket,
    roomId,
    identity,
    onMessage: addEncryptedMessage,
  });

  useEffect(() => {
    const clearMessages = useChatStore.getState().clearMessages;

    clearMessages();

    const onConnect = () => {
      socket.emit("join_room", { roomId });
    };

    socket.on("connect", onConnect);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("chat_history", (messages: any[]) => {
      messages.forEach((msg) => {
        void addEncryptedMessage({
          id: String(msg._id),
          roomId: msg.roomId ?? roomId,
          encrypted: msg.encrypted,
          sender: msg.sender,
        });
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("receive_message", (msg: any) => {
      void addEncryptedMessage({
        id: msg.id ?? msg._id ?? crypto.randomUUID(),
        roomId: msg.roomId ?? roomId,
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
      socket.emit("leave_room", { roomId });
    };
  }, [addEncryptedMessage, roomId]);

  useEffect(() => {
    return onRoomKeyImported((importedRoomId) => {
      if (importedRoomId !== roomId) return;

      const { messages, updateMessageText } = useChatStore.getState();

      messages
        .filter((message) => message.roomId === roomId)
        .forEach((message) => {
          void decrypt(message.encrypted, roomId)
            .then((text) => updateMessageText(message.id, text))
            .catch((error) => console.warn("[crypto] re-decrypt failed:", error));
        });
    });
  }, [roomId]);

  return (
    <div className="h-screen flex">
      <GroupSidebar />
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput roomId={roomId} onEncryptedMessage={broadcastMessage} />
      </div>
      <EncryptionPanel peerCount={peerCount} />
    </div>
  );
}
