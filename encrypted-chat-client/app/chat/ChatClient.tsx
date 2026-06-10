"use client";

import { useSearchParams } from "next/navigation";
import { socket } from "@/core/socket/socket";
import { useRoomWebRtc } from "@/core/webrtc/useRoomWebRtc";
import { useIdentity } from "@/app/context/IdentityContext";

import GroupSidebar from "../components/chat/GroupSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import EncryptionPanel from "../components/chat/EncryptionPanel";
import { useRoomMessages } from "../components/chat/useRoomMessages";

export default function ChatClient() {
  const params = useSearchParams();
  const roomId = params.get("room") || "";
  const { identity } = useIdentity();
  const { addEncryptedMessage } = useRoomMessages(roomId);

  const { peerCount, broadcastMessage } = useRoomWebRtc({
    socket,
    roomId,
    identity,
    localStream: null,
    onMessage: addEncryptedMessage,
    onRemoteStream: undefined,
  });

  return (
    <div className="h-screen flex">
      <GroupSidebar />
      <div className="flex-1 flex flex-col">
        {roomId ? (
          <>
            <MessageList currentUsername={identity?.username} />
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
