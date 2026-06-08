"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { socket } from "@/core/socket/socket";
import { useChatStore } from "@/core/store/chat-store";
import { decrypt, onRoomKeyImported } from "@/core/crypto/encryption";
import { useRoomWebRtc } from "@/core/webrtc/useRoomWebRtc";
import { useCallMedia } from "@/core/webrtc/useCallMedia";
import type { EncryptedPeerMessage } from "@/core/webrtc/types";
import { useIdentity } from "@/app/context/IdentityContext";

import GroupSidebar from "../components/chat/GroupSidebar";
import CallPanel from "../components/chat/CallPanel";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import EncryptionPanel from "../components/chat/EncryptionPanel";

export default function ChatClient() {
  const params = useSearchParams();
  const router = useRouter();
  const roomId = params.get("room") || "";
  const isCallMode = Boolean(roomId) && params.get("mode") === "call";
  const { identity } = useIdentity();
  const { localStream, error: mediaError } = useCallMedia(isCallMode);
  const [remoteStreamState, setRemoteStreamState] = useState<{
    roomId: string;
    streams: Map<string, MediaStream>;
  }>(() => ({
    roomId,
    streams: new Map(),
  }));
  const remoteStreams =
    remoteStreamState.roomId === roomId ? remoteStreamState.streams : new Map();

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

  const handleRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreamState((current) => {
      const next = current.roomId === roomId ? new Map(current.streams) : new Map();
      next.set(peerId, stream);
      return { roomId, streams: next };
    });
  }, [roomId]);

  const endCall = useCallback(() => {
    if (!isCallMode || !roomId) return;

    socket.emit("end_call", { roomId });
  }, [isCallMode, roomId]);

  const { peerCount, broadcastMessage } = useRoomWebRtc({
    socket,
    roomId,
    identity,
    localStream: isCallMode ? localStream : null,
    onMessage: addEncryptedMessage,
    onRemoteStream: handleRemoteStream,
  });

  useEffect(() => {
    if (!roomId) {
      useChatStore.getState().clearMessages();
      return;
    }

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

    socket.on("room_join_blocked", () => {
      alert("That private call is already full.");
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

  return (
    <div className="h-screen flex">
      <GroupSidebar />
      <div className="flex-1 flex flex-col">
        {isCallMode && (
          <CallPanel
            localStream={localStream}
            remoteStreams={remoteStreams}
            peerCount={peerCount}
            error={mediaError}
            onEndCall={endCall}
          />
        )}
        {roomId ? (
          <>
            <MessageList />
            <MessageInput roomId={roomId} onEncryptedMessage={broadcastMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">
            Select a room or create a private call.
          </div>
        )}
      </div>
      <EncryptionPanel peerCount={peerCount} />
    </div>
  );
}
