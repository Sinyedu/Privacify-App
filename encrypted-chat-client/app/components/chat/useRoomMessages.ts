"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { decrypt, onRoomKeyImported } from "@/core/crypto/encryption";
import { socket } from "@/core/socket/socket";
import { useChatStore } from "@/core/store/chat-store";
import type { EncryptedPeerMessage } from "@/core/webrtc/types";

export function useRoomMessages(roomId: string) {
  const router = useRouter();

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

  useEffect(() => {
    if (!roomId) {
      useChatStore.getState().clearMessages();
      return;
    }

    useChatStore.getState().clearMessages();

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

    socket.on("room_join_blocked", () => {
      alert("That room is not available.");
      router.push("/chat");
    });

    socket.on("call_ended", () => {
      alert("The call has ended.");
      router.push("/chat");
    });

    socket.on("room_deleted", ({ roomId: deletedRoomId }: { roomId: string }) => {
      if (deletedRoomId === roomId) {
        router.push("/chat");
      }
    });

    if (socket.connected) {
      socket.emit("join_room", { roomId });
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("room_join_blocked");
      socket.off("call_ended");
      socket.off("room_deleted");
      socket.emit("leave_room", { roomId });
    };
  }, [addEncryptedMessage, roomId, router]);

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

  return {
    addEncryptedMessage,
  };
}
