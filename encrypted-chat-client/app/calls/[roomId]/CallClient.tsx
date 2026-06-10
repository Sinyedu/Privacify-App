"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import CallPanel from "@/app/components/chat/CallPanel";
import MessageInput from "@/app/components/chat/MessageInput";
import MessageList from "@/app/components/chat/MessageList";
import { useRoomMessages } from "@/app/components/chat/useRoomMessages";
import { useIdentity } from "@/app/context/IdentityContext";
import { socket } from "@/core/socket/socket";
import { useCallMedia } from "@/core/webrtc/useCallMedia";
import { useRoomWebRtc } from "@/core/webrtc/useRoomWebRtc";

type CallClientProps = {
  roomId: string;
};

export default function CallClient({ roomId }: CallClientProps) {
  const router = useRouter();
  const { identity } = useIdentity();
  const { addEncryptedMessage } = useRoomMessages(roomId, {
    callEndedRedirect: "/groups",
    joinRoom: false,
  });
  const { localStream, error: mediaError } = useCallMedia(Boolean(roomId));
  const canStartRtc = Boolean(localStream);
  const [remoteStreamState, setRemoteStreamState] = useState<{
    roomId: string;
    streams: Map<string, MediaStream>;
  }>(() => ({
    roomId,
    streams: new Map(),
  }));
  const remoteStreams =
    remoteStreamState.roomId === roomId ? remoteStreamState.streams : new Map();

  const handleRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreamState((current) => {
      const next = current.roomId === roomId ? new Map(current.streams) : new Map();
      next.set(peerId, stream);
      return { roomId, streams: next };
    });
  }, [roomId]);

  const endCall = useCallback(() => {
    if (!roomId) return;

    socket.emit("end_call", { roomId });
    router.push("/groups");
  }, [roomId, router]);

  const { peerCount, broadcastMessage } = useRoomWebRtc({
    socket,
    roomId,
    identity: canStartRtc ? identity : null,
    localStream,
    onMessage: addEncryptedMessage,
    onRemoteStream: handleRemoteStream,
  });

  return (
    <div className="min-h-[calc(100vh-65px)] bg-neutral-950 text-white">
      <div className="flex min-h-[calc(100vh-65px)] flex-col">
        <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Private call</h1>
            <p className="text-xs text-neutral-400">{roomId}</p>
          </div>
          <Link
            href="/chat"
            className="rounded border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Back to chats
          </Link>
        </header>

        <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-h-0 overflow-y-auto">
            <CallPanel
              localStream={localStream}
              remoteStreams={remoteStreams}
              peerCount={peerCount}
              error={
                mediaError ||
                (!canStartRtc ? "Waiting for camera and microphone access..." : null)
              }
              onEndCall={endCall}
            />
          </main>

          <aside className="flex min-h-0 flex-col border-l border-neutral-800 bg-white text-neutral-950">
            <MessageList currentUsername={identity?.username} />
            <MessageInput roomId={roomId} onEncryptedMessage={broadcastMessage} />
          </aside>
        </div>
      </div>
    </div>
  );
}
