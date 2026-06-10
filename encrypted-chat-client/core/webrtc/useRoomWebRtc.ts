"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { RoomWebRtcSession } from "./roomSession";
import type { EncryptedPeerMessage, Identity } from "./types";

type UseRoomWebRtcOptions = {
  socket: Socket;
  roomId: string;
  identity: Identity | null;
  localStream?: MediaStream | null;
  onMessage: (message: EncryptedPeerMessage) => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
};

export function useRoomWebRtc({
  socket,
  roomId,
  identity,
  localStream,
  onMessage,
  onRemoteStream,
}: UseRoomWebRtcOptions) {
  const [peerCount, setPeerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const sessionRef = useRef<RoomWebRtcSession | null>(null);
  const localStreamRef = useRef<MediaStream | null>(localStream ?? null);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (!identity || !isConnected || !roomId) return;

    const session = new RoomWebRtcSession({
      socket,
      roomId,
      identity,
      localStream: localStreamRef.current,
      onMessage,
      onRemoteStream,
      onPeerCountChange: setPeerCount,
    });

    sessionRef.current = session;
    socket.on("room_peers", session.handleRoomPeers);
    socket.on("peer_joined", session.handlePeerJoined);
    socket.on("webrtc_signal", session.handleSignal);
    socket.on("peer_left", session.handlePeerLeft);
    socket.emit("join_room", { roomId });

    return () => {
      socket.off("room_peers", session.handleRoomPeers);
      socket.off("peer_joined", session.handlePeerJoined);
      socket.off("webrtc_signal", session.handleSignal);
      socket.off("peer_left", session.handlePeerLeft);
      session.close();
      sessionRef.current = null;
      socket.emit("leave_room", { roomId });
    };
  }, [identity, isConnected, onMessage, onRemoteStream, roomId, socket]);

  useEffect(() => {
    localStreamRef.current = localStream ?? null;
    sessionRef.current?.setLocalStream(localStream ?? null);
  }, [localStream]);

  const broadcastMessage = (message: EncryptedPeerMessage) => {
    sessionRef.current?.broadcastMessage(message);
  };

  return {
    peerCount,
    broadcastMessage,
  };
}
